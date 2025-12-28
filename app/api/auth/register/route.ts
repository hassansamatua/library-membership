import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { pool } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { 
      name, 
      email, 
      password, 
      nida, 
      membershipType, 
      phoneNumber, 
      organizationName 
    } = await req.json();
    
    const hashedPassword = await hashPassword(password);
    
    // Check if user exists by email
    const [existingUsers] = await pool.query<import('@/lib/auth').User[]>(
      'SELECT id FROM users WHERE email = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'Email is already registered' },
        { status: 400 }
      );
    }

    // Check if NIDA is already registered
    const [existingNida] = await pool.query<{id: number}[]>(
      'SELECT id FROM users WHERE nida = ?',
      [nida]
    );

    if (existingNida.length > 0) {
      return NextResponse.json(
        { message: 'This NIDA number is already registered' },
        { status: 400 }
      );
    }

    // Create new user (not approved by default)
    await pool.query(
      `INSERT INTO users 
       (name, email, password, nida, membership_type, phone_number, organization_name, is_approved) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        email, 
        hashedPassword, 
        nida, 
        membershipType, 
        phoneNumber, 
        membershipType === 'organization' ? organizationName : null,
        false // Not approved by default
      ]
    );

    return NextResponse.json(
      { message: 'Registration successful. Waiting for admin approval.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}