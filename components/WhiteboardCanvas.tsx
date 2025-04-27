'use client';

import { useEffect, useRef, useState } from 'react';
import { WhiteboardData } from '@/types/whiteboard';
import Toolbar from './Toolbar';
import CustomCursor from './CustomCursor';

type Props = {
  initialData: WhiteboardData;
  whiteboardId: string;
};

export default function WhiteboardCanvas({ initialData, whiteboardId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<WhiteboardData>(initialData);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff'); // Default to white for dark theme
  const [cursorPosition, setCursorPosition] = useState<[number, number]>([0, 0]);
  const [cursorSize, setCursorSize] = useState(4);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [showControls, setShowControls] = useState(true);

  // Use a ref for context to avoid recreating it
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Store the context in a ref for reuse
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas(); // Use the function that has access to the latest state
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Add effect to redraw when data or grid visibility changes
  useEffect(() => {
    redrawCanvas();
  }, [data, isGridVisible]);

  // Define redrawCanvas function that uses the context ref
  const redrawCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // First draw the grid
    if (isGridVisible) {
      drawGrid(ctx);
    }

    // Then draw all objects
    data.objects.forEach((obj: any) => {
      if (obj.type === 'path' && obj.points) {
        ctx.strokeStyle = obj.color || '#ffffff';
        ctx.lineWidth = obj.lineWidth || 2;
        ctx.beginPath();
        obj.points.forEach(([x, y]: [number, number], index: number) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (obj.type === 'line' && obj.start && obj.end) {
        ctx.strokeStyle = obj.color || '#ffffff';
        ctx.lineWidth = obj.lineWidth || 2;
        ctx.beginPath();
        ctx.moveTo(obj.start[0], obj.start[1]);
        ctx.lineTo(obj.end[0], obj.end[1]);
        ctx.stroke();
      } else if (obj.type === 'circle' && obj.start && obj.end) {
        ctx.strokeStyle = obj.color || '#ffffff';
        ctx.lineWidth = obj.lineWidth || 2;
        const radius = Math.hypot(obj.end[0] - obj.start[0], obj.end[1] - obj.start[1]);
        ctx.beginPath();
        ctx.arc(obj.start[0], obj.start[1], radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (obj.type === 'rectangle' && obj.start && obj.end) {
        ctx.strokeStyle = obj.color || '#ffffff';
        ctx.lineWidth = obj.lineWidth || 2;
        const width = obj.end[0] - obj.start[0];
        const height = obj.end[1] - obj.start[1];
        ctx.beginPath();
        ctx.rect(obj.start[0], obj.start[1], width, height);
        ctx.stroke();
      } else if (obj.type === 'text' && obj.position && obj.text) {
        ctx.fillStyle = obj.color || '#ffffff';
        ctx.font = `${obj.fontSize || 20}px ${obj.fontFamily || 'Inter, sans-serif'}`;
        ctx.fillText(obj.text, obj.position[0], obj.position[1]);
      }
    });
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    if (!isGridVisible) return;
    
    const gridSize = 25;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    ctx.beginPath();
    ctx.strokeStyle = '#2a2a2a'; // Very dark gray for the grid
    ctx.lineWidth = 0.5;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getPos(e);
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPath([pos]);
    } else {
      setStartPos(pos);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setCursorPosition(pos);
    
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      const strokeColor = tool === 'eraser' ? '#121212' : color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = cursorSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      const last = currentPath[currentPath.length - 1];
      if (last) {
        ctx.moveTo(last[0], last[1]);
        ctx.lineTo(pos[0], pos[1]);
        ctx.stroke();
      }
      setCurrentPath((prev) => [...prev, pos]);
    } else if (tool === 'line' && startPos) {
      // Live preview for line
      redrawCanvas(); // Redraw everything first
      ctx.strokeStyle = color;
      ctx.lineWidth = cursorSize;
      ctx.beginPath();
      ctx.moveTo(startPos[0], startPos[1]);
      ctx.lineTo(pos[0], pos[1]);
      ctx.stroke();
    } else if (tool === 'circle' && startPos) {
      // Live preview for circle
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = cursorSize;
      const radius = Math.hypot(pos[0] - startPos[0], pos[1] - startPos[1]);
      ctx.beginPath();
      ctx.arc(startPos[0], startPos[1], radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (tool === 'rectangle' && startPos) {
      // Live preview for rectangle
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = cursorSize;
      const width = pos[0] - startPos[0];
      const height = pos[1] - startPos[1];
      ctx.beginPath();
      ctx.rect(startPos[0], startPos[1], width, height);
      ctx.stroke();
    }
  };

  const endDrawing = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);

    let newObject = null;

    if (tool === 'pen' || tool === 'eraser') {
      if (currentPath.length > 1) {
        newObject = {
          type: 'path',
          points: currentPath,
          color: tool === 'eraser' ? '#121212' : color,
          lineWidth: cursorSize
        };
      }
    } else if (tool === 'line' && startPos) {
      newObject = {
        type: 'line',
        start: startPos,
        end: pos,
        color,
        lineWidth: cursorSize
      };
    } else if (tool === 'circle' && startPos) {
      newObject = {
        type: 'circle',
        start: startPos,
        end: pos,
        color,
        lineWidth: cursorSize
      };
    } else if (tool === 'rectangle' && startPos) {
      newObject = {
        type: 'rectangle',
        start: startPos,
        end: pos,
        color,
        lineWidth: cursorSize
      };
    } else if (tool === 'text') {
      const userText = prompt('Enter text:');
      if (userText) {
        newObject = {
          type: 'text',
          position: pos,
          text: userText,
          color,
          fontSize: 20,
          fontFamily: 'Inter, sans-serif'
        };
      }
    }

    if (newObject) {
      const newData = {
        ...data,
        objects: [...data.objects, newObject],
      };
      setData(newData);
      await saveWhiteboard(newData);
      
      // No need to call redraw here as the useEffect will handle it
    }
    setCurrentPath([]);
    setStartPos(null);
  };

  const handleCursorMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const pos: [number, number] = [e.clientX - rect.left, e.clientY - rect.top];
    setCursorPosition(pos);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const saveWhiteboard = async (updatedData: WhiteboardData) => {
    try {
      await fetch(`/api/whiteboard/${whiteboardId}/save`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: updatedData }),
      });
    } catch (error) {
      console.error('Failed to save whiteboard:', error);
      // Could add a toast notification here
    }
  };

  const toggleGrid = () => {
    setIsGridVisible(!isGridVisible);
    // No need to manually redraw here since the useEffect will handle it
  };

  const clearCanvas = async () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      const newData = {
        ...data,
        objects: [],
      };
      setData(newData);
      await saveWhiteboard(newData);
      // No need to manually redraw here since the useEffect will handle it
    }
  };

  const handleUndo = async () => {
    if (data.objects.length > 0) {
      const newObjects = [...data.objects];
      newObjects.pop();
      const newData = {
        ...data,
        objects: newObjects,
      };
      setData(newData);
      await saveWhiteboard(newData);
      // No need to manually redraw here since the useEffect will handle it
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-[#121212] cursor-none"
      onMouseMove={handleCursorMove}
    >
      {showControls && (
        <Toolbar 
          tool={tool} 
          setTool={setTool} 
          color={color} 
          setColor={setColor} 
          cursorSize={cursorSize}
          setCursorSize={setCursorSize}
          onToggleGrid={toggleGrid}
          isGridVisible={isGridVisible}
          onClearCanvas={clearCanvas}
          onUndo={handleUndo}
        />
      )}
      
      {/* Toggle button for toolbar */}
      <button 
        className="absolute top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full focus:outline-none hover:bg-gray-700"
        onClick={toggleControls}
      >
        {showControls ? '✕' : '☰'}
      </button>
      
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
      
      <CustomCursor 
        position={cursorPosition}
        tool={tool}
        color={color}
        size={cursorSize}
      />
    </div>
  );
}