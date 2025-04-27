// app/api/whiteboard/[id]/route.ts
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const result = await db.query('SELECT * FROM whiteboards WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}
