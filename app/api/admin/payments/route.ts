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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const membershipType = searchParams.get('membershipType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    connection = await pool.getConnection();

    // Get actual column names from payments table
    const [paymentColumns] = await connection.query('SHOW COLUMNS FROM payments');
    const paymentColumnSet = new Set(((paymentColumns as any[]) || []).map((r: any) => String(r.Field)));

    console.log('Payment columns:', Array.from(paymentColumnSet));

    // Get actual column names from users table
    const [userColumns] = await connection.query('SHOW COLUMNS FROM users');
    const userColumnSet = new Set(((userColumns as any[]) || []).map((r: any) => String(r.Field)));

    console.log('User columns:', Array.from(userColumnSet));

    // Build SELECT clause based on available columns
    const selectFields = [];
    
    // Payments table fields
    selectFields.push('p.id');
    selectFields.push(paymentColumnSet.has('user_id') ? 'p.user_id as userId' : 'p.userId as userId');
    
    // User fields
    if (userColumnSet.has('name')) {
      selectFields.push('u.name as userName');
    } else if (userColumnSet.has('fullName')) {
      selectFields.push('u.fullName as userName');
    }
    selectFields.push(userColumnSet.has('email') ? 'u.email as userEmail' : 'u.email as userEmail');
    
    // Payment fields based on actual schema
    selectFields.push('NULL as membershipType'); // Not in payments table
    selectFields.push(paymentColumnSet.has('amount') ? 'p.amount' : 'NULL as amount');
    selectFields.push('NULL as currency'); // Not in payments table
    selectFields.push(paymentColumnSet.has('status') ? 'p.status' : 'NULL as status');
    selectFields.push(paymentColumnSet.has('payment_method') ? 'p.payment_method as paymentMethod' : 'NULL as paymentMethod');
    selectFields.push(paymentColumnSet.has('transaction_id') ? 'p.transaction_id as transactionId' : 'NULL as transactionId');
    selectFields.push(paymentColumnSet.has('payment_date') ? 'p.payment_date as paymentDate' : 'NULL as paymentDate');
    selectFields.push(paymentColumnSet.has('due_date') ? 'p.due_date as dueDate' : 'NULL as dueDate');
    selectFields.push('NULL as penaltyAmount'); // Not in payments table
    selectFields.push(paymentColumnSet.has('created_at') ? 'p.created_at as createdAt' : 'NULL as createdAt');
    selectFields.push(paymentColumnSet.has('updated_at') ? 'p.updated_at as updatedAt' : 'NULL as updatedAt');
    selectFields.push(paymentColumnSet.has('invoice_number') ? 'p.invoice_number as invoiceNumber' : 'NULL as invoiceNumber');
    selectFields.push(paymentColumnSet.has('description') ? 'p.description as description' : 'NULL as description');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (status) {
      const statusColumn = paymentColumnSet.has('status') ? 'p.status' : 
                          paymentColumnSet.has('payment_status') ? 'p.payment_status' : 'NULL';
      if (statusColumn !== 'NULL') {
        whereClause += ` AND ${statusColumn} = ?`;
        params.push(status);
      }
    }

    if (membershipType) {
      // Skip membershipType filter as it's not in the payments table
    }

    if (dateFrom) {
      const dateColumn = paymentColumnSet.has('payment_date') ? 'p.payment_date' : 
                        paymentColumnSet.has('paymentDate') ? 'p.paymentDate' : 
                        paymentColumnSet.has('created_at') ? 'p.created_at' : 'NULL';
      if (dateColumn !== 'NULL') {
        whereClause += ` AND ${dateColumn} >= ?`;
        params.push(dateFrom);
      }
    }

    if (dateTo) {
      const dateColumn = paymentColumnSet.has('payment_date') ? 'p.payment_date' : 
                        paymentColumnSet.has('paymentDate') ? 'p.paymentDate' : 
                        paymentColumnSet.has('created_at') ? 'p.created_at' : 'NULL';
      if (dateColumn !== 'NULL') {
        whereClause += ` AND ${dateColumn} <= ?`;
        params.push(dateTo);
      }
    }

    // Build JOIN condition based on available columns
    const joinCondition = paymentColumnSet.has('user_id') ? 'p.user_id = u.id' : 
                         paymentColumnSet.has('userId') ? 'p.userId = u.id' : 
                         paymentColumnSet.has('user') ? 'p.user = u.id' : 'u.id = u.id';

    const query = `
      SELECT ${selectFields.join(', ')}
      FROM payments p
      LEFT JOIN users u ON ${joinCondition}
      ${whereClause}
      ORDER BY ${paymentColumnSet.has('created_at') ? 'p.created_at' : paymentColumnSet.has('createdAt') ? 'p.createdAt' : 'p.id'} DESC
    `;

    console.log('Payments query:', query);
    console.log('Payments params:', params);

    const [rows] = await connection.query<RowDataPacket[]>(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch payments' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
