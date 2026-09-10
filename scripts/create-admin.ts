import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function main() {
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    console.log(
      "Create an owner account. Add the generated values to .env.local or your host environment.",
    );
    const password = await terminal.question(
      "Choose a password (12+ characters; input is visible): ",
    );
    if (password.length < 12 || password.length > 512)
      throw new Error("Use a password between 12 and 512 characters.");
    const salt = randomBytes(16).toString("hex");
    console.log(
      `\nADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`,
    );
    console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString("hex")}\n`);
    console.log(
      "Restart the application after saving these values. Keep them private.",
    );
  } finally {
    terminal.close();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unable to create account.",
  );
  process.exitCode = 1;
});
