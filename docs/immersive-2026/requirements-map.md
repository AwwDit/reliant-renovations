# Reliant Renovations — immersive experience requirements map

Prepared September 7, 2026. This document maps the September 3 designer package to the latest user direction. It records content requirements and recommended connections; it does not claim that an interaction or launch task is implemented.

Sources: the supplied designer package extracted to `/private/tmp/reliant-requirements.txt`; [project baseline](../redesign-2026/project-baseline.json); current read-only SQLite project records; [asset provenance](../ASSETS.md); and visual inspection of all 80 selected project photographs. Current project data matches the baseline exactly: 10 published projects, 68 scope entries and 80 images.

## Direction and precedence

| Requirement | Designer package | Latest user direction and implementation consequence |
| --- | --- | --- |
| Business identity | Equally capable commercial and residential general contractor; disciplined construction management, trade coordination, communication and finish quality. | Preserve this positioning. Describe renovation and construction services; do not recast Reliant as an architecture practice or design studio. |
| Overall presentation | Modern, substantial, organized; real project photography supplies warmth; restrained typography and generous spacing. | The user rejected the flat/architectural direction and wants a distinctive, immersive journey through actual renovation projects. Use the authentic photographs as the experience itself, with meaningful service exploration and transitions. |
| Residential journey | Five projects demonstrate complete apartment, structural kitchen, bathroom/apartment finishes, basement and exterior capabilities. | The tour spans these services and connects several projects. Upper West Side can provide the opening living/kitchen/bath photographs; Plainview, Tribeca, Hicksville and Kings Park must be reachable service examples. Do not imply that rooms from different properties form one physical home. |
| Commercial journey | Retail, restaurants, interiors, demolition, concrete, masonry, facades, flooring and active-site work. | The user's explicit CAD request supersedes the document's preference to use blueprint graphics only subtly. CAD presentation can make documented scope understandable, but cannot invent dimensions, structural drawings, completed work or a supplied construction plan. |
| Division prominence | Commercial and residential receive equal prominence from the homepage. | Give each a clear, equally available entry. A residential opening scene does not justify hiding the commercial journey. |
| Photographs | Eight approved images per case study; image 01 is the preferred cover, followed by the approved gallery order. Use fewer on landing cards. | Retain all eight images and their owner-managed order in case studies. The service tour may select other approved images as its scene sequence without changing stored photo order. Name the project for each scene. |
| Real evidence | Avoid stock construction photos when authentic images exist; progress images should explain complexity. | No generated rooms or unrelated architectural scenes in the project journey. Do not label different-angle photographs as a matched before/after pair. |
| Brand | Existing blue/black/white logo; black, charcoal, white and selectively used electric blue. | Retain the actual identity. CAD treatment should support the commercial work and navigation rather than replace the company identity. |
| Navigation and maintenance | Straightforward navigation; filterable case studies; hide, reorder and replace projects without rebuilding. | Immersive controls supplement usable project links, accessible navigation and responsive layouts. Scene references must follow current published records and current images, with sensible fallbacks when an owner changes a project. |

## Verified company copy

The brief's exact positioning paragraph is:

> Reliant Renovations Inc. is a full-service general contractor built around responsive project management, dependable trade coordination and attention to detail. Our experience spans active retail locations, restaurants, offices, full apartment renovations, kitchens, bathrooms, basements and exterior transformations.

Its exact approach paragraph is:

> Every project is approached with the same priorities: understand the scope, communicate clearly, coordinate the work carefully and deliver a finished result that reflects the quality promised at the beginning.

The supplied hero headline is “Commercial and Residential Construction, Built Around the Details.” Its factual commitments remain usable even if the immersive design requires a shorter opening headline. The supplied primary and secondary actions are “Discuss Your Project” and “View Our Work.”

The brief supports owner-led, hands-on management; planning-through-closeout communication; multiple-trade coordination; commercial/residential experience; off-hours work around active operations; and professional execution, cleanliness and finish quality. Service-area wording is “New York City, Long Island, Westchester and select surrounding markets.”

The brief does **not** supply a license number, verified license statement, insurance statement, testimonial, rating, founding year, experience statistic, guarantee or named owner biography. It asks Reliant to confirm license wording **if displayed**, and to select final testimonials. Omit these claims until supplied; a recommended testimonial section is not testimonial evidence.

