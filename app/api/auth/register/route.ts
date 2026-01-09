import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.json();
    
    // Debug: Log received form data
    console.log('=== REGISTRATION FORM DATA RECEIVED ===');
    console.log('Full formData:', JSON.stringify(formData, null, 2));
    console.log('dateOfBirth:', formData.dateOfBirth);
    console.log('gender:', formData.gender);
    console.log('street:', formData.street);
    console.log('district:', formData.district);
    console.log('region:', formData.region);
    console.log('country:', formData.country);
    console.log('postalCode:', formData.postalCode);
    console.log('occupation:', formData.occupation);
    console.log('employerName:', formData.employerName);
    console.log('educationLevel:', formData.educationLevel);
    console.log('institutionName:', formData.institutionName);
    console.log('yearOfCompletion:', formData.yearOfCompletion);
    console.log('skills:', formData.skills);
    console.log('=== END FORM DATA ===');
    
    // Extract user data for users table
    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      nida: formData.nida,
      membership_type: formData.membershipType,
      phone_number: formData.phoneNumber,
      organization_name: formData.membershipType === 'organization' ? formData.organizationName : null,
      is_approved: false
    };

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    if (!formData.password || formData.password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user exists by email
    const [existingUsers] = await pool.query<import('mysql2').RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?', 
      [userData.email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Check if NIDA is already registered
    const [existingNida] = await pool.query<import('mysql2').RowDataPacket[]>(
      'SELECT id FROM users WHERE nida = ?',
      [userData.nida]
    );

    if (existingNida.length > 0) {
      return NextResponse.json(
        { message: 'This NIDA number is already registered' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(userData.password);
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table
      const [result] = await connection.query(
        `INSERT INTO users 
         (name, email, password, nida, membership_type, phone_number, organization_name, is_approved) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.name,
          userData.email,
          hashedPassword,
          userData.nida,
          userData.membership_type,
          userData.phone_number,
          userData.organization_name,
          userData.is_approved
        ]
      ) as any;

      const userId = result.insertId;

      // Prepare profile data for user_profiles table
      const profileData = {
        user_id: userId,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.street ? `${formData.street}${formData.houseNumber ? ' ' + formData.houseNumber : ''}` : null,
        city: formData.district || null,
        state: formData.region || null,
        country: formData.country || 'Tanzania',
        postal_code: formData.postalCode || null,
        job_title: formData.occupation || null,
        current_position: null,
        industry: formData.employerName || null,
        years_of_experience: null,
        skills: formData.skills || null,
        highest_degree: formData.educationLevel || null,
        field_of_study: null,
        institution: formData.institutionName || null,
        year_of_graduation: formData.yearOfCompletion || null,
        additional_certifications: null,
        areas_of_interest: null,
        id_proof_path: null,
        degree_certificates_path: null,
        cv_path: null,
        join_date: new Date().toISOString().split('T')[0]
      };

      // Insert into user_profiles table
      await connection.query(
        `INSERT INTO user_profiles 
         (${Object.keys(profileData).join(', ')})
         VALUES (${Object.keys(profileData).map(() => '?').join(', ')})`,
        Object.values(profileData)
      );

      // Commit the transaction
      await connection.commit();
      connection.release();

      return NextResponse.json(
        { message: 'Registration successful. Waiting for admin approval.' },
        { status: 201 }
      );
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      connection.release();
      console.error('Database error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}