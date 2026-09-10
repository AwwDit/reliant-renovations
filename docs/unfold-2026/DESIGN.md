# Reliant — unfolding project portfolio

The approved desktop foundation below is retained. The subsequent brand hero, vertical mobile accordion, and compact galleries are documented in [the current design update](../brand-home-2026/DESIGN.md).

This is the current direction. It supersedes the CAD, virtual-tour, tilted-print, and conventional split-hero attempts.

The user liked the sliding project panels in the generated composition reference and explicitly rejected the jagged blue decoration at the lower left. The built version therefore uses a straight 240px navigation spine and a full-height photographic accordion.

The existing blue/black/white RR artwork is preserved. The sidebar introduces Reliant as a commercial and residential general contractor, gives both divisions equal navigation prominence, and includes company, project, contact, service-area and legal access. The actual project photography supplies warmth; there are no generated building or room assets on the website.

The home collection features five real projects across both divisions. Selecting a panel or its name opens the photograph and reveals the project's location, documented scope and case-study link. Residential and Commercial each open all five published projects in database order. The complete Projects index retains all ten projects, filters and owner-managed order. Case studies retain all eight photographs and their complete documented scope.

Motion is tied to selection. GSAP Flip moves the photographic boundaries from one selection to the next; nothing auto-advances. Mobile uses one full-width photograph, selectable project names, previous/next controls and horizontal swipe. Reduced-motion selection is immediate. Server-rendered content and ordinary project links remain available without JavaScript.

The visual mockup was generated with the built-in image tool using the approved logo and existing Plainview, Raising Cane's, Upper West Side and Chick-fil-A photos as references. It was a composition reference only: its regenerated imagery and incorrect sample labels are not used in the implementation. The deployed UI uses the original local assets and live project records.

Skill application: design-taste-frontend and gpt-taste informed the composition, horizontal accordion and motivated motion. The explicit user-approved interaction takes precedence over randomized hero presets. Image generation was used to resolve the visual idea before implementation.

Implementation: `components/unfold/portfolio.tsx`, `components/unfold/portfolio.css`, `components/site-header.tsx`, `components/craft/navigation.css`, and the shared `app/(site)/foundation.css`. Navigation/content layers are 1 (page), 20 (sidebar), 60/61 (dialog shade/panel); local photographic clipping uses isolated stacking contexts.
