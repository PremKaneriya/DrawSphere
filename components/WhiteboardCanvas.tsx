'use client';

import { useEffect, useRef, useState } from 'react';
import { WhiteboardData } from '@/types/whiteboard';
import Toolbar from './Toolbar';

type Props = {
  initialData: WhiteboardData;
  whiteboardId: string;
};

export default function WhiteboardCanvas({ initialData, whiteboardId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<WhiteboardData>(initialData);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<[number, number] | null>(null);
  const [currentPath, setCurrentPath] = useState<[number, number][]>([]);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#000000');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw(ctx);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [data]);

  const redraw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    data.objects.forEach((obj: any) => {
      if (obj.type === 'path' && obj.points) {
        ctx.strokeStyle = obj.color || 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        obj.points.forEach(([x, y]: [number, number], index: number) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (obj.type === 'line' && obj.start && obj.end) {
        ctx.strokeStyle = obj.color || 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.start[0], obj.start[1]);
        ctx.lineTo(obj.end[0], obj.end[1]);
        ctx.stroke();
      } else if (obj.type === 'circle' && obj.start && obj.end) {
        ctx.strokeStyle = obj.color || 'black';
        ctx.lineWidth = 2;
        const radius = Math.hypot(obj.end[0] - obj.start[0], obj.end[1] - obj.start[1]);
        ctx.beginPath();
        ctx.arc(obj.start[0], obj.start[1], radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (obj.type === 'text' && obj.position && obj.text) {
        ctx.fillStyle = obj.color || 'black';
        ctx.font = '20px sans-serif';
        ctx.fillText(obj.text, obj.position[0], obj.position[1]);
      }
    });
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
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      const strokeColor = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
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
          color: tool === 'eraser' ? '#FFFFFF' : color,
        };
      }
    } else if (tool === 'line' && startPos) {
      newObject = {
        type: 'line',
        start: startPos,
        end: pos,
        color,
      };
    } else if (tool === 'circle' && startPos) {
      newObject = {
        type: 'circle',
        start: startPos,
        end: pos,
        color,
      };
    } else if (tool === 'text') {
      const userText = prompt('Enter text:');
      if (userText) {
        newObject = {
          type: 'text',
          position: pos,
          text: userText,
          color,
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
    }
    setCurrentPath([]);
    setStartPos(null);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const saveWhiteboard = async (updatedData: WhiteboardData) => {
    await fetch(`/api/whiteboard/${whiteboardId}/save`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: updatedData }),
    });
  };

  return (
    <>
      <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor} />
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
      />
    </>
  );
}
