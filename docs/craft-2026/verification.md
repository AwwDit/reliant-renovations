# Redesign verification · September 9, 2026

Local production preview: http://127.0.0.1:3006

## Content and scope

- Compared the live project records with the preserved baseline: all 10 projects, 80 images and 68 scope entries are unchanged. All image files exist.
- Checked the current public pages against the supplied designer package. Raising Cane’s remains exterior-only; Chick-fil-A photography is presented as construction/buildout.
- Public routes no longer expose the CAD or virtual-tour concepts. The old `/concept` route redirects to `/projects`; `/experience` redirects home.
- Residential and commercial collections each retain their five projects, current owner-managed order, service descriptions and case-study links.

## Automated checks

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — 11 tests passed.
- `npm run build` — production build passed.
- `npm run test:integration` — 54 assertions passed across public routes, authentication, project CRUD, ordering, uploads, inquiries and privacy. This suite uses a disposable database.

## Browser verification

- Inspected desktop and mobile layouts at 1440px and 390px, including light and dark themes.
- The production home, about, contact and privacy pages passed 16 combined viewport/theme axe WCAG A/AA checks with no detected violations, horizontal overflow or JavaScript errors. See `production-browser-checks.json`.
- Residential and commercial pages passed their desktop/mobile, light/dark accessibility and overflow checks. All five project stories per division remain available without JavaScript.
- Verified portfolio filtering from 10 projects to 5 and browser Back restoring 10; direct photo links; all 8 photographs on a case study; keyboard gallery navigation; Escape closing the gallery; focus returning to the exact opening control; and photo links without JavaScript.
- Verified desktop project previews and mobile navigation, keyboard access, Escape, focus restoration and ordinary navigation without JavaScript.
- Verified the contact form’s residential preselection, error feedback and successful retry using mocked responses. No live inquiry was sent by the browser test.
- Verified the redesigned 404 page and the retired concept-route redirect.
- Reduced-motion preferences disable decorative motion; natural document scrolling is retained.

The local preview is a production build. No external publication or account changes were performed.
