import type { Inquiry } from "../types";

export interface EmailBrand {
  siteUrl: string;
  contactEmail?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const projectTypes: Record<string, string> = {
  commercial: "Commercial construction",
  residential: "Residential renovation",
};
const timings: Record<string, string> = {
  flexible: "I’m exploring / timing is flexible",
  soon: "As soon as possible",
  "1-3-months": "In the next 1–3 months",
  "3-6-months": "In the next 3–6 months",
  "6-plus-months": "More than 6 months from now",
};

const projectTypeOf = (value: string) =>
  Object.hasOwn(projectTypes, value) ? projectTypes[value] : undefined;
const timingOf = (value: string) =>
  Object.hasOwn(timings, value) ? timings[value] : undefined;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character]!;
  });
}

function originOf(brand: EmailBrand): string {
  const url = new URL(brand.siteUrl);
  if (!["https:", "http:"].includes(url.protocol))
    throw new Error("Email links require an HTTP or HTTPS site URL.");
  return url.origin;
}

function reference(inquiry: Inquiry): string {
  return `RR-${inquiry.id.slice(0, 8).toUpperCase()}`;
}

function rows(fields: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;table-layout:fixed;">${fields
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `<tr>
        <td class="detail-label" valign="top" width="132" style="width:132px;padding:14px 14px 14px 0;border-bottom:1px solid #d8dbda;color:#606765;font-size:12px;line-height:20px;">${escapeHtml(label)}</td>
        <td valign="top" style="padding:14px 0;border-bottom:1px solid #d8dbda;color:#202524;font-size:14px;line-height:22px;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join("")}</table>`;
}

