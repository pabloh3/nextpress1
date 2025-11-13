Intent: Add a global jsdom polyfill for document.elementFromPoint during tests to eliminate unhandled errors triggered by drag handlers in @hello-pangea/dnd and our wrappers.

Context:
- New test client/src/test/DragClassToggle.test.tsx asserts npb-dragging body class is toggled during drag.
- jsdom lacks document.elementFromPoint, which is used by the DnD library during move/end, causing noisy unhandled errors.

Scope:
- Modify client/src/test/setup.ts only, adding a minimal mock returning document.body.
- Do not change DnD implementation or other tests.

Risks/Impact:
- Mock is global for jsdom test env; low risk as it only affects tests and returns a stable element.
- No effect on runtime behavior in browser.

Rollback:
- backups/client-src-test-setup.ts.bak holds previous setup content from HEAD.
