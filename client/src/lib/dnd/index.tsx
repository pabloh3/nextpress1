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
    if (dragState.draggingId) return;
    setDragState({ draggingId: draggableId, sourceDroppableId: droppableId, sourceIndex: index });
    try { onDragStart?.(); } catch (e) { console.warn('[DND] onDragStart callback errored:', e); }
  }, [onDragStart, dragState.draggingId]);

  const ctxOnDragEnd = useCallback((destination: DropLocation | null) => {
    const result: DropResult = {
      draggableId: dragState.draggingId || '',
      source: { droppableId: dragState.sourceDroppableId || 'unknown-source', index: dragState.sourceIndex ?? 0 },
      destination,
      reason: destination ? 'DROP' : 'CANCEL',
      mode: 'FLUID',
      type: 'DEFAULT',
      combine: null,
    };

    console.log('[DND] ctxOnDragEnd building result', result);

    setOverState({ id: null, index: -1 });
    setDragState({ draggingId: null, sourceDroppableId: null, sourceIndex: null });

    if (destination) committedRef.current = true;
    console.log('[DND] ctxOnDragEnd → onDragEnd(result)', result);
    try { onDragEnd(result); } catch (e) { console.warn('[DND] onDragEnd callback errored:', e); }
  }, [onDragEnd, dragState]);

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

// Droppable component
export interface DroppableProvided {
  innerRef: (element: HTMLElement | null) => void;
  droppableProps: {
    'data-rfd-droppable-id': string;
  };
  placeholder: React.ReactNode;
}

export interface DroppableStateSnapshot {
  isDraggingOver: boolean;
  draggingOverWith: string | null;
  draggingFromThisWith: string | null;
  isUsingPlaceholder: boolean;
}

export interface DroppableProps {
  droppableId: string;
  children: (provided: DroppableProvided, snapshot: DroppableStateSnapshot) => React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  isDropDisabled?: boolean;
  type?: string;
}

export function Droppable({ droppableId, children, direction = 'vertical', isDropDisabled = false }: DroppableProps) {
  const context = useContext(DndContext);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      context.registerDroppable(droppableId, elementRef.current);
    }
    return () => {
      context.registerDroppable(droppableId, null);
    };
  }, [droppableId, context]);

  const provided: DroppableProvided = {
    innerRef: (el: HTMLElement | null) => {
      elementRef.current = el;
      if (el) {
        context.registerDroppable(droppableId, el);
      }
    },
    droppableProps: {
      'data-rfd-droppable-id': droppableId,
    },
    placeholder: null,
  };

  const snapshot: DroppableStateSnapshot = {
    isDraggingOver: context.isDraggingOver(droppableId),
    draggingOverWith: context.isDraggingOver(droppableId) ? context.currentDrag.draggingId : null,
    draggingFromThisWith: context.currentDrag.sourceDroppableId === droppableId ? context.currentDrag.draggingId : null,
    isUsingPlaceholder: false,
  };

  return <>{children(provided, snapshot)}</>;
}

// Draggable component
export interface DraggableProvided {
  innerRef: (element: HTMLElement | null) => void;
  draggableProps: {
    'data-rfd-draggable-id': string;
    style?: React.CSSProperties;
    onMouseDown?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
  };
  dragHandleProps: {
    'data-rfd-drag-handle-draggable-id': string;
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
  } | null;
}

export interface DraggableStateSnapshot {
  isDragging: boolean;
  isDropAnimating: boolean;
  draggingOver: string | null;
  combineWith: string | null;
  combineTargetFor: string | null;
  mode: 'FLUID' | 'SNAP' | null;
}

export interface DraggableProps {
  draggableId: string;
  index: number;
  children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
  isDragDisabled?: boolean;
}

