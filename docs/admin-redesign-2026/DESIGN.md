# Reliant owner workspace

## Design read

An owner workspace for Reliant Renovations using the established public website's design: original color logo, charcoal and paper surfaces, Manrope typography, blue accents, straight edges, photographic project layouts and thin dividers. The existing React/Radix interactions remain the foundation. This is a brand alignment, not a new dashboard design system.

The design-taste skill's redesign audit informed brand preservation; the redesign-existing-projects skill guided the actual admin changes. Design variance 5, motion intensity 2, visual density 6: preserve the site identity, keep motion limited to feedback, and retain practical control density.

## Before

The prior dashboard shared the theme colors but used a monochrome logo, rounded navigation and controls, three boxed statistics, small project cards and rounded dialogs. The login screen was an isolated card. Those patterns did not match the public project index or navigation.

Baseline screenshots are retained in this directory. Existing MongoDB storage, owner authentication, project CRUD, publication/featured controls, ordering, photo uploads, inquiry handling and routes are preserved.

## Changes

- The 240px desktop sidebar matches the public navigation's logo, padding, surface and active-link treatment. Mobile uses the same compact brand bar, followed by two direct workspace tabs. Appearance controls are available within the dashboard.
- Larger project and inquiry headings use the site's Manrope proportions. The project overview is a continuous strip divided by fine rules.
- Project photographs use a two-column desktop grid and a single column on phones. Publication status, featured status, ordering and photo counts sit below the photographs; all management controls remain available.
- Buttons use square edges, quiet outlines and the site's divided icon cell for primary actions. Filters and search use underline treatments.
- Login/setup use authentic Upper West Side photography and the original full-color Reliant logo. The project editor and inquiry dialog use the same square geometry, typography and surface palette.
- The styles are separated into common workspace, project editor and authentication files instead of layering another override stylesheet over the former admin design.

No public marketing content, real project wording, image files or live records are changed by this redesign. Verification uses generated test databases with email delivery disabled.

## Verification

See QA.md and the browser report in this directory for the final desktop/mobile checks, both themes, accessibility, editing, ordering, publication, inquiry handling and test-resource cleanup.
