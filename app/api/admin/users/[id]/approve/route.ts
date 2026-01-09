// app/api/users/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper function to send email safely
async function sendApprovalEmail(email: string, name: string, membershipNumber?: string) {
  if (!resend) {
    console.log('Resend API key not configured, skipping email sending');
    return;
  }
  
  try {
    await resend.emails.send({
      from: 'TLA <onboarding@resend.dev>',
      to: email,
      subject: 'Your Account Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #111827; font-size: 24px; margin-bottom: 20px;">
            Welcome, ${name}!
          </h1>
          <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
            Your account has been approved. You can now log in.
          </p>
          ${membershipNumber ? `
          <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: 500; color: #111827;">Membership Number:</p>
            <p style="font-size: 24px; font-weight: 700; color: #10B981; margin: 8px 0 0 0;">${membershipNumber}</p>
          </div>
          ` : ''}
          <div style="margin: 30px 0;">
            <a 
              href="${process.env.NEXT_PUBLIC_APP_URL}/auth/login" 
              style="
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #10B981; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px;
                font-weight: 500;
                font-size: 16px;
              "
            >
              Log In
            </a>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send approval email:', emailError);
  }
}

interface User extends RowDataPacket {
  id: number;
  is_approved: boolean;
  name: string;
  email: string;
  membership_number?: string | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  return handleApproveUser(request, resolvedParams.id);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const resolvedParams = await params;
  return handleApproveUser(request, resolvedParams.id);
}

async function handleApproveUser(request: Request, userId: string) {
  try {
    console.log('Received request with user ID:', userId);
    console.log('User ID from params:', userId);

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

      // Generate membership number if not exists
      let membershipNumber = user.membership_number;
      if (!membershipNumber) {
        const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits
        const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
        membershipNumber = `TLA${year}${randomNum}`;
        
        // Store membership number in database
        await connection.query(
          'UPDATE user_profiles SET membership_number = ?, updated_at = NOW() WHERE user_id = ?',
          [membershipNumber, userId]
        );
      }

      // Update user approval status
      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE users SET is_approved = TRUE, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      // Also update membership status to 'active' in user_profiles
      await connection.query(
        'UPDATE user_profiles SET membership_status = ?, updated_at = NOW() WHERE user_id = ?',
        ['active', userId]
      );

      // Get updated user data
      const [updatedUsers] = await connection.query<User[]>(
        `SELECT u.id, u.name, u.email, u.is_approved as isApproved, up.membership_number
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = ?`,
        [userId]
      );

      // Send approval email
      await sendApprovalEmail(updatedUsers[0].email, updatedUsers[0].name, updatedUsers[0].membership_number || undefined);

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