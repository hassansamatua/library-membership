// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: PoolConnection | null = null;
  
  try {
    const { id } = params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('token')?.value;
    const token = authToken || cookieToken;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [users] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];
      
      await connection.query(
        `INSERT INTO deleted_users 
         (user_id, name, email, deleted_by, original_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          request.headers.get('x-user-id') || null,
          JSON.stringify(user)
        ]
      );

      const [result] = await connection.query<ResultSetHeader>(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Failed to delete user');
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}