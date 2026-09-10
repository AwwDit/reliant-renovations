# Asset provenance and production handoff

The owner supplied the project selections and logo in `Reliant_Renovations_Website_Designer_Package.docx`, then explicitly requested retrieval of the high-quality project images from its CompanyCam timeline links. No stock or generated project imagery is used.

## Current image set

All **80 selected images across ten projects** were matched to their CompanyCam sources and replaced at full delivered native resolution. The document's exact eight-image selection and reading order remain `01.webp` through `08.webp`. Matching used normalized image comparison followed by visual checks; no different project photographs were substituted.

The source set includes 64 photographs and 16 video poster stills matching the document selections. Only the published still-image files were retrieved for those video entries. CompanyCam's signed full-image endpoints set delivery caps; the actual delivered image dimensions below are authoritative. Long edges range from 1,536 to 3,085 pixels, replacing reference crops generally 500 pixels high. There is no upscaling or generated detail.

Files were automatically oriented and encoded as WebP at quality 90, retaining the full delivered dimensions and stripping EXIF, GPS, IPTC, XMP and ICC metadata. The 80 website source files total 31.60 MiB. Next.js serves responsive optimized derivatives and lazy-loads galleries. Existing filenames, alternative text, project records and owner controls remain intact.

[PROJECT-IMAGE-MANIFEST.json](PROJECT-IMAGE-MANIFEST.json) records each source identifier, source and output SHA-256, full output dimensions, original document-reference dimensions and file size. Signed image URLs, timeline HTML and matching thumbnails are excluded from public site assets.

When replacing existing image filenames on a running server, clear its generated `.next/cache/images` (production) and `.next/dev/cache/images` (isolated development builds), restart the preview and hard-refresh open browsers so the optimizer and browser do not retain the old pixels. Both local optimizer caches were cleared after this replacement.

## Source mapping

The following CompanyCam links are owner-supplied handoff references, kept out of public navigation. All ten were accessible for the explicitly requested retrieval; all 80 curated selections were found.

| Project folder under `public/images/projects/` | DOCX board               | Original source from document                                                         | Native output dimensions, 01–08                                                        |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `chick-fil-a-kingston`                         | `word/media/image3.jpg`  | [Chick-fil-A — Kingston](https://app.companycam.com/timeline/ZeExGmPnYfF1GyfM)        | 1440×1920, 1440×1920, 1440×1920, 1080×1920, 1080×1920, 1440×1920, 1440×1920, 1920×1440 |
| `lidl-staten-island`                           | `word/media/image5.jpg`  | [Lidl — Staten Island](https://app.companycam.com/timeline/KBJde6uBJhpK6nDQ)          | 1440×1920, 2880×2160, 1440×1920, 1200×1600, 2160×2880, 1200×1600, 1440×1920, 2880×2160 |
| `raising-canes-forest-hills`                   | `word/media/image7.jpg`  | [Raising Cane’s — Forest Hills](https://app.companycam.com/timeline/ard7cNbEEFiFJkAY) | 1440×1920, 1080×1920, 1440×1920, 1440×1920, 1440×1920, 1440×1920, 1440×1920, 1440×1920 |
| `harbor-freight-bronx`                         | `word/media/image9.jpg`  | [Harbor Freight — Bronx](https://app.companycam.com/timeline/szehzpDDq3GK8L33)        | 1920×1440, 1920×1440, 1920×1440, 1920×1440, 1440×1920, 1440×1920, 1440×1920, 1440×1920 |
| `lidl-harlem`                                  | `word/media/image11.jpg` | [Lidl — Harlem](https://app.companycam.com/timeline/LF8ZmBc3V5ArFe9H)                 | 1440×1920, 1920×1440, 1920×1440, 1920×1440, 1440×1920, 1920×1440, 1440×1920, 1920×1440 |
| `upper-west-side-apartment`                    | `word/media/image13.jpg` | [Upper West Side Apartment](https://app.companycam.com/timeline/Kige8Bzce1t9uWCQ)     | 1024×1536, 1536×1024, 1024×1536, 1024×1536, 2880×1924, 2880×1924, 2880×1924, 2160×2880 |
| `plainview-kitchen`                            | `word/media/image15.jpg` | [Plainview Kitchen](https://app.companycam.com/timeline/BSPMY8BeCLYm82Tj)             | 1080×1920, 1080×1920, 1080×1920, 1080×1920, 1080×1920, 1080×1920, 1080×1920, 1440×1920 |
| `tribeca-apartment`                            | `word/media/image17.jpg` | [Tribeca Apartment](https://app.companycam.com/timeline/2uSkJFmwK8tjGpqg)             | 2304×2880, 1920×2880, 1920×2880, 2058×2880, 1920×2880, 2468×3085, 1080×1920, 1440×1920 |
| `hicksville-basement`                          | `word/media/image19.jpg` | [Hicksville Basement](https://app.companycam.com/timeline/KEssYNuXLJsYV1LC)           | 1440×1920, 1440×1920, 1440×1920, 1440×1920, 1080×1920, 1080×1920, 1440×1920, 1440×1920 |
| `kings-park-exterior`                          | `word/media/image21.jpg` | [Kings Park Exterior](https://app.companycam.com/timeline/9U3PstoutpEztXF1)           | 1440×1920, 1080×1920, 1440×1920, 1080×1920, 1440×1920, 1080×1920, 1440×1920, 1440×1920 |

## Logo

`public/images/logo.png` preserves the 484×348 approved source crop from `word/media/image1.png`. After the user explicitly authorized editing the original pixels, two real transparent RGBA PNG derivatives were created at native resolution: `public/images/brand/reliant-color-transparent.png` and `public/images/brand/reliant-white-transparent.png`, both 474×335. The website uses the white version on dark surfaces; the color version retains the approved blue, black outlines, and intentional white fills. The color asset preserves the original letterforms and proportions. At the user’s request, only INC in the white asset was changed to regular-weight sans lettering; all other pixels and both flanking bars are unchanged. Neither asset has a background rectangle or generated replacement artwork. See [LOGO-ASSETS.md](LOGO-ASSETS.md) for processing and alpha verification. Request approved vector artwork (`.AI`, `.EPS`, or `.SVG`) for sharper large-format use.

## Editorial and privacy notes

- Keep residential locations at neighborhood or city level. No homeowner names or residential street addresses were added to asset filenames.
- Present the documented Reliant scope accurately. For Raising Cane’s, the interior images are contextual views; the documented Reliant work is storefront and exterior facade.
- Keep commercial brand-name permissions and final portfolio publication approval on the launch handoff.
- New photographs should have descriptive alt text, accurate dimensions, and metadata stripped during upload. Preserve project order and hiding controls through the dashboard.
- Progress photographs remain in their approved gallery positions and should be described as progress where applicable.
