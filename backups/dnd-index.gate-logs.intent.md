Intent: Gate remaining verbose DnD console logs behind DEBUG_BUILDER flag.

Original intent summary (carry-over): Previously added partial gating for ctxOnDragStart and move/setOver logs. Remaining logs (ctxOnDragEnd, finalizeDrag, Draggable.handleDragStart, parent droppable, null-droppable, end.* events, finalDestination, cancel, mismatch) are still always printing. Goal is to reduce noise in production console while preserving ability to debug when DEBUG_BUILDER is set.

Scope:
- Only modify client/src/lib/dnd/index.tsx
- Wrap non-warning console.log statements with if (import.meta.env?.DEBUG_BUILDER) ...
- Preserve console.warn for error-like conditions (callback errors, missing meta) so they always surface.
- No functional changes besides conditional logging.

Non-goals:
- Do not refactor logic
- Do not change API surface
- Do not remove logs entirely

Risk & Mitigation:
- Minimal risk; only gating logs. Ensure no required side-effects are inside logs before wrapping.
