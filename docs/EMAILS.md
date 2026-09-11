# Branded email templates

The shared email design uses Reliant's original full-color logo, charcoal masthead, light content surface, blue action button, straight borders and a Manrope/Arial/Helvetica font stack. The templates use inline styles, presentation tables, an Outlook width fallback, mobile spacing, a hidden preview line and explicit plain-text alternatives. Email clients that do not have Manrope use the fallback fonts.

## Active messages

| Email               | Recipient               | Trigger                               | Action                                                             |
| ------------------- | ----------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| New project inquiry | `INQUIRY_TO_EMAIL`      | Inquiry successfully saved in MongoDB | Open the protected Inquiries tab; reply to the submitter           |
| Inquiry received    | Submitted email address | Inquiry successfully saved in MongoDB | View Our Work; reply to the public contact address when configured |

The owner alert contains the submitted fields and description. Blank company/phone values are omitted. Attachments are mentioned but never attached or linked publicly. The customer receipt contains the inquiry reference and selected project type/timing; it does not echo free-text descriptions, expose the owner notification address, or include admin links. It uses the existing form confirmation wording and makes no response-time promise.

## Environment

Set these in `.env.local` or the production host:

```env
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=your-owner@your-domain.com
INQUIRY_FROM_EMAIL=Reliant Renovations <projects@your-domain.com>
INQUIRY_TO_EMAIL=your-owner-inbox@your-domain.com
NEXT_PUBLIC_CONTACT_EMAIL=your-public-contact@your-domain.com
SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Use a verified sending domain for `INQUIRY_FROM_EMAIL`. `INQUIRY_TO_EMAIL` is the private owner notification destination. `NEXT_PUBLIC_CONTACT_EMAIL` is optional and also appears on the website; it is used for customer email replies when supplied. Without it, replies go to the configured sender. Use a monitored sender in that case. The logo is loaded from the public site URL, so recipients need a publicly reachable domain, not localhost.

No extra email-template IDs or hosted template setup is required. All four templates are rendered in `lib/email/templates.ts` and sent by `lib/email/delivery.ts` using the existing [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email). Each message has its own [idempotency key](https://resend.com/docs/dashboard/emails/idempotency-keys). Inquiry keys use the saved inquiry ID; reset keys use the token hash, not the raw reset secret.

Storage completes before notification attempts. The two messages are attempted independently with bounded provider timeouts. Either email may fail without losing the inquiry. API flags describe provider acceptance, not eventual inbox delivery; there is no automatic retry worker or delivery-webhook tracking.

## Local previews and tests

```sh
npm run email:preview
node --import tsx --test tests/email.test.ts tests/security-email.test.ts
```

The preview command generates and opens an offline gallery with all four emails. Choose an email in the sidebar, switch between desktop and mobile widths, and review either the HTML or plain-text version. The subject and intended recipient are shown above each email; download links provide individual files. Email links inside the gallery are disabled.

The gallery lives at `docs/email-form-2026/previews/index.html`, alongside the individual `.html` and `.txt` files. You can reopen or share `index.html` on its own; it contains all four previews and generates downloads directly. The logo is embedded in preview copies, so no website, MongoDB, internet connection, or email credentials are needed. All data and recovery tokens are synthetic. Production templates are unchanged and still use the public logo URL.

Run `npm run email:preview -- --no-open` to generate the files without opening a browser. After editing `lib/email/templates.ts`, rerun the command and refresh the gallery. `EMAIL_PREVIEW_SITE_URL` optionally changes the example link destinations; it defaults to `https://reliant.example.test`. Preview generation does not load `.env.local` or call Resend. Delivery tests mock the network and use fake credentials; no messages are sent.

Browser screenshots verify layout and overflow. They are not substitutes for actual Gmail/Outlook/Apple Mail rendering or a delivery test with the production domain.

## Admin account password recovery

Two further branded account emails are implemented: **Reset your password** with the one-time recovery link, and **Password changed** with sign-in and recovery actions. Each is sent only to the affected admin account's email address, using the same verified `INQUIRY_FROM_EMAIL` sender and Resend key. Other administrators, the inquiry inbox and the public contact address do not receive a copy. Invalid account email addresses are rejected; they never redirect recovery mail to the owner.

`ADMIN_EMAIL` identifies the initial owner for account setup; it is not a shared recovery destination for additional administrators. Accounts have their own stored email addresses and password hashes. The delivery helpers retain an `ADMIN_EMAIL` fallback only for older callers that omit the account recipient; the account recovery routes pass the affected account's email explicitly.

Choose **Forgot password?** on the sign-in screen and enter your account email. `/admin/forgot-password` returns the same confirmation whether or not the submitted address matches an account. Requests are rate-limited. The reset link expires after 30 minutes; requesting another invalidates the earlier link for that account. Only its hash and expiry are stored in MongoDB. The secret travels in the email link's URL fragment, which is not sent with the page request. Opening the link does not consume it; submitting a valid new password consumes it atomically.

Passwords must contain 12–512 characters. A successful reset saves a new password hash in MongoDB, removes the token and invalidates existing sessions for that account. Other administrators' passwords and sessions are unchanged. It does not sign in automatically. Keep `ADMIN_SESSION_SECRET` configured. Account emails run after the HTTP response, so provider latency does not reveal a matching address. Delivery failure invalidates the matching unsent reset token, and the account holder can request another link.

Creating an additional admin account does not send an invitation email. The owner creates the account with a name, email address and password in the dashboard, or the site operator uses `npm run admin:add`. Invitation emails, email verification and in-app reply sending are outside this flow.