function button(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;border-collapse:collapse;">
    <tr><td bgcolor="#195bdf" style="background:#195bdf;border:1px solid #195bdf;mso-padding-alt:16px 22px;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:16px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;line-height:20px;">${escapeHtml(label)} <span aria-hidden="true" style="padding-left:22px;">&#8594;</span></a>
    </td></tr>
  </table>`;
}

function shell({
  brand,
  subject,
  preheader,
  section,
  heading,
  body,
  footer,
}: {
  brand: EmailBrand;
  subject: string;
  preheader: string;
  section: string;
  heading: string;
  body: string;
  footer: string;
}): string {
  const origin = originOf(brand);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none}
    a:focus-visible{outline:2px solid #195bdf;outline-offset:4px}
    @media only screen and (max-width:600px){
      .email-outer{padding:0!important}
      .email-pad{padding-left:24px!important;padding-right:24px!important}
      .email-heading{font-size:30px!important;line-height:35px!important}
      .detail-label{width:94px!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background:#e9eceb;color:#202524;font-family:Manrope,Arial,Helvetica,sans-serif;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#e9eceb" style="width:100%;background:#e9eceb;">
    <tr><td class="email-outer" align="center" style="padding:36px 16px;">
      <!--[if mso]><table role="presentation" width="640" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;border-collapse:collapse;background:#f9faf9;">
        <tr><td class="email-pad" bgcolor="#181c1d" style="padding:30px 40px;background:#181c1d;border-bottom:3px solid #2463eb;">
          <a href="${escapeHtml(origin)}" style="text-decoration:none;color:#ffffff;">
            <img src="${escapeHtml(origin)}/images/brand/reliant-color-transparent.png" width="146" height="104" alt="Reliant Renovations Inc." style="display:block;width:146px;height:104px;color:#ffffff;font-size:18px;font-weight:bold;">
          </a>
          <p style="margin:21px 0 0;font-size:11px;line-height:19px;letter-spacing:0.6px;color:#c7cecd;">Commercial Construction<br>Residential Renovations</p>
        </td></tr>
        <tr><td class="email-pad" style="padding:34px 40px 38px;">
          <p style="margin:0 0 14px;color:#195bdf;font-size:11px;font-weight:700;line-height:18px;letter-spacing:1.4px;text-transform:uppercase;">${escapeHtml(section)}</p>
          <h1 class="email-heading" style="margin:0 0 24px;font-size:36px;line-height:41px;letter-spacing:-1.3px;font-weight:600;color:#202524;">${escapeHtml(heading)}</h1>
          ${body}
        </td></tr>
        <tr><td class="email-pad" style="padding:25px 40px 30px;border-top:1px solid #d8dbda;">
          <p style="margin:0 0 10px;font-size:12px;line-height:20px;font-weight:700;color:#202524;">Reliant Renovations Inc.</p>
          <p style="margin:0 0 12px;font-size:11px;line-height:18px;color:#606765;">New York City, Long Island, Westchester and select surrounding markets.</p>
          <p style="margin:0 0 14px;font-size:11px;line-height:18px;color:#606765;">${escapeHtml(footer)}</p>
          <p style="margin:0;font-size:11px;line-height:18px;"><a href="${escapeHtml(origin)}" style="color:#195bdf;text-decoration:underline;">Website</a>&nbsp;&nbsp; / &nbsp;&nbsp;<a href="${escapeHtml(origin)}/privacy" style="color:#195bdf;text-decoration:underline;">Privacy</a></p>
        </td></tr>
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}

const paragraph = (text: string) =>
  `<p style="margin:0 0 22px;font-size:14px;line-height:24px;color:#4e5754;">${escapeHtml(text)}</p>`;

/** The owner receives the complete submission; attachments stay behind admin auth. */
export function ownerInquiryEmail(
  inquiry: Inquiry,
  brand: EmailBrand,
): EmailTemplate {
  const subject = "New project inquiry | Reliant Renovations";
  const inbox = `${originOf(brand)}/admin?view=inquiries`;
  const fields: [string, string][] = [
    ["Reference", reference(inquiry)],
    ["Name", inquiry.name],
    ["Company", inquiry.company],
    ["Email", inquiry.email],
    ["Phone", inquiry.phone],
    ["Project type", projectTypeOf(inquiry.projectType) || inquiry.projectType],
    ["Location", inquiry.location],
    ["Desired timing", timingOf(inquiry.timing) || inquiry.timing],
  ];
  const attachmentNotice = inquiry.attachment
    ? "An attachment was included. Sign in to the owner dashboard to download it."
    : "";
  const body = `${paragraph("A project inquiry has been saved to your owner inbox. Reply to this email to contact the person who submitted it.")}
    ${rows(fields)}
    <h2 style="margin:28px 0 12px;font-size:16px;line-height:24px;font-weight:700;color:#202524;">Project description</h2>
    <p style="margin:0 0 22px;font-size:14px;line-height:24px;color:#4e5754;word-break:break-word;overflow-wrap:anywhere;">${escapeHtml(inquiry.description).replace(/\r?\n/g, "<br>")}</p>
    ${attachmentNotice ? paragraph(attachmentNotice) : ""}
    ${button("Open inquiries", inbox)}`;
  return {
    subject,
    html: shell({
      brand,
      subject,
      preheader:
        "A new project inquiry is ready to review in your owner inbox.",
      section: "Owner workspace",
      heading: "New project inquiry.",
      body,
      footer:
        "This notification was sent to the configured owner inquiry address.",
    }),
    text: [
      "RELIANT RENOVATIONS INC.",
      "New project inquiry",
      ...fields
        .filter(([, value]) => value)
        .map(([label, value]) => `${label}: ${value}`),
      `Project description:\n${inquiry.description}`,
      attachmentNotice,
      "Reply to this email to contact the person who submitted the inquiry.",
      `Open inquiries: ${inbox}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

/** Keep the receipt concise; don't forward free-text submissions or private owner details. */
export function inquiryConfirmationEmail(
  inquiry: Inquiry,
  brand: EmailBrand,
): EmailTemplate {
  const subject = "We received your project inquiry | Reliant Renovations";
  const contact = brand.contactEmail
    ? "If you would like to add anything, reply to this email."
    : "We will use the contact details you provided to follow up.";
  const fields: [string, string][] = [
    ["Reference", reference(inquiry)],
    ["Project type", projectTypeOf(inquiry.projectType) || "Project inquiry"],
    [
      "Desired timing",
      timingOf(inquiry.timing) || "As provided in your inquiry",
    ],
  ];
  const message =
    "Your project inquiry has been received. Our team will be in touch.";
  return {
    subject,
    html: shell({
      brand,
      subject,
      preheader: message,
      section: "Project inquiry",
      heading: "Inquiry received.",
      body: `${paragraph("Thank you for contacting Reliant Renovations.")}${paragraph(message)}${rows(fields)}<div style="padding-top:24px;">${paragraph(contact)}</div>${button("View Our Work", `${originOf(brand)}/projects`)}`,
      footer:
        "You received this confirmation because this email address was used to submit a project inquiry on our website.",
    }),
    text: [
      "RELIANT RENOVATIONS INC.",
      "Inquiry received",
      "Thank you for contacting Reliant Renovations.",
      message,
      ...fields.map(([label, value]) => `${label}: ${value}`),
      contact,
      `View Our Work: ${originOf(brand)}/projects`,
      `Privacy: ${originOf(brand)}/privacy`,
    ].join("\n\n"),
  };
}

export function passwordResetEmail(
  token: string,
  brand: EmailBrand,
): EmailTemplate {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new Error("Invalid password-reset token.");
  const url = `${originOf(brand)}/admin/reset-password#token=${token}`;
  const subject = "Reset your admin password | Reliant Renovations";
  const instructions =
    "Use the link below to choose a new password for your Reliant Renovations admin account. The link expires in 30 minutes and can be used once.";
  const ignore =
    "If you did not request this, you can ignore this email. Your password has not changed.";
  return {
    subject,
    html: shell({
      brand,
      subject,
      preheader: "Your one-time password-reset link expires in 30 minutes.",
      section: "Admin access",
      heading: "Reset your password.",
      body: `${paragraph(instructions)}${button("Reset password", url)}<div style="padding-top:28px;">${paragraph(ignore)}</div>`,
      footer:
        "This account email was sent to the email address for your admin account.",
    }),
    text: [
      "RELIANT RENOVATIONS INC.",
      "Reset your password",
      instructions,
      `Reset password: ${url}`,
      ignore,
    ].join("\n\n"),
  };
}

export function passwordChangedEmail(brand: EmailBrand): EmailTemplate {
  const subject = "Your admin password was changed | Reliant Renovations";
  const message =
    "The password for your Reliant Renovations admin account has been changed. Previous sign-in sessions for this account have been signed out.";
  const unexpected =
    "If you did not make this change, request a new password-reset link to secure your account.";
  const origin = originOf(brand);
  return {
    subject,
    html: shell({
      brand,
      subject,
      preheader: "Your admin account password has been changed.",
      section: "Admin access",
      heading: "Password changed.",
      body: `${paragraph(message)}${button("Sign in", `${origin}/admin`)}<div style="padding-top:28px;">${paragraph(unexpected)}<p style="margin:0;font-size:13px;line-height:22px;"><a href="${escapeHtml(origin)}/admin/forgot-password" style="color:#195bdf;text-decoration:underline;">Request a password-reset link</a></p></div>`,
      footer:
        "This account email was sent to the email address for your admin account.",
    }),
    text: [
      "RELIANT RENOVATIONS INC.",
      "Password changed",
      message,
      `Sign in: ${origin}/admin`,
      unexpected,
      `Password recovery: ${origin}/admin/forgot-password`,
    ].join("\n\n"),
  };
}
