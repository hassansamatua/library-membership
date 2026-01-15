<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SIMPLE API TEST ===\n\n";

// Test user 26
$userId = 26;

echo "1. Testing database connection...\n";
try {
    // Test simple query
    $result = $db->query("SELECT COUNT(*) as count FROM users WHERE id = $userId");
    $count = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "User count: $count\n";
    
    // Test membership query
    $result = $db->query("SELECT COUNT(*) as count FROM memberships WHERE user_id = $userId");
    $membershipCount = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Membership count: $membershipCount\n";
    
    // Test payment query
    $result = $db->query("SELECT COUNT(*) as count FROM membership_payments WHERE user_id = $userId AND status = 'completed'");
    $paymentCount = $result->fetch(PDO::FETCH_ASSOC)['count'];
    echo "Completed payment count: $paymentCount\n";
    
    echo "✅ Database connection working!\n";
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
}

echo "\n=== CONCLUSION ===\n";
echo "If database connection works, then the issue is in the TypeScript API logic.\n";
echo "If database connection fails, then there's a database configuration issue.\n";
?>
