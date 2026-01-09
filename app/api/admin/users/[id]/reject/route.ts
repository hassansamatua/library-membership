import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface User extends RowDataPacket {
  id: number;
  is_approved: boolean;
  name: string;
  email: string;
  membership_number?: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id;
    
    console.log('Rejecting user:', userId);
    
    // Get rejection reason from request body
    const body = await request.json().catch(() => ({}));
    const rejectionReason = body.reason || 'No specific reason provided';

    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('token')?.value;
    const token = authToken || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    if (!userId || isNaN(Number(userId))) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    try {
      const [rows] = await connection.query(
        `SELECT u.id, u.is_approved, u.name, u.email, up.membership_number
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [userId]
      );

      const users = rows as User[];

      if (!users || users.length === 0) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];

      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE users SET is_approved = FALSE, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      console.log('Database update result:', result);

      if (!result.affectedRows) {
        console.error('No rows affected when rejecting user:', userId);
        return NextResponse.json(
          { success: false, message: 'Failed to reject user' },
          { status: 500 }
        );
      }

      console.log('User rejected successfully:', userId);

      try {
        await resend.emails.send({
          from: 'TLA <onboarding@resend.dev>',
          to: user.email,
          subject: 'Your Account Was Not Approved',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #111827; font-size: 24px; margin-bottom: 20px;">
                Hello, ${user.name}
              </h1>
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                Your account request was not approved at this time.
              </p>
              ${rejectionReason ? `
              <div style="background-color: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 500; color: #991B1B; margin-bottom: 8px;">Reason:</p>
                <p style="margin: 0; color: #7F1D1D;">${rejectionReason}</p>
              </div>
              ` : ''}
              <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                If you believe this is a mistake, please contact TLA for assistance.
              </p>
              <p style="color: #6B7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                Tanzania Library and Information Association (TLA)
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'User rejected successfully',
        user: {
          id: user.id,
          isApproved: false,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error rejecting user:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
