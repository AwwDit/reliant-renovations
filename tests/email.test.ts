import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import {
  inquiryConfirmationEmail,
  ownerInquiryEmail,
  type EmailBrand,
} from "../lib/email/templates";
import { sendInquiryEmails } from "../lib/email/delivery";
import type { Inquiry } from "../lib/types";

const inquiry: Inquiry = {
  id: "c17b898c-4c7a-44bc-a830-51cb8ec22a44",
  name: "Jamie Example",
  company: "Example Company",
  email: "customer@example.test",
  phone: "555-0107",
  location: "Example project location",
  projectType: "commercial",
  timing: "1-3-months",
  description: "Renovate the reception area.\nRetain the existing cabinetry.",
  attachment: "/api/uploads/inquiry-private-example.pdf",
  createdAt: "2026-09-09T14:00:00.000Z",
  read: false,
};

const brand: EmailBrand = {
  siteUrl: "https://reliant.example.test/ignored-path?ignored=query",
  contactEmail: "hello@example.test",
};

test("owner notification includes the full submission, friendly labels, branding and a working inbox destination", () => {
  const email = ownerInquiryEmail(inquiry, brand);
  assert.match(email.subject, /New project inquiry/);
  assert.ok(
    email.html.includes(
      'src="https://reliant.example.test/images/brand/reliant-color-transparent.png"',
    ),
  );
  assert.ok(email.html.includes('alt="Reliant Renovations Inc."'));
  assert.ok(
    email.html.includes(
      "New York City, Long Island, Westchester and select surrounding markets.",
    ),
  );
  for (const line of [
    "Reference: RR-C17B898C",
    `Name: ${inquiry.name}`,
    `Company: ${inquiry.company}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone}`,
    "Project type: Commercial construction",
    `Location: ${inquiry.location}`,
    "Desired timing: In the next 1–3 months",
    `Project description:\n${inquiry.description}`,
  ]) {
    assert.ok(email.text.includes(line), line);
  }
  assert.ok(
    email.html.includes(
      "Renovate the reception area.<br>Retain the existing cabinetry.",
    ),
  );
  assert.ok(
    email.html.includes(
      'href="https://reliant.example.test/admin?view=inquiries"',
    ),
  );
  assert.ok(
    email.text.includes(
      "Open inquiries: https://reliant.example.test/admin?view=inquiries",
    ),
  );
  for (const body of [email.html, email.text]) {
    assert.match(body, /Sign in to the owner dashboard to download it/);
    assert.ok(!body.includes(inquiry.attachment!));
    assert.ok(!body.includes("ignored-path"));
  }
});

test("owner notification omits empty optional fields and absent attachment notices", () => {
  const email = ownerInquiryEmail(
    { ...inquiry, company: "", phone: "", attachment: null },
    brand,
  );
  assert.doesNotMatch(email.text, /(?:Company|Phone):/);
  assert.doesNotMatch(email.html, />Company<|>Phone</);
  assert.doesNotMatch(email.html + email.text, /An attachment was included/);
  assert.ok(email.text.includes(`Name: ${inquiry.name}`));
});

test("untrusted submission fields are escaped in HTML and preserved as plain text", () => {
  const hostile = "<script>alert(\"unsafe\")</script> & 'quoted'";
  const email = ownerInquiryEmail(
    {
      ...inquiry,
      name: hostile,
      company: hostile,
      email: hostile,
      phone: hostile,
      location: hostile,
      projectType: hostile,
      timing: hostile,
      description: hostile,
    },
    brand,
  );
  assert.ok(!email.html.includes(hostile));
  assert.doesNotMatch(email.html, /<script>/);
  assert.ok(
    email.html.includes(
      "&lt;script&gt;alert(&quot;unsafe&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;",
    ),
  );
  assert.ok(email.text.includes(`Name: ${hostile}`));
  assert.ok(email.text.includes(`Project description:\n${hostile}`));
  assert.ok(!email.subject.includes(hostile));
});

test("prototype property names cannot become project type or timing labels", () => {
  for (const value of ["__proto__", "constructor", "toString"]) {
    const submission = { ...inquiry, projectType: value, timing: value };
    const owner = ownerInquiryEmail(submission, brand);
    const receipt = inquiryConfirmationEmail(submission, brand);
    assert.ok(owner.text.includes(`Project type: ${value}`));
    assert.ok(owner.text.includes(`Desired timing: ${value}`));
    assert.ok(receipt.text.includes("Project type: Project inquiry"));
    assert.ok(
      receipt.text.includes("Desired timing: As provided in your inquiry"),
    );
    assert.doesNotMatch(
      owner.html + owner.text + receipt.html + receipt.text,
      /\[object Object\]|function Object|function toString/,
    );
    assert.ok(!receipt.html.includes(value));
  }
});

