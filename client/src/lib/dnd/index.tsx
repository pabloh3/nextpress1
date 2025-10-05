import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

// Public types compatible with previous library usage
export interface DropLocation {
  droppableId: string;
  index: number;
}

export interface DropResult {
  draggableId: string;
  source: DropLocation;
  destination: DropLocation | null;
  reason: 'DROP' | 'CANCEL';
  mode?: 'FLUID' | 'SNAP';
  type?: string;
  combine?: any;
}

type DragDropContextProps = {
  children: React.ReactNode;
  onDragEnd: (result: DropResult) => void;
  onDragStart?: () => void;
};

type InternalDragState = {
  draggingId: string | null;
  sourceDroppableId: string | null;
  sourceIndex: number | null;
};

type DndRegistry = {
  droppables: Map<string, HTMLElement>;
};

const DndContext = createContext<{
  registerDroppable: (id: string, el: HTMLElement | null) => void;
  onDragStart: (draggableId: string, droppableId: string, index: number) => void;
  onDragEnd: (destination: DropLocation | null) => void;
  isDraggingOver: (droppableId: string) => boolean;
  currentDrag: InternalDragState;
  setOver: (droppableId: string | null, index: number) => void;
  getOverIndex: (droppableId: string) => number;
  getOver: () => { id: string | null; index: number };
  wasDropCommitted: () => boolean;
  clearDropCommitted: () => void;
}>({
  registerDroppable: () => {},
  onDragStart: () => {},
  onDragEnd: () => {},
  isDraggingOver: () => false,
  currentDrag: { draggingId: null, sourceDroppableId: null, sourceIndex: null },
  setOver: () => {},
  getOverIndex: () => -1,
  getOver: () => ({ id: null, index: -1 }),
  wasDropCommitted: () => false,
  clearDropCommitted: () => {},
});

export function DragDropContext({ children, onDragEnd, onDragStart }: DragDropContextProps) {
  const registryRef = useRef<DndRegistry>({ droppables: new Map() });
  const [dragState, setDragState] = useState<InternalDragState>({ draggingId: null, sourceDroppableId: null, sourceIndex: null });
  const [overState, setOverState] = useState<{ id: string | null; index: number }>({ id: null, index: -1 });
  const committedRef = useRef<boolean>(false);

  const registerDroppable = useCallback((id: string, el: HTMLElement | null) => {
    const registry = registryRef.current;
    if (el) {
      registry.droppables.set(id, el);
    } else {
      registry.droppables.delete(id);
    }
  }, []);

  const ctxOnDragStart = useCallback((draggableId: string, droppableId: string, index: number) => {
    console.log('[DND] ctxOnDragStart', { draggableId, droppableId, index });
    // If already dragging, ignore subsequent starts (prevents nested starts)
    if (dragState.draggingId) return;
    setDragState({ draggingId: draggableId, sourceDroppableId: droppableId, sourceIndex: index });
    onDragStart?.();
  }, [onDragStart, dragState.draggingId]);

  const ctxOnDragEnd = useCallback((destination: DropLocation | null) => {
    setOverState({ id: null, index: -1 });
    setDragState((state) => {
      const result: DropResult = {
        draggableId: state.draggingId || '',
        source: { droppableId: state.sourceDroppableId || 'unknown-source', index: state.sourceIndex ?? 0 },
        destination,
        reason: destination ? 'DROP' : 'CANCEL',
        mode: 'FLUID',
        type: 'DEFAULT',
        combine: null,
      };
      // Reset first to avoid re-entrancy issues
      const next: InternalDragState = { draggingId: null, sourceDroppableId: null, sourceIndex: null };
      if (destination) committedRef.current = true;
      console.log('[DND] ctxOnDragEnd → onDragEnd(result)', result);
      onDragEnd(result);
      return next;
    });
  }, [onDragEnd]);

  const isDraggingOver = useCallback((droppableId: string) => overState.id === droppableId, [overState]);
  const setOver = useCallback((droppableId: string | null, index: number) => {
    setOverState({ id: droppableId, index });
  }, []);
  const getOverIndex = useCallback((droppableId: string) => (overState.id === droppableId ? overState.index : -1), [overState]);

  const value = useMemo(() => ({
    registerDroppable,
    onDragStart: ctxOnDragStart,
    onDragEnd: ctxOnDragEnd,
    isDraggingOver,
    currentDrag: dragState,
    setOver,
    getOverIndex,
    getOver: () => overState,
    wasDropCommitted: () => committedRef.current,
    clearDropCommitted: () => { committedRef.current = false; },
  }), [registerDroppable, ctxOnDragStart, ctxOnDragEnd, isDraggingOver, dragState, setOver, getOverIndex]);

  return (
    <DndContext.Provider value={value}>{children}</DndContext.Provider>
  );
}

