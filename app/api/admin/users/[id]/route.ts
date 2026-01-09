// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ResultSetHeader, RowDataPacket, PoolConnection } from 'mysql2/promise';
import { cookies } from 'next/headers';

async function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const authToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (authToken) return authToken;

  const cookieStore = await cookies();
  return cookieStore.get('token')?.value || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: PoolConnection | null = null;
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userId = parseInt(id, 10);
    
    console.log('Fetching user details for ID:', userId);
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();

    // Get user basic info
    const [users] = await connection.query<RowDataPacket[]>(
      'SELECT id, name, email, is_admin, is_approved, created_at, updated_at, membership_number FROM users WHERE id = ?',
      [userId]
    );

    console.log('User query result:', users.length, 'rows');

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Get user profile if exists
    const [profileColumns] = await connection.query('SHOW COLUMNS FROM user_profiles');
    const profileColumnSet = new Set(((profileColumns as any[]) || []).map((r: any) => String(r.Field)));

    console.log('Profile columns:', Array.from(profileColumnSet));

    // Build SELECT clause based on available columns
    const selectFields = [];
    if (profileColumnSet.has('personal_info')) selectFields.push('personal_info');
    if (profileColumnSet.has('contact_info')) selectFields.push('contact_info');
    if (profileColumnSet.has('professional_info')) selectFields.push('professional_info');
    if (profileColumnSet.has('membership_info')) selectFields.push('membership_info');
    if (profileColumnSet.has('membership_type')) selectFields.push('membership_type');
    if (profileColumnSet.has('membership_number')) selectFields.push('membership_number');
    if (profileColumnSet.has('membership_status')) selectFields.push('membership_status');
    if (profileColumnSet.has('join_date')) selectFields.push('join_date');

    const profileQuery = selectFields.length > 0 
      ? `SELECT ${selectFields.join(', ')} FROM user_profiles WHERE user_id = ?`
      : 'SELECT NULL FROM DUAL WHERE 1=0';

    const [profiles] = await connection.query<RowDataPacket[]>(profileQuery, [userId]);

    console.log('Profile query result:', profiles.length, 'rows');

    const profile = profiles[0] || {};

    // Parse JSON fields
    const personalInfo = profile.personal_info ? JSON.parse(profile.personal_info) : {};
    const contactInfo = profile.contact_info ? JSON.parse(profile.contact_info) : {};
    const professionalInfo = profile.professional_info ? JSON.parse(profile.professional_info) : {};
    const membershipInfo = profile.membership_info ? JSON.parse(profile.membership_info) : {};

    // Also check direct columns for membership info
    const membershipType = profile.membership_type || membershipInfo.membershipType || membershipInfo.membership_type || 'personal';
    const profileMembershipNumber = profile.membership_number || membershipInfo.membershipNumber || membershipInfo.membership_number || '';
    const membershipStatus = profile.membership_status || membershipInfo.membershipStatus || membershipInfo.membership_status || '';
    const joinDate = profile.join_date || membershipInfo.joinDate || membershipInfo.join_date || user.created_at;
    const membershipExpiry = profile.membership_expiry || membershipInfo.membershipExpiry || membershipInfo.membership_expiry;

    // Validate membership type
    const validMembershipTypes = ['personal', 'organization'];
    const finalMembershipType = validMembershipTypes.includes(membershipType.toLowerCase()) ? membershipType.toLowerCase() : 'personal';

    // Use membership number from users table first, then profile table
    let finalMembershipNumber = user.membership_number || profileMembershipNumber;
    
    // Set membership status based on user approval status
    let finalMembershipStatus = membershipStatus;
    if (!finalMembershipStatus) {
      finalMembershipStatus = user.is_approved ? 'active' : 'pending';
    }
    
    // Override with actual approval status to ensure consistency
    finalMembershipStatus = user.is_approved ? 'active' : 'pending';
    
    console.log('User approval status:', user.is_approved);
    console.log('Original membership status from DB:', membershipStatus);
    console.log('Final membership status:', finalMembershipStatus);
    
    // Only generate and store membership number if user is approved AND no existing number in either table
    if (!finalMembershipNumber && user.is_approved) {
      const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits
      const randomNum = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
      finalMembershipNumber = `TLA${year}${randomNum}`;
      
      // Store membership number in both tables for consistency
      try {
        // Store in users table
        await connection.query(
          'UPDATE users SET membership_number = ?, updated_at = NOW() WHERE id = ?',
          [finalMembershipNumber, userId]
        );
        
        // Also store in user_profiles table if it exists
        await connection.query(
          'UPDATE user_profiles SET membership_number = ?, updated_at = NOW() WHERE user_id = ?',
          [finalMembershipNumber, userId]
        );
        
        console.log('New TLA membership number stored in both tables:', finalMembershipNumber);
      } catch (dbError) {
        console.error('Failed to store membership number:', dbError);
        // Continue without storing, but log the error
      }
    } else if (finalMembershipNumber) {
      // Convert existing MEM numbers to TLA format if they exist
      if (finalMembershipNumber.startsWith('MEM')) {
        const existingYear = finalMembershipNumber.substring(3, 5); // Extract YY from MEMYYxxxx
        const existingNumber = finalMembershipNumber.substring(5); // Extract xxxxx
        finalMembershipNumber = `TLA${existingYear}${existingNumber}`;
        
        // Update both tables with new format
        try {
          await connection.query(
            'UPDATE users SET membership_number = ?, updated_at = NOW() WHERE id = ?',
            [finalMembershipNumber, userId]
          );
          
          await connection.query(
            'UPDATE user_profiles SET membership_number = ?, updated_at = NOW() WHERE user_id = ?',
            [finalMembershipNumber, userId]
          );
          
          console.log('Converted MEM to TLA format:', finalMembershipNumber);
        } catch (dbError) {
          console.error('Failed to convert membership number format:', dbError);
        }
      }
      console.log('Using existing membership number from database:', finalMembershipNumber);
    }

    // Calculate expiry date (1 year from approval date if not set)
    let finalExpiryDate = membershipExpiry;
    if (!finalExpiryDate && user.is_approved && joinDate) {
      const approvalDate = new Date(joinDate);
      approvalDate.setFullYear(approvalDate.getFullYear() + 1);
      approvalDate.setMonth(1, 1); // Set to February 1st
      finalExpiryDate = approvalDate.toISOString().split('T')[0];
    }

    const userData = {
      ...user,
      membership_number: finalMembershipNumber,
      profile: {
        personalInfo: {
          fullName: personalInfo.fullName || profile.name || user.name,
          gender: personalInfo.gender || profile.gender || '',
          dateOfBirth: personalInfo.dateOfBirth || personalInfo.date_of_birth || profile.date_of_birth || '',
          nationality: personalInfo.nationality || profile.nationality || '',
          placeOfBirth: personalInfo.placeOfBirth || profile.place_of_birth || '',
          profilePicture: personalInfo.profilePicture || profile.profile_picture || ''
        },
        contactInfo: {
          phone: contactInfo.phone || profile.phone || '',
          address: contactInfo.address || profile.address || '',
          city: contactInfo.city || profile.city || '',
          country: contactInfo.country || profile.country || '',
          postalCode: contactInfo.postalCode || profile.postal_code || '',
          socialMedia: contactInfo.socialMedia || {
            facebook: profile.facebook || '',
            twitter: profile.twitter || '',
            linkedin: profile.linkedin || '',
            instagram: profile.instagram || ''
          }
        },
        professionalInfo: professionalInfo || {
          occupation: profile.job_title || profile.current_position || '',
          employer: profile.company || '',
          workEmail: profile.work_email || '',
          yearsOfExperience: profile.years_of_experience || '',
          skills: profile.skills ? (Array.isArray(profile.skills) ? profile.skills : []) : []
        },
        membership: {
          ...membershipInfo,
          membershipType: finalMembershipType || '',
          membershipNumber: finalMembershipNumber || '',
          membershipStatus: finalMembershipStatus || '',
          joinDate: joinDate || '',
          expiryDate: finalExpiryDate || ''
        }
      }
    };

    console.log('Returning user data:', userData);

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: PoolConnection | null = null;
  
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, is_admin, is_approved } = body;

    connection = await pool.getConnection();

    const [result] = await connection.query<ResultSetHeader>(
      'UPDATE users SET name = ?, email = ?, is_admin = ?, is_approved = ?, updated_at = NOW() WHERE id = ?',
      [name, email, is_admin, is_approved, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User updated successfully',
      userId
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: PoolConnection | null = null;
  
  try {
    const { id } = params;
    const userId = parseInt(id, 10);
    
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || !(decoded as any).isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [users] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const user = users[0];
      
      await connection.query(
        `INSERT INTO deleted_users 
         (user_id, name, email, deleted_by, original_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          request.headers.get('x-user-id') || null,
          JSON.stringify(user)
        ]
      );

      const [result] = await connection.query<ResultSetHeader>(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        throw new Error('Failed to delete user');
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete user'
      },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}