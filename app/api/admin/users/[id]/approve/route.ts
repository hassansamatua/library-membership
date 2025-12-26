import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [result] = await pool.query(
      'UPDATE users SET is_approved = TRUE WHERE id = ?',
      [params.id]
    );

    // Fetch the updated user to return
    const [user] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ 
      message: 'User approved successfully',
      user: user[0] // Return the updated user data
    });
  } catch (error) {
    console.error('Failed to approve user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}