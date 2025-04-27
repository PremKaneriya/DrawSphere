'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    const res = await fetch('/api/whiteboard', { method: 'POST' });
    const data = await res.json();
    router.push(`/whiteboard/${data.id}`);
  };

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
    </main>
  );
}
