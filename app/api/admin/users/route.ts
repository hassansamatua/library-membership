import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    const [users] = await pool.query<import('@/lib/auth').User[]>(`
      SELECT id, name, email, is_approved, created_at 
      FROM users 
      WHERE is_admin = 0
      ORDER BY created_at DESC
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}