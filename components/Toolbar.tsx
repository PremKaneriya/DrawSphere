'use client';

import { useState } from 'react';

const PRESET_COLORS = [
  '#ffffff', // White
  '#ff5252', // Red
  '#ff9100', // Orange
  '#ffeb3b', // Yellow
  '#4caf50', // Green
  '#2196f3', // Blue
  '#7c4dff', // Purple
  '#f48fb1', // Pink
];

type Props = {
  tool: string;
  setTool: (tool: string) => void;
  color: string;
  setColor: (color: string) => void;
  cursorSize: number;
  setCursorSize: (size: number) => void;
  onToggleGrid: () => void;
  isGridVisible: boolean;
  onClearCanvas: () => void;
  onUndo: () => void;
};

export default function Toolbar({
  tool,
  setTool,
  color,
  setColor,
  cursorSize,
  setCursorSize,
  onToggleGrid,
  isGridVisible,
  onClearCanvas,
  onUndo,
}: Props) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const tools = [
    { id: 'pen', icon: '✏️', tooltip: 'Pen' },
    { id: 'eraser', icon: '🧽', tooltip: 'Eraser' },
    { id: 'line', icon: '━', tooltip: 'Line' },
    { id: 'circle', icon: '⭕', tooltip: 'Circle' },
    { id: 'rectangle', icon: '⬜', tooltip: 'Rectangle' },
    { id: 'text', icon: 'T', tooltip: 'Text' },
  ];

  return (
    <div className="absolute top-4 left-4 flex flex-col space-y-4 z-40">
      {/* Main toolbar */}
      <div className="flex flex-col bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-2 space-y-2">
        {/* Tools */}
        <div className="flex flex-col space-y-2">
          {tools.map((t) => (
            <button
              key={t.id}
              className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                tool === t.id ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              onClick={() => setTool(t.id)}
              title={t.tooltip}
            >
              <span className="text-xl">{t.icon}</span>
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-gray-700 my-1" />

        {/* Color selector */}
        <div className="relative">
          <button
            className="w-10 h-10 rounded-md border-2 border-gray-700 overflow-hidden"
            style={{ backgroundColor: color }}
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Color Picker"
          />
          
          {showColorPicker && (
            <div className="absolute top-12 left-0 bg-gray-900 p-2 rounded-md border border-gray-700 shadow-lg grid grid-cols-4 gap-1 z-50">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-md border ${color === c ? 'border-white' : 'border-gray-700'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                    setShowColorPicker(false);
                  }}
                />
              ))}
              <div className="col-span-4 mt-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8"
                />
              </div>
            </div>
          )}
        </div>

        <div className="w-full h-px bg-gray-700 my-1" />

        {/* Cursor size */}
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xs text-gray-400">Size</span>
          <input
            type="range"
            min="1"
            max="20"
            value={cursorSize}
            onChange={(e) => setCursorSize(parseInt(e.target.value))}
            className="w-full accent-blue-500"
            title="Brush Size"
          />
          <span className="text-xs text-gray-300">{cursorSize}px</span>
        </div>
      </div>

      {/* Secondary toolbar for actions */}
      <div className="flex flex-col bg-gray-900 rounded-lg shadow-xl border border-gray-700 p-2 space-y-2">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
          onClick={onUndo}
          title="Undo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h12a6 6 0 0 1 0 12H9" />
            <path d="M3 12l4-4" />
            <path d="M3 12l4 4" />
          </svg>
        </button>
        
        <button
          className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700"
          onClick={onToggleGrid}
          title={isGridVisible ? "Hide Grid" : "Show Grid"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
          </svg>
        </button>
        
        <button
          className="w-10 h-10 flex items-center justify-center rounded-md bg-red-800 text-red-100 hover:bg-red-700"
          onClick={onClearCanvas}
          title="Clear Canvas"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>
      </div>
    </div>
  );
}