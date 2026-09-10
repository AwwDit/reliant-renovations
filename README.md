# Reliant Renovations

A Next.js application based on the supplied Reliant Renovations Website Designer Package, with distinct commercial and residential portfolios and an owner dashboard.

## Run locally

Use Node.js 22.13 or newer.

```sh
npm ci
cp .env.example .env.local
npm run admin:setup
```

The setup command prompts for an owner password and generates `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET`. Add those values to `.env.local`. Start MongoDB in another terminal, then start the site:

```sh
npm run db:local
```

```sh
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin. Admin access is disabled until both credentials are configured; there is no default password. The setup tool explicitly indicates that terminal input is visible. Keep credentials private.

The local database uses port **27018**, replica set `reliant-local`, and database `reliant_renovations`. Its files live under `data/mongodb/`. The runner uses `data/tools/mongodb/bin/mongod` when present, otherwise `MONGODB_BIN` or an installed `mongod`. It refuses to reconfigure an existing listener. An existing MongoDB service on port 27017 is left alone. Keep the database terminal running while using the site. For Atlas, set the server-only `MONGODB_URI` and `MONGODB_DB` instead; the local runner is unnecessary.

If transferring an existing SQLite installation, migrate **before starting the site against an empty MongoDB database**. Run `npm run db:migrate` to preview, then `npm run db:migrate -- --apply` to import and verify. See [MongoDB setup and migration](docs/MONGODB.md).

## What is implemented

- Editorial homepage with shared navigation to distinct Commercial, Residential, Projects, About and Contact pages.
- Branded homepage hero built from real project photography, with the document's headline, introduction and calls to action.
- Homepage arrival animation traces the actual RELIANT lettering with architectural construction guides, then draws the navigation, photo seams and content alignments before revealing the finished homepage. It plays once per tab session, supports Skip, and respects reduced motion.
- About page with an immediate company introduction, one residential hero photograph, a finished commercial project alongside Why Reliant, and the original approved copy.
- Five-project accordion below the hero: horizontal on desktop and vertical photo bands on mobile.
- Live Google Maps rating and reviews below the homepage projects, with manual review navigation, expandable original wording, reviewer attribution and direct Google Maps links.
- Dark theme by default, with a persistent light/dark toggle covering navigation, photo treatments, project sliders, galleries, forms, footer and owner dashboard.
- Fixed desktop navigation and a mobile menu containing navigation links and utility controls.
- Transparent original-color and white logo assets; the white logo uses regular-weight INC lettering throughout the site and dashboard.
- Ten case studies with eight curated CompanyCam images each, matched to the document selections at full delivered resolution, and keyboard-accessible fullscreen galleries.
- Aligned project index with commercial/residential filters, consistent photo proportions and a compact justified gallery on each case page.
- Owner-managed featured projects.
- Protected dashboard to create, edit, publish, hide, reorder and delete projects; edit scope, description, image order and alternative text.
- Project photo uploads validated and converted to WebP, resized to a maximum of 2400 pixels, with EXIF/GPS metadata stripped.
- Inquiry form with custom keyboard-accessible dropdowns, optional image/PDF attachment, and a private MongoDB-backed owner inbox.
- Branded HTML and plain-text owner inquiry alerts and customer confirmations through Resend, with an authenticated link directly to the Inquiries tab.
- Owner password recovery with branded reset and password-change emails, expiring single-use tokens and session revocation after a password change.
- Per-page metadata, canonical URLs, truthful organization/project/breadcrumb structured data, dynamic published-project sitemap, robots configuration and prelaunch noindex.
- Optional Google Analytics loaded only after visitor consent and optional Search Console verification.

Public pages use server rendering, self-hosted Manrope, image optimization and reduced-motion support. Project wording follows the supplied document; galleries use the owner's curated CompanyCam photography. Historical prototypes remain separate from the active public design and are excluded from indexing. No fabricated reviews, license claims, contact details or performance statistics are included.

To replay the homepage arrival animation during review, open `/?intro=1` (for example, `http://localhost:3000/?intro=1`). Refresh that URL to replay it; reduced-motion preferences still apply. Normal homepage visits only play it once per tab session, and anchor links go straight to their content.

## Link previews

