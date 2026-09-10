# Cloudinary media storage

The website uses Cloudinary for durable project photographs and private inquiry attachments on DigitalOcean App Platform. MongoDB continues to hold project details, image order and alternative text, inquiries, and owner account data. Cloudinary does not replace MongoDB.

The initial project-image migration completed on September 10, 2026: all 80 photographs across 10 projects were uploaded to cloud `dbg0zy3al` in the dynamic folder `reliant`. All 80 public delivery URLs were verified, and the existing database's image references were updated while preserving copy, order, alternative text and other project fields. The source files and a private pre-migration project-record backup were retained locally.

`lib/project-media-manifest.ts` contains only the verified public source-to-Cloudinary URL mapping. Fresh databases seed these Cloudinary URLs automatically. The shared resolver also preserves selected cover photographs, crop positions and original gallery dimensions after migration. Existing databases still retain owner edits; seeding never replaces them. Future uploads are handled by the Cloudinary upload integration and do not require adding entries to this initial catalog manifest.

## Configuration

Add these values to the local `.env.local` file when ready to connect the account, and to the App Platform web service's environment variables before deployment:

```dotenv
MEDIA_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=dbg0zy3al
CLOUDINARY_ASSET_FOLDER=reliant
CLOUDINARY_API_KEY=your-private-api-key
CLOUDINARY_API_SECRET=your-private-api-secret
```

Use API credentials for the Cloudinary product environment whose cloud name is `dbg0zy3al`. Mark the key and secret as encrypted in App Platform. Keep them out of Git, browser code, logs, and `NEXT_PUBLIC_` variables. Uploads are signed by the application's server; an unsigned upload preset is not needed.

`MEDIA_STORAGE=cloudinary` explicitly selects Cloudinary. Without this variable, production defaults to Cloudinary and development/test defaults to local storage. `MEDIA_STORAGE=local` remains available for a host with persistent disk. Cloudinary failures never silently fall back to App Platform's temporary filesystem.

## The `reliant` dynamic folder

Every upload sets the Cloudinary **`asset_folder` to `reliant`**. This is the folder shown in the Media Library in dynamic folder mode. Cloudinary creates it on the first successful upload if it does not already exist. No folder has to be created manually.

The application's asset identifiers also have a fixed `reliant/` prefix to separate them from the other projects in this account. These are two distinct settings: `asset_folder` organizes the Media Library; `public_id` identifies an asset for delivery. The uploader disables automatic insertion of the asset folder into the public ID, so the prefix is not doubled. In dynamic folder mode, moving a Media Library asset between folders does not itself rename its public ID or delivery URL. Keep these IDs unchanged so saved project images and attachment lookups continue to work. [Cloudinary upload parameters](https://cloudinary.com/documentation/upload_parameters)

The application does not list, modify, or remove assets belonging to other project prefixes. It uploads with `overwrite=false` and verifies the identity of Cloudinary's response. A retry that finds an existing asset reuses it only after comparing the stored original bytes with the source bytes.

## Public project photographs and private attachments

| Content                                                                   | Storage and delivery                                                                                                                        |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| New admin project photographs                                             | Cloudinary `image` resource, public `upload` delivery; MongoDB stores the verified HTTPS URL.                                               |
| Existing bundled project photographs migrated by the script               | Cloudinary `image` resource with an identifier derived from the original file's SHA-256 digest.                                             |
| Inquiry attachments, including images and PDFs                            | Cloudinary `raw` resource with **`authenticated`** delivery; the browser continues to use the site's `/api/uploads/inquiry-UUID.ext` route. |
| Logos, fonts, Google attribution marks, and other static interface assets | Remain bundled with the application.                                                                                                        |

The inquiry download route checks the owner's existing session before retrieving the original file through a signed server request. It returns the bytes with private/no-store caching and attachment headers. The browser does not receive Cloudinary credentials or a reusable public attachment URL. [Cloudinary media access control](https://cloudinary.com/documentation/control_access_to_media)

## Responsive image delivery

