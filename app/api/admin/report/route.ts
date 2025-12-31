import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import * as XLSX from 'xlsx';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    // Get token from cookies
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Verify token and check admin status
    try {
      const decoded = verifyToken(token);
      if (!decoded.isAdmin) {
        return new NextResponse('Admin access required', { status: 403 });
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      return new NextResponse('Invalid or expired token', { status: 401 });
    }

    // Fetch users data
    const [rows] = await pool.query(`
      SELECT u.*, p.* 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `) as [any[], any];

    // Type assertion for the rows
    const users = rows as any[];

    // Format data for Excel
    const reportData = users.map((user) => ({
      'ID': user.id,
      'Name': user.name,
      'Email': user.email,
      'Status': user.is_approved ? 'Active' : 'Pending',
      'Member Since': new Date(user.created_at).toLocaleDateString(),
      'Membership Number': user.membership_number || 'N/A',
      'Membership Type': user.membership_type || 'N/A',
      'Phone': user.phone || 'N/A',
      'Address': user.address || 'N/A',
      'City': user.city || 'N/A',
      'Country': user.country || 'N/A'
    }));

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Users Report');
    
    // Generate Excel file buffer
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', 'attachment; filename="members-report.xlsx"');
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
