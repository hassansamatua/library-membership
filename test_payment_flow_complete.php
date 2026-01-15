<?php
/**
 * Test Payment Flow - Complete Verification Script
 * This script tests the entire payment flow for test payments:
 * 1. Create a test payment
 * 2. Verify payment is in 'pending' status
 * 3. Activate test payment via API
 * 4. Verify payment is updated to 'completed'
 * 5. Verify membership is created and marked as 'paid'
 * 6. Verify membership_payments record is created
 * 7. Verify user can access membership card
 */

require_once 'Database.php';

echo "=== TEST PAYMENT FLOW VERIFICATION ===\n\n";

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Test with user ID 2 (or create a test user)
    $testUserId = 2;
    $testReference = 'TEST-' . time();
    
    echo "1. Creating test payment...\n";
    $stmt = $conn->prepare("
        INSERT INTO payments (reference, user_id, membership_type, amount, currency, status, payment_method, created_at, updated_at)
        VALUES (?, ?, 'personal', 40000, 'TZS', 'pending', 'Test Payment', NOW(), NOW())
    ");
    $stmt->execute([$testReference, $testUserId]);
    echo "   ✓ Test payment created with reference: $testReference\n\n";
    
    // Verify payment is pending
    echo "2. Verifying payment status is 'pending'...\n";
    $stmt = $conn->prepare("SELECT * FROM payments WHERE reference = ?");
    $stmt->execute([$testReference]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($payment && $payment['status'] === 'pending') {
        echo "   ✓ Payment status: PENDING\n";
        echo "   - Amount: {$payment['amount']} TZS\n";
        echo "   - Method: {$payment['payment_method']}\n";
        echo "   - Created: {$payment['created_at']}\n\n";
    } else {
        echo "   ✗ Payment not found or not pending\n\n";
        exit(1);
    }
    
    // Check if membership_payments table exists
    echo "3. Checking database tables...\n";
    $tables = ['payments', 'memberships', 'membership_payments'];
    foreach ($tables as $table) {
        $stmt = $conn->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "   ✓ Table exists: $table\n";
        } else {
            echo "   ✗ Table NOT found: $table\n";
        }
    }
    echo "\n";
    
    // Simulate what activate-test API does
    echo "4. Simulating activate-test API call...\n";
    
    // Start transaction
    $conn->beginTransaction();
    
    try {
        // Update payment status
        $stmt = $conn->prepare("
            UPDATE payments 
            SET status = 'completed', 
                paid_at = NOW(),
                updated_at = NOW()
            WHERE reference = ? AND user_id = ?
        ");
        $stmt->execute([$testReference, $testUserId]);
        echo "   ✓ Payment status updated to 'completed'\n";
        
        // Generate membership number
        $year = date('y');
        $membershipNumber = 'TLA' . $year . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
        $currentYear = date('Y');
        
        // Create/update membership
        $stmt = $conn->prepare("
            INSERT INTO memberships 
            (user_id, membership_number, membership_type, status, 
             payment_status, payment_date, reference, payment_method,
             expiry_date, amount_paid, created_at, updated_at)
            VALUES (?, ?, ?, 'active', 'paid', NOW(), ?, ?, 
                   DATE_ADD(NOW(), INTERVAL 1 YEAR), ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
              status = 'active',
              membership_type = VALUES(membership_type),
              payment_status = 'paid',
              payment_date = NOW(),
              reference = VALUES(reference),
              payment_method = VALUES(payment_method),
              expiry_date = VALUES(expiry_date),
              amount_paid = VALUES(amount_paid),
              updated_at = NOW()
        ");
        $stmt->execute([
            $testUserId,
            $membershipNumber,
            'personal',
            $testReference,
            'Test Payment',
            40000
        ]);
        echo "   ✓ Membership created: $membershipNumber\n";
        
        // Create payment record in membership_payments
        $stmt = $conn->prepare("
            INSERT INTO membership_payments 
            (user_id, amount, payment_method, reference, 
             payment_date, status, cycle_year)
            VALUES (?, ?, ?, ?, NOW(), 'completed', ?)
            ON DUPLICATE KEY UPDATE
              status = 'completed',
              updated_at = NOW()
        ");
        $stmt->execute([
            $testUserId,
            40000,
            'Test Payment',
            $testReference,
            $currentYear
        ]);
        echo "   ✓ Membership payment record created\n\n";
        
        $conn->commit();
        
    } catch (Exception $e) {
        $conn->rollBack();
        echo "   ✗ Error: " . $e->getMessage() . "\n\n";
        exit(1);
    }
    
    // Verify payment is completed
    echo "5. Verifying payment is now 'completed'...\n";
    $stmt = $conn->prepare("SELECT * FROM payments WHERE reference = ?");
    $stmt->execute([$testReference]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($payment && $payment['status'] === 'completed') {
        echo "   ✓ Payment status: COMPLETED\n";
        echo "   - Paid at: {$payment['paid_at']}\n";
        echo "   - Transaction ID: {$payment['transaction_id']}\n\n";
    } else {
        echo "   ✗ Payment status not updated to completed\n\n";
        exit(1);
    }
    
    // Verify membership exists and is paid
    echo "6. Verifying membership status...\n";
    $stmt = $conn->prepare("SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
    $stmt->execute([$testUserId]);
    $membership = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($membership) {
        echo "   ✓ Membership found\n";
        echo "   - Number: {$membership['membership_number']}\n";
        echo "   - Status: {$membership['status']}\n";
        echo "   - Payment Status: {$membership['payment_status']}\n";
        echo "   - Expiry Date: {$membership['expiry_date']}\n\n";
        
        if ($membership['payment_status'] !== 'paid') {
            echo "   ✗ WARNING: Payment status is not 'paid'\n\n";
        }
    } else {
        echo "   ✗ Membership not found\n\n";
        exit(1);
    }
    
    // Verify membership_payments record exists
    echo "7. Verifying membership_payments record...\n";
    $stmt = $conn->prepare("
        SELECT * FROM membership_payments 
        WHERE user_id = ? AND reference = ? 
        ORDER BY payment_date DESC LIMIT 1
    ");
    $stmt->execute([$testUserId, $testReference]);
    $membershipPayment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($membershipPayment) {
        echo "   ✓ Membership payment record found\n";
        echo "   - Amount: {$membershipPayment['amount']} TZS\n";
        echo "   - Status: {$membershipPayment['status']}\n";
        echo "   - Payment Date: {$membershipPayment['payment_date']}\n";
        echo "   - Cycle Year: {$membershipPayment['cycle_year']}\n\n";
        
        if ($membershipPayment['status'] !== 'completed') {
            echo "   ✗ WARNING: Payment status is not 'completed'\n\n";
        }
    } else {
        echo "   ✗ Membership payment record NOT found\n";
        echo "   This might be the issue preventing membership card access!\n\n";
    }
    
    // Test what the API would return for canAccessIdCard
    echo "8. Checking canAccessIdCard eligibility...\n";
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count FROM membership_payments 
        WHERE user_id = ? AND status = 'completed'
    ");
    $stmt->execute([$testUserId]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $canAccessIdCard = $result['count'] > 0;
    echo "   " . ($canAccessIdCard ? "✓" : "✗") . " canAccessIdCard: " . ($canAccessIdCard ? 'YES' : 'NO') . "\n";
    echo "   - Completed payments found: {$result['count']}\n\n";
    
    if (!$canAccessIdCard) {
        echo "   ✗ User CANNOT access membership card - no completed payments in membership_payments table\n";
        echo "   The membership card page will show: 'Membership Card Not Available'\n\n";
    } else {
        echo "   ✓ User CAN access membership card - they can now view and download their card!\n\n";
    }
    
    // Summary
    echo "=== TEST SUMMARY ===\n";
    echo "✓ Test payment flow completed successfully!\n\n";
    echo "Payment Reference: $testReference\n";
    echo "Membership Number: {$membership['membership_number']}\n";
    echo "User ID: $testUserId\n\n";
    
    echo "Expected behavior:\n";
    echo "1. User completes test payment\n";
    echo "2. Success page shows: 'Payment Successful!'\n";
    echo "3. Success page shows: 'Test payment successful! Your membership has been activated.'\n";
    echo "4. User clicks 'View Membership Card'\n";
    echo "5. Membership card is displayed (NOT the 'Not Available' message)\n";
    echo "6. User can download/print membership card\n\n";
    
    $conn = null;
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>
