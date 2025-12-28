// app/api/admin/deleted-users/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [users] = await connection.query(`
      SELECT du.*, u.name as deleted_by_name 
      FROM deleted_users du
      LEFT JOIN users u ON du.deleted_by = u.id
      ORDER BY du.deleted_at DESC
    `);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching deleted users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch deleted users' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}