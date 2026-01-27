<?php
// Test the active members API query
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Testing Active Members Query ===\n\n";
    
    // Test the exact query from the API
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
      INNER JOIN users u ON m.user_id = u.id
      WHERE m.status = 'active' 
      AND m.expiry_date >= CURDATE()
      ORDER BY m.created_at DESC
      LIMIT 50
    ");
    
    $activeMembers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($activeMembers) . " active members:\n\n";
    
    foreach ($activeMembers as $member) {
        echo "ID: {$member['id']}\n";
        echo "Name: {$member['name']}\n";
        echo "Email: {$member['email']}\n";
        echo "Membership Number: {$member['membership_number']}\n";
        echo "Type: {$member['membership_type']}\n";
        echo "Status: {$member['status']}\n";
        echo "Expires: {$member['expiry_date']}\n";
        echo "Joined: {$member['joined_date']}\n";
        echo "Payment Status: {$member['payment_status']}\n";
        echo "---\n";
    }
    
    echo "\n=== API Response Test ===\n";
    echo "This query should return the same data as the API endpoint.\n";
    echo "The admin reports page should now show this member list.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
