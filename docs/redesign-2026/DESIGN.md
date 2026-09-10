# Reliant: architectural edition

The September 2026 redesign preserves the project database, published URLs, galleries, services, inquiry form, admin tools, and metadata while replacing the public presentation.

## Audit and direction

The previous site used a full-screen illustrative interior, a floating cream navigation bar, light Manrope headings, translucent division cards, and a fixed scene behind almost every route. Project stories depended on drawers and a scene viewer. The repeated flat panels and similar page compositions obscured the real photographs.

The new direction is an architectural studio: a physical sectional model introduces construction, bold sans-serif headlines establish hierarchy, and dimensional photo frames bring authentic projects forward. The layout uses a normal document flow, a compact sticky navigation bar, deep image shadows, staggered image sizes, and blue structural accents. Content is readable before JavaScript loads.

Design variance: 8. Motion intensity: 5. Visual density: 3. Motion introduces content in reading order and responds to actions; reduced-motion users get static content. Native CSS and IntersectionObserver are used with the existing Next.js, React, Radix and Phosphor stack.

## Tokens

Dark: graphite #17191d, elevated graphite #202328, off-white #f0f1f3, blue #2665ed. Light: silver #eff0f2, raised silver #e5e7ea, ink #1b1e24, blue #215ce5. System preference applies until the visitor chooses a saved theme. Both use self-hosted Manrope, sharp corners, no competing accent color, and generous responsive gutters. Photography retains its natural colors.

The brand logo assets remain the existing approved files. The white logo is displayed in dark mode and rendered in monochrome ink on light surfaces.

## Asset provenance

`public/images/architecture/structure.webp` is an illustrative architectural model, generated with the built-in image generation tool and optimized to WebP. The homepage labels it “Architectural concept.” It is not a completed Reliant project.

All portfolio and service imagery comes from the existing authentic project photographs. No project photo was replaced or edited. A pre-redesign snapshot of the ten project records is in `project-baseline.json`.

### Hero prompt

Use case: stylized-concept. Asset type: premium architectural construction company website hero artwork, widescreen 16:9, no text. Create an extraordinarily photorealistic studio photograph of a large sculptural architectural scale model, a sectional cutaway of an elegant modern building in a deconstructed/exploded arrangement. Positioned on the right two thirds of the horizontal frame: thick pale silver concrete exterior walls, cantilevered white concrete horizontal roof slab lifted above the main structure, precise brushed aluminium structural members, smoked glass, small oak interior floor and stair, one vivid cobalt blue inner wall and cobalt structural beam. Monumental, precise, strong perspective, tangible museum quality physical maquette. Lower viewpoint three-quarter architectural axonometric angle, geometry strikingly sculptural and plausible. Float separated slabs slightly to express construction layers with physically convincing deep cast shadows. Overall dark graphite studio environment, ground and seamless back wall charcoal #17191c. Dramatic softbox key light from upper left, shadow-rich ambient occlusion, softly illuminated edges. The left third is predominantly clear charcoal negative space for later website headline text. Model fills height and right edge, refined architectural magazine art direction. Limited palette: charcoal, concrete silver, brushed chrome, natural pale oak, one saturated cobalt accent. High detail, realistic tactile concrete surface. Absolutely no lettering, labels, captions, people, branding, watermarks, plants, grids or diagram lines. This is an abstract architecture concept, not a photograph of an actual client project. Output landscape 16:9.