The shared `components/site-image.tsx` component keeps Next.js responsive image sizing, lazy loading, and fetch priorities, but sends public project photos directly to Cloudinary. Cloudinary creates and caches the requested width with automatic format/quality selection and no upscaling. This removes a second download and image-encoding step on the App Platform server. Original URLs in MongoDB stay unchanged. [Cloudinary image transformations](https://cloudinary.com/documentation/image_transformations)

Only canonical public project URLs in the configured account use this loader. Local logos and local uploads retain Next.js optimization with WebP output; authenticated inquiry files retain the existing protected route. The build supplies the public cloud name to the browser automatically, so no additional environment variables or credentials are required. Google reviews also render in a separate server Suspense boundary so their API response cannot delay the homepage photographs.

## Migrate the current catalog and attachments

Run this from the repository on the computer that still has **both** the bundled `public/images/` files and the old `DATA_DIR/uploads/` files. `MONGODB_URI` and `MONGODB_DB` must point to the current catalog you intend to migrate. The command loads Next.js environment files, including `.env.local`; environment values already supplied by the shell take precedence.

1. Back up the current MongoDB database and uploaded files. Complete migration before directing new inquiries to the Cloudinary deployment. Avoid editing project images during the final migration and verification.
2. Preview the migration:

   ```sh
   npm run media:migrate
   ```

   This is a **read-only dry run**. It connects directly to MongoDB and checks every referenced local image and inquiry attachment. It includes unpublished projects, reports counts, and neither seeds an empty database nor creates indexes. It does not call Cloudinary or require its key/secret for this preview.

3. Once the preview succeeds and the credentials are set, apply it:

   ```sh
   npm run media:migrate -- --apply
   ```

   The script first completes the same file preflight. Every source must exist, be readable, match its allowed image/PDF extension, remain inside the permitted source directory after resolving symlinks, and be no larger than 10 MB. Unsupported references, missing originals, and changed files produce a nonzero exit. No remote image URL is downloaded for ingestion.

   All planned uploads finish before any project references are changed in MongoDB. An upload failure therefore leaves project records untouched. After uploading, each project update compares its original image sources at their original indices and changes only those `images.N.src` fields. Concurrent changes to image sources cause that project's migration to be skipped with a nonzero exit; copy, alternative text, project order, visibility, and other fields are not replaced.

4. Check the project galleries, upload a photograph through the admin, and verify an existing inquiry attachment while signed in. An unsigned request for that attachment must remain unauthorized. Keep the original files and database backup until the deployed website has been verified after a redeployment.

The migration never deletes local originals. Re-running after interruption uses deterministic asset IDs; identical bundled photographs are reused, existing supported Cloudinary project URLs are left unchanged, and already migrated inquiry files are byte-checked before reuse. If a database update fails after earlier projects succeeded, those completed projects are skipped on the next run. Private inquiry attachment paths stay unchanged in MongoDB, so existing admin links continue to work.

Private attachment migration must run against the old local originals **before cutover**. New attachments created after Cloudinary is enabled have no local copy, so this one-time local migration command will correctly stop if asked to read those files. Do not run it automatically on every application start or deployment. Only currently referenced media is migrated; unused files are left alone.

## App Platform deployment

App Platform's local filesystem does not survive redeployment, so `DATA_DIR` is not a durable destination there. Keep the production media backend set to Cloudinary and set the five variables above on the web service. [DigitalOcean App Platform storage](https://docs.digitalocean.com/products/app-platform/how-to/store-data/)

Use the configured cloud name during both build and runtime so Next.js accepts that account's image URLs. The key and secret are server-only runtime credentials. Set the usual production MongoDB, owner authentication, site URL, Google reviews, and Resend environment variables separately, following `.env.example`.

If migrating from a local MongoDB database to a production database as well, transfer the database **after** applying the image migration, or run the media command against the production copy while the local source files are still available. Copying the Git repository alone does not move admin changes, inquiries, or owner settings. Check the final production database's image URLs and an authenticated attachment download before switching the public DNS.

## Verification

`tests/media-migration.test.ts` uses temporary local fixtures and mocked storage/database adapters. It checks dry-run preflight, hidden projects, source-file validation, symlink escape rejection, public/private separation, unchanged originals, content-derived retry IDs, upload failure behavior, and concurrent image updates without modifying a real account or database.

```sh
node --conditions=react-server --import tsx --test tests/media-migration.test.ts
```

Cloudinary adapter and media URL tests separately verify signed uploads, safe response URLs, retry byte comparison, and authenticated retrieval. The initial 80 project photographs passed live upload and public delivery checks. There were no existing inquiry attachments to migrate; authenticated attachment behavior is covered by mocked adapter tests and the application's isolated route integration checks. Verify a real attachment download as part of the production launch test.