The homepage and general pages share a branded 1200 × 630 JPEG containing the original logo, real residential/commercial project photography, and the approved homepage headline. The homepage also advertises a seven-second silent H.264 MP4 through Open Graph video metadata for clients that support animated previews. It uses the website's RR construction geometry, measured lettering guides and pencil hatching, then fills in the photographs, logo and headline. The JPEG remains the fallback, including for Twitter's large-image card. Other pages use still previews, and individual project links retain their own project photograph. Both files are bundled static assets, so messaging apps can fetch them without runtime generation or database access.

Run `npm run social:preview` to regenerate `public/images/social/reliant-share-v3.jpg` after changing its layout or approved copy. The generator reads bundled originals and fonts; no credentials or external services are required. When replacing published artwork, bump the filename in `lib/social-preview.ts` and include the new JPEG in the deployment.

Run `npm run social:animate` to regenerate `public/videos/social/reliant-share-v2.mp4`. This local generation command requires `ffmpeg` and `ffprobe` on your PATH; neither is needed on the deployed server. Commit the generated MP4 with the site, and bump its filename in `lib/social-preview.ts` when replacing a published animation.

Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin (for example, `https://reliantrenovationsinc.com`) at build time and runtime so the absolute sharing-image and video URLs are reachable. After deploying, test a newly sent homepage link in Messages on an actual iPhone. Animation and autoplay depend on the receiving client and device settings; they are not guaranteed. Existing previews may remain cached by the receiving app.

## Owner handoff

1. Sign in at `/admin` with the configured owner password.
2. Choose **Add project** or **Edit project**. Enter the division, location, scope and project story.
3. Upload photos and write descriptive alternative text. The first photo becomes the cover. Use the image arrows to reorder the gallery.
4. Use **Publish project** to control public visibility and **Feature on the homepage** for the homepage's Selected projects section. That section displays the first featured commercial project and the first featured residential project in portfolio order. Keep a project in each division featured for a balanced selection. The hero and specialty-section photographs are separate editorial selections from published projects, with fallbacks when those selections are unavailable.
5. Use the project arrows in the collection to reorder the portfolio. Hidden projects remain editable. Existing project URLs are permanent to preserve shared and indexed links.
6. Open **Inquiries** to read submissions and download private attachments. Email delivery is optional; the inbox is the source of truth.

Deletion permanently removes a project record after confirmation. Image files are retained so they cannot be inadvertently removed from other projects; periodically review unused files during maintenance. Removing a project does not revoke an image URL that has already been shared. Inquiry deletion requests must currently be handled by an authorized operator in the database and associated private file storage.

## Configuration

See `.env.example`. Confirm the actual business email, phone and production domain. Public contact details can differ from the private inquiry notification destination. Set all public variables before the production build.

For email, configure `RESEND_API_KEY`, `INQUIRY_TO_EMAIL` and a verified-domain `INQUIRY_FROM_EMAIL`. Set `SITE_URL` to the public production origin so email links and the logo work outside your computer. Customer replies use `NEXT_PUBLIC_CONTACT_EMAIL` when provided; otherwise they go to the sender. The private owner destination is not exposed to the customer.

After an inquiry is saved, the owner receives its details and a link to `/admin?view=inquiries`; the customer receives a separate confirmation. Private attachments remain accessible only after owner sign-in. Missing email settings or delivery failures never discard the saved inquiry. The API reports provider acceptance separately as `emailSent` (owner alert) and `confirmationEmailSent` (customer receipt); this does not assert inbox delivery.

Run `npm run email:preview` to open an offline gallery of all four emails, with desktop/mobile views, plain-text versions, and individual downloads. No server or credentials are needed, and nothing is sent. Use `npm run email:preview -- --no-open` to generate the files without opening a browser. See [email templates and configuration](docs/EMAILS.md). Confirm real receipt as part of the authorized launch test.

Set the private `ADMIN_EMAIL` to enable owner password recovery. The login screen links to `/admin/forgot-password`; reset links expire after 30 minutes. A reset stores the new password hash in MongoDB and signs out existing sessions. `ADMIN_PASSWORD_HASH` remains the bootstrap credential until the first reset, after which the MongoDB credential takes precedence. Keep `ADMIN_SESSION_SECRET` and the bootstrap environment values configured.

For Google reviews, set server-only `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACES_PLACE_ID`. The example environment contains the verified Reliant Renovations listing ID. Google supplies up to five reviews in relevance order. Requests are made fresh through the server; reviews are not saved to MongoDB or a persistent cache. Missing configuration or an unavailable Google API omits this optional section while the rest of the homepage remains available. See [Google reviews setup](docs/GOOGLE-REVIEWS.md).

