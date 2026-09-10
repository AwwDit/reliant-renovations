# Reliant homepage and gallery evolution

This update follows the user's approval of a dedicated brand hero above the existing desktop project slider, a vertical photographic accordion on mobile, and denser project-detail galleries. It extends the approved unfolding portfolio rather than replacing its visual identity.

Design read: a commercial and residential renovation portfolio for homeowners and business clients, using the existing photographic, charcoal, white and electric-blue language. Native CSS, Manrope, Phosphor, Radix and GSAP remain the project's foundation. Design variance 8, motion intensity 6, visual density 4, with gallery density increased to 6. No new packages or generated imagery were added.

## Homepage

The actual RR logo stays in the straight navigation sidebar. A prominent Reliant name introduces the company above the exact client headline. Real Plainview and Raising Cane's images show both sides of the business. The two supplied calls to action lead to Contact and the on-page Projects section. The complete approved introduction and division links follow within the hero. The existing desktop accordion remains beneath it, with the normal site footer restored at the end of the homepage.

The main H1 now belongs to the hero; the sidebar uses its existing division descriptor. Project heading levels reflect the new section hierarchy. The hero uses published owner-managed projects, falls back to available photographs, and does not expose imagery from unpublished projects. When only one project is available, the hero uses a single photograph.

## Mobile projects

Every project is present as a photographic band in normal page flow. One selected band expands, while the others keep their full names, index and plus control. The selected panel shows its project link. Tapping a different band changes the selection; scrolling never changes it. The horizontal mobile index, swipe handling and previous/next carousel controls were removed. The desktop selection animation remains intact.

## Project galleries

The eight photographs form justified rows in source order, generally three per row on desktop and two on mobile. Their actual aspect ratios determine their widths, preserving the full photographs. Consistent 10px desktop and 8px mobile gutters replace the staggered gaps. Numbered overlays keep the collection legible, while complete descriptions remain available in accessible links and the full-size viewer. Keyboard navigation, Escape, focus restoration, photo URLs and no-JavaScript image links are retained.

## Preservation and verification

The client's supplied wording, project descriptions, all 68 scope entries, all 80 photographs, project slugs, ordering and data remain intact. Metadata and owner workflows were not redesigned. No document launch/account instructions were executed. The brand's existing colors, approved logo assets and sharp geometry take priority over generic skill defaults; the exact supplied wording takes priority over suggested copy-length limits.

The hero has a short entrance animation, the accordion animates only on selection, and gallery controls respond to user action. Reduced-motion settings remove transitions. Navigation occupies the existing page layer, and the full-photo viewer keeps its established modal layer.

Checks are recorded in `content-verification.json`, `accordion-responsive-checks.json`, `gallery-checks.json`, `production-checks.json` and `lighthouse-mobile.json`. Screenshots show the final homepage in both themes and the updated galleries. Temporary production verification processes are stopped after testing; the existing development preview remains on port 3000.

Final production checks passed at 320, 390, 768 and 1440px. Both themes render without horizontal overflow; hero CTAs remain in the initial viewport; the project anchor lands at 0px on desktop and 84px on mobile. All 16 tested public/project routes returned 200. The production gallery lightbox and desktop/mobile selection controls passed.

The local Lighthouse mobile simulation scored performance 89, accessibility 100 and best practices 100, with LCP 3.6 seconds and CLS 0. The report identifies existing render-blocking CSS as the main remaining performance opportunity. These are local simulated measurements, not field Core Web Vitals. SEO scored 69 solely because the pre-launch preview intentionally blocks indexing; the indexing configuration was preserved.

## Projects index refinement

The user's subsequent request extended the clean gallery treatment to the Projects index. The alternating 88px offsets, unequal columns, tall inconsistent cover ratios and oversized gutters were removed. The index now uses two equal columns with 4:3 photographs, 22px desktop column gutters and 28px row gaps. Mobile uses a compact single column. The heading and supplied introductory sentence are stacked, filtering remains in its existing URL-based toolbar, and location/title/category details follow a consistent hierarchy. Caption categories align at the bottom of each desktop row.

Only index-specific selectors in `components/craft/portfolio.css` and `components/craft/portfolio.tsx` changed. The shared project-detail gallery and hero selectors were preserved. Document copy, all ten projects, URLs, database order and owner settings remain intact. Three cover selections use existing wider photographs: Harbor Freight 04, Lidl Harlem 02 and Upper West Side 06. If an owner removes a selected photograph, the first available project image is used instead. Crop positions for the existing Lidl Staten Island, Raising Cane's and Plainview cover images preserve the facade, signage and range hood. No new completion claims or imagery were created; the Chick-fil-A cover retains the supplied construction context.

Scoped ESLint, TypeScript and the production build passed. Responsive/filter/navigation/accessibility results are recorded in `projects-index-checks.json`; production geometry checks and mobile Lighthouse measurements are recorded separately in `projects-index-production.json` and `projects-index-lighthouse.json`.

The final Projects index Lighthouse mobile simulation scored 99 performance, 100 accessibility and 100 best practices, with LCP 2.2 seconds and CLS 0.001. These are local simulated measurements. Production checks passed for all three filters at 320, 390, 768 and 1440px, including equal widths, aligned row edges, 4:3 covers, both themes and zero browser errors.

## Sitewide appearance and mobile navigation

The mobile navigation project preview was removed at the user's request. Its project data prop and unused preview styles were removed as well. The six primary mobile links, service areas, privacy, owner access, Instagram and appearance control remain. The approved sidebar, page layouts, photographs and supplied wording are unchanged.

Both themes now use one shared palette across the public pages and owner workspace. Navigation, the homepage hero, photographic project panels, index, case metadata, image viewer, footer, About, Contact, Privacy and form states follow the selected appearance. The light edition uses pale neutral photo overlays and dark text while preserving the original images. Portalled menus, project editors and inquiry dialogs inherit the same tokens. The owner workspace's existing monochrome logo becomes dark in light mode. Filled blue controls retain readable white text, including hover states.

The pre-hydration initializer and theme control now share the approved dark default. A saved visitor choice persists through reloads and route navigation and synchronizes across tabs. The toggle is hidden without JavaScript; native mobile navigation remains available. The fullscreen photo viewer uses an opaque theme background. During the owner-interface audit, the optional empty phone link was also removed from inquiry dialogs.

`theme-checks.json` records 36 public/setup page states across 390px and 1440px in both themes, with zero horizontal overflow or scoped accessibility violations. The mobile menu contains no project image, and its focus trap, Escape dismissal and focus restoration pass. Theme persistence, the no-JavaScript menu and both image-viewer themes pass. Captured `theme-*.png` images cover the hero, slider, menu, footer, form and gallery viewer.

`admin-theme-checks.json` records 20 authenticated production-browser states: login, project collection, project editor, inbox and inquiry dialog in both themes at 390px and 1440px. All pass contrast/accessibility and overflow checks. These checks used a random local production port, temporary credentials, disabled email and a uniquely named disposable MongoDB database. The owned server, test database and temporary files were removed afterward. Scoped ESLint and formatting checks pass; the root agent completed the production rebuild.
