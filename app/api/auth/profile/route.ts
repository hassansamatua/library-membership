// In app/api/auth/profile/route.ts
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';

// Interface for profile data
interface ProfileData {
  // Basic info
  name?: string;
  email?: string;
  password?: string;
  
  // Contact info
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Professional info
  current_position?: string;
  company?: string;
  industry?: string;
  years_of_experience?: number;
  skills?: string; // Comma-separated
  
  // Education
  highest_degree?: string;
  field_of_study?: string;
  institution?: string;
  year_of_graduation?: number;
  additional_certifications?: string;
  
  // Membership
  membership_type?: string;
  membership_number?: string;
  membership_status?: string;
  join_date?: string;
  
  // Interests
  areas_of_interest?: string; // Comma-separated
  
  // Files
  id_proof_path?: string;
  degree_certificates_path?: string; // Comma-separated
  cv_path?: string;
}

// In app/api/auth/profile/route.ts
export async function PUT(request: Request) {
  try {
    // Parse the request body
    const requestData = await request.json() as Partial<ProfileData>;
    console.log('Profile update request data:', JSON.stringify(requestData, null, 2));
    
    // Get token from cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split('; ')
      .find(row => row.trim().startsWith('token='))
      ?.split('=')[1] || null;

    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Separate user and profile data
    const userUpdate: Record<string, any> = {};
    const profileUpdate: Record<string, any> = {};
    
    // User table fields
    const userFields = ['name', 'email', 'password'];
    
    // Process user data
    Object.entries(requestData).forEach(([key, value]) => {
      if (userFields.includes(key) && value !== undefined && value !== '') {
        userUpdate[key] = value;
      } else if (value !== undefined) {
        profileUpdate[key] = value;
      }
    });
    
    // Hash password if it's being updated
    if (userUpdate.password) {
      userUpdate.password = await hashPassword(userUpdate.password);
    }
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Update user table if there are user fields to update
      if (Object.keys(userUpdate).length > 0) {
        await connection.query(
          'UPDATE users SET ? WHERE id = ?',
          [userUpdate, decoded.id]
        );
      }
      
      // Update or insert profile
      if (Object.keys(profileUpdate).length > 0) {
        // Check if profile exists
        const [existingProfile] = await connection.query(
          'SELECT id FROM user_profiles WHERE user_id = ?',
          [decoded.id]
        );
        
        if (existingProfile.length > 0) {
          // Update existing profile
          await connection.query(
            'UPDATE user_profiles SET ? WHERE user_id = ?',
            [profileUpdate, decoded.id]
          );
        } else {
          // Insert new profile
          await connection.query(
            'INSERT INTO user_profiles SET ?',
            [{ user_id: decoded.id, ...profileUpdate }]
          );
        }
      }
      
      await connection.commit();
      
      // Get updated user data
      const [users] = await connection.query(
        `SELECT u.*, up.* 
         FROM users u 
         LEFT JOIN user_profiles up ON u.id = up.user_id 
         WHERE u.id = ?`,
        [decoded.id]
      );
      
      const updatedUser = users[0];
      
      // Remove sensitive data
      delete updatedUser.password;
      delete updatedUser.refresh_token;
      
      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyAndUpdateProfile(token: string, data: any) {
  // Ensure token is a string and not 'undefined'
  if (typeof token !== 'string' || token === 'undefined') {
    console.error('Invalid token format:', token);
    throw new Error('Invalid token format');
  }
  
  console.log('Token received for verification (first 10 chars):', token.substring(0, 10) + '...');
  
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    console.log('Attempting to verify token...');
    const decoded = verifyToken(token);
    console.log('Successfully decoded token:', { 
      id: decoded.id, 
      email: decoded.email,
      isAdmin: decoded.isAdmin,
      iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : null,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : null
    });
    
    // Flatten the data structure and only include valid user fields
    const updateData: Record<string, any> = {};
    
    // Define valid user fields that can be updated
    const validUserFields = [
      'first_name', 'last_name', 'phone', 'address', 'city', 'state', 
      'postal_code', 'country', 'bio', 'profile_picture', 'company',
      'job_title', 'website', 'twitter', 'linkedin', 'github', 'facebook',
      'instagram', 'youtube', 'tiktok'
    ];
    
    // Flatten the nested data structure
    if (data.personalInfo) {
      Object.entries(data.personalInfo).forEach(([key, value]) => {
        if (validUserFields.includes(key) && value !== undefined) {
          updateData[key] = value;
        }
      });
    }
    
    // Add other top-level fields if they exist and are valid
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'personalInfo' && validUserFields.includes(key) && value !== undefined) {
        updateData[key] = value;
      }
    });
    
    console.log('Prepared update data:', JSON.stringify(updateData, null, 2));
    
    if (Object.keys(updateData).length === 0) {
      console.log('No valid fields to update');
      return NextResponse.json(
        { message: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE users SET ? WHERE id = ?',
        [updateData, decoded.id]
      );
      
      return NextResponse.json({ 
        message: 'Profile updated successfully',
        userId: decoded.id,
        updatedFields: Object.keys(updateData)
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