Keep `SITE_INDEXABLE=false` for development and staging. Set it to `true` and rebuild only after launch review. Search Console and Analytics properties must be created or connected separately. The application does not change the existing website, DNS or third-party accounts.

## Production hosting and storage

This application uses the official MongoDB Node.js driver and supports **Cloudinary media storage**, including DigitalOcean App Platform deployments. Use **MongoDB Atlas or a replica set**, and deploy the app as a **Node.js web service**, behind HTTPS. A static export does not support the application's admin, inquiry and database functionality.

```sh
npm ci
npm run build
npm start
```

Configure server-only `MONGODB_URI` and `MONGODB_DB` in the host environment. Set `MEDIA_STORAGE=cloudinary`, `CLOUDINARY_CLOUD_NAME=dbg0zy3al`, `CLOUDINARY_ASSET_FOLDER=reliant`, and the private `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`. New project photos are public Cloudinary images; inquiry attachments are authenticated assets downloaded only through the owner-protected server route. The dynamic folder is `reliant`; public IDs also use a separate `reliant/` namespace to isolate this site in the shared account. Cloudinary failures never silently fall back to local storage.

Run `npm run media:migrate` to preview migration of existing catalog photos and inquiry attachments, then `npm run media:migrate -- --apply` to upload and update existing project image references. Run it on the machine with the original files and database before deploying. It preserves source files, image order and alternative text. See [Cloudinary configuration and migration](docs/CLOUDINARY.md). For local development without Cloudinary credentials, explicitly set `MEDIA_STORAGE=local`; this stores files under `DATA_DIR/uploads/` and requires persistent disk when used on a production host.

Seed content is inserted once for a new database and does not overwrite owner edits or restore deleted projects. Catalogue writes and reordering use transactions; login and inquiry rate limits use atomic MongoDB counters. Migrate/restore the existing MongoDB database when moving hosts to retain current edits and image references.

The public site layout waits for an incoming request before reading the live project catalog for the shared footer. Production builds therefore do not require MongoDB access, including when generating legal pages. This is necessary on App Platform because its build containers cannot connect to managed databases protected by trusted sources. Keep the database's network restrictions enabled and grant the running app access. Use the managed MongoDB cluster's supplied `mongodb+srv://` connection string as `MONGODB_URI`, preserving its authentication/TLS options; database connection variables must be available at runtime. [DigitalOcean build-time database access](https://docs.digitalocean.com/support/why-does-my-app-fail-to-build-while-trying-to-connect-to-a-digitalocean-managed-database/)

Set `SITE_URL` to the public HTTPS origin so proxy-origin checks work. Set `TRUST_PROXY=true` only when the reverse proxy overwrites client IP headers and the Node server cannot be accessed directly. Otherwise leave it false: rate limits use a conservative shared bucket. Configure reverse-proxy request limits and HTTPS security policy on the host.

Configure database backups through the MongoDB host and maintain backups of media independently; database backups contain image references, not image bytes. Retain the local media originals after migration and configure Cloudinary's backup options as appropriate for the account. Test restoration before launch and on a regular maintenance schedule. Configure host monitoring and dependency update alerts; those services are not provisioned by this repository. The SQLite migration retains the original file and creates a private snapshot under `DATA_DIR/backups/`.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:integration
```

Tests require the local replica set, or an explicit `MONGODB_TEST_URI`. Every database test creates a uniquely named disposable database and restricts cleanup to that name. The integration check starts a disposable production server on an available port with random temporary credentials and external email disabled. It tests real routes, auth, public visibility, uploads, inquiries and private attachments. The local preview data is untouched. A production build is required first.

## Remaining launch inputs

- Original vector logo for future large-format use. The selected CompanyCam images have been retrieved and replaced the document reference crops; see the asset provenance for exact dimensions.
- Confirmed phone/email, final service-area wording, license language if desired, permission for commercial brand names/logos and genuine testimonials if supplied.
- Production host, HTTPS, persistent storage, backup/monitoring setup and email provider configuration.
- Review of the document-reported compromised legacy domain and a verified redirect/removal plan before changing live hosting.
- Final owner visual acceptance. See the UI verification record for completed desktop/mobile layout, photo contrast, project navigation, theme and accessibility checks.

See [asset provenance](docs/ASSETS.md), [design decisions](docs/DESIGN.md), and [SEO and migration checklist](docs/SEO-LAUNCH.md). The domain compromise is reported by the supplied document, not independently verified or remediated by this build.
