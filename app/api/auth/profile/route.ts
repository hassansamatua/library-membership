import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { RowDataPacket } from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure the upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'profile-pictures');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// GET endpoint to fetch user profile
export async function GET(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Fetch user data with profile
    const [users] = await connection.query<RowDataPacket[]>(
      `SELECT 
        u.*, 
        up.* 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];
    
    // Clean up sensitive data
    delete user.password;
    delete user.refresh_token;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        personalInfo: {
          fullName: user.full_name || user.name,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          idNumber: user.id_number,
          profilePicture: user.profile_picture,
          nationality: user.nationality,
          placeOfBirth: user.place_of_birth,
          phone: user.phone,
          address: user.address,
          city: user.city,
          country: user.country,
          postalCode: user.postal_code
        }
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT endpoint to update user profile
export async function PUT(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Rest of your PUT endpoint code...
    // ... (keep the rest of your existing PUT endpoint code)
    
  } catch (error) {
    console.error('Error in PUT /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PATCH endpoint to update user profile with file upload
export async function PATCH(request: Request) {
  const connection = await pool.getConnection();
  
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Handle multipart form data
    const formData = await request.formData();
    const personalInfoStr = formData.get('personalInfo') as string;
    const profilePicture = formData.get('profilePicture') as File | null;
    const profilePictureUrl = formData.get('profilePictureUrl') as string | null;

    // Parse the personalInfo JSON string
    let personalInfo = {};
    try {
      personalInfo = personalInfoStr ? JSON.parse(personalInfoStr) : {};
    } catch (error) {
      console.error('Error parsing personalInfo:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid personal information format' },
        { status: 400 }
      );
    }

    const profileUpdate: Record<string, any> = { ...personalInfo };

    // Handle file upload if a new profile picture is provided
    if (profilePicture && profilePicture.size > 0) {
      const fileExtension = profilePicture.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, fileName);
      
      try {
        // Convert the file to a buffer and save it
        const bytes = await profilePicture.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await fs.promises.writeFile(filePath, buffer);
        
        // Store the relative path in the database
        profileUpdate.profile_picture = `/uploads/profile-pictures/${fileName}`;
      } catch (error) {
        console.error('Error saving profile picture:', error);
        return NextResponse.json(
          { success: false, message: 'Failed to save profile picture' },
          { status: 500 }
        );
      }
    } else if (profilePictureUrl) {
      // If it's a URL or base64 string
      profileUpdate.profile_picture = profilePictureUrl;
    }

    // Start transaction
    await connection.beginTransaction();

    try {
      // Update or create profile
      const [existingProfile] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM user_profiles WHERE user_id = ?',
        [decoded.id]
      );

      if (existingProfile?.length > 0) {
        // Update existing profile
        const updateFields = Object.keys(profileUpdate);
        const updateValues = Object.values(profileUpdate);
        const setClause = updateFields.map(field => `\`${field}\` = ?`).join(', ');
        
        await connection.query(
          `UPDATE user_profiles SET ${setClause} WHERE user_id = ?`,
          [...updateValues, decoded.id]
        );
      } else {
        // Insert new profile
        const insertFields = ['user_id', ...Object.keys(profileUpdate)];
        const insertValues = [decoded.id, ...Object.values(profileUpdate)];
        const placeholders = insertFields.map(() => '?').join(', ');
        const columns = insertFields.map(field => `\`${field}\``).join(', ');
        
        await connection.query(
          `INSERT INTO user_profiles (${columns}) VALUES (${placeholders})`,
          insertValues
        );
      }

      await connection.commit();
      
      // Fetch updated user data
      const [users] = await connection.query<RowDataPacket[]>(
        `SELECT 
          u.*, 
          up.* 
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?`,
        [decoded.id]
      );

      // Clean up sensitive data
      const updatedUser = users[0];
      if (updatedUser) {
        delete updatedUser.password;
        delete updatedUser.refresh_token;
      }
      
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          personalInfo: {
            fullName: updatedUser.full_name || updatedUser.name,
            gender: updatedUser.gender,
            dateOfBirth: updatedUser.date_of_birth,
            idNumber: updatedUser.id_number,
            profilePicture: updatedUser.profile_picture,
            nationality: updatedUser.nationality,
            placeOfBirth: updatedUser.place_of_birth,
            phone: updatedUser.phone,
            address: updatedUser.address,
            city: updatedUser.city,
            country: updatedUser.country,
            postalCode: updatedUser.postal_code
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error('Error in PATCH /api/auth/profile:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in PATCH /api/auth/profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: (error as Error).message })
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}