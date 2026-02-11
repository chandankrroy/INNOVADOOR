import { useUndoRedo } from '../context/UndoRedoContext';
import { Undo2, Redo2 } from 'lucide-react';

export default function UndoRedoButtons() {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  const handleUndo = () => {
    try {
      const state = undo();
      if (state) {
        // Trigger a custom event that CreateMeasurement components can listen to
        window.dispatchEvent(new CustomEvent('undo-redo-undo', { detail: state }));
      }
    } catch (error) {
      console.error('Undo error:', error);
    }
  };

  const handleRedo = () => {
    try {
      const state = redo();
      if (state) {
        // Trigger a custom event that CreateMeasurement components can listen to
        window.dispatchEvent(new CustomEvent('undo-redo-redo', { detail: state }));
      }
    } catch (error) {
      console.error('Redo error:', error);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-300">
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        className={`p-1.5 rounded-md transition-colors ${
          canUndo 
            ? 'text-gray-700 hover:bg-gray-200 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <div className="w-px h-6 bg-gray-300"></div>
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        className={`p-1.5 rounded-md transition-colors ${
          canRedo 
            ? 'text-gray-700 hover:bg-gray-200 cursor-pointer' 
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-5 h-5" />
      </button>
    </div>
  );
}

