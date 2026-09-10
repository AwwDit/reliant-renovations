# Reliant Renovations — Experience Blueprint

**Status: proposed visual direction; unimplemented.** This blueprint accompanies three AI-generated artboards for review before another layout cycle. The artboards establish composition and atmosphere. They do not prove a continuous apartment model, working navigation, animation, accessibility or performance. A genuine residential 3D tour still requires an authored, connected scene. No live application changes are specified as completed here.

## Visual direction

Use architectural cinema as the shared language: a slim white masthead, the approved Reliant CAD logo, a dark graphite-green chapter rail, restrained electric-blue actions, large environmental views and precise foreground information. Preserve the actual approved logo asset; generated branding in an artboard is only a reference.

The three artboards establish complementary views:

- **Home:** two adjacent, full-height entries. A residential interior and a shaded commercial architectural view receive equal prominence. Both labels and entry links remain visible without hover.
- **Residential:** one connected apartment fills the main view. Room navigation, service details and mode controls sit in a consistent foreground rail.
- **Commercial:** a pale architectural drawing or shaded-model view carries the transformation, with the same masthead and chapter system. Keep the complete storefront legible.

Depth comes from spatial perspective, material, light, foreground/background relationships and deliberate occlusion. Avoid repeating floating cards or using shadows as the primary source of depth. All information and controls must remain readable where layers intersect.

## Whole-site structure

