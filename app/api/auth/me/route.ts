import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
  let connection;
  try {
    // Get token from Authorization header or cookie
    const authHeader = request.headers.get('authorization');
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    
    if (!token) {
      token = request.headers.get('cookie')
        ?.split('; ')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];
    }

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'No token provided' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get database connection
    connection = await pool.getConnection();

    // Fetch user data
    const [users] = await connection.query<RowDataPacket[]>(
      `SELECT 
        id, 
        name, 
        email, 
        is_admin as isAdmin, 
        is_approved as isApproved,
        membership_number as membershipNumber,
        created_at as createdAt
      FROM users 
      WHERE id = ?`,
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = users[0];
    
    // Get user profile if it exists
    const [profiles] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [user.id]
    );

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // Prepare response
    const responseData = {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      isApproved: Boolean(user.isApproved),
      membershipNumber: user.membershipNumber,
      createdAt: user.createdAt,
      profile: profile ? {
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        postalCode: profile.postal_code,
        profilePicture: profile.profile_picture,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        idNumber: profile.id_number
      } : null
    };

    return new NextResponse(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        } 
      }
    );

  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return new NextResponse(
      JSON.stringify({ 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}