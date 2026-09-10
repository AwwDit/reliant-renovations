# Verification · September 9, 2026

Preview: http://localhost:3000

## Preserved content

The live project data was compared with the original baseline after implementation: all 10 projects, 80 photographs and 68 scope entries are unchanged. No image files are missing. See `content-check.json`.

The generated mockup is a design reference only. The actual site uses the approved logo file, original curated photographs, and correctly matched project names/scopes. The sidebar edge is straight, as requested.

## Build and application checks

- Production build and TypeScript compilation passed.
- Global ESLint passed.
- All 11 existing unit tests passed.
- All 54 integration assertions passed against a disposable database: public routes, authentication, project CRUD, ordering, uploads, inquiries and privacy.

## Browser checks

- Exercised all 15 visible project selections across Home, Residential and Commercial. Every selection reveals the correct name and case-study link; panels meet with no layout gaps after each transition.
- Ran 18 axe WCAG A/AA checks across those three routes, dark/light themes and widths 1440px, 1024px and 390px. No violations, horizontal overflow or JavaScript errors were detected.
- Verified mobile previous/next, horizontal swipe, reduced-motion behavior and five ordinary project links without JavaScript. The linked case study exposes all eight photos without JavaScript.
- Verified desktop and mobile navigation, route active states, mobile-menu Escape/focus restoration and legal links with the portfolio footer hidden.
- Verified the Projects filter from 10 to 5 and Back restoring 10; direct photo links; gallery keyboard arrows; Escape returning focus to the exact originating image; and photo browser history.
- Checked Projects, case studies, About and Contact across desktop/mobile and both themes. No accessibility violations or overflow in the checked views. Landscape case-study photos now retain their measured proportions.
- Rechecked production panel selection, mobile controls and client navigation through all main routes.
- Production contact-form browser checks used intercepted responses to exercise an error followed by a successful retry. No live inquiry was sent.

Detailed results: `browser-checks.json` and `production-checks.json`. Desktop and mobile screenshots are saved alongside this report.

The local development server uses `localhost`. Next.js blocks its development resources when accessed through the unconfigured `127.0.0.1` alias, so use the preview link above. The temporary production test server is stopped after verification.

## Performance sample

One simulated mobile Lighthouse pass on the production build scored 91 for performance, with LCP 3.4s, CLS 0.003 and total blocking time 30ms. These are laboratory measurements, not field Core Web Vitals. LCP remains the main optimization opportunity; hero-image discovery and loading priority passed. See `lighthouse-mobile.report.html` and `.json` for the full result.
