# Redesign verification

Verified locally on September 7, 2026. Production preview: http://127.0.0.1:3002.

- Production build, TypeScript and repository ESLint pass.
- Existing unit tests: 11 passed.
- Existing integration suite: 54 assertions passed on the redesigned production build. Uses an isolated database, test credentials, temporary uploads and disabled email notifications.
- All ten stored project records, including all eighty photo records, match `project-baseline.json` byte for byte. No project data was edited.
- All ten project routes return HTTP 200 and render eight gallery photographs; see `project-routes.json`.
- Browser interaction checks pass: all/commercial/residential filtering, Back navigation, selected-project URL, selected-photo URL, lightbox arrows/Escape/focus restoration, commercial contact prefill, mocked form error/retry/success, mobile navigation, and no-JavaScript project collection/navigation. Browser error list is empty. Form tests intercepted network requests and did not create real inquiries.
- Automated WCAG A/AA checks reported zero violations on homepage, project collection, project story, contact and residential pages at 1440px and 390px in both themes (twenty tested combinations). About and privacy additionally passed at both sizes in dark mode. Earlier service-caption contrast finding was corrected and rechecked. No horizontal overflow was found on tested screens.
- Screenshots were inspected for composition, photo cropping, hierarchy and button visibility on desktop and mobile in light and dark themes. Final homepage previews are saved beside this file.
- Reduced motion shows all content without entrance/reveal effects. The navigation, gallery and form remain usable with keyboard controls.

## Performance

Lighthouse 13.4.1, local production build, default simulated mobile network and CPU:

| Page               | Performance | Accessibility |  LCP |  TBT |   CLS |
| ------------------ | ----------: | ------------: | ---: | ---: | ----: |
| Homepage           |          94 |           100 | 3.1s | 20ms |     0 |
| Project collection |          99 |           100 | 2.2s | 20ms | 0.002 |

These are laboratory results, not field Core Web Vitals. Homepage LCP remains above the 2.5s target under the simulated mobile profile. The hero uses explicit eager loading and high fetch priority; Lighthouse confirms discovery/priority checks pass. A redundant project-link accessible label was removed after the initial Lighthouse run, and final DOM validation confirms each link uses its complete visible content.

Compact measurement reports: `lighthouse-home.json` and `lighthouse-projects.json`. The project report explicitly records the final accessible-name fix separately from its earlier performance measurement.
