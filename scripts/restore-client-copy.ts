import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { seedProjects } from "../lib/seed";
import type { Project } from "../lib/types";

const fields = [
  "title",
  "subtitle",
  "category",
  "description",
  "result",
  "scope",
] as const;
type CopyField = (typeof fields)[number];
type ProjectCopy = Pick<Project, CopyField>;
type SourceProject = ProjectCopy & Pick<Project, "id" | "slug">;
type SourceMap = { sourceDocument: string; projects: SourceProject[] };
type RawRow = {
  id: string;
  slug: string;
  division: string;
  published: number;
  sort_order: number;
  data: string;
};
type Backup = {
  version: 1;
  createdAt: string;
  databasePath: string;
  sourceDocument: string;
  fields: readonly CopyField[];
  rows: (RawRow & { appliedCopy: ProjectCopy })[];
};
type Change = {
  row: RawRow;
  originalData: Record<string, unknown>;
  copy: ProjectCopy;
  changedFields: CopyField[];
  restoreRawData?: string;
};

const mapPath = fileURLToPath(
  new URL("../docs/client-copy-2026/project-copy-map.json", import.meta.url),
);
const backupPath = fileURLToPath(
  new URL("../docs/client-copy-2026/project-copy-before.json", import.meta.url),
);

function objectFrom(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} is not a project object.`);
  }
  return value as Record<string, unknown>;
}

function copyFrom(value: unknown, label: string): ProjectCopy {
  const project = objectFrom(value, label);
  for (const field of fields) {
    if (field === "scope") {
      if (
        !Array.isArray(project.scope) ||
        !project.scope.every((item) => typeof item === "string")
      ) {
        throw new Error(`${label} has an invalid scope.`);
      }
    } else if (typeof project[field] !== "string") {
      throw new Error(`${label} has an invalid ${field}.`);
    }
  }
  return {
    title: project.title as string,
    subtitle: project.subtitle as string,
    category: project.category as string,
    description: project.description as string,
    result: project.result as string,
    scope: [...(project.scope as string[])],
  };
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function nonCopyFields(project: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(project).filter(
      ([key]) => !fields.includes(key as CopyField),
    ),
  );
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: node --import tsx scripts/restore-client-copy.ts [--dry-run | --apply] [--restore]\n" +
        "Default: read-only dry-run. --apply restores supplied copy and creates a raw-row backup.\n" +
        "--restore previews undoing that application; --restore --apply performs the undo.\n" +
        "DATABASE_PATH and DATA_DIR follow the existing application's path conventions.",
    );
    return;
  }
  const unknown = args.filter(
    (arg) => !["--apply", "--dry-run", "--restore"].includes(arg),
  );
  if (
    unknown.length ||
    (args.includes("--apply") && args.includes("--dry-run"))
  ) {
    throw new Error("Use --help to see the supported arguments.");
  }
  const apply = args.includes("--apply");
  const restore = args.includes("--restore");
  // Match lib/db.ts without importing it: importing its database helpers must
  // never create tables, seed records, or change any unrelated application data.
  const dataDirectory = resolve(process.env.DATA_DIR || "data");
  const databasePath = resolve(
    process.env.DATABASE_PATH || `${dataDirectory}/reliant.db`,
  );
  if (!existsSync(databasePath)) {
    throw new Error(`Existing database not found: ${databasePath}`);
  }

  const source = JSON.parse(readFileSync(mapPath, "utf8")) as SourceMap;
  if (!Array.isArray(source.projects) || source.projects.length !== 10) {
    throw new Error("The source map must contain the ten supplied projects.");
  }
  const identifiers = new Set<string>();
  const slugs = new Set<string>();
  for (const project of source.projects) {
    if (identifiers.has(project.id) || slugs.has(project.slug)) {
      throw new Error("The source map contains duplicate project identities.");
    }
    identifiers.add(project.id);
    slugs.add(project.slug);
    const seed = seedProjects.find(
      ({ id, slug }) => id === project.id && slug === project.slug,
    );
    if (
      !seed ||
      !same(copyFrom(seed, project.slug), copyFrom(project, project.slug))
    ) {
      throw new Error(`Seed and supplied copy disagree for ${project.slug}.`);
    }
  }

  let backup: Backup | undefined;
  if (restore) {
    if (!existsSync(backupPath)) {
      throw new Error(`No prior application backup exists: ${backupPath}`);
    }
    backup = JSON.parse(readFileSync(backupPath, "utf8")) as Backup;
    if (
      backup.version !== 1 ||
      backup.databasePath !== databasePath ||
      !same(backup.fields, fields) ||
      !Array.isArray(backup.rows)
    ) {
      throw new Error(
        "The backup does not match this database or copy migration.",
      );
    }
  }

  const db = new DatabaseSync(databasePath, { readOnly: !apply });
  let transaction = false;
  try {
    db.exec(apply ? "BEGIN IMMEDIATE" : "BEGIN");
    transaction = true;
    const find = db.prepare(
      "SELECT id, slug, division, published, sort_order, data FROM projects WHERE id = ? AND slug = ?",
    );
    const changes: Change[] = [];
    const unchanged: string[] = [];
    const skipped: { slug: string; reason: string }[] = [];

    for (const approved of source.projects) {
      const saved = backup?.rows.find(
        ({ id, slug }) => id === approved.id && slug === approved.slug,
      );
      if (restore && !saved) continue;
      const row = find.get(approved.id, approved.slug) as RawRow | undefined;
      if (!row) {
        skipped.push({
          slug: approved.slug,
          reason: "No existing row matches both seed ID and slug.",
        });
        continue;
      }
      const originalData = objectFrom(JSON.parse(row.data), approved.slug);
      if (originalData.id !== row.id || originalData.slug !== row.slug) {
        throw new Error(
          `Stored project identity disagrees with its row: ${row.slug}.`,
        );
      }
      const currentCopy = copyFrom(originalData, row.slug);
      const previousData = saved
        ? objectFrom(JSON.parse(saved.data), `Backup for ${row.slug}`)
        : undefined;
      const copy = copyFrom(previousData || approved, row.slug);
      if (saved) {
        const appliedCopy = copyFrom(
          saved.appliedCopy,
          `Applied copy for ${row.slug}`,
        );
        const conflicts = fields.filter(
          (field) =>
            !same(currentCopy[field], appliedCopy[field]) &&
            !same(currentCopy[field], copy[field]),
        );
        if (conflicts.length) {
          throw new Error(
            `Cannot restore ${row.slug}; these copy fields changed after the migration: ${conflicts.join(", ")}.`,
          );
        }
      }
      const changedFields = fields.filter(
        (field) => !same(currentCopy[field], copy[field]),
      );
      if (!changedFields.length) {
        unchanged.push(row.slug);
        continue;
      }
      changes.push({
        row,
        originalData,
        copy,
        changedFields,
        // Restore the exact original JSON bytes when no other field changed.
        // Otherwise, retain later non-copy edits and undo only the copy fields.
        restoreRawData:
          saved &&
          previousData &&
          same(nonCopyFields(originalData), nonCopyFields(previousData))
            ? saved.data
            : undefined,
      });
    }

    if (apply && changes.length) {
      if (!restore) {
        const snapshot: Backup = {
          version: 1,
          createdAt: new Date().toISOString(),
          databasePath,
          sourceDocument: source.sourceDocument,
          fields,
          rows: changes.map(({ row, copy }) => ({ ...row, appliedCopy: copy })),
        };
        mkdirSync(dirname(backupPath), { recursive: true });
        // Exclusive creation prevents overwriting the one-time recovery copy.
        writeFileSync(backupPath, `${JSON.stringify(snapshot, null, 2)}\n`, {
          flag: "wx",
          mode: 0o600,
        });
      }
      const update = db.prepare(
        "UPDATE projects SET data = ? WHERE id = ? AND slug = ? AND data = ?",
      );
      for (const change of changes) {
        const data =
          change.restoreRawData ||
          JSON.stringify({
            ...change.originalData,
            ...change.copy,
          });
        const result = update.run(
          data,
          change.row.id,
          change.row.slug,
          change.row.data,
        );
        if (Number(result.changes) !== 1) {
          throw new Error(
            `Project changed while restoring copy: ${change.row.slug}.`,
          );
        }
      }
    }
    db.exec("COMMIT");
    transaction = false;
    const changedFieldCounts = Object.fromEntries(
      fields.map((field) => [
        field,
        changes.filter(({ changedFields }) => changedFields.includes(field))
          .length,
      ]),
    );
    console.log(
      JSON.stringify(
        {
          mode: apply ? "apply" : "dry-run",
          operation: restore ? "undo-copy-restoration" : "restore-client-copy",
          databasePath,
          sourceMap: mapPath,
          backupPath,
          changedProjects: changes.length,
          changedFields: changes.reduce(
            (total, change) => total + change.changedFields.length,
            0,
          ),
          changedFieldCounts,
          changes: changes.map(({ row, changedFields }) => ({
            slug: row.slug,
            changedFields,
          })),
          unchanged,
          skipped,
          writesPerformed: apply && changes.length > 0,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (transaction) db.exec("ROLLBACK");
    throw error;
  } finally {
    db.close();
  }
}

try {
  main();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Copy restoration failed.",
  );
  process.exitCode = 1;
}