export function Draggable({ draggableId, index, children, isDragDisabled = false }: DraggableProps) {
  const context = useContext(DndContext);
  const elementRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const dragMetaRef = useRef<{ id: string; source: string; index: number } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (isDragDisabled) return;

    console.log('[DND] Draggable.handleDragStart', {
      draggableId,
      index,
      type: (e as any)?.type,
      target: (e.target as HTMLElement)?.tagName,
    });

    e.stopPropagation();
    if ((e as any)?.type === 'touchstart') {
      e.preventDefault();
    }
    setIsDragging(true);

    // Resolve source droppable
    let parent = elementRef.current?.parentElement;
    while (parent && !parent.hasAttribute('data-rfd-droppable-id')) {
      parent = parent.parentElement;
    }
    const sourceDroppableId = parent?.getAttribute('data-rfd-droppable-id') || 'unknown';
    dragMetaRef.current = { id: draggableId, source: sourceDroppableId, index };

    console.log('[DND] Draggable.start → parent droppable', { sourceDroppableId });
    context.onDragStart(draggableId, sourceDroppableId, index);

    const computeDroppableAtPoint = (clientX: number, clientY: number) => {
      const elementUnder = document.elementFromPoint(clientX, clientY);
      let droppableUnder = elementUnder as HTMLElement | null;
      while (droppableUnder && !droppableUnder.hasAttribute('data-rfd-droppable-id')) {
        droppableUnder = droppableUnder.parentElement as HTMLElement | null;
      }
      const underId = droppableUnder?.getAttribute('data-rfd-droppable-id') || null;
      return { droppableUnder, underId };
    };

    // Handle drag move
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if ('touches' in moveEvent) {
        (moveEvent as TouchEvent).preventDefault();
      }
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const { droppableUnder, underId } = computeDroppableAtPoint(clientX, clientY);
      console.log('[DND] move', { clientX, clientY, underId });

      if (underId && droppableUnder) {
        const draggables = Array.from(droppableUnder.querySelectorAll('[data-rfd-draggable-id]')) as HTMLElement[];
        let targetIndex = draggables.length;
        for (let i = 0; i < draggables.length; i++) {
          const rect = draggables[i].getBoundingClientRect();
          const middle = rect.top + rect.height / 2;
          if (clientY < middle) { targetIndex = i; break; }
        }
        console.log('[DND] setOver', { underId, targetIndex });
        context.setOver(underId, targetIndex);
      } else if (!underId) {
        console.log('[DND] move.null-droppable');
      }
    };

    // Handle drag end (recompute destination)
    const handleEnd = (endEvent: MouseEvent | TouchEvent) => {
      setIsDragging(false);

      let clientX: number;
      let clientY: number;
      if ('changedTouches' in endEvent && endEvent.changedTouches.length > 0) {
        clientX = endEvent.changedTouches[0].clientX;
        clientY = endEvent.changedTouches[0].clientY;
      } else if ('touches' in endEvent && endEvent.touches.length > 0) {
        clientX = endEvent.touches[0].clientX;
        clientY = endEvent.touches[0].clientY;
      } else {
        clientX = (endEvent as MouseEvent).clientX;
        clientY = (endEvent as MouseEvent).clientY;
      }

      const { droppableUnder, underId } = computeDroppableAtPoint(clientX, clientY);
      const storedOver = context.getOver();
      console.log('[DND] end.recompute', { clientX, clientY, underId, storedOver });

      let finalDestination: DropLocation | null = null;
      if (underId && droppableUnder) {
        const draggables = Array.from(droppableUnder.querySelectorAll('[data-rfd-draggable-id]')) as HTMLElement[];
        let targetIndex = draggables.length;
        for (let i = 0; i < draggables.length; i++) {
          const rect = draggables[i].getBoundingClientRect();
          const middle = rect.top + rect.height / 2;
          if (clientY < middle) { targetIndex = i; break; }
        }
        finalDestination = { droppableId: underId, index: targetIndex };
      } else if (storedOver.id && storedOver.index !== -1) {
        finalDestination = { droppableId: storedOver.id, index: storedOver.index };
      }

      if (!finalDestination && storedOver.id) {
        console.log('[DND] end.mismatch', { recomputed: underId, storedOver });
      }

      const meta = dragMetaRef.current;
      if (!meta) {
        console.warn('[DND] end.without-meta');
        context.onDragEnd(null);
      } else if (finalDestination) {
        console.log('[DND] end.finalDestination', finalDestination);
        context.onDragEnd(finalDestination);
      } else {
        console.log('[DND] end.cancel');
        context.onDragEnd(null);
      }

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd as any);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd as any);
      document.removeEventListener('touchcancel', handleEnd as any);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd as any);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd as any);
    document.addEventListener('touchcancel', handleEnd as any);
  }, [draggableId, index, isDragDisabled, context]);

  const provided: DraggableProvided = {
    innerRef: (el: HTMLElement | null) => {
      elementRef.current = el;
    },
    draggableProps: {
      'data-rfd-draggable-id': draggableId,
      style: isDragging ? { opacity: 0.5 } : undefined,
      onMouseDown: isDragDisabled ? undefined : handleDragStart,
      onTouchStart: isDragDisabled ? undefined : handleDragStart,
    },
    dragHandleProps: isDragDisabled ? null : {
      'data-rfd-drag-handle-draggable-id': draggableId,
      onMouseDown: handleDragStart,
      onTouchStart: handleDragStart,
    },
  };

  const snapshot: DraggableStateSnapshot = {
    isDragging,
    isDropAnimating: false,
    draggingOver: context.getOver().id,
    combineWith: null,
    combineTargetFor: null,
    mode: isDragging ? 'FLUID' : null,
  };

  return <>{children(provided, snapshot)}</>;
}

export default {
  DragDropContext,
  Droppable,
  Draggable,
};