import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Writable } from "node:stream";

/** Readline retains editing support while secret input is hidden from the terminal. */
class PrivateOutput extends Writable {
  hidden = false;

  _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    if (!this.hidden) stdout.write(chunk);
    callback();
  }
}

async function main() {
  if (!stdin.isTTY || !stdout.isTTY)
    throw new Error(
      "Run npm run admin:add in an interactive terminal. Passwords cannot be piped or passed as arguments.",
    );
  if (process.argv.length > 2)
    throw new Error(
      "Run npm run admin:add without arguments. Enter the account details at the prompts.",
    );

  loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
  const { authConfigured } = await import("../lib/auth");
  if (!authConfigured())
    throw new Error(
      "Keep ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET configured before adding another admin.",
    );
  if (!process.env.MONGODB_URI)
    throw new Error(
      "Set MONGODB_URI and MONGODB_DB to the website's database before adding an admin.",
    );

  const { AdminAccountError, createAdminAccount, normalizeAdminEmail } =
    await import("../lib/admin-accounts");
  const { closeMongoConnections } = await import("../lib/mongodb");
  const output = new PrivateOutput();
  const terminal = createInterface({ input: stdin, output, terminal: true });
  const abort = new AbortController();
  terminal.on("SIGINT", () => abort.abort());

  async function secret(prompt: string) {
    const answer = terminal.question(prompt, { signal: abort.signal });
    output.hidden = true;
    try {
      return await answer;
    } finally {
      output.hidden = false;
      stdout.write("\n");
    }
  }

  try {
    console.log(
      `Add an admin to MongoDB database: ${process.env.MONGODB_DB || "reliant_renovations"}`,
    );
    console.log(
      "Use the deployed site's MongoDB settings to create a login for the live site. The owner account is preserved.\n",
    );
    const name = (
      await terminal.question("Your name: ", { signal: abort.signal })
    ).trim();
    if (!name || name.length > 100)
      throw new Error("Enter a name of 1–100 characters.");
    const email = normalizeAdminEmail(
      await terminal.question("Your email: ", { signal: abort.signal }),
    );
    if (!email) throw new Error("Enter a valid email address.");
    const password = await secret(
      "Choose a password (12+ characters; input is hidden): ",
    );
    if (password.length < 12 || password.length > 512)
      throw new Error("Use a password between 12 and 512 characters.");
    if (password !== (await secret("Confirm password (input is hidden): ")))
      throw new Error(
        "The passwords did not match. No admin account was created.",
      );
    try {
      const account = await createAdminAccount({ name, email, password });
      console.log(
        `\nAdmin account created for ${account.email}. Sign in at /admin with your email and password.`,
      );
    } catch (error) {
      if (error instanceof AdminAccountError) throw new Error(error.message);
      throw new Error(
        "The account could not be created. Check the MongoDB connection and database access, then try again.",
      );
    }
  } finally {
    output.hidden = false;
    terminal.close();
    await closeMongoConnections();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error && error.name !== "AbortError"
      ? error.message
      : "Cancelled.",
  );
  process.exitCode = 1;
});
