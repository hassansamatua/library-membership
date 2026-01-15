<?php
require_once 'Database.php';

echo "=== TESTING DATABASE CONNECTION ===\n\n";

try {
    $database = new Database();
    $db = $database->getConnection();
    
    echo "✅ Database connection successful!\n";
    
    // Test simple query
    $result = $db->query("SELECT COUNT(*) as count FROM users WHERE id = 26");
    $count = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "User count: $count\n";
    
    // Test membership_payments table
    $result = $db->query("SELECT COUNT(*) as count FROM membership_payments WHERE user_id = 26");
    $count = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Payment records count: $count\n";
    
    // Test memberships table
    $result = $db->query("SELECT COUNT(*) as count FROM memberships WHERE user_id = 26");
    $count = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Membership records count: $count\n";
    
    echo "✅ All database operations successful!\n";
    
} catch (Exception $e) {
    echo "❌ Database connection error: " . $e->getMessage() . "\n";
}

echo "\n=== CONCLUSION ===\n";
echo "If database connection works, then the issue is in the TypeScript API compilation.\n";
echo "If database connection fails, then there's a database configuration issue.\n";
?>
