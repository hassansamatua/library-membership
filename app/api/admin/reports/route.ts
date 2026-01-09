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

    // Get saved reports from database (if you have a reports table)
    // For now, return empty array since we don't have a reports table
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT 
        id,
        name,
        type,
        parameters,
        generated_at as generatedAt,
        generated_by as generatedBy,
        file_path as filePath
      FROM reports 
      ORDER BY generated_at DESC`
    ).catch(() => [[], []]);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
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

    const { reportType, startDate, endDate } = await request.json();
    
    let query = '';
    let params: any[] = [];

    switch (reportType) {
      case 'userActivity':
        query = `
          SELECT 
            u.id, 
            u.name, 
            u.email,
            u.is_approved,
            u.created_at as registration_date,
            COUNT(DISTINCT l.id) as login_count,
            MAX(l.login_time) as last_login
          FROM users u
          LEFT JOIN login_logs l ON u.id = l.user_id
          WHERE u.created_at BETWEEN ? AND ?
          GROUP BY u.id
          ORDER BY u.created_at DESC
        `;
        params = [startDate, endDate];
        break;

      case 'systemUsage':
        query = `
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as new_users,
            SUM(is_approved) as approved_users
          FROM users
          WHERE created_at BETWEEN ? AND ?
          GROUP BY DATE(created_at)
          ORDER BY date
        `;
        params = [startDate, endDate];
        break;

      case 'auditLog':
        query = `
          SELECT 
            a.*,
            u.name as user_name,
            u.email as user_email
          FROM audit_logs a
          LEFT JOIN users u ON a.user_id = u.id
          WHERE a.created_at BETWEEN ? AND ?
          ORDER BY a.created_at DESC
          LIMIT 1000
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
    const [results] = await connection.query(query, params);
    
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
