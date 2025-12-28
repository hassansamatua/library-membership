// lib/membership.ts
import { pool } from './db';
import type { RowDataPacket } from 'mysql2';

export async function generateMembershipNumber(): Promise<string> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get or create sequence for current year
    const year = new Date().getFullYear().toString().slice(-2);
    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT last_number FROM membership_sequence WHERE year = ? FOR UPDATE',
      [year]
    ) as [RowDataPacket[], any];

    let nextNumber: number;
    
    if (rows.length === 0) {
      // First number for this year
      nextNumber = 1;
      await connection.query(
        'INSERT INTO membership_sequence (year, last_number) VALUES (?, ?)',
        [year, nextNumber]
      );
    } else {
      // Increment last number
      nextNumber = rows[0].last_number + 1;
      await connection.query(
        'UPDATE membership_sequence SET last_number = ? WHERE year = ?',
        [nextNumber, year]
      );
    }

    await connection.commit();
    
    // Format as MEMyyXXXXX (5 digits minimum)
    return `MEM${year}${nextNumber.toString().padStart(5, '0')}`;

  } catch (error) {
    await connection.rollback();
    console.error('Error generating membership number:', error);
    throw new Error('Failed to generate membership number');
  } finally {
    connection.release();
  }
}