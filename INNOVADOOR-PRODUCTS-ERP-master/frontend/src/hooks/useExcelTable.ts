import { useState, useCallback, useRef, useEffect } from 'react';

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export interface ActionHistory {
  type: 'edit' | 'paste' | 'delete' | 'fill';
  position: CellPosition | SelectionRange;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export interface UseExcelTableOptions {
  rows: number;
  cols: number;
  onCellChange?: (row: number, col: number, value: any) => void;
  getCellValue: (row: number, col: number) => any;
  setCellValue: (row: number, col: number, value: any) => void;
  isEditable?: (row: number, col: number) => boolean;
}

export function useExcelTable(options: UseExcelTableOptions) {
  const { rows, cols, onCellChange, getCellValue, setCellValue, isEditable } = options;
  
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>('');
  const [clipboard, setClipboard] = useState<any[][]>([]);
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellPosition | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  const isComposingRef = useRef(false);

  // Check if cell is editable
  const canEdit = useCallback((row: number, col: number): boolean => {
    if (isEditable) {
      return isEditable(row, col);
    }
    return true; // Default to editable
  }, [isEditable]);

  // Normalize selection range
  const normalizeRange = useCallback((range: SelectionRange): SelectionRange => {
    return {
      start: {
        row: Math.min(range.start.row, range.end.row),
        col: Math.min(range.start.col, range.end.col),
      },
      end: {
        row: Math.max(range.start.row, range.end.row),
        col: Math.max(range.start.col, range.end.col),
      },
    };
  }, []);

  // Check if position is in range
  const isInRange = useCallback((pos: CellPosition, range: SelectionRange): boolean => {
    const normalized = normalizeRange(range);
    return (
      pos.row >= normalized.start.row &&
      pos.row <= normalized.end.row &&
      pos.col >= normalized.start.col &&
      pos.col <= normalized.end.col
    );
  }, [normalizeRange]);

  // Get all cells in selection
  const getSelectedCells = useCallback((): CellPosition[] => {
    if (selectionRange) {
      const normalized = normalizeRange(selectionRange);
      const cells: CellPosition[] = [];
      for (let row = normalized.start.row; row <= normalized.end.row; row++) {
        for (let col = normalized.start.col; col <= normalized.end.col; col++) {
          cells.push({ row, col });
        }
      }
      return cells;
    } else if (selectedCell) {
      return [selectedCell];
    }
    return [];
  }, [selectedCell, selectionRange, normalizeRange]);

  // Move selection
  const moveSelection = useCallback((direction: 'up' | 'down' | 'left' | 'right', extend = false) => {
    if (!selectedCell) {
      setSelectedCell({ row: 0, col: 0 });
      return;
    }

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (direction) {
      case 'up':
        newRow = Math.max(0, selectedCell.row - 1);
        break;
      case 'down':
        newRow = Math.min(rows - 1, selectedCell.row + 1);
        break;
      case 'left':
        newCol = Math.max(0, selectedCell.col - 1);
        break;
      case 'right':
        newCol = Math.min(cols - 1, selectedCell.col + 1);
        break;
    }

    if (extend && selectedCell) {
      setSelectionRange({
        start: selectedCell,
        end: { row: newRow, col: newCol },
      });
    } else {
      setSelectedCell({ row: newRow, col: newCol });
      setSelectionRange(null);
    }
    setIsEditing(false);
  }, [selectedCell, rows, cols]);

  // Select cell
  const selectCell = useCallback((row: number, col: number, extend = false) => {
    const newPos = { row, col };
    
    if (extend && selectedCell) {
      setSelectionRange({
        start: selectedCell,
        end: newPos,
      });
    } else {
      setSelectedCell(newPos);
      setSelectionRange(null);
    }
    setIsEditing(false);
  }, [selectedCell]);

  // Start editing
  const startEditing = useCallback((row?: number, col?: number) => {
    const cell = row !== undefined && col !== undefined 
      ? { row, col } 
      : selectedCell;
    
    if (!cell || !canEdit(cell.row, cell.col)) return;
    
    setSelectedCell(cell);
    setSelectionRange(null);
    setEditValue(getCellValue(cell.row, cell.col) || '');
    setIsEditing(true);
  }, [selectedCell, canEdit, getCellValue]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  // Save edit
  const saveEdit = useCallback(() => {
    if (!selectedCell || !isEditing) return;
    
    const oldValue = getCellValue(selectedCell.row, selectedCell.col);
    const newValue = editValue;
    
    if (oldValue !== newValue) {
      // Add to history
      const action: ActionHistory = {
        type: 'edit',
        position: selectedCell,
        oldValue,
        newValue,
        timestamp: Date.now(),
      };
      
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(action);
        return newHistory.slice(-100); // Keep last 100 actions
      });
      setHistoryIndex(prev => Math.min(prev + 1, 99));
      
      setCellValue(selectedCell.row, selectedCell.col, newValue);
      onCellChange?.(selectedCell.row, selectedCell.col, newValue);
    }
    
    setIsEditing(false);
    setEditValue('');
  }, [selectedCell, isEditing, editValue, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async () => {
    const cells = getSelectedCells();
    if (cells.length === 0) return;

    if (cells.length === 1) {
      const cell = cells[0];
      const value = getCellValue(cell.row, cell.col);
      await navigator.clipboard.writeText(String(value || ''));
      setClipboard([[value]]);
    } else {
      const normalized = selectionRange ? normalizeRange(selectionRange) : null;
      if (!normalized) return;
      
      const data: any[][] = [];
      for (let row = normalized.start.row; row <= normalized.end.row; row++) {
        const rowData: any[] = [];
        for (let col = normalized.start.col; col <= normalized.end.col; col++) {
          rowData.push(getCellValue(row, col));
        }
        data.push(rowData);
      }
      
      // Copy as tab-separated text
      const text = data.map(row => row.map(cell => String(cell || '')).join('\t')).join('\n');
      await navigator.clipboard.writeText(text);
      setClipboard(data);
    }
  }, [getSelectedCells, getCellValue, selectionRange, normalizeRange]);

  // Cut to clipboard
  const cutToClipboard = useCallback(async () => {
    await copyToClipboard();
    // Delete selected cells
    const cells = getSelectedCells();
    const actions: ActionHistory[] = [];
    
    cells.forEach(cell => {
      const oldValue = getCellValue(cell.row, cell.col);
      actions.push({
        type: 'delete',
        position: cell,
        oldValue,
        newValue: null,
        timestamp: Date.now(),
      });
      setCellValue(cell.row, cell.col, '');
      onCellChange?.(cell.row, cell.col, '');
    });
    
    if (actions.length > 0) {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(...actions);
        return newHistory.slice(-100);
      });
      setHistoryIndex(prev => Math.min(prev + actions.length, 99));
    }
  }, [copyToClipboard, getSelectedCells, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Paste from clipboard
  const pasteFromClipboard = useCallback(async () => {
    if (clipboard.length === 0) {
      // Try to read from system clipboard
      try {
        const text = await navigator.clipboard.readText();
        const lines = text.split('\n');
        const data = lines.map(line => line.split('\t').map(cell => cell.trim()));
        setClipboard(data);
        // Continue with paste logic below
      } catch (err) {
        console.error('Failed to read clipboard:', err);
        return;
      }
    }

    if (clipboard.length === 0) return;
    
    const cells = getSelectedCells();
    if (cells.length === 0) return;

    const startCell = cells[0];
    const actions: ActionHistory[] = [];

    clipboard.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        const targetRow = startCell.row + rowIdx;
        const targetCol = startCell.col + colIdx;
        
        if (targetRow < rows && targetCol < cols && canEdit(targetRow, targetCol)) {
          const oldValue = getCellValue(targetRow, targetCol);
          actions.push({
            type: 'paste',
            position: { row: targetRow, col: targetCol },
            oldValue,
            newValue: value,
            timestamp: Date.now(),
          });
          setCellValue(targetRow, targetCol, value);
          onCellChange?.(targetRow, targetCol, value);
        }
      });
    });

    if (actions.length > 0) {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(...actions);
        return newHistory.slice(-100);
      });
      setHistoryIndex(prev => Math.min(prev + actions.length, 99));
    }
  }, [clipboard, getSelectedCells, rows, cols, canEdit, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Delete selected cells
  const deleteCells = useCallback(() => {
    const cells = getSelectedCells();
    if (cells.length === 0) return;

    const actions: ActionHistory[] = [];
    cells.forEach(cell => {
      if (canEdit(cell.row, cell.col)) {
        const oldValue = getCellValue(cell.row, cell.col);
        actions.push({
          type: 'delete',
          position: cell,
          oldValue,
          newValue: null,
          timestamp: Date.now(),
        });
        setCellValue(cell.row, cell.col, '');
        onCellChange?.(cell.row, cell.col, '');
      }
    });

    if (actions.length > 0) {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(...actions);
        return newHistory.slice(-100);
      });
      setHistoryIndex(prev => Math.min(prev + actions.length, 99));
    }
  }, [getSelectedCells, canEdit, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Fill down
  const fillDown = useCallback(() => {
    if (!selectedCell) return;
    const cells = getSelectedCells();
    if (cells.length === 0) return;

    const normalized = selectionRange ? normalizeRange(selectionRange) : { start: selectedCell, end: selectedCell };
    const sourceRow = normalized.start.row;
    const actions: ActionHistory[] = [];

    for (let col = normalized.start.col; col <= normalized.end.col; col++) {
      const sourceValue = getCellValue(sourceRow, col);
      for (let row = normalized.start.row + 1; row <= normalized.end.row; row++) {
        if (canEdit(row, col)) {
          const oldValue = getCellValue(row, col);
          actions.push({
            type: 'fill',
            position: { row, col },
            oldValue,
            newValue: sourceValue,
            timestamp: Date.now(),
          });
          setCellValue(row, col, sourceValue);
          onCellChange?.(row, col, sourceValue);
        }
      }
    }

    if (actions.length > 0) {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(...actions);
        return newHistory.slice(-100);
      });
      setHistoryIndex(prev => Math.min(prev + actions.length, 99));
    }
  }, [selectedCell, getSelectedCells, selectionRange, normalizeRange, canEdit, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Fill right
  const fillRight = useCallback(() => {
    if (!selectedCell) return;
    const cells = getSelectedCells();
    if (cells.length === 0) return;

    const normalized = selectionRange ? normalizeRange(selectionRange) : { start: selectedCell, end: selectedCell };
    const sourceCol = normalized.start.col;
    const actions: ActionHistory[] = [];

    for (let row = normalized.start.row; row <= normalized.end.row; row++) {
      const sourceValue = getCellValue(row, sourceCol);
      for (let col = normalized.start.col + 1; col <= normalized.end.col; col++) {
        if (canEdit(row, col)) {
          const oldValue = getCellValue(row, col);
          actions.push({
            type: 'fill',
            position: { row, col },
            oldValue,
            newValue: sourceValue,
            timestamp: Date.now(),
          });
          setCellValue(row, col, sourceValue);
          onCellChange?.(row, col, sourceValue);
        }
      }
    }

    if (actions.length > 0) {
      setActionHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(...actions);
        return newHistory.slice(-100);
      });
      setHistoryIndex(prev => Math.min(prev + actions.length, 99));
    }
  }, [selectedCell, getSelectedCells, selectionRange, normalizeRange, canEdit, getCellValue, setCellValue, onCellChange, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const action = actionHistory[historyIndex];
    if (!action) return;

    if (action.type === 'edit' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.oldValue);
      onCellChange?.(action.position.row, action.position.col, action.oldValue);
    } else if (action.type === 'paste' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.oldValue);
      onCellChange?.(action.position.row, action.position.col, action.oldValue);
    } else if (action.type === 'delete' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.oldValue);
      onCellChange?.(action.position.row, action.position.col, action.oldValue);
    } else if (action.type === 'fill' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.oldValue);
      onCellChange?.(action.position.row, action.position.col, action.oldValue);
    }

    setHistoryIndex(prev => prev - 1);
  }, [historyIndex, actionHistory, setCellValue, onCellChange]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= actionHistory.length - 1) return;
    
    const action = actionHistory[historyIndex + 1];
    if (!action) return;

    if (action.type === 'edit' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.newValue);
      onCellChange?.(action.position.row, action.position.col, action.newValue);
    } else if (action.type === 'paste' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.newValue);
      onCellChange?.(action.position.row, action.position.col, action.newValue);
    } else if (action.type === 'delete' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.newValue);
      onCellChange?.(action.position.row, action.position.col, action.newValue);
    } else if (action.type === 'fill' && 'row' in action.position) {
      setCellValue(action.position.row, action.position.col, action.newValue);
      onCellChange?.(action.position.row, action.position.col, action.newValue);
    }

    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, actionHistory, setCellValue, onCellChange]);

  // Select all
  const selectAll = useCallback(() => {
    setSelectionRange({
      start: { row: 0, col: 0 },
      end: { row: rows - 1, col: cols - 1 },
    });
    setSelectedCell({ row: 0, col: 0 });
  }, [rows, cols]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if composing (IME input)
      if (isComposingRef.current) return;
      
      // Don't handle if not in table
      if (!tableRef.current?.contains(document.activeElement) && document.activeElement !== inputRef.current) {
        return;
      }

      // Handle Escape
      if (e.key === 'Escape') {
        if (isEditing) {
          cancelEditing();
        }
        return;
      }

      // Handle F2
      if (e.key === 'F2') {
        e.preventDefault();
        startEditing();
        return;
      }

      // Handle Ctrl combinations
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          copyToClipboard();
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          pasteFromClipboard();
          return;
        }
        if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          cutToClipboard();
          return;
        }
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          return;
        }
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
          return;
        }
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          selectAll();
          return;
        }
        if (e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          fillDown();
          return;
        }
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          fillRight();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          const cells = getSelectedCells();
          cells.forEach(cell => {
            setCellValue(cell.row, cell.col, editValue);
            onCellChange?.(cell.row, cell.col, editValue);
          });
          setIsEditing(false);
          return;
        }
      }

      // Handle navigation keys (only if not editing or in input)
      if (!isEditing || (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveSelection('up', e.shiftKey);
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveSelection('down', e.shiftKey);
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          moveSelection('left', e.shiftKey);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          moveSelection('right', e.shiftKey);
          return;
        }
        if (e.key === 'Tab') {
          if (!isEditing) {
            e.preventDefault();
            if (e.shiftKey) {
              moveSelection('left');
            } else {
              moveSelection('right');
            }
          }
          return;
        }
        if (e.key === 'Enter') {
          if (!isEditing) {
            e.preventDefault();
            moveSelection('down');
          } else {
            e.preventDefault();
            saveEdit();
            moveSelection('down');
          }
          return;
        }
        if (e.key === 'Home') {
          e.preventDefault();
          if (selectedCell) {
            selectCell(selectedCell.row, 0, e.ctrlKey);
          }
          return;
        }
        if (e.key === 'End') {
          e.preventDefault();
          if (selectedCell) {
            selectCell(selectedCell.row, cols - 1, e.ctrlKey);
          }
          return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (!isEditing) {
            e.preventDefault();
            deleteCells();
          }
          return;
        }
      }
    };

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = () => {
      isComposingRef.current = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('compositionstart', handleCompositionStart);
    document.addEventListener('compositionend', handleCompositionEnd);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('compositionstart', handleCompositionStart);
      document.removeEventListener('compositionend', handleCompositionEnd);
    };
  }, [
    isEditing,
    selectedCell,
    editValue,
    moveSelection,
    selectCell,
    startEditing,
    cancelEditing,
    saveEdit,
    copyToClipboard,
    pasteFromClipboard,
    cutToClipboard,
    undo,
    redo,
    selectAll,
    fillDown,
    fillRight,
    deleteCells,
    getSelectedCells,
    setCellValue,
    onCellChange,
    cols,
  ]);

  return {
    // State
    selectedCell,
    selectionRange,
    isEditing,
    editValue,
    setEditValue,
    isDragging,
    dragStart,
    
    // Refs
    tableRef,
    inputRef,
    isComposingRef,
    
    // Actions
    selectCell,
    startEditing,
    cancelEditing,
    saveEdit,
    moveSelection,
    copyToClipboard,
    pasteFromClipboard,
    cutToClipboard,
    deleteCells,
    fillDown,
    fillRight,
    undo,
    redo,
    selectAll,
    
    // Helpers
    getSelectedCells,
    isInRange,
    normalizeRange,
    canEdit,
    setIsDragging,
    setDragStart,
  };
}

