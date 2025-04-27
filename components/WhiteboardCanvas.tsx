'use client';

import { useEffect, useRef, useState } from 'react';
import { WhiteboardData } from '@/types/whiteboard';
import Toolbar from './Toolbar';
import CustomCursor from './CustomCursor';

// Define object types with common properties
type BaseObject = {
  id: string;
  type: string;
  color: string;
  lineWidth: number;
};

type PathObject = BaseObject & {
  type: 'path';
  points: [number, number][];
};

type LineObject = BaseObject & {
  type: 'line';
  start: [number, number];
  end: [number, number];
};

type CircleObject = BaseObject & {
  type: 'circle';
  start: [number, number];
  end: [number, number];
};

type RectangleObject = BaseObject & {
  type: 'rectangle';
  start: [number, number];
  end: [number, number];
};

type TextObject = BaseObject & {
  type: 'text';
  position: [number, number];
  text: string;
  fontSize: number;
  fontFamily: string;
};

type WhiteboardObject = PathObject | LineObject | CircleObject | RectangleObject | TextObject;

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
  
  // Selection and resize state
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<[number, number]>([0, 0]);
  const [showTextControls, setShowTextControls] = useState(false);

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

  // Effect to control text controls visibility
  useEffect(() => {
    if (selectedObjectId) {
      const selectedObj = data.objects.find((obj: any) => obj.id === selectedObjectId);
      if (selectedObj && selectedObj.type === 'text') {
        setShowTextControls(true);
      } else {
        setShowTextControls(false);
      }
    } else {
      setShowTextControls(false);
    }
  }, [selectedObjectId, data.objects]);

  // Helper to get object bounds
  const getObjectBounds = (obj: any) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    if (obj.type === 'path' && obj.points) {
      obj.points.forEach(([x, y]: [number, number]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    } else if (obj.type === 'line' && obj.start && obj.end) {
      minX = Math.min(obj.start[0], obj.end[0]);
      minY = Math.min(obj.start[1], obj.end[1]);
      maxX = Math.max(obj.start[0], obj.end[0]);
      maxY = Math.max(obj.start[1], obj.end[1]);
    } else if (obj.type === 'circle' && obj.start && obj.end) {
      const radius = Math.hypot(obj.end[0] - obj.start[0], obj.end[1] - obj.start[1]);
      minX = obj.start[0] - radius;
      minY = obj.start[1] - radius;
      maxX = obj.start[0] + radius;
      maxY = obj.start[1] + radius;
    } else if (obj.type === 'rectangle' && obj.start && obj.end) {
      minX = Math.min(obj.start[0], obj.end[0]);
      minY = Math.min(obj.start[1], obj.end[1]);
      maxX = Math.max(obj.start[0], obj.end[0]);
      maxY = Math.max(obj.start[1], obj.end[1]);
    } else if (obj.type === 'text' && obj.position) {
      const ctx = ctxRef.current;
      if (ctx) {
        ctx.font = `${obj.fontSize || 20}px ${obj.fontFamily || 'Inter, sans-serif'}`;
        const metrics = ctx.measureText(obj.text);
        minX = obj.position[0];
        minY = obj.position[1] - (obj.fontSize || 20);
        maxX = obj.position[0] + metrics.width;
        maxY = obj.position[1];
      } else {
        // Fallback if context is not available
        minX = obj.position[0];
        minY = obj.position[1] - (obj.fontSize || 20);
        maxX = obj.position[0] + (obj.text.length * (obj.fontSize || 20) * 0.6);
        maxY = obj.position[1];
      }
    }
    
    return { minX, minY, maxX, maxY };
  };
  
  // Function to check if a point is inside object bounds
  const isPointInObject = (x: number, y: number, obj: any) => {
    const bounds = getObjectBounds(obj);
    const padding = 10; // Make the hit area a bit larger
    
    return (
      x >= bounds.minX - padding &&
      x <= bounds.maxX + padding &&
      y >= bounds.minY - padding &&
      y <= bounds.maxY + padding
    );
  };
  
  // Helper to get resize handle position
  const getResizeHandles = (obj: any) => {
    const bounds = getObjectBounds(obj);
    const handles = {
      tl: [bounds.minX, bounds.minY],
      tr: [bounds.maxX, bounds.minY],
      bl: [bounds.minX, bounds.maxY],
      br: [bounds.maxX, bounds.maxY]
    };
    return handles;
  };
  
  // Check if a point is on a resize handle
  const getResizeHandleAtPoint = (x: number, y: number, obj: any) => {
    const handles = getResizeHandles(obj);
    const handleSize = 10;
    
    for (const [handleName, [hx, hy]] of Object.entries(handles)) {
      if (
        x >= hx - handleSize / 2 &&
        x <= hx + handleSize / 2 &&
        y >= hy - handleSize / 2 &&
        y <= hy + handleSize / 2
      ) {
        return handleName;
      }
    }
    
    return null;
  };

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
      const isSelected = obj.id === selectedObjectId;
      
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
      
      // Draw selection and resize handles if object is selected
      if (isSelected) {
        const bounds = getObjectBounds(obj);
        
        // Draw selection box
        ctx.strokeStyle = '#4f90f2';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(
          bounds.minX - 5, 
          bounds.minY - 5, 
          bounds.maxX - bounds.minX + 10, 
          bounds.maxY - bounds.minY + 10
        );
        ctx.setLineDash([]);
        
        // Draw resize handles
        const handles = getResizeHandles(obj);
        Object.values(handles).forEach(([hx, hy]) => {
          ctx.fillStyle = '#4f90f2';
          ctx.fillRect(hx - 5, hy - 5, 10, 10);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(hx - 5, hy - 5, 10, 10);
        });
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
    const pos = getPos(e);
    
    // If tool is 'select', handle selection instead of drawing
    if (tool === 'select') {
      const ctx = ctxRef.current;
      if (!ctx) return;
      
      // Check if clicking on a resize handle of selected object
      if (selectedObjectId) {
        const selectedObj = data.objects.find((obj: any) => obj.id === selectedObjectId);
        if (selectedObj) {
          const handle = getResizeHandleAtPoint(pos[0], pos[1], selectedObj);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            return;
          }
          
          // If clicking inside the selected object, prepare for dragging
          if (isPointInObject(pos[0], pos[1], selectedObj)) {
            setIsDragging(true);
            
            // Calculate offset from the object's reference point
            if (selectedObj.type === 'rectangle' || selectedObj.type === 'line' || selectedObj.type === 'circle') {
              setDragOffset([
                pos[0] - selectedObj.start[0],
                pos[1] - selectedObj.start[1]
              ]);
            } else if (selectedObj.type === 'text') {
              setDragOffset([
                pos[0] - selectedObj.position[0],
                pos[1] - selectedObj.position[1]
              ]);
            } else if (selectedObj.type === 'path' && selectedObj.points.length > 0) {
              const bounds = getObjectBounds(selectedObj);
              setDragOffset([
                pos[0] - bounds.minX,
                pos[1] - bounds.minY
              ]);
            }
            return;
          }
        }
      }
      
      // Try to select an object
      for (let i = data.objects.length - 1; i >= 0; i--) {
        const obj = data.objects[i];
        if (isPointInObject(pos[0], pos[1], obj)) {
          setSelectedObjectId(obj.id);
          return;
        }
      }
      
      // If clicked on empty space, deselect
      setSelectedObjectId(null);
      return;
    }
    
    setIsDrawing(true);
    // Deselect any currently selected object when starting to draw
    setSelectedObjectId(null);
    
    if (tool === 'pen' || tool === 'eraser') {
      setCurrentPath([pos]);
    } else {
      setStartPos(pos);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setCursorPosition(pos);
    
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    // Handle resizing
    if (isResizing && selectedObjectId) {
      const selectedIdx = data.objects.findIndex((obj: any) => obj.id === selectedObjectId);
      if (selectedIdx === -1) return;
      
      const obj = {...data.objects[selectedIdx]};
      
      // Handle resizing based on object type
      if ((obj.type === 'rectangle' || obj.type === 'line') && resizeHandle) {
        const newObjects = [...data.objects];
        
        // Different logic based on which handle is being dragged
        if (resizeHandle === 'br') {
          obj.end = [pos[0], pos[1]];
        } else if (resizeHandle === 'tr') {
          obj.end = [pos[0], obj.end[1]];
          obj.start = [obj.start[0], pos[1]];
        } else if (resizeHandle === 'bl') {
          obj.start = [pos[0], obj.start[1]];
          obj.end = [obj.end[0], pos[1]];
        } else if (resizeHandle === 'tl') {
          obj.start = [pos[0], pos[1]];
        }
        
        newObjects[selectedIdx] = obj;
        setData({...data, objects: newObjects});
        redrawCanvas();
        return;
      } else if (obj.type === 'circle' && resizeHandle) {
        const newObjects = [...data.objects];
        
        // For circle, we only adjust the end point (radius)
        if (resizeHandle) {
          const dx = pos[0] - obj.start[0];
          const dy = pos[1] - obj.start[1];
          const distance = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          
          obj.end = [
            obj.start[0] + distance * Math.cos(angle),
            obj.start[1] + distance * Math.sin(angle)
          ];
          
          newObjects[selectedIdx] = obj;
          setData({...data, objects: newObjects});
          redrawCanvas();
          return;
        }
      } else if (obj.type === 'text' && resizeHandle) {
        // For text, we'll adjust font size based on the drag distance
        const newObjects = [...data.objects];
        const bounds = getObjectBounds(obj);
        
        if (resizeHandle === 'br' || resizeHandle === 'tr') {
          // When dragging right handles, adjust font size based on horizontal movement
          const dragDistance = pos[0] - bounds.maxX;
          const scaleFactor = 0.1; // Controls how sensitive the resizing is
          
          // Calculate new font size with limits
          const newFontSize = Math.max(8, Math.min(100, obj.fontSize + dragDistance * scaleFactor));
          obj.fontSize = newFontSize;
          
          newObjects[selectedIdx] = obj;
          setData({...data, objects: newObjects});
          redrawCanvas();
        }
        return;
      }
      return;
    }
    
    // Handle dragging
    if (isDragging && selectedObjectId) {
      const selectedIdx = data.objects.findIndex((obj: any) => obj.id === selectedObjectId);
      if (selectedIdx === -1) return;
      
      const obj = {...data.objects[selectedIdx]};
      const newObjects = [...data.objects];
      
      if (obj.type === 'rectangle' || obj.type === 'line' || obj.type === 'circle') {
        // Calculate the width and height to maintain during dragging
        const width = obj.end[0] - obj.start[0];
        const height = obj.end[1] - obj.start[1];
        
        // Update position using the drag offset
        const newStartX = pos[0] - dragOffset[0];
        const newStartY = pos[1] - dragOffset[1];
        
        obj.start = [newStartX, newStartY];
        obj.end = [newStartX + width, newStartY + height];
      } else if (obj.type === 'text') {
        obj.position = [pos[0] - dragOffset[0], pos[1] - dragOffset[1]];
      } else if (obj.type === 'path' && obj.points.length > 0) {
        const bounds = getObjectBounds(obj);
        const dx = pos[0] - dragOffset[0] - bounds.minX;
        const dy = pos[1] - dragOffset[1] - bounds.minY;
        
        // Move all points by the calculated delta
        obj.points = obj.points.map(([x, y]: any) => [x + dx, y + dy]);
      }
      
      newObjects[selectedIdx] = obj;
      setData({...data, objects: newObjects});
      redrawCanvas();
      return;
    }
    
    if (!isDrawing) return;

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
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      await saveWhiteboard(data);
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setDragOffset([0, 0]);
      await saveWhiteboard(data);
      return;
    }
    
    if (!isDrawing) return;
    setIsDrawing(false);
    const pos = getPos(e);

    let newObject = null;

    if (tool === 'pen' || tool === 'eraser') {
      if (currentPath.length > 1) {
        newObject = {
          id: generateId(),
          type: 'path',
          points: currentPath,
          color: tool === 'eraser' ? '#121212' : color,
          lineWidth: cursorSize
        };
      }
    } else if (tool === 'line' && startPos) {
      newObject = {
        id: generateId(),
        type: 'line',
        start: startPos,
        end: pos,
        color,
        lineWidth: cursorSize
      };
    } else if (tool === 'circle' && startPos) {
      newObject = {
        id: generateId(),
        type: 'circle',
        start: startPos,
        end: pos,
        color,
        lineWidth: cursorSize
      };
    } else if (tool === 'rectangle' && startPos) {
      newObject = {
        id: generateId(),
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
          id: generateId(),
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
      // Set newly created object as selected
      setSelectedObjectId(newObject.id);
    }
    setCurrentPath([]);
    setStartPos(null);
  };
  
  // Helper to generate unique IDs
  const generateId = () => {
    return 'obj_' + Math.random().toString(36).substring(2, 11);
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

  // Function to handle text font size change
  const handleFontSizeChange = async (newSize: number) => {
    if (!selectedObjectId) return;
    
    const selectedIdx = data.objects.findIndex((obj: any) => obj.id === selectedObjectId);
    if (selectedIdx === -1 || data.objects[selectedIdx].type !== 'text') return;
    
    const newObjects = [...data.objects];
    newObjects[selectedIdx] = {
      ...newObjects[selectedIdx],
      fontSize: newSize
    };
    
    const newData = {
      ...data,
      objects: newObjects
    };
    
    setData(newData);
    await saveWhiteboard(newData);
  };

  // Function to handle text font family change
  const handleFontFamilyChange = async (newFontFamily: string) => {
    if (!selectedObjectId) return;
    
    const selectedIdx = data.objects.findIndex((obj: any) => obj.id === selectedObjectId);
    if (selectedIdx === -1 || data.objects[selectedIdx].type !== 'text') return;
    
    const newObjects = [...data.objects];
    newObjects[selectedIdx] = {
      ...newObjects[selectedIdx],
      fontFamily: newFontFamily
    };
    
    const newData = {
      ...data,
      objects: newObjects
    };
    
    setData(newData);
    await saveWhiteboard(newData);
  };

  // Function to get the current selected text object
  const getSelectedTextObject = () => {
    if (!selectedObjectId) return null;
    return data.objects.find((obj: any) => obj.id === selectedObjectId && obj.type === 'text');
  };

  // Function to handle text content change
  const handleTextChange = async (newText: string) => {
    if (!selectedObjectId) return;
    
    const selectedIdx = data.objects.findIndex((obj: any) => obj.id === selectedObjectId);
    if (selectedIdx === -1 || data.objects[selectedIdx].type !== 'text') return;
    
    const newObjects = [...data.objects];
    newObjects[selectedIdx] = {
      ...newObjects[selectedIdx],
      text: newText
    };
    
    const newData = {
      ...data,
      objects: newObjects
    };
    
    setData(newData);
    await saveWhiteboard(newData);
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