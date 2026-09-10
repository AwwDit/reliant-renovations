import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  inquiryConfirmationEmail,
  ownerInquiryEmail,
  passwordResetEmail,
  passwordChangedEmail,
} from "../lib/email/templates";
import type { Inquiry } from "../lib/types";
import {
  emailPreviewGallery,
  type EmailPreview,
} from "./email-preview-gallery";

// Synthetic preview content only. This command never invokes the email provider.
const inquiry: Inquiry = {
  id: "b593c914-fb2f-477c-b4c6-0649b19c4e08",
  name: "Example homeowner",
  company: "",
  email: "homeowner@example.test",
  phone: "(516) 555-0100",
  projectType: "residential",
  location: "Plainview, New York",
  timing: "3-6-months",
  description:
    "We are planning a kitchen renovation with new cabinetry, countertops and lighting.\n\nWe would like to discuss the scope and coordination of the work.",
  attachment: "/api/uploads/inquiry-example.pdf",
  createdAt: "2026-09-09T16:30:00.000Z",
  read: false,
};
const brand = {
  siteUrl: process.env.EMAIL_PREVIEW_SITE_URL || "https://reliant.example.test",
  contactEmail: "hello@example.test",
};

function openInBrowser(file: string): Promise<void> {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "explorer.exe"
        : "xdg-open";
  return new Promise((resolve, reject) => {
    const child = spawn(command, [file], { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help")) {
    console.log(
      "Usage: npm run email:preview [-- --no-open]\n\nRenders all four emails and opens an offline preview gallery.\n--no-open  Generate the gallery and HTML/text exports without opening a browser.\n\nRun again after editing a template, then refresh the gallery. No emails are sent.",
    );
    return;
  }
  if (args.some((arg) => arg !== "--no-open")) {
    throw new Error("Unknown option. Use npm run email:preview -- --help.");
  }

  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const directory = resolve(root, "docs/email-form-2026/previews");
  const logo = `data:image/png;base64,${(
    await readFile(
      resolve(root, "public/images/brand/reliant-color-transparent.png"),
    )
  ).toString("base64")}`;
  const previews: EmailPreview[] = [
    {
      id: "owner-inquiry",
      label: "New project inquiry",
      audience: "Owner inbox",
      trigger: "Sent to the owner after a project inquiry is saved.",
      template: ownerInquiryEmail(inquiry, brand),
    },
    {
      id: "inquiry-confirmation",
      label: "Inquiry confirmation",
      audience: "Customer",
      trigger: "Sent to the customer after their project inquiry is saved.",
      template: inquiryConfirmationEmail(inquiry, brand),
    },
    {
      id: "password-reset",
      label: "Password reset",
      audience: "Admin account",
      trigger: "Sent when the owner requests a password-reset link.",
      template: passwordResetEmail("e".repeat(64), brand),
    },
    {
      id: "password-changed",
      label: "Password changed",
      audience: "Admin account",
      trigger: "Sent after the owner successfully resets their password.",
      template: passwordChangedEmail(brand),
    },
  ];

  await mkdir(directory, { recursive: true });
  for (const preview of previews) {
    // Only preview copies embed the logo. Production email HTML stays unchanged.
    preview.template.html = preview.template.html.replace(
      /src="[^"]*\/images\/brand\/reliant-color-transparent\.png"/g,
      () => `src="${logo}"`,
    );
    await writeFile(
      resolve(directory, `${preview.id}.html`),
      preview.template.html,
    );
    await writeFile(
      resolve(directory, `${preview.id}.txt`),
      preview.template.text,
    );
  }
  const gallery = resolve(directory, "index.html");
  await writeFile(gallery, emailPreviewGallery(previews, logo));
  console.log(`\nEmail preview gallery: ${pathToFileURL(gallery).href}`);
  console.log(
    "Four emails · Desktop / mobile · HTML / plain text\nWorks offline. No server, database, or email credentials needed. No emails sent.\nRun this command again after editing templates, then refresh the gallery.\n",
  );
  if (!args.includes("--no-open")) {
    try {
      await openInBrowser(gallery);
    } catch {
      console.log(
        "Could not open a browser automatically. Open the file above manually.",
      );
    }
  }
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
