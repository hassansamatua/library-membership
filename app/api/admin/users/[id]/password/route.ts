import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    console.log('Received password update request for user ID:', userId);
    
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    console.log('Auth token present:', !!token);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token and check if user is admin
    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { password } = await request.json();
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in database
    const userIdNum = parseInt(userId, 10);
    console.log('Parsed user ID:', userIdNum);
    
    if (isNaN(userIdNum)) {
      console.error('Invalid user ID format:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    console.log('Executing database query...');
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userIdNum]
    );
    console.log('Database query result:', result);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