## Residential service and project map

Filenames below are one-based `01.webp`–`08.webp` under `/images/projects/{slug}/`. They are not zero-based array indices. Display the actual project name/location whenever the tour changes property.

| Project and route | Service destinations | Complete documented scope coverage | Useful photographic evidence |
| --- | --- | --- | --- |
| Upper West Side Apartment — `/projects/upper-west-side-apartment` | Living, kitchen, bathroom, full apartment renovation | Complete apartment renovation; custom millwork kitchen/cabinetry; bathroom renovation; new hardwood flooring; custom interior doors/millwork; complete painting/finish work; coordination of all required trades. | Living `06`; kitchen `01`/`02`; bathroom `03`/`04`; cabinetry detail `05`/`07`; door `08`. These are finished views. |
| Plainview Kitchen — `/projects/plainview-kitchen` | Kitchens, open layouts, structural coordination, adjoining first-floor finishes | Wall removal and structural steel header; relocated kitchen plumbing; custom kitchen cabinetry; fabricated range hood; custom island accent; new kitchen hardwood; refinishing adjoining hardwood; first-floor repainting; kitchen work from demolition through final finishes. | Kitchen/hood `01`; island detail `03`; adjoining floor/rail `04`/`05`; actual construction `08`. Do not invent a steel dimension from the photograph. |
| Tribeca Apartment — `/projects/tribeca-apartment` | Bathrooms, tile/fixtures, apartment finishing | Complete renovation of two bathrooms; bathroom tile, fixtures and finish work; apartment preparation/repainting; hardwood refinishing; associated carpentry, patching and trade coordination. | Vanity `01`; shower `03`/`04`; brass fixture details `05`/`06`; floor `07`; painted architectural detail `08`. Do not call the two different bathrooms one continuous room. |
| Hicksville Basement — `/projects/hicksville-basement` | Basement renovation, room layout, lighting, flooring, finish carpentry | Demolition through finishes; new framing/layout; finished walls/ceilings; electrical/lighting improvements; doors/trim/finish carpentry; flooring; painting/finish work; coordination of all trades. | Finished living area `01`/`02`; sliding door `03`; cabinets `04`; stairs `05`/`06`; actual exposed ceiling/services during renovation `08`. |
| Kings Park Exterior — `/projects/kings-park-exterior` | Exterior renovation, windows, siding, stone finishes | Existing siding/window removal; new siding; new windows throughout; exterior stone finishes; interior patching/preparation/painting around replaced windows; exterior trim and finish work. | Front `01`/`02`; siding/windows `03`; rear `04`/`05`/`07`; window detail `08`. Do not infer roofing or landscaping work from what appears in the image. |

Recommended residential progression: **Living → Kitchen → Bathroom → Basement → Exterior**. Living anchors the experience in Upper West Side; kitchen links to the structurally broader Plainview example; bathroom links to Tribeca; basement and exterior transition to their own named projects. This is a service journey through the portfolio, not a claim of a single-property walkthrough.

## Suggested residential service hotspots

Each scene has three short labels and evidence-backed copy. A hotspot may open the stated detail photograph or linked case study. Place object-specific markers only on a visible corresponding element; use an explicit “Related project” control for another property's work.

