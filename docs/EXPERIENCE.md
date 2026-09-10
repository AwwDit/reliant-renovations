# Current experience implementation

The current implementation and full visitor journey are documented in [WORLD-EXPERIENCE.md](WORLD-EXPERIENCE.md).

- `components/world/world-shell.tsx` owns persistent environmental imagery, image handoff, focused crop/zoom and paused commercial video frames.
- `world-page.tsx` registers route scene information while preserving server-rendered route content and initial imagery.
- `world-home.tsx` provides the residential/commercial entry.
- `division-journey.tsx` and `lib/world-journeys.ts` provide the complete service chapters, feature details, journey index and real-project connections.
- `project-atlas.tsx` provides the immersive portfolio and case-study viewer with URL-backed selection and accessible detail/full-photo dialogs.
- About, Contact and Privacy use the same environment and readable foreground surfaces.

The owner dashboard, publication filters, inquiry API and real-project database remain separate and intact. `/experience` still redirects to Home.

The manually authored Three.js apartment, standalone panorama viewer and previous static residential entry are superseded. Their retained code and historical tests do not describe active visitor behavior.

No new assets were generated for this redesign. Existing provenance remains in CINEMA-ASSETS.json, EXPERIENCE-ASSETS.json and RESIDENTIAL-MOTION-ASSETS.json. The one-room Higgsfield motion study is retained as a separate file; it is not the residential tour. The current residential experience is a set of photographic service chapters, with a future continuous film requiring coordinated keyframes and a reviewed credit estimate.
