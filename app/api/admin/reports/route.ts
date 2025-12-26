import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
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

    const [results] = await pool.query(query, params);
    
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
  }
}
