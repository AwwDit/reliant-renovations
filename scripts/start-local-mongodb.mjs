import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createConnection } from "node:net";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

// A workspace-specific local replica set supports the same transactions as Atlas.
const port = 27018;
const replicaSet = "reliant-local";
const uri = `mongodb://127.0.0.1:${port}/?directConnection=true`;
const directory = resolve("data/mongodb");
// Never initialize or reconfigure a database owned by another local process.
await new Promise((done, reject) => {
  const socket = createConnection({ host: "127.0.0.1", port });
  socket.once("connect", () => {
    socket.destroy();
    reject(
      new Error(
        "Port 27018 is already in use. Keep the existing MongoDB process or stop it explicitly before starting this one.",
      ),
    );
  });
  socket.once("error", (error) => {
    socket.destroy();
    if (error.code === "ECONNREFUSED") done();
    else reject(error);
  });
});
await mkdir(directory, { recursive: true, mode: 0o700 });
const localBinary = resolve("data/tools/mongodb/bin/mongod");
const child = spawn(
  process.env.MONGODB_BIN || (existsSync(localBinary) ? localBinary : "mongod"),
  [
    "--dbpath",
    directory,
    "--bind_ip",
    "127.0.0.1",
    "--port",
    String(port),
    "--replSet",
    replicaSet,
    "--logpath",
    resolve("data/mongodb.log"),
    "--logappend",
    "--nounixsocket",
  ],
  { stdio: ["ignore", "inherit", "inherit"] },
);
let stopped = false;
child.on("error", () => {
  console.error(
    "Could not start mongod. Install MongoDB Community Server or set MONGODB_BIN to its executable.",
  );
  process.exitCode = 1;
  stopped = true;
});
child.on("exit", (code) => {
  stopped = true;
  if (code && code !== 0) {
    console.error(
      "MongoDB stopped. Check data/mongodb.log; port 27018 may already be in use.",
    );
    process.exitCode = code;
  }
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stopped = true;
    child.kill("SIGTERM");
  });
try {
  let ready = false;
  for (let attempt = 0; attempt < 60 && !stopped; attempt++) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 500 });
    try {
      const hello = await client.db("admin").command({ hello: 1 });
      const status = await client.db("admin").command({ serverStatus: 1 });
      if (status.pid !== child.pid)
        throw new Error("Port 27018 belongs to a different MongoDB process.");
      if (hello.setName && hello.setName !== replicaSet)
        throw new Error("Port 27018 belongs to a different replica set.");
      if (!hello.setName) {
        await client.db("admin").command({
          replSetInitiate: {
            _id: replicaSet,
            members: [{ _id: 0, host: `127.0.0.1:${port}` }],
          },
        });
      } else if (hello.isWritablePrimary) {
        ready = true;
        console.log(
          "Local MongoDB ready on 127.0.0.1:27018 (replica set reliant-local). Keep this terminal running.",
        );
        break;
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("different replica set") ||
          error.message.includes("different MongoDB process"))
      )
        throw error;
    } finally {
      await client.close();
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready && !stopped)
    throw new Error(
      "Local MongoDB did not become ready. Check data/mongodb.log.",
    );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Local MongoDB failed to start.",
  );
  process.exitCode = 1;
  child.kill("SIGTERM");
}
