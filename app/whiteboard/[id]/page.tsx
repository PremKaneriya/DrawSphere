import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import { WhiteboardData } from '@/types/whiteboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collaborative Whiteboard',
  description: 'A real-time collaborative whiteboard application',
};

async function getWhiteboard(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/whiteboard/${id}`, {
      method: 'GET',
      cache: 'no-store',
    });
    
    if (!res.ok) throw new Error('Failed to load whiteboard');
    return res.json();
  } catch (error) {
    console.error('Error loading whiteboard:', error);
    // Return a default empty whiteboard structure
    return {
      id,
      data: {
        objects: []
      }
    };
  }
}

export default async function WhiteboardPage({ params }: { params: { id: string } }) {
  const whiteboard = await getWhiteboard(params.id);

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#121212]">
      <WhiteboardCanvas 
        initialData={whiteboard.data as WhiteboardData} 
        whiteboardId={whiteboard.id} 
      />
    </div>
  );
}