# MongoDB setup and migration

The application stores projects, inquiries, application settings and request rate limits in MongoDB using the official Node.js driver. IDs, slugs and the public API response shape remain unchanged. Bootstrap password hashes and session secrets remain server environment variables. Media is stored in Cloudinary when `MEDIA_STORAGE=cloudinary`, or `DATA_DIR/uploads/` in local mode; MongoDB contains image and attachment references. See [Cloudinary setup and media migration](CLOUDINARY.md) before moving to App Platform.

## Local development

The current workspace uses MongoDB Community 8.0.30, downloaded from MongoDB's official release manifest and verified against its SHA-256 checksum. Its executable is stored under ignored `data/tools/mongodb/bin/mongod`, without changing the system installation.

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=reliant-local
MONGODB_DB=reliant_renovations
DATA_DIR=./data
```

Start `npm run db:local`, then `npm run dev` in a separate terminal. The local runner binds only to 127.0.0.1 on port 27018 and stores its files under `data/mongodb/`. It does not start on boot. Stop its terminal process with Ctrl+C for a clean shutdown. The existing MongoDB listener on port 27017 is unrelated and is not modified.

On a fresh checkout, install MongoDB Community Server and expose `mongod` on PATH, or set `MONGODB_BIN` to a current executable. The binary and database files are not source-controlled.

## Production connection

Set `MONGODB_URI` to the MongoDB Atlas connection string or an authenticated replica-set connection string, and set `MONGODB_DB` to the intended database. Keep both server-side; never use a `NEXT_PUBLIC_` prefix. The app requires a replica set because initial seeding, project writes, and catalogue reordering use transactions. MongoDB's [Node.js transaction documentation](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) describes this API.

Use a database account scoped to this application's database with permission to read/write and create its indexes. Configure Atlas/network access and backups in the hosting account. No Atlas cluster or live deployment has been created as part of this local migration.

Connection pools are reused across development reloads. The app reads current records on the server; clients never receive database credentials or BSON `_id` values. Unique indexes enforce project IDs and slugs. A TTL index cleans up expired rate-limit records, while each request checks expiration atomically without depending on TTL cleanup timing.

## Transfer an existing SQLite installation

Run the import before the application seeds a new destination database. The migration accepts `DATABASE_PATH` for the old SQLite source; otherwise it reads `DATA_DIR/reliant.db`.

```sh
npm run db:migrate
npm run db:migrate -- --apply
```

The first command is read-only and reports record counts. Apply writes a private JSON snapshot to `DATA_DIR/backups/`, then imports in a single MongoDB transaction. It compares every project and inquiry field before committing. IDs, slugs, ordering, publish/featured state, client wording, timestamps, image arrays, inquiry read status and attachment references are preserved. SQLite is opened read-only and retained; image files are not moved.

The script refuses to overwrite an existing destination. If the app already seeded it, choose a fresh `MONGODB_DB`; do not delete the old destination to make the script pass. Repeating the migration for an identical source snapshot is a no-op, including after subsequent MongoDB edits. A migration marker records the source digest and counts.

The completed workspace migration preserved **10 projects and 80 image references**. The source contained **zero inquiries**. Its private snapshot is `data/backups/sqlite-to-mongo-1788979134048.json`; the original SQLite database remains at `data/reliant.db`.

For recovery, retain the old SQLite application revision with its database/uploads snapshot. The current application does not silently fall back to SQLite. To recover into MongoDB, import that retained SQLite snapshot into a fresh database or restore a tested MongoDB backup. Changes made after migration live in MongoDB and require a MongoDB backup.

`scripts/restore-client-copy.ts` is a historical SQLite-only recovery tool. It does not modify the active MongoDB records.

## Verification

`npm test` and `npm run test:integration` create isolated generated database names. Their default is the local replica set on port 27018; `MONGODB_TEST_URI` can explicitly select another test server. Tests never reuse `MONGODB_DB` from the site configuration. They drop only their generated databases and clean up temporary uploads and server processes.

Checks cover CRUD, unique slugs, hidden projects, exact-set reordering, rejection of edits to deleted projects, inquiry persistence/read status, seed-once behavior and concurrent rate-limit requests. Integration also exercises authenticated HTTP routes, uploads and private attachments. Run a production build before integration.

Verified September 9, 2026: all 14 unit tests and 71 production integration assertions passed, along with TypeScript, ESLint and the production build. Separate migration checks confirmed read-only preview, import fidelity, private backup permissions, idempotence after owner edits, refusal to overwrite an occupied database, and complete rollback after an import failure. All generated test databases were removed. After a clean local MongoDB restart, every live project/inquiry field still matched the retained source snapshot and the running homepage returned HTTP 200.
