// app/api/whiteboard/[id]/save/route.ts
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { data } = body; // expecting { data: {...} }

  await db.query('UPDATE whiteboards SET data = $1, updated_at = NOW() WHERE id = $2', [data, id]);
  return NextResponse.json({ success: true });
}
