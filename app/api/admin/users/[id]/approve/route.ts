import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { generateMembershipNumber } from '@/lib/membership';

interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  is_approved: boolean;
  membership_number: string | null;
  created_at: Date;
}

export async function PATCH(
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
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user exists
      const [users] = await connection.query<User[]>(
        'SELECT * FROM users WHERE id = ? FOR UPDATE',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];

      if (user.is_approved) {
        await connection.rollback();
        return NextResponse.json(
          { 
            message: 'User is already approved',
            membership_number: user.membership_number
          },
          { status: 400 }
        );
      }

      // Generate and assign membership number
      const membershipNumber = await generateMembershipNumber();
      
      // Update the user's approval status and set membership number
      await connection.query<ResultSetHeader>(
        'UPDATE users SET is_approved = TRUE, membership_number = ? WHERE id = ?',
        [membershipNumber, userId]
      );

      // Commit the transaction
      await connection.commit();

      // Send approval email with membership number
      try {
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-approval-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            membershipNumber: membershipNumber
          })
        });

        if (!emailResponse.ok) {
          console.error('Failed to send approval email');
        }
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          is_approved: true,
          membership_number: membershipNumber,
          created_at: user.created_at
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error in approve endpoint:', error);
    return NextResponse.json(
      { 
        message: error instanceof Error ? error.message : 'Internal server error',
        success: false 
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}