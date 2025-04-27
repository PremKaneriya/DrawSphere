// app/whiteboard/[id]/page.tsx
import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import { WhiteboardData } from '@/types/whiteboard';

async function getWhiteboard(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whiteboard/${id}`, {
    method: 'GET',
    cache: 'no-store',
  }
  );
  if (!res.ok) throw new Error('Failed to load whiteboard');
  return res.json();
}

export default async function WhiteboardPage({ params }: { params: { id: string } }) {
  const whiteboard = await getWhiteboard(params.id);

  return (
    <div className="w-screen h-screen overflow-hidden">
      <WhiteboardCanvas initialData={whiteboard.data as WhiteboardData} whiteboardId={whiteboard.id} />
    </div>
  );
}
