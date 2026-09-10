import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { MongoServerError, type ClientSession, type Db } from "mongodb";
import type { Division, Inquiry, Project } from "./types";
import type { InquiryInput, ProjectInput } from "./validation";
import { seedProjects } from "./seed";
import {
  closeMongoConnections,
  ensureMongoIndexes,
  mongoConnection,
} from "./mongodb";

export function dataDirectory() {
  return resolve(/* turbopackIgnore: true */ process.env.DATA_DIR || "data");
}

export class ProjectNotFoundError extends Error {
  constructor() {
    super("This project no longer exists.");
    this.name = "ProjectNotFoundError";
  }
}

const transactionOptions = {
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
};

// Serialize catalogue writes so reorder validation includes concurrent creates/deletes.
async function lockProjects(db: Db, session: ClientSession) {
  await db
    .collection("settings")
    .updateOne(
      { key: "project-revision" },
      { $inc: { revision: 1 } },
      { session },
    );
}

async function initializeDatabase(db: Db): Promise<Db> {
  await ensureMongoIndexes(db);
  try {
    await db
      .collection("settings")
      .updateOne(
        { key: "project-revision" },
        { $setOnInsert: { revision: 0 } },
        { upsert: true },
      );
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000))
      throw error;
  }
  if (!(await db.collection("settings").findOne({ key: "seeded" }))) {
    await mongoConnection().client.withSession((session) =>
      session.withTransaction(async () => {
        await lockProjects(db, session);
        if (
          await db
            .collection("settings")
            .findOne({ key: "seeded" }, { session })
        )
          return;
        await db.collection<Project>("projects").bulkWrite(
          seedProjects.map((project) => ({
            updateOne: {
              filter: { id: project.id },
              update: { $setOnInsert: project },
              upsert: true,
            },
          })),
          { session },
        );
        await db
          .collection("settings")
          .insertOne({ key: "seeded", value: "1" }, { session });
      }, transactionOptions),
    );
  }
  return db;
}

export async function getDb(): Promise<Db> {
  const connection = mongoConnection();
  if (!connection.initialized) {
    const pending = connection.database.then(initializeDatabase);
    connection.initialized = pending;
    pending.catch(() => {
      if (connection.initialized === pending)
        connection.initialized = undefined;
    });
  }
  return connection.initialized;
}

export const closeDb = closeMongoConnections;

export async function getProjects({
  includeHidden = false,
  division,
}: { includeHidden?: boolean; division?: Division } = {}): Promise<Project[]> {
  return (await getDb())
    .collection<Project>("projects")
    .find(
      {
        ...(!includeHidden && { published: true }),
        ...(division && { division }),
      },
      { projection: { _id: 0 } },
    )
    .sort({ order: 1, id: 1 })
    .toArray();
}

export async function getProject(
  slug: string,
  { includeHidden = false }: { includeHidden?: boolean } = {},
): Promise<Project | undefined> {
  return (
    (await (
      await getDb()
    )
      .collection<Project>("projects")
      .findOne(
        { slug, ...(!includeHidden && { published: true }) },
        { projection: { _id: 0 } },
      )) ?? undefined
  );
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  return (
    (await (
      await getDb()
    )
      .collection<Project>("projects")
      .findOne({ id }, { projection: { _id: 0 } })) ?? undefined
  );
}

async function writeProjects<T>(
  write: (db: Db, session: ClientSession) => Promise<T>,
) {
  const db = await getDb();
  return mongoConnection().client.withSession((session) =>
    session.withTransaction(async () => {
      await lockProjects(db, session);
      return write(db, session);
    }, transactionOptions),
  );
}

export async function saveProject(input: ProjectInput): Promise<Project> {
  return writeProjects(async (db, session) => {
    const collection = db.collection<Project>("projects");
    const existing = input.id
      ? await collection.findOne({ id: input.id }, { session })
      : null;
    if (input.id && !existing) throw new ProjectNotFoundError();
    const last = await collection.findOne({}, { sort: { order: -1 }, session });
    const project: Project = {
      ...input,
      id: input.id || randomUUID(),
      order: input.order ?? existing?.order ?? (last ? last.order + 1 : 0),
      updatedAt: new Date().toISOString(),
    };
    await collection.replaceOne({ id: project.id }, project, {
      upsert: !input.id,
      session,
    });
    return project;
  });
}

export async function deleteProject(id: string): Promise<boolean> {
  return writeProjects(
    async (db, session) =>
      (await db.collection("projects").deleteOne({ id }, { session }))
        .deletedCount > 0,
  );
}

export async function reorderProjects(ids: string[]) {
  await writeProjects(async (db, session) => {
    const collection = db.collection<Project>("projects");
    const projects = await collection
      .find({}, { projection: { id: 1 }, session })
      .toArray();
    const existingIds = new Set(projects.map((project) => project.id));
    if (
      ids.length !== projects.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existingIds.has(id))
    )
      throw new Error("Refresh the project list and try again.");
    if (ids.length)
      await collection.bulkWrite(
        ids.map((id, order) => ({
          updateOne: { filter: { id }, update: { $set: { order } } },
        })),
        { session },
      );
  });
}

export async function saveInquiry(
  input: InquiryInput,
  attachment: string | null,
): Promise<Inquiry> {
  const inquiry: Inquiry = {
    ...input,
    attachment,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  // insertOne adds _id to its argument; keep BSON values out of API/React props.
  await (
    await getDb()
  )
    .collection<Inquiry>("inquiries")
    .insertOne({ ...inquiry });
  return inquiry;
}

export async function getInquiries(): Promise<Inquiry[]> {
  return (await getDb())
    .collection<Inquiry>("inquiries")
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1, id: -1 })
    .toArray();
}

export async function markInquiryRead(
  id: string,
  read: boolean,
): Promise<boolean> {
  return (
    (
      await (
        await getDb()
      )
        .collection<Inquiry>("inquiries")
        .updateOne({ id }, { $set: { read } })
    ).matchedCount > 0
  );
}

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const collection = (await getDb()).collection<{
    key: string;
    count: number;
    resetAt: Date;
  }>("rate_limits");
  const expired = {
    $lte: [{ $ifNull: ["$resetAt", new Date(0)] }, new Date(now)],
  };
  const update = [
    {
      $set: {
        count: { $cond: [expired, 1, { $add: ["$count", 1] }] },
        resetAt: { $cond: [expired, new Date(now + windowMs), "$resetAt"] },
      },
    },
  ];
  const options = { upsert: true, returnDocument: "after" as const };
  try {
    const row = await collection.findOneAndUpdate({ key }, update, options);
    return !!row && row.count <= limit;
  } catch (error) {
    if (!(error instanceof MongoServerError && error.code === 11000))
      throw error;
    // Simultaneous initial requests can race to insert the unique key. Retry
    // against the winner using the same atomic operation, retaining its count.
    const row = await collection.findOneAndUpdate({ key }, update, options);
    return !!row && row.count <= limit;
  }
}
