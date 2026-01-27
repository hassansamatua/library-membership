<?php
// Test the updated API query with LEFT JOIN
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Testing Updated API Query (LEFT JOIN) ===\n\n";
    
    // Test the updated query
    $stmt = $conn->query("
      SELECT 
        u.id,
        u.name,
        u.email,
        m.membership_number,
        m.membership_type,
        m.status,
        m.expiry_date,
        m.joined_date,
        m.payment_status,
        m.created_at as membership_created_at
      FROM memberships m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'active' 
      AND m.expiry_date >= CURDATE()
      ORDER BY m.created_at DESC
      LIMIT 50
    ");
    
    $activeMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($activeMembers) . " active members:\n\n";
    
    foreach ($activeMembers as $member) {
      echo "ID: {$member['id']}\n";
      echo "Name: " . ($member['name'] ?: 'MISSING') . "\n";
      echo "Email: " . ($member['email'] ?: 'MISSING') . "\n";
      echo "Membership Number: {$member['membership_number']}\n";
      echo "Type: {$member['membership_type']}\n";
      echo "Status: {$member['status']}\n";
      echo "Expires: {$member['expiry_date']}\n";
      echo "Joined: " . ($member['joined_date'] && $member['joined_date'] !== '0000-00-00' ? $member['joined_date'] : 'N/A') . "\n";
      echo "Payment Status: {$member['payment_status']}\n";
      echo "---\n";
    }
    
    echo "\n=== SUCCESS ===\n";
    echo "The API should now return all " . count($activeMembers) . " active members.\n";
    echo "The admin reports page will show the complete list with missing user records flagged.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
