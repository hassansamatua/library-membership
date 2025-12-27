// app/api/admin/users/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  is_approved: boolean;
  created_at: Date;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    // Get the ID from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // The ID should be the segment before 'approve'
    const approveIndex = pathSegments.indexOf('approve');
    let id = null;
    
    if (approveIndex > 0) {
      id = pathSegments[approveIndex - 1];
    }

    if (!id) {
      throw new Error('User ID is required');
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new Error(`Invalid user ID: ${id}`);
    }

    console.log('Approving user ID:', userId);

    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Update the user's approval status
    await connection.query<ResultSetHeader>(
      'UPDATE users SET is_approved = TRUE WHERE id = ?',
      [userId]
    );

    // Fetch the updated user with proper typing
    const [users] = await connection.query<User[]>(
      'SELECT id, name, email, is_approved, created_at FROM users WHERE id = ?',
      [userId]
    );

    const updatedUser = users[0];
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return NextResponse.json({ 
  success: true,
  message: 'User approved successfully',
  user: {
    ...updatedUser,
    isApproved: updatedUser.is_approved // Add this line
  }
});

  } catch (error) {
    console.error('Failed to approve user:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}