// In app/api/auth/profile/route.ts
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { pool } from '@/lib/db';

type JwtPayload = {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
};

// In app/api/auth/profile/route.ts
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Exists' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in header');
      // Try to get token from cookies as fallback
      const cookieHeader = request.headers.get('cookie');
      const tokenFromCookie = cookieHeader
        ?.split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];
      
      if (!tokenFromCookie) {
        return NextResponse.json(
          { message: 'No authentication token provided' },
          { status: 401 }
        );
      }
      console.log('Using token from cookie');
      return await verifyAndUpdateProfile(tokenFromCookie, await request.json());
    }

    const token = authHeader.split(' ')[1];
    return await verifyAndUpdateProfile(token, await request.json());

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyAndUpdateProfile(token: string, data: any) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    console.log('Decoded token:', decoded);
    
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE users SET ? WHERE id = ?',
        [data, decoded.userId]
      );
      
      return NextResponse.json({ 
        message: 'Profile updated successfully',
        userId: decoded.userId
      });
    } finally {
      connection.release();
    }
  }
   catch (error) {
    console.error('JWT verification failed:', error);
    return NextResponse.json(
      { message: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
