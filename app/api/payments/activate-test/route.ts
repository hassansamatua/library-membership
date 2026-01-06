import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // For test payments, activate membership directly
      const [paymentRows] = await connection.execute(
        'SELECT user_id, membership_type FROM payments WHERE reference = ?',
        [reference]
      );

      if (!paymentRows || paymentRows.length === 0) {

        let membershipNumber = membershipRows[0][0]?.membership_number;
        if (!membershipNumber) {
          // Generate membership number
          const year = new Date().getFullYear().toString().slice(-2);
          const [sequenceRows] = await connection.execute(
            'SELECT last_number FROM membership_sequence WHERE year = ? FOR UPDATE',
            [year]
          );
          
          let nextNumber = 1;
          if (sequenceRows[0].length > 0) {
            nextNumber = sequenceRows[0][0].last_number + 1;
            await connection.execute(
              'UPDATE membership_sequence SET last_number = ? WHERE year = ?',
              [nextNumber, year]
            );
          } else {
            await connection.execute(
              'INSERT INTO membership_sequence (year, last_number) VALUES (?, ?)',
              [year, nextNumber]
            );
          }
          
          membershipNumber = `TLA${year}${nextNumber.toString().padStart(5, '0')}`;
        }

        // Update payment record with proper timestamp
        await connection.execute(
          `UPDATE payments SET 
             transaction_id = ?, 
             status = 'completed', 
             paid_at = NOW(),
             payment_method = ?
             WHERE reference = ?`,
          [
            `TEST-TXN-${Date.now()}`,
            'test',
            reference
          ]
        );

        // Update or create membership record
        const [result] = await connection.execute(
          `UPDATE memberships SET 
             membership_number = ?,
             membership_type = ?,
             status = 'active',
             payment_status = 'paid',
             payment_date = CURDATE(),
             amount_paid = ?,
             expiry_date = DATE_ADD(CURDATE(), INTERVAL 1 YEAR),
             updated_at = NOW()
             WHERE user_id = ?`,
          [membershipNumber, membership_type, 40000, user_id]
        );

        // If no membership record existed, insert one
        if (result[1].affectedRows === 0) {
          await connection.execute(
            `INSERT INTO memberships 
               (user_id, membership_number, membership_type, status, payment_status, payment_date, amount_paid, join_date, expiry_date)
               VALUES (?, ?, 'personal', 'active', 'paid', CURDATE(), ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR))`,
            [user_id, membershipNumber, 40000]
          );
        }

        console.log('Test membership activated for reference:', reference);

        return NextResponse.json({ 
          success: true, 
          message: 'Test membership activated successfully',
          reference,
          membershipNumber,
          paymentStatus: 'completed'
        });
      } else {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error activating test membership:', error);
    return NextResponse.json(
      { error: 'Failed to activate test membership' },
      { status: 500 }
    );
  }
}
