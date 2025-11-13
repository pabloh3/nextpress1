Context: We are diagnosing why drags initiated from BlockLibrary do not trigger canvas drops reliably, especially on touch.

Scope of changes:
- Add console instrumentation in client/src/lib/dnd/index.tsx to trace drag lifecycle:
  - Log on start with draggableId, source droppable
  - Log move coordinates and droppable under pointer
  - Log setOver target and drag end over state
  - Wrap onDragStart/onDragEnd user callbacks with try/catch + warn
- Add a data attribute on BlockLibrary cards for quick DOM identification during debugging (no behavior change)

Assumptions:
- No iframe; elementFromPoint should work
- Collapsible wrappers should not interfere with low-level events

Risks / impact:
- Console noise during development; no user-visible changes
- No API changes; behavior intact aside from touch preventDefault already applied

Rollback:
- Revert to backups/dnd-index.tsx.touch-drag-fix.bak or backups/dnd-index.tsx.instrumentation.bak

Date: 2025-11-11
