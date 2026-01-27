<?php
// Test database connection from Node.js perspective
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Database Connection Test ===\n\n";
    
    // Test basic connection
    echo "1. Testing basic connection...\n";
    $stmt = $conn->query("SELECT 1 as test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   ✅ Connection successful: " . $result['test'] . "\n";
    
    // Test payment lookup
    echo "\n2. Testing payment lookup...\n";
    $stmt = $conn->prepare("SELECT id, user_id, reference FROM payments WHERE reference LIKE 'TEST%' LIMIT 1");
    $stmt->execute();
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($payment) {
        echo "   ✅ Found test payment: ID {$payment['id']}, User {$payment['user_id']}, Ref {$payment['reference']}\n";
    } else {
        echo "   ❌ No test payment found\n";
    }
    
    // Test transaction
    echo "\n3. Testing transaction...\n";
    try {
        $conn->beginTransaction();
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE id = ?");
        $stmt->execute([1]);
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $conn->commit();
        echo "   ✅ Transaction successful: User count = {$count['count']}\n";
    } catch (Exception $e) {
        $conn->rollback();
        echo "   ❌ Transaction failed: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== Database Test Complete ===\n";
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}
?>
