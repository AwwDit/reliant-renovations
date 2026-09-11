import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Inquiry } from "../types";
import { site } from "../site";
import {
  inquiryConfirmationEmail,
  ownerInquiryEmail,
  passwordResetEmail,
  passwordChangedEmail,
  type EmailBrand,
  type EmailTemplate,
} from "./templates";

type DeliveryResult = { emailSent: boolean; confirmationEmailSent: boolean };

/** Called only after storage succeeds. Provider failures never discard an inquiry. */
export async function sendInquiryEmails(
  inquiry: Inquiry,
): Promise<DeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();
  const owner = process.env.INQUIRY_TO_EMAIL?.trim();
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (!apiKey || !from)
    return { emailSent: false, confirmationEmailSent: false };

  const brand = {
    siteUrl:
      process.env.SITE_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      site.url,
    contactEmail,
  };

  async function send(
    kind: "owner-inquiry" | "inquiry-confirmation",
    to: string,
    template: EmailTemplate,
    replyTo?: string,
  ): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `${kind}/${inquiry.id}`,
        },
        body: JSON.stringify({
          from,
          to: [to],
          ...(replyTo ? { reply_to: replyTo } : {}),
          ...template,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok)
        console.error(`${kind} email provider returned`, response.status);
      return response.ok;
    } catch {
      console.error(
        `${kind} email failed; inquiry remains saved in the dashboard.`,
      );
      return false;
    }
  }

  try {
    const ownerTemplate = owner ? ownerInquiryEmail(inquiry, brand) : null;
    const confirmationTemplate = inquiryConfirmationEmail(inquiry, brand);
    const [emailSent, confirmationEmailSent] = await Promise.all([
      owner && ownerTemplate
        ? send("owner-inquiry", owner, ownerTemplate, inquiry.email)
        : Promise.resolve(false),
      // The private notification destination is never revealed to the customer.
      send(
        "inquiry-confirmation",
        inquiry.email,
        confirmationTemplate,
        contactEmail,
      ),
    ]);
    return { emailSent, confirmationEmailSent };
  } catch {
    console.error(
      "Inquiry email configuration is invalid; inquiry remains saved in the dashboard.",
    );
    return { emailSent: false, confirmationEmailSent: false };
  }
}

const securityRecipientSchema = z.string().trim().email().max(254);

async function sendAccountSecurityEmail(
  render: (brand: EmailBrand) => EmailTemplate,
  idempotencyKey: string,
  recipientEmail?: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.INQUIRY_FROM_EMAIL?.trim();
  // Legacy callers may omit the account; an invalid explicit recipient must
  // never redirect a password-reset secret to the bootstrap owner address.
  const rawRecipient =
    recipientEmail === undefined ? process.env.ADMIN_EMAIL : recipientEmail;
  if (typeof rawRecipient !== "string" || /[\r\n]/.test(rawRecipient))
    return false;
  const recipient = securityRecipientSchema.safeParse(rawRecipient);
  if (!apiKey || !from || !recipient.success) return false;
  try {
    const template = render({
      siteUrl:
        process.env.SITE_URL?.trim() ||
        process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
        site.url,
    });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({ from, to: [recipient.data], ...template }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      console.error("Admin account email provider returned", response.status);
    return response.ok;
  } catch {
    console.error("Admin account email could not be sent.");
    return false;
  }
}

export async function sendPasswordResetEmail(
  token: string,
  recipientEmail?: string,
): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(token)) return false;
  const fingerprint = createHash("sha256").update(token).digest("hex");
  return sendAccountSecurityEmail(
    (brand) => passwordResetEmail(token, brand),
    `owner-password-reset/${fingerprint}`,
    recipientEmail,
  );
}

export async function sendPasswordChangedEmail(
  recipientEmail?: string,
): Promise<boolean> {
  return sendAccountSecurityEmail(
    passwordChangedEmail,
    `owner-password-changed/${randomUUID()}`,
    recipientEmail,
  );
}
