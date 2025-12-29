// lib/db.ts
import mysql from 'mysql2/promise';

// Create a connection pool
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'next_auth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true
});

// Helper function to get a connection
export const getConnection = () => pool.getConnection();

// Helper function for queries
export const query = async (sql: string, params: any[] = []) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(sql, params);
    return rows;
  } finally {
    connection.release();
  }
};

// Helper function for transactions
export const executeInTransaction = async (callback: (connection: any) => Promise<any>) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// For backward compatibility
export const connectToDatabase = async () => {
  const connection = await pool.getConnection();
  return {
    ...connection,
    release: () => connection.release(),
    query: (sql: string, values?: any) => connection.query(sql, values)
  };
};

export default pool;