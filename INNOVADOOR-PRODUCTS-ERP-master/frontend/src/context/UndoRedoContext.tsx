import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface HistoryState {
  formData: any;
  items: any[];
  timestamp: number;
}

interface UndoRedoContextType {
  history: HistoryState[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  saveState: (formData: any, items: any[]) => void;
  undo: () => { formData: any; items: any[] } | null;
  redo: () => { formData: any; items: any[] } | null;
  clearHistory: () => void;
}

const UndoRedoContext = createContext<UndoRedoContextType | undefined>(undefined);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const saveState = useCallback((formData: any, items: any[]) => {
    const newState: HistoryState = {
      formData: JSON.parse(JSON.stringify(formData)),
      items: JSON.parse(JSON.stringify(items)),
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Remove any states after currentIndex (when user undid and then made new changes)
      const newHistory = prev.slice(0, currentIndex + 1);
      // Add new state
      newHistory.push(newState);
      // Limit history to last 50 states
      const limitedHistory = newHistory.slice(-50);
      setCurrentIndex(limitedHistory.length - 1);
      return limitedHistory;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      const state = history[newIndex];
      return {
        formData: JSON.parse(JSON.stringify(state.formData)),
        items: JSON.parse(JSON.stringify(state.items)),
      };
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      const state = history[newIndex];
      return {
        formData: JSON.parse(JSON.stringify(state.formData)),
        items: JSON.parse(JSON.stringify(state.items)),
      };
    }
    return null;
  }, [currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  return (
    <UndoRedoContext.Provider
      value={{
        history,
        currentIndex,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        saveState,
        undo,
        redo,
        clearHistory,
      }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
}

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (context === undefined) {
    throw new Error('useUndoRedo must be used within an UndoRedoProvider');
  }
  return context;
}

