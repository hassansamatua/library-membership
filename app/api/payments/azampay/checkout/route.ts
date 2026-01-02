import { NextRequest, NextResponse } from 'next/server';
import { azampayService } from '@/lib/azampay';
import { getUserById } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { membershipType, amount, userId } = body;

    if (!membershipType || !amount || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: membershipType, amount, userId' },
        { status: 400 }
      );
    }

    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate unique order ID
    const orderId = `TLA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Extract phone number from user profile
    let userPhone = '+255000000000'; // Default fallback
    if (user.profile) {
      const profile = user.profile as any;
      userPhone = profile.phone || 
                  JSON.parse(profile.contact_info || '{}')?.phone || 
                  '+255000000000';
    }

    // Create payment record first
    const { pool } = await import('@/lib/db');
    const connection = await pool.getConnection();
    
    try {
      // Try direct insertion since table structure is now correct
      await connection.query(
        `INSERT INTO payments (reference, user_id, membership_type, amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, 'TZS', 'pending', NOW())`,
        [orderId, userId, membershipType, amount]
      );
      
      console.log('Payment record created successfully');
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      
      // If table doesn't exist, create it
      if (dbError.code === 'ER_NO_SUCH_TABLE') {
        console.log('Creating payments table...');
        try {
          await connection.query(`
            CREATE TABLE payments (
              id INT AUTO_INCREMENT PRIMARY KEY,
              reference VARCHAR(100) UNIQUE NOT NULL,
              user_id INT NOT NULL,
              membership_type VARCHAR(50) NOT NULL,
              amount DECIMAL(10,2) NOT NULL,
              currency VARCHAR(3) DEFAULT 'TZS',
              status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
              payment_method VARCHAR(50),
              transaction_id VARCHAR(100),
              checkout_url TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              paid_at TIMESTAMP NULL DEFAULT NULL,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              INDEX idx_user_id (user_id),
              INDEX idx_reference (reference),
              INDEX idx_status (status),
              INDEX idx_created_at (created_at)
            )
          `);
          
          // Try inserting again
          await connection.query(
            `INSERT INTO payments (reference, user_id, membership_type, amount, currency, status, created_at)
             VALUES (?, ?, ?, ?, 'TZS', 'pending', NOW())`,
            [orderId, userId, membershipType, amount]
          );
        } catch (createError) {
          console.error('Failed to create table:', createError);
          throw new Error('Database setup failed. Please contact administrator.');
        }
      } else {
        throw dbError;
      }
    } finally {
      connection.release();
    }

    // Try AzamPay checkout
    try {
      const checkoutResponse = await azampayService.createMembershipPayment({
        userId,
        membershipType,
        amount,
        userEmail: user.email,
        userPhone,
        orderId,
      });

      // Update payment record with checkout URL
      const connection2 = await pool.getConnection();
      try {
        await connection2.query(
          'UPDATE payments SET checkout_url = ? WHERE reference = ?',
          [checkoutResponse.checkoutUrl, orderId]
        );
      } finally {
        connection2.release();
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: checkoutResponse.checkoutUrl,
        reference: checkoutResponse.reference,
        orderId,
        amount,
        currency: 'TZS',
      });

    } catch (azampayError) {
      console.error('AzamPay checkout failed:', azampayError);
      
      // Fallback: Create a manual payment record and show payment instructions
      return NextResponse.json({
        success: false,
        fallback: true,
        error: 'Payment gateway temporarily unavailable. Please contact support.',
        reference: orderId,
        amount,
        currency: 'TZS',
        paymentInstructions: {
          message: 'Please contact TLA office to complete payment',
          phone: '+255 22 211 3456',
          email: 'membership@tla.or.tz',
          reference: orderId,
        }
      });
    }

  } catch (error) {
    console.error('Payment checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment checkout' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');

  if (!reference) {
    return NextResponse.json(
      { error: 'Reference parameter is required' },
      { status: 400 }
    );
  }

  try {
    const paymentStatus = await azampayService.checkPaymentStatus(reference);
    
    return NextResponse.json({
      success: true,
      status: paymentStatus,
    });
  } catch (error) {
    console.error('AzamPay status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