| Scene | Hotspot label | Suggested copy | Evidence / destination |
| --- | --- | --- | --- |
| Living — Upper West Side `06` | Hardwood flooring | “New hardwood floors bring the finished apartment together.” | Upper West Side scope: installation of new hardwood flooring; room photo `06`. |
| Living — Upper West Side `06` | Painting & finishes | “Complete apartment painting and finish work carried the renovation through to the final details.” | Upper West Side scope: complete apartment painting and finish work. |
| Living — Upper West Side `06` | Custom millwork | “Explore the fitted cabinetry and custom interior details in this apartment.” | Upper West Side scope: custom millwork and interior doors; open detail `05` or `07`. Do not suggest the furniture was supplied by Reliant. |
| Kitchen — Upper West Side `02` | Custom cabinetry | “A custom millwork kitchen, with cabinetry finished as part of a complete apartment renovation.” | Upper West Side scope: custom millwork kitchen and cabinetry; detail `07`. |
| Kitchen — Upper West Side `02` | Complete kitchen renovation | “See how the kitchen connects to the wider Upper West Side apartment renovation.” | Upper West Side description and complete-apartment scope; kitchen `01`, living `06`. No separate countertop-fabrication claim is supplied. |
| Kitchen — Upper West Side `02` | Open-plan kitchens | “In Plainview, wall removal and a structural steel header opened the layout around custom cabinetry and a fabricated range hood.” | **Related project: Plainview Kitchen**, `01`; process evidence `08`; all stated elements are in its scope. |
| Bathroom — Upper West Side `03` | Bathroom renovation | “An updated bathroom formed part of this complete Upper West Side apartment renovation.” | Upper West Side bathroom scope; `03`/`04`. |
| Bathroom — Upper West Side `03` | Tile & fixture details | “Explore the tile, fixtures and finish work in our Tribeca bathroom renovation.” | **Related project: Tribeca Apartment**, `01`, with detail `05`/`06`; explicit tile/fixture scope. |
| Bathroom — Upper West Side `03` | Two bathrooms, one project | “The Tribeca project combined two renovated bathrooms with apartment painting and hardwood-floor refinishing.” | **Related project: Tribeca Apartment**, description; bathroom views `01`/`04`, floor `07`. Do not add waterproofing methods or plumbing replacement claims. |
| Basement — Hicksville `01` | Layout, walls & ceilings | “New interior framing and a finished layout turned the basement into usable living space.” | Hicksville scope: framing/layout and finished walls/ceilings; process detail `08`. |
| Basement — Hicksville `01` | Lighting & electrical | “Electrical and lighting improvements were coordinated with the basement renovation.” | Hicksville scope: electrical and lighting improvements; visible ceiling lights in `01`. |
| Basement — Hicksville `01` | Flooring & finish carpentry | “Flooring, interior doors, trim and stair details complete the space.” | Hicksville flooring/door/trim/finish-carpentry scope; details `03`/`06`. |
| Exterior — Kings Park `01` | New siding | “Existing siding was removed and replaced as part of the complete exterior renovation.” | Kings Park removal and new-siding scope; closer view `03`. |
| Exterior — Kings Park `01` | Window replacement | “New windows were installed throughout, with interior patching and painting around the replaced openings.” | Kings Park new-window and interior-repair scope; detail `08`. |
| Exterior — Kings Park `01` | Stone & exterior finishes | “Exterior stone finishes, trim and associated finish work completed the renewed facade.” | Kings Park stone/trim/finish scope; closer front view `02`. |

## Commercial scope and project map

| Project and route | Service destinations | Complete documented scope coverage | Suitable scene/detail sequence |
| --- | --- | --- | --- |
| Chick-fil-A — Kingston — `/projects/chick-fil-a-kingston` | Ground-up carpentry, framing, interiors, trade coordination | Wood stick framing; structural roof trusses/roof framing; interior partitions/soffits; drywall/taping/spackling/finishing; painting; suspended ceiling grid; wainscoting/stainless-steel trim; interior doors; team/trade coordination. | `05` roof framing → `06` interior coordination → `03` interior finishes in progress. Exterior `01` is the approved cover. State Reliant's carpentry/interior-finish package, not responsibility for the entire restaurant build. |
| Lidl Staten Island — `/projects/lidl-staten-island` | Masonry, EIFS/facade restoration, concrete finishing | Project masonry; exterior EIFS repair/restoration; interior masonry repairs; elevator-shaft masonry/repairs; basement/cellar concrete grinding/sealing; multiple-scope coordination. | `03` exterior repair → `04` opening/masonry → `02` storefront context. Different scopes, not a proven chronological before/after sequence. |
| Raising Cane’s — Forest Hills — `/projects/raising-canes-forest-hills` | Storefronts, exterior metal/ACM panels, facade transitions | Glass storefront installation; exterior metal panels; ACM composite-panel facade; field coordination of storefront/facade transitions; exterior trim/finish work. | `05` installation → `01` completed storefront → `04` facade detail. Interior `07`/`08` are context photographs, not evidence that Reliant completed the restaurant interior. |
| Harbor Freight — Bronx — `/projects/harbor-freight-bronx` | Active retail refresh, interiors, masonry infill, exterior work, off-hours coordination | Entire retail interior repainting; new partitions; designated exterior-door removal/CMU infill; full exterior preparation/repainting; new bollards; patching/preparation/finish work; off-hours work around operations. | `01` approved front cover, `02` exterior extent, `08` refreshed staff kitchenette. Finished views support the result; the off-hours arrangement comes from the brief, not the image timestamps. |
| Lidl Harlem — `/projects/lidl-harlem` | Flooring, selective demolition, concrete preparation/polishing, off-hours operations | First-floor and cellar flooring removal; selective interior-partition demolition; exposed-concrete preparation; polished concrete throughout first floor/cellar; off-hours coordination. | `02` sales floor → `07` refrigerator aisle → `04` entrance. Retain floor area in crops. Do not label a clear demolition stage or matched before/after when the supplied photos do not establish it. |