// Droppable
type DroppableProps = {
  droppableId: string;
  isDropDisabled?: boolean;
  direction?: 'vertical' | 'horizontal';
  children: (provided: {
    innerRef: (el: HTMLElement | null) => void;
    droppableProps: React.HTMLAttributes<HTMLElement>;
    placeholder: React.ReactNode;
  }, snapshot: { isDraggingOver: boolean; overIndex: number }) => React.ReactNode;
};

const DroppableIdContext = createContext<string | null>(null);

export function Droppable({ droppableId, isDropDisabled = false, direction = 'vertical', children }: DroppableProps) {
  const { registerDroppable, isDraggingOver, onDragEnd, currentDrag, setOver, getOverIndex } = useContext(DndContext);
  const ref = useRef<HTMLElement | null>(null);
  const [indicatorTop, setIndicatorTop] = useState<number | null>(null);

  useEffect(() => {
    registerDroppable(droppableId, ref.current);
    return () => registerDroppable(droppableId, null);
  }, [droppableId, registerDroppable]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (isDropDisabled) return;
    if (!currentDrag.draggingId) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    // Ignore droppables that are inside the currently dragged element
    try {
      const dragEl = document.querySelector(`[data-draggable-id="${currentDrag.draggingId}"]`) as HTMLElement | null;
      if (dragEl && ref.current && dragEl.contains(ref.current)) {
        console.log('[DND] handleDragOver ignored (droppable is inside dragged element)', { droppableId });
        return;
      }
    } catch {}
    const container = ref.current as HTMLElement | null;
    if (!container) return;
    const index = computeIndexFromPointer(container, e.clientX, e.clientY, direction);
    setOver(droppableId, index);
    const items = Array.from(container.querySelectorAll('[data-draggable-index]')) as HTMLElement[];
    const containerRect = container.getBoundingClientRect();
    let top = 0;
    if (items.length === 0 || index <= 0) {
      top = 0;
    } else if (index >= items.length) {
      const last = items[items.length - 1].getBoundingClientRect();
      top = last.bottom - containerRect.top;
    } else {
      const before = items[index].getBoundingClientRect();
      top = before.top - containerRect.top;
    }
    setIndicatorTop(top);
    console.log('[DND] handleDragOver', { droppableId, index, indicatorTop: top });
  }, [isDropDisabled, currentDrag.draggingId, direction, droppableId, setOver]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (isDropDisabled) return;
    if (!currentDrag.draggingId) return;
    e.preventDefault();
    e.stopPropagation();
    try { e.dataTransfer.dropEffect = 'move'; } catch {}
    const container = ref.current as HTMLElement | null;
    if (!container) return;
    const index = computeIndexFromPointer(container, e.clientX, e.clientY, direction);
    setOver(droppableId, index);
    console.log('[DND] handleDragEnter', { droppableId, index });
  }, [isDropDisabled, currentDrag.draggingId, direction, droppableId, setOver]);

  const computeIndexFromPointer = useCallback((container: HTMLElement, clientX: number, clientY: number, axis: 'vertical' | 'horizontal') => {
    const items = Array.from(container.querySelectorAll('[data-draggable-index]')) as HTMLElement[];
    if (items.length === 0) return 0;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      const mid = axis === 'vertical' ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const pointer = axis === 'vertical' ? clientY : clientX;
      if (pointer < mid) return i;
    }
    return items.length; // append
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (isDropDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    // Ignore drops into droppables that are inside the currently dragged element
    try {
      const dragEl = document.querySelector(`[data-draggable-id="${currentDrag.draggingId}"]`) as HTMLElement | null;
      if (dragEl && ref.current && dragEl.contains(ref.current)) {
        setOver(null, -1);
        setIndicatorTop(null);
        console.log('[DND] handleDrop ignored (droppable is inside dragged element)', { droppableId });
        return;
      }
    } catch {}
    const container = ref.current as HTMLElement | null;
    if (!container) return onDragEnd(null);
    const index = computeIndexFromPointer(container, e.clientX, e.clientY, direction);
    console.log('[DND] handleDrop commit', { droppableId, index });
    onDragEnd({ droppableId, index });
    setOver(null, -1);
    setIndicatorTop(null);
  }, [isDropDisabled, direction, computeIndexFromPointer, droppableId, onDragEnd, setOver, currentDrag.draggingId]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    // Do not clear over state here to preserve last known destination for fallback
    setIndicatorTop(null);
    console.log('[DND] handleDragLeave', { droppableId });
  }, []);

  const provided = {
    innerRef: (el: HTMLElement | null) => { ref.current = el; },
    droppableProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDrop: handleDrop,
      onDragLeave: handleDragLeave,
      'data-droppable-id': droppableId,
      style: { position: 'relative' },
    } as React.HTMLAttributes<HTMLElement>,
    placeholder: (indicatorTop != null && !isDropDisabled && currentDrag.draggingId)
      ? (
        (() => {
          const slot = 12; // visual drop slot height
          const translateY = (indicatorTop as number) - slot / 2; // center around boundary
          return (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: slot,
                background: 'rgba(59,130,246,0.12)',
                border: '2px solid #3b82f6',
                boxShadow: '0 0 0 2px rgba(59,130,246,0.15) inset',
                borderRadius: 6,
                transform: `translateY(${translateY}px)`,
                pointerEvents: 'none',
              }}
            />
          );
        })()
      ) : null,
  };

  const snapshot = { isDraggingOver: isDraggingOver(droppableId), overIndex: getOverIndex(droppableId) };

  return (
    <DroppableIdContext.Provider value={droppableId}>
      {children(provided, snapshot)}
    </DroppableIdContext.Provider>
  );
}

