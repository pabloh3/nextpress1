import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { DragDropContext, Droppable, Draggable } from '@/lib/dnd'

// Minimal block component for testing drag behavior
const TestItem = ({ id }: { id: string }) => (
  <Draggable draggableId={id} index={0}>
    {(provided) => (
      <div
        data-testid={`draggable-${id}`}
        ref={provided.innerRef as any}
        {...provided.draggableProps}
        {...(provided.dragHandleProps || {})}
        style={{ width: 80, height: 24, background: '#eee' }}
      >
        Item {id}
      </div>
    )}
  </Draggable>
)

const Canvas = ({ children }: { children: React.ReactNode }) => (
  <Droppable droppableId="canvas">
    {(provided) => (
      <div
        ref={provided.innerRef as any}
        {...provided.droppableProps}
        style={{ padding: 8 }}
      >
        {children}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
)

/**
 * Utility: simulate a basic mouse drag sequence (mousedown + mousemove + mouseup)
 */
function simulateMouseDrag(target: HTMLElement) {
  fireEvent.mouseDown(target, { clientX: 10, clientY: 10 })
  // Move a little to trigger listeners
  fireEvent.mouseMove(document, { clientX: 14, clientY: 16 })
  fireEvent.mouseUp(document, { clientX: 20, clientY: 24 })
}

/**
 * Utility: simulate a basic touch drag sequence (touchstart + touchmove + touchend)
 */
function simulateTouchDrag(target: HTMLElement) {
  const touchInit = { touches: [{ clientX: 5, clientY: 5 }] } as any
  fireEvent.touchStart(target, touchInit)
  fireEvent.touchMove(document, { touches: [{ clientX: 12, clientY: 14 }] } as any)
  fireEvent.touchEnd(document, { changedTouches: [{ clientX: 18, clientY: 22 }] } as any)
}

describe('DragDropContext body class toggle', () => {
  it('adds and removes npb-dragging on mouse drag', () => {
    const { getByTestId } = render(
      <DragDropContext onDragEnd={() => {}}>
        <Canvas>
          <TestItem id="a" />
        </Canvas>
      </DragDropContext>
    )

    const draggable = getByTestId('draggable-a')
    expect(document.body.classList.contains('npb-dragging')).toBe(false)

    simulateMouseDrag(draggable)

    // After drag end, class should be removed
    expect(document.body.classList.contains('npb-dragging')).toBe(false)
  })

  it('adds and removes npb-dragging on touch drag', () => {
    const { getByTestId } = render(
      <DragDropContext onDragEnd={() => {}}>
        <Canvas>
          <TestItem id="b" />
        </Canvas>
      </DragDropContext>
    )

    const draggable = getByTestId('draggable-b')
    expect(document.body.classList.contains('npb-dragging')).toBe(false)

    simulateTouchDrag(draggable)

    // After drag end, class should be removed
    expect(document.body.classList.contains('npb-dragging')).toBe(false)
  })

  it('class is present during active drag (mouse)', () => {
    const { getByTestId } = render(
      <DragDropContext onDragEnd={() => {}}>
        <Canvas>
          <TestItem id="c" />
        </Canvas>
      </DragDropContext>
    )
    const draggable = getByTestId('draggable-c')
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 3, clientY: 4 })
    draggable.dispatchEvent(mousedown)
    expect(document.body.classList.contains('npb-dragging')).toBe(true)
    const mouseup = new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 6, clientY: 8 })
    document.dispatchEvent(mouseup)
    expect(document.body.classList.contains('npb-dragging')).toBe(false)
  })
})
