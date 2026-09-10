# Division transition verification

Verified September 9, 2026: all 28 targeted browser checks passed, with no browser errors or outstanding failures. The final production build, lint and formatting checks also passed.

The [functional report](browser-checks.json) records animation frames and settled states at 1440px and 390px. Coverage includes:

- Leaving the visible homepage accordion and switching between Commercial and Residential through desktop and mobile navigation.
- Pointer and keyboard activation, including the mobile menu's portalled links.
- Rapid alternating choices, cancelling a departure by selecting the current division, and switching while an entrance or accordion expansion is running.
- A deliberately delayed Commercial RSC response: a later Residential choice remains the final destination after the old response is released.
- Direct entry, browser back/forward, native middle-click new-tab behavior, and uncancelled Meta/Control link events.
- Reduced motion without an exit or entrance animation, and immediate routing when the homepage accordion is offscreen.
- No-JavaScript navigation and all five fallback project links.
- Stage and index controls remain inert during motion; transition attributes, inert state, clipping, transforms and temporary positioning are removed after settling. Each collection retains five projects with one expanded preview and no horizontal overflow.

The additional [light-mode capture check](capture-checks.json) passed. Desktop and mobile entrance frames and the light-mode departure/settled frames were visually reviewed: the navigation stays fixed, the panels reveal in sequence, and the final collection retains the approved layout and theme.

Useful captures:

- [Desktop entrance](1440-commercial-to-residential-entering.png)
- [Mobile entrance](390-commercial-to-residential-entering.png)
- [Light departure](1440-light-commercial-to-residential-leaving.png)
- [Light settled collection](1440-light-residential-settled.png)

Browser checks used the existing `http://localhost:3000` preview and public, read-only interactions. No server was started or stopped, no website data was changed, and all QA browser contexts were closed. The first run's Meta-click popup timeout was a headless browser limitation; explicit default-event checks for both modifiers and a real middle-click new-tab check passed.
