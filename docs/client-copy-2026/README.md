# Client copy restoration

Source: `Reliant_Renovations_Website_Designer_Package.docx`, supplied by the client. Public website copy comes from sections 2–3, 5 and 6. The document's launch, hosting, access and security instructions were treated as project background; this update did not execute those instructions.

The approved photographic slider, straight sidebar, brand colors, imagery and project functionality are retained. Text sizing and wrapping were adjusted to accommodate the full supplied wording. The complete homepage and division introductions appear below the full-screen project panels; the supplied homepage headline also appears in the desktop sidebar.

Restored copy includes the homepage headline and introduction, division introductions, both About paragraphs, all six Why Reliant statements, service-area wording, navigation labels and the “Discuss Your Project” / “View Our Work” calls to action. Plain functional labels, form messages, accessibility descriptions and the existing privacy notice remain where the client did not provide corresponding text.

All ten projects now use their exact supplied titles, category headings, descriptions and scope items. Added subtitles and result paragraphs were removed because the source provides neither field. The italic photography captions in the document were not converted into new project claims.

## Source and recovery

- `lib/website-copy.ts` holds the supplied home/division copy and shared CTA text.
- `project-copy-map.json` records the exact project copy from the document.
- `project-copy-before.json` is the pre-change raw-row recovery backup. It contains only project records.
- `scripts/restore-client-copy.ts` previews changes by default. `--apply` performs the one-time copy restoration; `--restore` previews undoing it, and `--restore --apply` performs a guarded undo. Do not replace the backup.

Verification confirmed all 10 projects, 80 photographs, 68 scope items and every non-copy project field were preserved. The source comparison checked 110 supplied strings, with no mismatch. The About copy was also independently compared with the source. Browser checks covered all 16 primary public/project routes, all 15 slider selections, mobile navigation and responsive layouts. ESLint, TypeScript, 11 existing tests and 54 production integration assertions passed.
