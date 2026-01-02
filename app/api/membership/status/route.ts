import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import type { RowDataPacket } from 'mysql2/promise';

type MembershipRow = RowDataPacket & {
  id: number;
  user_id: number;
  membership_number: string;
  membership_type: 'individual' | 'organization' | 'student';
  status: 'active' | 'expired' | 'suspended' | 'pending';
  joined_date: string;
  expiry_date: string;
  payment_status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  payment_date: string | null;
  amount_paid: string | number;
};

async function getAuthToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (authToken) return authToken;

  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

function toDateOnlyIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getCycleDates(now: Date) {
  const year = now.getFullYear();
  const cycleYear = now.getMonth() >= 1 ? year : year - 1;
  const cycleStart = new Date(cycleYear, 1, 1);
  const dueDate = new Date(cycleYear, 2, 31);
  const expiryDate = new Date(cycleYear + 1, 0, 31);
  return {
    cycleYear,
    cycleStart,
    dueDate,
    expiryDate
  };
}

function getPlanAmounts(args: { type: 'personal' | 'organization'; newUser: boolean }) {
  if (args.type === 'organization') {
    return { baseAmount: 150000 };
  }
  return { baseAmount: args.newUser ? 40000 : 30000 };
}

export async function GET(request: Request) {
  let connection;
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 401 });
    }

    const url = new URL(request.url);
    const typeParam = url.searchParams.get('type');
    const newUserParam = url.searchParams.get('newUser');

    connection = await pool.getConnection();

    const [userRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, membership_type FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!userRows?.length) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const userTypeRaw = String((userRows[0] as any).membership_type || '').toLowerCase();
    const defaultType: 'personal' | 'organization' = userTypeRaw === 'organization' ? 'organization' : 'personal';

    const type: 'personal' | 'organization' = typeParam === 'organization' ? 'organization' : 'personal';
    const now = new Date();
    const cycle = getCycleDates(now);

    const [membershipRows] = await connection.query<MembershipRow[]>(
      'SELECT * FROM memberships WHERE user_id = ? ORDER BY expiry_date DESC LIMIT 1',
      [decoded.id]
    );

    const membership = membershipRows?.[0] || null;
    const hasMembership = !!membership;

    const newUser = newUserParam != null
      ? newUserParam === 'true' || newUserParam === '1'
      : !hasMembership;

    const planType = typeParam === 'personal' || typeParam === 'organization' ? type : defaultType;
    const { baseAmount } = getPlanAmounts({ type: planType, newUser });

    const dueDateOnly = new Date(cycle.dueDate.getFullYear(), cycle.dueDate.getMonth(), cycle.dueDate.getDate());
    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = nowDateOnly.getTime() > dueDateOnly.getTime();
    const penaltyAmount = overdue ? Math.round(baseAmount * 0.1) : 0;
    const totalDue = baseAmount + penaltyAmount;

    const membershipExpiry = membership?.expiry_date ? new Date(membership.expiry_date) : null;
    const activeByDate = membershipExpiry ? membershipExpiry.getTime() >= nowDateOnly.getTime() : false;
    const paid = membership?.payment_status === 'paid';
    // Check if user has profile picture
    const [profileRows] = await connection.query<RowDataPacket[]>(
      'SELECT profile_picture FROM user_profiles WHERE user_id = ?',
      [decoded.id]
    );
    
    const userProfile = profileRows[0] || {};
    const hasProfilePicture = Boolean(userProfile.profile_picture && userProfile.profile_picture !== '' && userProfile.profile_picture !== null);

    const active = Boolean(membership?.status === 'active' && activeByDate && paid && hasProfilePicture);

    const effectiveFees = active
      ? { baseAmount: 0, penaltyAmount: 0, totalDue: 0, currency: 'TZS' }
      : { baseAmount, penaltyAmount, totalDue, currency: 'TZS' };

    return NextResponse.json({
      success: true,
      cycle: {
        year: cycle.cycleYear,
        startDate: toDateOnlyIso(cycle.cycleStart),
        dueDate: toDateOnlyIso(cycle.dueDate),
        expiryDate: toDateOnlyIso(cycle.expiryDate)
      },
      plan: {
        type: planType,
        newUser
      },
      fees: effectiveFees,
      membership: membership
        ? {
            membershipNumber: membership.membership_number,
            membershipType: membership.membership_type,
            status: membership.status,
            paymentStatus: membership.payment_status,
            joinedDate: membership.joined_date,
            expiryDate: membership.expiry_date,
            amountPaid: membership.amount_paid
          }
        : null,
      canAccessIdCard: active
    });
  } catch (error) {
    if ((error as any)?.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json(
        {
          success: false,
          message: 'Membership system is not set up yet. Please run database migrations for memberships/payments.'
        },
        { status: 500 }
      );
    }

    console.error('Error in GET /api/membership/status:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
