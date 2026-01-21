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
        u.id as user_id,
        u.name,
        u.email,
        up.membership_number,
        up.membership_type,
        up.membership_status,
        up.join_date,
        up.profile_picture as profile_picture,
        m.expiry_date,
        m.payment_status,
        m.amount_paid,
        m.payment_date as membership_payment_date,
        m.status as membership_status_from_db,
        p.reference,
        p.amount as payment_amount,
        p.status as payment_status_from_payments,
        p.created_at as payment_created_at
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN memberships m ON u.id = m.user_id
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'completed'
      WHERE up.membership_number IS NOT NULL
      ORDER BY u.created_at DESC, p.created_at DESC
    `);

    // Transform data to match frontend expectations
    // Group by user to get unique members with their latest payment info
    const userMap = new Map();
    
    results.forEach((row: any) => {
      const userId = row.user_id;
      
      // If we haven't seen this user yet, or if this payment is more recent
      if (!userMap.has(userId) || 
          (row.payment_created_at && userMap.get(userId).paymentDate < row.payment_created_at)) {
        
        // Determine actual membership status from database
        let membershipStatus = 'inactive';
        if (row.membership_status_from_db === 'active') {
          membershipStatus = 'active';
        } else if (row.payment_status === 'paid' && row.expiry_date) {
          // Check if membership is still valid
          const expiryDate = new Date(row.expiry_date);
          const today = new Date();
          membershipStatus = expiryDate >= today ? 'active' : 'expired';
        }
        
        userMap.set(userId, {
          id: userId.toString(),
          userId: userId,
          userName: row.name,
          userEmail: row.email,
          userPhone: '', // Can be added if needed from user_profiles
          membershipNumber: row.membership_number || `TLA${userId}`,
          membershipType: row.membership_type || 'Personal',
          joinDate: row.join_date || new Date().toISOString(),
          expiryDate: row.expiry_date || new Date(new Date().getFullYear() + 1, 0, 31).toISOString(),
          paymentStatus: row.payment_status || 'pending',
          membershipStatus: membershipStatus,
          amount: row.payment_amount || row.amount_paid || 0,
          paymentDate: row.payment_created_at || row.membership_payment_date,
          lastPaymentAmount: row.payment_amount || row.amount_paid || 0,
          profilePicture: row.profile_picture || null,
        });
      }
    });
    
    const transformedData = Array.from(userMap.values());
    
    console.log('📊 Admin Cards API Response:', {
      totalUsers: transformedData.length,
      sampleData: transformedData.slice(0, 2).map(card => ({
        id: card.id,
        userName: card.userName,
        membershipNumber: card.membershipNumber,
        membershipStatus: card.membershipStatus,
        paymentStatus: card.paymentStatus,
        expiryDate: card.expiryDate
      }))
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
