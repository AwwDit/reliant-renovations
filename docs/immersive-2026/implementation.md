# Reliant immersive redesign

Implemented September 7, 2026 in the existing Next.js site.

## Direction and content

The homepage introduces Reliant as a commercial and residential renovation contractor and gives equal entry points into the two experiences. All project records remain in the owner-managed database; no scope, image, metadata or project ordering was edited.

Residential is a room-by-room photographic tour. Living, kitchen, bathroom, basement and exterior scenes introduce services with interactive hotspots. Kitchens connect Upper West Side and Plainview; bathrooms connect Upper West Side and Tribeca; the remaining destinations include Hicksville and Kings Park. Each scene identifies its source project. The complete residential project index is accessible throughout. Service links reference appropriate published case studies, including limiting the structural kitchen example to Plainview.

The residential navigation is a service journey through real project photographs, with camera-style transitions and bounded photo exploration. Its room guide is a navigation diagram, not a measured property plan. It does not claim a continuous 360-degree capture or a photogrammetric reconstruction. All images retain a link to the full photograph.

Commercial includes five distinct illustrated project studies for storefront/facade work, framing, masonry, retail refresh and concrete flooring. Animated linework and a controllable reveal transition from the study to real project photography. Play, pause, replay and direct project selection are available. Drawings are explicitly labeled illustrative. Raising Cane’s opens first, while the selection rail follows admin order.

The portfolio index retains all ten case studies with residential/commercial filtering and direct links into the two experiences. Individual projects use a fullscreen photo viewer with eight-photo navigation, a contain-fit view, full scope and result information, and related projects. The existing about, contact, privacy and owner-management routes remain available.

## State and interaction

- Residential room and related-project selection are shareable in `?room=…&project=…` URLs.
- Commercial selection uses `?project=…`.
- Individual photo selection uses `?photo=…`.
- Browser Back, keyboard controls, focus restoration, reduced motion and no-JavaScript navigation are supported.
- Public content uses current published records. Unpublished projects are omitted from the tour and gallery links.
- Original inquiry fields, optional attachments, project management and other backend behavior are retained.

## Requirement precedence

The current user direction explicitly requests an immersive CAD experience and a service tour connecting multiple projects. It takes precedence over the brief’s earlier preference for restrained blueprint imagery. The document remains the source of the project facts and capabilities. Launch operations and business confirmations listed in the document are background requirements, not instructions to alter external accounts during this local redesign.

See requirements-map.md for the complete project-to-service mapping and document comparison.
