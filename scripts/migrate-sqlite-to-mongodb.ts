import { loadEnvConfig } from "@next/env";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  closeMongoConnections,
  ensureMongoIndexes,
  mongoConnection,
} from "../lib/mongodb";
import type { Inquiry, Project } from "../lib/types";

loadEnvConfig(process.cwd());
const apply = process.argv.includes("--apply");
const collections = [
  "projects",
  "inquiries",
  "settings",
  "rate_limits",
] as const;

async function main() {
  const path = resolve(
    process.env.DATABASE_PATH || `${process.env.DATA_DIR || "data"}/reliant.db`,
  );
  const source = new DatabaseSync(path, { readOnly: true });
  let projects: Project[], inquiries: Inquiry[];
  let settings: { key: string; value: string }[];
  let rateLimits: { key: string; count: number; resetAt: Date }[];
  try {
    source.exec("BEGIN");
    projects = source
      .prepare("SELECT * FROM projects ORDER BY sort_order, id")
      .all()
      .map((row) => ({
        ...JSON.parse(String(row.data)),
        id: String(row.id),
        slug: String(row.slug),
        division: String(row.division),
        published: Boolean(row.published),
        order: Number(row.sort_order),
      }));
    inquiries = source
      .prepare("SELECT * FROM inquiries ORDER BY created_at DESC, id DESC")
      .all()
      .map((row) => ({
        ...JSON.parse(String(row.data)),
        id: String(row.id),
        createdAt: String(row.created_at),
        read: Boolean(row.is_read),
      }));
    settings = source
      .prepare("SELECT * FROM settings")
      .all()
      .map((row) => ({ key: String(row.key), value: String(row.value) }));
    rateLimits = source
      .prepare("SELECT * FROM rate_limits")
      .all()
      .map((row) => ({
        key: String(row.key),
        count: Number(row.count),
        resetAt: new Date(Number(row.reset_at)),
      }));
    source.exec("COMMIT");
  } finally {
    source.close();
  }

  const snapshot = JSON.stringify({
    projects,
    inquiries,
    settings,
    rateLimits,
  });
  const digest = createHash("sha256").update(snapshot).digest("hex");
  const connection = mongoConnection();
  const db = await connection.database;
  const marker = await db
    .collection("settings")
    .findOne({ key: "migration:sqlite" });
  if (marker) {
    if (marker.sourceDigest !== digest)
      throw new Error(
        "This destination was already migrated from a different snapshot. No changes were made.",
      );
    console.log(
      "This SQLite snapshot was already migrated. MongoDB content has been left unchanged.",
    );
    return;
  }
  for (const name of collections) {
    if (await db.collection(name).countDocuments({}))
      throw new Error(
        "Migration requires an empty MongoDB destination. Existing content will not be overwritten; choose a new MONGODB_DB.",
      );
  }
  const counts = {
    projects: projects.length,
    images: projects.reduce((n, p) => n + p.images.length, 0),
    inquiries: inquiries.length,
    settings: settings.length,
    rateLimits: rateLimits.length,
  };
  console.log(
    JSON.stringify(
      { mode: apply ? "apply" : "dry-run", database: db.databaseName, counts },
      null,
      2,
    ),
  );
  if (!apply) {
    console.log(
      "Run with --apply to back up this snapshot and import it. SQLite and image files are retained.",
    );
    return;
  }

  const backupDirectory = resolve(process.env.DATA_DIR || "data", "backups");
  mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const backup = resolve(backupDirectory, `sqlite-to-mongo-${Date.now()}.json`);
  writeFileSync(backup, snapshot, { flag: "wx", mode: 0o600 });
  await ensureMongoIndexes(db);
  await connection.client.withSession((session) =>
    session.withTransaction(
      async () => {
        for (const name of collections) {
          if (await db.collection(name).countDocuments({}, { session }))
            throw new Error(
              "The MongoDB destination changed during migration. No import was committed.",
            );
        }
        if (projects.length)
          await db.collection<Project>("projects").insertMany(
            projects.map((p) => ({ ...p })),
            { session },
          );
        if (inquiries.length)
          await db.collection<Inquiry>("inquiries").insertMany(
            inquiries.map((i) => ({ ...i })),
            { session },
          );
        if (settings.length)
          await db.collection("settings").insertMany(
            settings.map((s) => ({ ...s })),
            { session },
          );
        if (rateLimits.length)
          await db.collection("rate_limits").insertMany(
            rateLimits.map((r) => ({ ...r })),
            { session },
          );
        await db
          .collection("settings")
          .updateOne(
            { key: "seeded" },
            { $setOnInsert: { value: "1" } },
            { session, upsert: true },
          );
        await db.collection("settings").insertOne(
          {
            key: "migration:sqlite",
            sourceDigest: digest,
            migratedAt: new Date(),
            counts,
          },
          { session },
        );
        const importedProjects = await db
          .collection<Project>("projects")
          .find({}, { projection: { _id: 0 }, session })
          .sort({ order: 1, id: 1 })
          .toArray();
        const importedInquiries = await db
          .collection<Inquiry>("inquiries")
          .find({}, { projection: { _id: 0 }, session })
          .sort({ createdAt: -1, id: -1 })
          .toArray();
        if (
          !isDeepStrictEqual(projects, importedProjects) ||
          !isDeepStrictEqual(inquiries, importedInquiries)
        )
          throw new Error(
            "Imported content did not exactly match the SQLite snapshot. Import rolled back.",
          );
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
    ),
  );
  console.log(
    `Migration verified. Backup: ${backup}. Original SQLite database and all image files retained.`,
  );
}

main()
  .catch((error: unknown) => {
    // Do not print driver errors: they can contain credentials or submitted content.
    const message =
      error instanceof Error &&
      !("code" in error) &&
      !error.name.startsWith("Mongo")
        ? error.message
        : "MongoDB migration failed. Check the connection and replica-set configuration; the import transaction was not committed.";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(closeMongoConnections);
