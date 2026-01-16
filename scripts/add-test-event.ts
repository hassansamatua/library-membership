import { pool } from '@/lib/db';

async function addTestEvent() {
  const connection = await pool.getConnection();
  try {
    // Add a test event starting tomorrow
    const [result] = await connection.query(
      `INSERT INTO events 
      (title, description, start_time, end_time, location, capacity, status, created_at, updated_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY), 'TLA Office', 50, 'upcoming', NOW(), NOW())`,
      ['TLA Monthly Meetup', 'Join us for our monthly meetup with guest speakers and networking!']
    );
    
    console.log('Test event added successfully!', result);
  } catch (error) {
    console.error('Error adding test event:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

addTestEvent();
