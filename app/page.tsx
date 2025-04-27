'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();

  const [whiteboards, setWhiteboards] = useState([]) as any[];
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/whiteboard', { method: 'POST' });
    const data = await res.json();
    router.push(`/whiteboard/${data.id}`);
  };

  useEffect(() => {
  const fetchWhiteboards = async () => {
    const res = await fetch('/api/whiteboard');
    const data = await res.json();
    setWhiteboards(data);
    console.log(data);
  };
    fetchWhiteboards();
  }, []);


  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800">
      <h1 className="text-4xl font-bold mb-8">🧑‍🎨 Whiteboard App</h1>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create New Whiteboard'}
      </button>
      {
        // Render the whiteboards
        whiteboards.map((whiteboard: any) => (
          <a
            key={whiteboard.id}
            href={`/whiteboard/${whiteboard.id}`}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {whiteboard.title}
          </a>
        ))
      }
    </main>
  );
}