test("customer receipt confirms the saved inquiry without forwarding private or free-text fields", () => {
  const email = inquiryConfirmationEmail(inquiry, brand);
  assert.match(email.subject, /received your project inquiry/);
  assert.ok(email.text.includes("Reference: RR-C17B898C"));
  assert.ok(email.text.includes("Project type: Commercial construction"));
  assert.ok(email.text.includes("Desired timing: In the next 1–3 months"));
  assert.ok(
    email.html.includes(
      'src="https://reliant.example.test/images/brand/reliant-color-transparent.png"',
    ),
  );
  assert.ok(
    email.text.includes("View Our Work: https://reliant.example.test/projects"),
  );
  for (const body of [email.html, email.text]) {
    for (const privateValue of [
      inquiry.name,
      inquiry.company,
      inquiry.email,
      inquiry.phone,
      inquiry.location,
      inquiry.description,
      inquiry.attachment!,
      "/admin",
    ]) {
      assert.ok(!body.includes(privateValue), privateValue);
    }
    assert.match(body, /reply to this email/);
  }
});

test("customer receipt uses safe fallbacks for unrecognized submitted labels", () => {
  const hostile = '<a href="https://untrusted.example.test">Untrusted text</a>';
  const email = inquiryConfirmationEmail(
    { ...inquiry, projectType: hostile, timing: hostile },
    { ...brand, contactEmail: undefined },
  );
  for (const body of [email.html, email.text]) {
    assert.ok(!body.includes(hostile));
    assert.ok(!body.includes("untrusted.example.test"));
    assert.ok(body.includes("As provided in your inquiry"));
    assert.ok(body.includes("We will use the contact details you provided"));
    assert.ok(!body.includes("reply to this email"));
  }
});

test("email templates reject non-web link protocols", () => {
  for (const siteUrl of [
    "javascript:alert(1)",
    "data:text/html,unsafe",
    "file:///private/example",
    "mailto:owner@example.test",
  ]) {
    for (const template of [ownerInquiryEmail, inquiryConfirmationEmail]) {
      assert.throws(
        () => template(inquiry, { ...brand, siteUrl }),
        /HTTP or HTTPS/,
      );
    }
  }
});

const fakeEnvironment = {
  RESEND_API_KEY: "fake-test-key-never-sent",
  INQUIRY_FROM_EMAIL: "Reliant Test <notifications@sender.example.test>",
  INQUIRY_TO_EMAIL: "private-owner@example.test",
  NEXT_PUBLIC_CONTACT_EMAIL: "public-contact@example.test",
  SITE_URL: "https://reliant.example.test",
  NEXT_PUBLIC_SITE_URL: "https://public-fallback.example.test",
};