CAD chapter labels can follow **Framing → Interiors → Storefront → Masonry → Flooring**, with each chapter linked to the applicable named project(s). Keep dimensions, material quantities, construction dates and hidden assemblies out unless they are documented. Do not expose private plans, full residential addresses or internal CompanyCam handoff URLs in public navigation.

## Document coverage and current-data omissions

1. **No selected-project omission found.** All five commercial and five residential projects are present. All 68 scope bullet points from the brief are preserved in current data, with all 80 approved photographs and general locations. Shortened display titles retain the original meaning through the subtitle/category. Added result statements summarize supplied scope rather than add measurements or outcomes.
2. **The scope is broader than a room tour alone.** A tour showing only Upper West Side living/kitchen/bath would miss Plainview structural coordination, Tribeca's two-bathroom scope, Hicksville basement capability, Kings Park siding/windows/stone and most commercial services. These are present in the database and must remain discoverable through the new journey and project index.
3. **General capabilities without selected case studies:** the introduction mentions offices, mixed-use environments and complete homes. No dedicated selected office/mixed-use or full-house-interior case study exists. These can remain supplied general company copy; do not fabricate portfolio evidence or label a partial-scope project as proof of a complete building commission.
4. **Taco Bell and Spark Car Wash are deliberately absent.** The brief calls them future candidates to evaluate after completion, with replacement only if their story/photography is stronger. Their absence is correct.
5. **Unconfirmed publication inputs are deliberately absent from project data:** license wording/number, approved testimonials, final contact details and YouTube URL. `lib/site.ts` supports configured phone/email/YouTube; it does not provide invented defaults. Do not expose environment values while auditing. The brief's recommended testimonials and click-to-call functionality depend on real supplied content/configuration.
6. **Business introduction remains represented:** the current About route contains the full-service-general-contractor paragraph, experience breadth, owner-led management, communication, trade coordination and service areas. The new journey must not replace that identity with architectural-design language.
7. **Operational requirements are separate from portfolio content:** email routing, analytics/Search Console connection, backup/monitoring/update operations, compromised-domain remediation, credential cleanup, spam removal, legitimate URL redirects and final publication permissions require their respective deployment/account work. Their completion cannot be inferred from this redesign or a database comparison. Existing local inquiry storage, upload/API protections and editable portfolio behavior should survive the presentation changes.
8. **No unsupported personal or factual embellishment:** retain neighborhood/city residential locations; avoid homeowner names, full street addresses, receipts, private plans, punch-list material, license/insurance claims, invented reviews and invented construction chronology. Use the supplied business voice: a general contractor delivering coordinated construction and careful finish work.

## Review checks for the new experience

- Both divisions have equally visible entry points and a direct path to discuss a project.
- Each residential service scene names its real source project; cross-project links identify the destination property.
- All five residential and five commercial records remain discoverable, with their complete scope/result and eight-image gallery available.
- Every hotspot claim maps to an explicit scope item or clearly visible detail; generated scenes and false before/after pairings are absent.
- Project publishing/hiding, image replacement, ordering, contact type prefill, inquiry submission/uploads, accessible navigation, reduced-motion behavior and responsive layouts remain usable.
- The CAD request is honored as the current user direction without presenting conceptual graphics as supplied construction documents.
