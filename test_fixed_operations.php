<?php
// Test the fixed database operations
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Testing Fixed Database Operations ===\n\n";
    
    // Get the test payment
    echo "1. Finding test payment...\n";
    $stmt = $conn->query("SELECT id, user_id, reference, amount, status FROM payments WHERE reference LIKE 'TEST%' ORDER BY created_at DESC LIMIT 1");
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$payment) {
        echo "   ❌ No test payment found. Run create_test_payment.php first.\n";
        exit;
    }
    
    echo "   ✅ Found test payment: {$payment['reference']}\n";
    
    $userId = $payment['user_id'];
    $reference = $payment['reference'];
    $cycleYear = 2025; // Membership cycle year (Jan 2026 = 2025 cycle)
    $expiryYear = $cycleYear + 1;
    $membershipNumber = 'TLA' . substr($cycleYear, -2) . rand(10000, 99999);
    
    echo "\n2. Testing database operations with correct column names...\n";
    
    try {
        $conn->beginTransaction();
        
        // Test membership_payments insert (using 'reference' not 'payment_reference')
        $stmt = $conn->prepare("INSERT INTO membership_payments (user_id, amount, payment_method, reference, payment_date, status, cycle_year, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), 'completed', ?, NOW(), NOW())");
        $stmt->execute([$userId, $payment['amount'], 'test', $reference, $cycleYear]);
        echo "   ✅ membership_payments record created\n";
        
        // Test payments update (using correct JOIN)
        $stmt = $conn->prepare("UPDATE payments p INNER JOIN membership_payments mp ON p.reference = mp.reference SET p.status = mp.status, p.paid_at = mp.payment_date, p.updated_at = NOW() WHERE p.id = ? AND p.user_id = ?");
        $stmt->execute([$payment['id'], $userId]);
        echo "   ✅ payments table updated\n";
        
        // Test memberships insert
        $stmt = $conn->prepare("INSERT INTO memberships (user_id, membership_number, membership_type, status, payment_status, payment_date, reference, payment_method, expiry_date, amount_paid, cycle_year, created_at, updated_at) VALUES (?, ?, ?, 'active', 'paid', NOW(), ?, ?, DATE(CONCAT(?, '-01-31')), ?, ?, NOW(), NOW())");
        $stmt->execute([$userId, $membershipNumber, 'personal', $reference, 'test', $expiryYear, $payment['amount'], $cycleYear]);
        echo "   ✅ memberships record created\n";
        
        $conn->commit();
        echo "   ✅ All database operations successful\n";
        
        // Verify results
        echo "\n3. Verification:\n";
        
        $stmt = $conn->prepare("SELECT * FROM membership_payments WHERE reference = ?");
        $stmt->execute([$reference]);
        $mpRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($mpRecord) {
            echo "   ✅ membership_payments: ID {$mpRecord['id']}, Status {$mpRecord['status']}, Cycle {$mpRecord['cycle_year']}\n";
        }
        
        $stmt = $conn->prepare("SELECT * FROM payments WHERE reference = ?");
        $stmt->execute([$reference]);
        $pRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($pRecord) {
            echo "   ✅ payments: Status {$pRecord['status']}, Paid at {$pRecord['paid_at']}\n";
        }
        
        $stmt = $conn->prepare("SELECT * FROM memberships WHERE reference = ?");
        $stmt->execute([$reference]);
        $mRecord = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($mRecord) {
            echo "   ✅ memberships: {$mRecord['membership_number']}, Status {$mRecord['status']}, Expires {$mRecord['expiry_date']}\n";
        }
        
        echo "\n=== ALL TESTS PASSED ===\n";
        echo "The activate-test endpoint should now work!\n";
        echo "Test with reference: {$reference}\n";
        
    } catch (Exception $e) {
        $conn->rollback();
        echo "   ❌ Database operation failed: " . $e->getMessage() . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