// Draggable
type DraggableProps = {
  draggableId: string;
  index: number;
  children: (provided: {
    innerRef: (el: HTMLElement | null) => void;
    draggableProps: React.HTMLAttributes<HTMLElement> & { draggable: true } & { 'data-draggable-index': number };
    dragHandleProps: React.HTMLAttributes<HTMLElement> & { draggable: true };
  }, snapshot: { isDragging: boolean }) => React.ReactNode;
};

export function Draggable({ draggableId, index, children }: DraggableProps) {
  const droppableId = useContext(DroppableIdContext);
  const { onDragStart, onDragEnd, getOver, wasDropCommitted, clearDropCommitted } = useContext(DndContext);
  const ref = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!droppableId) return;
    // If another drag is active, ignore
    // We cannot read dragState here directly, so rely on dataTransfer: still stop propagation
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', draggableId);
    // Use a custom type to avoid interference
    try { e.dataTransfer.setData('application/x-nextpress-dnd', JSON.stringify({ draggableId })); } catch {}
    onDragStart(draggableId, droppableId, index);
    setIsDragging(true);
    console.log('[DND] draggable onDragStart', { draggableId, droppableId, index });
  }, [draggableId, droppableId, index, onDragStart]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setIsDragging(false);
    e.stopPropagation();
    // If a drop was already committed by a droppable, do not emit cancel
    if (wasDropCommitted()) {
      clearDropCommitted();
      console.log('[DND] draggable onDragEnd (drop already committed by droppable)');
      return;
    }
    const over = getOver();
    if (over.id != null && over.index >= 0) {
      console.log('[DND] draggable onDragEnd synthesizing drop', over);
      onDragEnd({ droppableId: over.id, index: over.index });
    } else {
      // Fallback: detect droppable under pointer and compute index
      let clientX = 0, clientY = 0;
      try {
        clientX = (e as any).clientX ?? 0;
        clientY = (e as any).clientY ?? 0;
      } catch {}
      let target = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      let container: HTMLElement | null = null;
      while (target) {
        const id = target.getAttribute('data-droppable-id');
        if (id) { container = target as HTMLElement; break; }
        target = target.parentElement;
      }
      if (container) {
        const droppableIdAttr = container.getAttribute('data-droppable-id')!;
        const items = Array.from(container.querySelectorAll('[data-draggable-index]')) as HTMLElement[];
        let computedIndex = 0;
        if (items.length > 0) {
          // vertical heuristic
          const pointer = clientY;
          computedIndex = items.length;
          for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (pointer < mid) { computedIndex = i; break; }
          }
        }
        console.log('[DND] draggable onDragEnd fallback commit', { droppableId: droppableIdAttr, index: computedIndex });
        onDragEnd({ droppableId: droppableIdAttr, index: computedIndex });
      } else {
        console.log('[DND] draggable onDragEnd cancel (no over and no container)');
        onDragEnd(null);
      }
    }
  }, [onDragEnd, getOver, wasDropCommitted, clearDropCommitted]);

  const provided = {
    innerRef: (el: HTMLElement | null) => { ref.current = el; },
    draggableProps: {
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      'data-draggable-id': draggableId,
      'data-draggable-index': index,
    } as React.HTMLAttributes<HTMLElement> & { draggable: true } & { 'data-draggable-index': number },
    dragHandleProps: {
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      'data-draggable-id': draggableId,
    } as React.HTMLAttributes<HTMLElement> & { draggable: true },
  };

  const snapshot = { isDragging };

  return children(provided, snapshot);
}

export default {
  DragDropContext,
  Droppable,
  Draggable,
};


