# Admin redesign verification

Verified on September 9, 2026: all 61 functional browser checks and all 36 responsive checks passed. The final production build, global lint, TypeScript, formatting and the separate 71-assertion integration suite also passed.

The browser harness uses a disposable production server on a randomly assigned local port, temporary owner credentials, a generated `reliant_test_admin_redesign_*` MongoDB database and a temporary upload directory. Its database destination is fixed to the verified local replica set at `127.0.0.1:27018`, with `directConnection` enabled. Email delivery is explicitly disabled. The existing development server, owner credentials and website database are not reused or changed. Both final runs stopped their owned servers and removed their generated databases and temporary directories.

The previous admin presentation is captured in the `before-*.png` files. Final screenshots are captured after visible images decode and the browser paints, before accessibility scanning alters the rendering environment.

The [functional results](browser-checks.json) cover dark and light appearance at 390px and 1440px:

- Sign in, password visibility, theme retention and navigation.
- All, commercial and residential filters; title and location search; empty results.
- Editor layout, keyboard containment, Escape and focus restoration.
- Discarding unsaved field changes without persisting them.
- Saving an edit and photo order, reopening it, then restoring the source values.
- Uploading one actual project photo through the file input, enforcing its required alt text, saving it, verifying the uploaded URL responds successfully, then removing it and restoring the original gallery.
- Project ordering and publish/hide controls, including public route visibility.
- Creating and removing a disposable hidden project with an existing image.
- Inquiry navigation, read state, the email reply link and optional empty phone.
- Scoped accessibility, contrast and horizontal overflow across login, dashboard, editor, inbox and inquiry dialog.
- Switching appearance through the visible dashboard control, retaining it after reload and opening the public homepage with the same appearance and no horizontal overflow.

The [responsive results](breakpoint-checks.json) cover login, dashboard and editor in both themes at 320, 390, 768, 1000, 1024 and 1440px. The 320px viewport is 640px high. No document or root overflow, theme mismatch, or editor header/body/footer collision was found. Final desktop and mobile screenshots were visually reviewed.

The checks caught and verified fixes for mobile login photo overflow and editor/inquiry focus restoration. The final functional run reported no browser errors, scoped axe violations or outstanding failures. Unsaved changes retain the existing behavior: closing or cancelling discards them without saving.

The separate integration suite passed all 71 assertions covering authentication, project CRUD, uploads and inquiries. All browser mutations were confined to generated test data; the original ten project records and their image order were restored within that data before cleanup.
