import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2/promise';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

async function getAuthToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (authToken) return authToken;

  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({} as any));
    const { reportType, startDate, endDate, columns } = body;
    
    console.log('Report generation request:', { reportType, startDate, endDate, columns });
    
    if (!reportType) {
      return NextResponse.json(
        { message: 'Report type is required' },
        { status: 400 }
      );
    }
    
    let query = '';
    let params: any[] = [];

    switch (reportType) {
      case 'membership':
        query = `
          SELECT 
            u.id,
            u.name,
            u.email,
            u.is_approved,
            up.membership_number,
            up.membership_type,
            up.membership_status,
            up.join_date,
            m.expiry_date,
            m.payment_status
          FROM users u
          LEFT JOIN user_profiles up ON u.id = up.user_id
          LEFT JOIN memberships m ON u.id = m.user_id
          WHERE u.created_at BETWEEN ? AND ?
          ORDER BY u.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      case 'financial':
        query = `
          SELECT 
            p.id,
            p.user_id,
            u.name,
            u.email,
            p.transaction_id,
            p.amount,
            p.payment_method,
            p.status,
            p.payment_date,
            p.due_date,
            p.invoice_number,
            p.description,
            p.created_at
          FROM payments p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.created_at BETWEEN ? AND ?
          ORDER BY p.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      case 'attendance':
        query = `
          SELECT 
            a.id,
            a.user_id,
            u.name,
            u.email,
            a.event_id,
            e.title as event_title,
            a.check_in_time,
            a.check_out_time,
            a.status,
            a.created_at
          FROM attendance a
          LEFT JOIN users u ON a.user_id = u.id
          LEFT JOIN events e ON a.event_id = e.id
          WHERE a.created_at BETWEEN ? AND ?
          ORDER BY a.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      case 'inventory':
        query = `
          SELECT 
            i.id,
            i.title,
            i.author,
            i.isbn,
            i.category,
            i.status,
            i.quantity,
            i.available_quantity,
            i.location,
            i.created_at
          FROM inventory i
          WHERE i.created_at BETWEEN ? AND ?
          ORDER BY i.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      case 'event':
        query = `
          SELECT 
            e.id,
            e.title,
            e.description,
            e.location,
            e.start_date,
            e.end_date,
            e.status,
            COUNT(a.id) as attendance_count,
            e.created_at
          FROM events e
          LEFT JOIN attendance a ON e.id = a.event_id
          WHERE e.created_at BETWEEN ? AND ?
          GROUP BY e.id
          ORDER BY e.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      default:
        return NextResponse.json(
          { message: 'Invalid report type' },
          { status: 400 }
        );
    }

    connection = await pool.getConnection();
    console.log('Executing query:', query);
    console.log('With params:', params);
    
    const [results] = await connection.query<RowDataPacket[]>(query, params);
    console.log('Query results:', results.length, 'rows');
    
    return NextResponse.json({
      success: true,
      data: results,
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to generate report',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
