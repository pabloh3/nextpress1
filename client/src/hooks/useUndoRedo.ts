import { useState } from 'react';

/**
 * Hook for managing undo/redo functionality with state history.
 * Tracks a history of states and allows navigation between them.
 * 
 * @param initialState - The initial state value
 * @returns Object with current state, pushState, undo, redo functions, and availability flags
 */
export function useUndoRedo<T>(initialState: T) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentState = history[currentIndex];
  
  /**
   * Adds a new state to the history.
   * Removes any states after current index (when undoing then making new change).
   * Limits history to 50 states to prevent memory issues.
   */
  const pushState = (newState: T) => {
    setHistory(prevHistory => {
      // Remove any states after current index (when undoing then making new change)
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  };
  
  /**
   * Moves to the previous state in history (undo).
   */
  const undo = () => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  };
  
  /**
   * Moves to the next state in history (redo).
   */
  const redo = () => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  return { currentState, pushState, undo, redo, canUndo, canRedo };
}

