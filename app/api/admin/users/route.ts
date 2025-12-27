// In app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';

// Add this GET handler
export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query<RowDataPacket[]>(`
      SELECT id, name, email, is_admin as isAdmin, is_approved as isApproved, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// Your existing POST handler remains the same
export async function POST(request: Request) {
  // ... existing POST implementation ...
}