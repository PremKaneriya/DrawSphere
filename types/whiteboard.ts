// types/whiteboard.ts
  export type WhiteboardObject = 
  | { type: 'path'; points: [number, number][]; color: string }
  | { type: 'line'; start: [number, number]; end: [number, number]; color: string }
  | { type: 'circle'; start: [number, number]; end: [number, number]; color: string }
  | { type: 'text'; position: [number, number]; text: string; color: string };

export type WhiteboardPage = {
  id: string; // unique id per page
  objects: WhiteboardObject[];
};

export type WhiteboardData = {
  objects: any;
  pages: WhiteboardPage[];
};
