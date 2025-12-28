// app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  let connection;
  try {
    // Get the ID from the context params
    const { id } = await Promise.resolve(context.params);
    const userId = parseInt(id, 10);
    
    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Get the user data before deletion
      const [users] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];
      
      // 2. Insert into deleted_users table
      await connection.query(
        `INSERT INTO deleted_users 
         (user_id, name, email, deleted_by, original_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          // Get the admin ID from the request headers or session
          request.headers.get('x-user-id') || null,
          JSON.stringify(user) // Store the complete user data
        ]
      );

      // 3. Delete from users table
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