function configureEmail(
  t: TestContext,
  overrides: Partial<
    Record<keyof typeof fakeEnvironment, string | undefined>
  > = {},
) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries({
    ...fakeEnvironment,
    ...overrides,
  })) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  t.after(() => {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

interface SentEmail {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
  text: string;
}

function mockDelivery(
  t: TestContext,
  respond: (body: SentEmail) => Response | Promise<Response> = () =>
    Response.json({ id: "fake-provider-message-id" }),
) {
  const requests: { body: SentEmail; headers: Headers }[] = [];
  const errors: unknown[][] = [];
  t.mock.method(console, "error", (...values: unknown[]) => {
    errors.push(values);
  });
  t.mock.method(
    globalThis,
    "fetch",
    async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
      assert.equal(String(input), "https://api.resend.com/emails");
      assert.equal(init?.method, "POST");
      assert.equal(typeof init?.body, "string");
      const body = JSON.parse(init!.body as string) as SentEmail;
      const headers = new Headers(init?.headers);
      requests.push({ body, headers });
      return respond(body);
    },
  );
  return { requests, errors };
}

test("delivery separates owner and customer recipients, replies and retry identities", async (t) => {
  configureEmail(t);
  const { requests } = mockDelivery(t);
  assert.deepEqual(await sendInquiryEmails(inquiry), {
    emailSent: true,
    confirmationEmailSent: true,
  });
  assert.equal(requests.length, 2);
  const owner = requests.find(({ body }) =>
    body.to.includes(fakeEnvironment.INQUIRY_TO_EMAIL),
  )!;
  const receipt = requests.find(({ body }) => body.to.includes(inquiry.email))!;
  assert.ok(owner);
  assert.ok(receipt);
  assert.deepEqual(owner.body.to, [fakeEnvironment.INQUIRY_TO_EMAIL]);
  assert.equal(owner.body.reply_to, inquiry.email);
  assert.deepEqual(receipt.body.to, [inquiry.email]);
  assert.equal(
    receipt.body.reply_to,
    fakeEnvironment.NEXT_PUBLIC_CONTACT_EMAIL,
  );
  assert.ok(
    !JSON.stringify(receipt.body).includes(fakeEnvironment.INQUIRY_TO_EMAIL),
  );
  for (const request of requests) {
    assert.equal(request.body.from, fakeEnvironment.INQUIRY_FROM_EMAIL);
    assert.equal(
      request.headers.get("Authorization"),
      `Bearer ${fakeEnvironment.RESEND_API_KEY}`,
    );
    assert.equal(request.headers.get("Content-Type"), "application/json");
    assert.ok(request.body.html.includes("Reliant Renovations"));
    assert.ok(request.body.text.includes("RELIANT RENOVATIONS"));
    assert.ok(request.headers.get("Idempotency-Key")?.includes(inquiry.id));
  }
  const ownerKey = owner.headers.get("Idempotency-Key");
  const receiptKey = receipt.headers.get("Idempotency-Key");
  assert.notEqual(ownerKey, receiptKey);
  await sendInquiryEmails(inquiry);
  assert.equal(requests.length, 4);
  for (const retry of requests.slice(2)) {
    assert.equal(
      retry.headers.get("Idempotency-Key"),
      retry.body.to[0] === inquiry.email ? receiptKey : ownerKey,
    );
  }
});

test("receipt never falls back to the private owner address for replies", async (t) => {
  configureEmail(t, { NEXT_PUBLIC_CONTACT_EMAIL: undefined });
  const { requests } = mockDelivery(t);
  assert.deepEqual(await sendInquiryEmails(inquiry), {
    emailSent: true,
    confirmationEmailSent: true,
  });
  const receipt = requests.find(({ body }) => body.to.includes(inquiry.email))!;
  assert.ok(!Object.hasOwn(receipt.body, "reply_to"));
  assert.ok(
    !JSON.stringify(receipt.body).includes(fakeEnvironment.INQUIRY_TO_EMAIL),
  );
  assert.ok(!receipt.body.text.includes("reply to this email"));
});

test("missing or blank sender credentials prevent every provider request", async (t) => {
  for (const key of ["RESEND_API_KEY", "INQUIRY_FROM_EMAIL"] as const) {
    for (const value of [undefined, "   "]) {
      await t.test(
        `${key} is ${value === undefined ? "missing" : "blank"}`,
        async (t) => {
          configureEmail(t, { [key]: value });
          const { requests } = mockDelivery(t);
          assert.deepEqual(await sendInquiryEmails(inquiry), {
            emailSent: false,
            confirmationEmailSent: false,
          });
          assert.equal(requests.length, 0);
        },
      );
    }
  }
});

test("missing owner destination sends only the customer receipt", async (t) => {
  configureEmail(t, { INQUIRY_TO_EMAIL: undefined });
  const { requests } = mockDelivery(t);
  assert.deepEqual(await sendInquiryEmails(inquiry), {
    emailSent: false,
    confirmationEmailSent: true,
  });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].body.to, [inquiry.email]);
});

test("invalid email site configuration prevents sending instead of creating unsafe links", async (t) => {
  configureEmail(t, { SITE_URL: "javascript:alert(1)" });
  const { requests } = mockDelivery(t);
  assert.deepEqual(await sendInquiryEmails(inquiry), {
    emailSent: false,
    confirmationEmailSent: false,
  });
  assert.equal(requests.length, 0);
});

test("provider rejection and network failure affect each delivery result independently", async (t) => {
  const cases = [
    {
      owner: "reject",
      receipt: "success",
      emailSent: false,
      confirmationEmailSent: true,
    },
    {
      owner: "success",
      receipt: "reject",
      emailSent: true,
      confirmationEmailSent: false,
    },
    {
      owner: "network",
      receipt: "success",
      emailSent: false,
      confirmationEmailSent: true,
    },
    {
      owner: "success",
      receipt: "network",
      emailSent: true,
      confirmationEmailSent: false,
    },
    {
      owner: "network",
      receipt: "reject",
      emailSent: false,
      confirmationEmailSent: false,
    },
  ] as const;
  for (const scenario of cases) {
    await t.test(
      `owner ${scenario.owner}, receipt ${scenario.receipt}`,
      async (t) => {
        configureEmail(t);
        const providerSecret = "fake-provider-error-must-not-be-logged";
        const { requests, errors } = mockDelivery(t, (body) => {
          const outcome =
            body.to[0] === inquiry.email ? scenario.receipt : scenario.owner;
          if (outcome === "network") throw new Error(providerSecret);
          return Response.json(
            { message: providerSecret },
            { status: outcome === "reject" ? 429 : 200 },
          );
        });
        assert.deepEqual(await sendInquiryEmails(inquiry), {
          emailSent: scenario.emailSent,
          confirmationEmailSent: scenario.confirmationEmailSent,
        });
        assert.equal(requests.length, 2);
        assert.ok(!JSON.stringify(errors).includes(providerSecret));
      },
    );
  }
});
