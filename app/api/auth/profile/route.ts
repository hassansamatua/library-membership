// app/api/auth/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// ... (keep your existing mapProfileToDb and mapDbToProfile functions)

export async function PUT(request: Request) {
  // Try to get user ID from header first (set by middleware)
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    // Fallback to session if header is not available
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('No user ID found in headers or session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const profileUpdate = await request.json();
    console.log('Profile update for user:', userId);

    const connection = await connectToDatabase();
    const dbProfile = mapProfileToDb(profileUpdate);

    // Check if profile exists
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    if (existing && existing.length > 0) {
      // Update existing profile
      const [result] = await connection.query<ResultSetHeader>(
        'UPDATE user_profiles SET ? WHERE user_id = ?',
        [dbProfile, userId]
      );
      console.log('Update result:', result);
    } else {
      // Insert new profile
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO user_profiles SET ?',
        [{ ...dbProfile, user_id: userId }]
      );
      console.log('Insert result:', result);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