| Route              | Role and service story                                                                                                                                                                          | Direct actions                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/`                | Immediate residential/commercial choice, concise company positioning, selected real work and service areas. Core copy: **“Commercial and residential construction, built around the details.”** | **Explore a home**, **Explore a storefront**, **View our work**, **Discuss your project** |
| `/residential`     | Connected apartment experience, readable residential service chapters, real case studies, and a separate **Basements and exteriors** section.                                                   | Choose a mode or room; view real work; discuss a residential project.                     |
| `/commercial`      | Four-stage storefront journey, followed by the broader commercial capabilities and their documented project evidence.                                                                           | Choose a stage; view the real project; discuss a commercial project.                      |
| `/projects`        | Published project index with clearly labeled residential/commercial filters, locations, scope summaries and visible project links.                                                              | **View project** remains a text action; photographs also link.                            |
| `/projects/[slug]` | Documentary case study: actual project name, general location, completed scope, result and approved photography.                                                                                | Browse photographs, related projects and project inquiry.                                 |
| `/about`           | Owner-led management, trade coordination, communication and finish quality, grounded in the supplied company copy.                                                                              | View work and contact Reliant.                                                            |
| `/contact`         | A straightforward inquiry page, visually consistent with the new direction and independent of either experience.                                                                                | Existing project-type choices, contact fields and optional attachment.                    |
| `/privacy`         | Existing privacy information remains accessible from the footer.                                                                                                                                | Return to the site or contact page.                                                       |

Build the experience into the principal division pages. The current `/experience` route redirects to `/`; keep the residential and commercial pages as the direct visitor destinations.

The persistent masthead provides **Residential · Commercial · Projects · About · Contact**; the logo links to Home. Keep a visible **Discuss your project** action. Visitors can change division or leave an experience at any point. Contact and project pages never require completing an animation or tour.

## Residential: one apartment, two modes

Persistent disclosure: **“An imagined apartment illustrating Reliant’s services.”** Real project references appear separately, labeled **“Real project photograph”**, with the actual project name and general location.

- **Guided tour** — “Follow the apartment from room to room.” Provide Start, Pause/Resume, Previous, Next and a room list. Movement follows connected spaces and can be interrupted.
- **Explore freely** — “Choose your route and inspect the details.” Support actual movement through the same apartment, with discoverable keyboard and touch controls, accessible room shortcuts and an always-visible exit.

These mode names require the corresponding behavior. Disconnected panoramas or room-image swaps remain a clearly labeled fallback, such as **View room scenes**.

| Chapter         | Exact service copy                                                                                                            | Documentary reference                  |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Entry**       | **Custom doors. Carefully finished transitions.** Interior doors, millwork details and hardwood flooring.                     | Upper West Side Apartment              |
| **Living room** | **Bring the whole space together.** Millwork, flooring, painting and coordinated finishes.                                    | Upper West Side Apartment              |
| **Kitchen**     | **A kitchen built around everyday life.** Layout changes, custom cabinetry, a fabricated range hood and coordinated flooring. | Plainview Kitchen                      |
| **Bedroom**     | **Carry the finish through every room.** Painting, hardwood floors, interior doors and finish work.                           | Upper West Side and Tribeca apartments |
| **Bathroom**    | **The detail is in the finish.** Bathroom renovation, tile, fixtures and associated carpentry.                                | Tribeca Apartment                      |

The artboard’s four room labels are provisional; these five chapters define the proposed service story. Their order must follow the authored apartment layout. References establish Reliant’s documented capabilities; they do not imply that an illustrated room reproduces a photographed client space.

Keep Hicksville basement work and Kings Park siding, windows and stone finishes in the separate **Basements and exteriors** path. They should not be forced into the apartment’s geography.

**Required scene package:** a consistent floor plan and connected geometry, traversable doorways, material/lighting continuity, camera and collision boundaries, named service anchors, guided-route waypoints, and optimized delivery assets. Review the route and representative camera views before frontend assembly. Artboards alone cannot supply this package.

## Commercial: a bounded construction story

Use **“Illustrative architectural transformation”** on generated media. The initial journey is tied specifically to Raising Cane’s storefront and exterior facade scope.

| Stage               | Exact copy and visual role                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Drawing**         | **The architectural study.** An illustrative interpretation of the storefront.                                                                                           |
| **Storefront**      | **Glass and connection.** Glass storefront installation and coordinated facade transitions.                                                                              |
| **Facade & finish** | **Bring the materials together.** Metal and ACM panels, exterior trim and finish work.                                                                                   |
| **Real project**    | **See the documented work.** The Raising Cane’s storefront and exterior facade in Forest Hills. Switch to an actual project photograph and link to the documented scope. |

Do not imply that Reliant supplied architectural design or a structural frame for this project. Present ground-up carpentry through Chick-fil-A; masonry/restoration through Lidl Staten Island; occupied retail work through Harbor Freight; and demolition/polished concrete through Lidl Harlem.

Use native scrolling and discrete stage controls. Keep the generated-to-real boundary explicit, retain a direct **View project** action, and provide a way to skip the sequence.

## Delivery boundaries and acceptance

- **Mobile:** preserve division choice, contact access, chapter navigation and service copy. Recompose the rail below or beside the environment. Avoid obstructed controls, mandatory full-screen entry and gestures that trap page scrolling.
- **Reduced motion and fallback:** provide still views, instant chapter changes and complete readable service/project content. Guided movement requires an intentional start. Handle unavailable graphics or media without an empty scroll runway.
- **SEO:** retain existing meaningful routes, titles, canonicals and prelaunch indexing controls. Render headings, service descriptions and real-project links in HTML independently of canvas/video. Use real case-study media in project schema and keep synthetic scenes clearly identified. This document does not constitute a completed SEO audit.
- **Project integrity:** preserve the approved curated photography and documented scopes. Use general residential locations; add no invented dimensions, reviews, credentials, performance figures or business history.
- **Admin:** retain existing project publishing, hiding, ordering and editing behavior. Hidden projects disappear from public proof and contextual references. The authored demonstration apartment remains separate from the completed-project collection. Existing admin workflows and inquiry handling are outside the visual redesign.

The build sequence starts with the connected apartment asset and representative camera views, then the commercial model and shared navigation, followed by the remaining public pages. Each experience needs working interactions and responsive, accessibility and performance verification before it can be described as delivered.
