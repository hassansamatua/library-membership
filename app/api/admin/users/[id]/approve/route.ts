// app/api/users/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  return handleApproveUser(resolvedParams.id);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  return handleApproveUser(resolvedParams.id);
}

async function handleApproveUser(userId: string) {
  try {
    console.log('Received request with user ID:', userId);
    console.log('User ID from params:', userId);
    
    // Validate user ID
    if (!userId || isNaN(Number(userId))) {
      console.error('Invalid user ID:', userId);
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // First, check if user exists
      const [users] = await connection.query(
        'SELECT id, is_approved FROM users WHERE id = ?',
        [userId]
      );

      if (!users || users.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];

      // If already approved, return success
      if (user.is_approved) {
        return NextResponse.json({
          success: true,
          message: 'User is already approved',
          user: {
            id: user.id,
            isApproved: true
          }
        });
      }

      // Update user approval status
      await connection.query(
        'UPDATE users SET is_approved = TRUE, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      // Get updated user data
      const [updatedUsers] = await connection.query(
        'SELECT id, name, email, is_approved as isApproved FROM users WHERE id = ?',
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: 'User approved successfully',
        user: updatedUsers[0]
      });

    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Database error' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}