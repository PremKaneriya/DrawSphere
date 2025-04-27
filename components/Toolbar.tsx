'use client';

import { useState } from 'react';

type ToolbarProps = {
  tool: string;
  setTool: (tool: string) => void;
  color: string;
  setColor: (color: string) => void;
};

export default function Toolbar({ tool, setTool, color, setColor }: ToolbarProps) {
  const tools = ['pen', 'line', 'circle', 'text', 'eraser'];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-white border shadow p-2 rounded-lg z-50">
      {tools.map((t) => (
        <button
          key={t}
          onClick={() => setTool(t)}
          className={`px-3 py-1 rounded ${tool === t ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {t.toUpperCase()}
        </button>
      ))}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="w-10 h-10 p-0 border rounded"
      />
    </div>
  );
}
