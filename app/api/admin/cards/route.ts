import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2/promise';

async function getAuthToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (authToken) return authToken;

  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

interface MembershipCardRow extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  email: string;
  membership_number: string;
  membership_type: string;
  membership_status: string;
  join_date: string;
  profile_picture: string | null;
  expiry_date: string;
  payment_status: string;
  amount: number;
  created_at: string;
}

export async function GET(request: Request) {
  let connection;
  try {
    const token = await getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!decoded?.isAdmin) {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();

    // Fetch all membership cards with payment information
    const [results] = await connection.query<MembershipCardRow[]>(`
      SELECT 
        u.id,
        u.name,
        u.email,
        up.membership_number,
        up.membership_type,
        up.membership_status,
        up.join_date,
        JSON_EXTRACT(up.personal_info, '$.profilePicture') as profile_picture,
        m.expiry_date,
        p.status as payment_status,
        p.amount,
        p.created_at as payment_date,
        MAX(p.created_at) as last_payment_date,
        MAX(p.amount) as last_payment_amount
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN memberships m ON u.id = m.user_id
      LEFT JOIN payments p ON u.id = p.user_id
      WHERE up.membership_number IS NOT NULL
      GROUP BY u.id, u.name, u.email, up.membership_number, up.membership_type, up.membership_status, up.join_date, m.expiry_date, p.status, up.personal_info
      ORDER BY u.created_at DESC
    `);

    // Transform data to match frontend expectations
    const transformedData = results.map((row: any) => {
      // Determine membership status based on payment status
      // If payment is paid, membership is active
      const membershipStatus = row.payment_status === 'paid' ? 'active' : 'inactive';
      
      return {
        id: row.id.toString(),
        userId: row.user_id,
        userName: row.name,
        userEmail: row.email,
        membershipNumber: row.membership_number || `TLA${row.id}`,
        membershipType: row.membership_type || 'Personal',
        joinDate: row.join_date || new Date().toISOString(),
        expiryDate: row.expiry_date || new Date(new Date().getFullYear() + 1, 0, 31).toISOString(),
        paymentStatus: row.payment_status || 'pending',
        membershipStatus: membershipStatus,
        amount: row.amount || 0,
        paymentDate: row.payment_date,
        lastPaymentAmount: row.last_payment_amount || 0,
        profilePicture: row.profile_picture,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
    });

  } catch (error) {
    console.error('Failed to fetch membership cards:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch membership cards',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
