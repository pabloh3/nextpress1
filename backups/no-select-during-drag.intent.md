Intent: Prevent global text selection after/while dragging blocks.

Issue: After finishing a drag, large text regions appear selected in the canvas (accidental selection by the browser during pointer movement).

Fix:
- Add body class toggling in DnD: Add 'npb-dragging' on drag start; remove on drag end/cancel.
- Add CSS rule to disable selection for body and descendants while 'npb-dragging' is present.

Files changed:
- client/src/lib/dnd/index.tsx (toggle class)
- client/src/index.css (add rule)

Notes:
- We still allow selecting contents normally when not dragging.
- Touch and mouse paths both toggle correctly.
