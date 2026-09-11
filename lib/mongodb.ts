import { MongoClient, type Db } from "mongodb";

type Connection = {
  client: MongoClient;
  database: Promise<Db>;
  initialized?: Promise<Db>;
};
// Reuse connection pools across Next.js development module reloads.
const globalMongo = globalThis as typeof globalThis & {
  reliantMongo?: Map<string, Connection>;
};
const connections = (globalMongo.reliantMongo ??= new Map());

export function mongoConnection(): Connection {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI before starting the application.");
  const name = process.env.MONGODB_DB || "reliant_renovations";
  const key = `${uri}\n${name}`;
  const cached = connections.get(key);
  if (cached) return cached;
  const client = new MongoClient(uri, {
    appName: "reliant-renovations",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  const connection: Connection = {
    client,
    database: client.connect().then(() => client.db(name)),
  };
  connection.database.catch(() => {
    if (connections.get(key) === connection) connections.delete(key);
    void client.close();
  });
  connections.set(key, connection);
  return connection;
}

export async function ensureMongoIndexes(db: Db) {
  await Promise.all([
    db
      .collection("projects")
      .createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { slug: 1 }, unique: true },
        { key: { published: 1, division: 1, order: 1, id: 1 } },
      ]),
    db
      .collection("inquiries")
      .createIndexes([
        { key: { id: 1 }, unique: true },
        { key: { createdAt: -1 } },
      ]),
    db.collection("settings").createIndex({ key: 1 }, { unique: true }),
    db.collection("admin_accounts").createIndexes([
      { key: { id: 1 }, unique: true },
      {
        key: { email: 1 },
        unique: true,
        partialFilterExpression: { email: { $type: "string" } },
        collation: { locale: "en", strength: 2 },
      },
      {
        key: { resetTokenHash: 1 },
        unique: true,
        partialFilterExpression: { resetTokenHash: { $type: "string" } },
      },
    ]),
    db.collection("rate_limits").createIndexes([
      { key: { key: 1 }, unique: true },
      { key: { resetAt: 1 }, expireAfterSeconds: 0 },
    ]),
  ]);
}

export async function closeMongoConnections() {
  const clients = [...connections.values()].map(({ client }) => client);
  connections.clear();
  await Promise.all(clients.map((client) => client.close()));
}
