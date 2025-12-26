import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(plainPassword: string, hashedPassword: string) {
  try {
    console.log('Comparing passwords...');
    console.log('Plain password (first 5 chars):', plainPassword.substring(0, 5) + '...');
    console.log('Hashed password (first 10 chars):', hashedPassword.substring(0, 10) + '...');
    
    // Check if hashed password starts with the bcrypt identifier
    if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$')) {
      console.error('Invalid hash format - not a bcrypt hash');
      return false;
    }
    
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    console.log('bcrypt.compare result:', result);
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function generateToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, isAdmin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

export function verifyToken(token: string) {
  try {
    if (!token) {
      console.error('No token provided');
      throw new Error('Authentication token is required');
    }

    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined');
      throw new Error('Server configuration error');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { 
      id: number; 
      email: string; 
      isAdmin: boolean;
      iat?: number;
      exp?: number;
    };

    // Log token expiration for debugging
    if (decoded.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      console.log(`Token expires in ${expiresIn} seconds`);
    }

    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error('Invalid or expired token');
  }
}

export interface User extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  is_admin: boolean;
  is_approved: boolean;
  created_at: Date;
}