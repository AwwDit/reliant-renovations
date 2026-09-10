# Logo assets

## Final deliverables

The final assets were edited directly from the approved source pixels after the user explicitly authorized this method: **“Yes, edit the original pixels.”**

| Asset                                               | Dimensions | Format   | Transparent pixels | Antialiased pixels | Opaque pixels | Size          |
| --------------------------------------------------- | ---------- | -------- | ------------------ | ------------------ | ------------- | ------------- |
| `public/images/brand/reliant-color-transparent.png` | 474 × 335  | RGBA PNG | 73,394             | 8,973              | 76,423        | 115,735 bytes |
| `public/images/brand/reliant-white-transparent.png` | 474 × 335  | RGBA PNG | 92,029             | 12,974             | 53,787        | 26,285 bytes  |

Use the white version on dark site surfaces. The color version retains the original blue, black outlines, and intentional white logo fills. Both preserve the existing RR monogram, main lettering, horizontal rules, and proportions. At the user’s subsequent request, only INC in the white version uses a lighter regular sans weight; the color version is unchanged. Neither image contains a painted checkerboard, background rectangle, or artificial enlargement.

## Source

`public/images/logo.png`, 484 × 348 pixels, is the approved logo crop extracted from `word/media/image1.png` in the user-supplied `Reliant_Renovations_Website_Designer_Package.docx`. This source remains intact. None of the AI-generated attempts below contributed pixels to the final files.

## Deterministic processing

Pillow operated on the original RGB pixels at native resolution.

1. Identify contiguous near-white regions with a four-neighbour flood fill using the minimum RGB channel at a threshold of 180. Preserve the intentional enclosed white body of the second R and the white bodies of the eleven RENOVATIONS letters. Remove the surrounding paper and white counters/gaps.
2. Find the original dark/blue ink using a minimum-channel value below 180. Restrict edge coverage to its two-pixel neighbourhood so paper texture cannot create a faint rectangle.
3. Derive antialias coverage from `clamp((248 - min(R,G,B)) / 228, 0, 1)`, removing alpha values below 4/255. For the color version, unmatte the outer antialiased edges against white; keep intentional white interiors opaque.
4. For the white version, map the original dark/blue ink to pure RGB white and retain the derived alpha. Original white areas become transparent, preserving outlined details and negative space.
5. Crop to the nontransparent artwork with a six-pixel transparent margin and save lossless RGBA PNG. No upscaling was used. The original extraction preserved typography; the subsequent INC-only adjustment is recorded below.

## Verification

Both files were inspected composited over dark `#191d20` and light `#eeeeee` surfaces. The PNG alpha range is 0–255. All four corners and the complete outer border have alpha 0. The original color artwork has a nontransparent bounding box of `(6, 6, 468, 329)`. The white logo after its INC adjustment has `(6, 6, 468, 330)`, within the same 474 × 335 canvas. Review composites are temporary files and are not public assets.

The white logo naturally has low contrast on light backgrounds; use the color version there. These remain raster derivatives of the supplied source. Approved vector artwork would support sharper large-format applications.

## INC weight adjustment

The user explicitly requested that INC in the white version should not be bold. Only the INC region `(190, 295, 288, 334)` was changed. The three letters were rendered in Arial Regular at the original letter centers (202.5, 232.5, and 269 pixels), centered vertically at 313.5 pixels and matching the original cap height. Four-times sampling was used only to antialias the replacement letter edges before returning to the unchanged 474 × 335 canvas. All nontransparent replacement pixels are pure white.

Pixel comparison confirmed that every RGBA pixel outside this small INC region is identical, including both horizontal bars. The color logo was untouched. The final composite was visually inspected on a dark surface; transparency and zero-alpha borders remain intact.

## Earlier generation attempts

Before direct pixel editing was authorized, the built-in `image_gen.imagegen` tool was used for a faithful color background extraction and a white monochrome version, each with a targeted transparency correction. All four outputs were RGB PNGs with no alpha channel and were rejected. Three contained a painted checkerboard and one a black backdrop. No failed rendering was installed as a site asset.

The final files above use only the original source pixels and the user-authorized deterministic process. No CLI/API image-generation fallback was used.

The public site uses the approved transparent PNG assets directly. The earlier animated contour trace has been retired.
