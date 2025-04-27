// app/api/whiteboard/route.ts
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST() {
  const id = uuidv4();
  await db.query('INSERT INTO whiteboards (id, title, data) VALUES ($1, $2, $3)', [id, 'Untitled', { objects: [] }]);
  return NextResponse.json({ id });
}
