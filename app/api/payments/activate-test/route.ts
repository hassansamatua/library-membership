import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

interface PaymentRow {
  id: number;
  user_id: number;
  amount: number;
  membership_type: string;
  payment_method: string;
  reference: string;
}

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
    const { reference } = await request.json();
    
    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Get the authenticated user from the session
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify the token and get user ID
    const decoded = verifyToken(token);
    
    if (!decoded?.id) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    const userId = typeof decoded.id === 'string' ? parseInt(decoded.id) : decoded.id;
    
    // Get database connection
    connection = await pool.getConnection();
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // 1. Get payment details first
      const [paymentRows] = await connection.query<PaymentRow[]>(
        `SELECT id, user_id, amount, membership_type, payment_method, reference 
         FROM payments 
         WHERE reference = ? AND user_id = ? 
         LIMIT 1`,
        [reference, userId]
      );
      
      if (!paymentRows || paymentRows.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: 'Payment not found' },
          { status: 404 }
        );
      }
      
      const payment = paymentRows[0];
      
      // 2. Update payment status to completed
      await connection.execute(
        `UPDATE payments 
         SET status = 'completed', 
             paid_at = NOW(),
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [payment.id, userId]
      );
      
      // 3. Generate membership number
      const year = new Date().getFullYear().toString().slice(-2);
      const membershipNumber = `TLA${year}${Math.floor(10000 + Math.random() * 90000)}`;
      const currentYear = new Date().getFullYear();
      
      // 4. Create or update membership with all required fields
      await connection.execute(
        `INSERT INTO memberships 
         (user_id, membership_number, membership_type, status, 
          payment_status, payment_date, reference, payment_method,
          expiry_date, amount_paid, created_at, updated_at)
         VALUES (?, ?, ?, 'active', 'paid', NOW(), ?, ?, 
                DATE_ADD(NOW(), INTERVAL 1 YEAR), ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           status = 'active',
           membership_type = VALUES(membership_type),
           payment_status = 'paid',
           payment_date = NOW(),
           reference = VALUES(reference),
           payment_method = VALUES(payment_method),
           expiry_date = VALUES(expiry_date),
           amount_paid = VALUES(amount_paid),
           updated_at = NOW()`,
        [
          userId, 
          membershipNumber,
          payment.membership_type || 'personal',
          payment.reference,
          payment.payment_method || 'test',
          payment.amount || 40000
        ]
      );
      
      // 5. Create payment record in membership_payments
      await connection.execute(
        `INSERT INTO membership_payments 
         (user_id, amount, payment_method, reference, 
          payment_date, status, cycle_year)
         VALUES (?, ?, ?, ?, NOW(), 'completed', ?)
         ON DUPLICATE KEY UPDATE
           status = 'completed',
           updated_at = NOW()`,
        [
          userId,
          payment.amount || 40000,
          payment.payment_method || 'test',
          payment.reference,
          currentYear
        ]
      );
      
      // Commit the transaction
      await connection.commit();
      
      console.log('✓ Test payment activated successfully:', {
        reference,
        userId,
        membershipNumber,
        status: 'completed'
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment and membership updated successfully',
        data: {
          membershipNumber,
          reference: payment.reference,
          amount: payment.amount || 40000,
          paymentMethod: payment.payment_method || 'test',
          status: 'completed'
        }
      });
    } catch (error) {
      // Rollback in case of error
      if (connection) {
        await connection.rollback();
      }
      console.error('Error processing payment:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to process payment',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in activate-test endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.release();
      } catch (err) {
        console.error('Error releasing connection:', err);
      }
    }
  }
}