<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== FINAL PAYMENT FLOW TEST ===\n\n";

// Test the complete payment flow
$userId = 26;
$paymentReference = 'TEST-1768482190501';
$amount = 40000;

echo "1. Testing complete payment flow...\n";

// Step 1: Insert payment record
echo "Inserting payment record...\n";
$insertPaymentQuery = "INSERT INTO membership_payments (user_id, amount, payment_method, reference, payment_date, status, cycle_year, created_at) VALUES (?, ?, ?, ?, NOW(), 'completed', 2025, NOW())";
$insertPaymentStmt = $db->prepare($insertPaymentQuery);
$insertPaymentStmt->execute([$userId, $amount, 'test', $paymentReference]);

$paymentId = $db->lastInsertId();
echo "Payment record inserted with ID: $paymentId\n";

// Step 2: Update membership record
echo "Updating membership record...\n";
$updateMembershipQuery = "UPDATE memberships SET payment_status = 'paid', status = 'active', payment_date = NOW(), amount_paid = ?, payment_reference = ? WHERE user_id = ?";
$updateMembershipStmt = $db->prepare($updateMembershipQuery);
$updateMembershipStmt->execute([$amount, $paymentReference, $userId]);

echo "Membership record updated\n";

// Step 3: Test membership status API
echo "\n3. Testing membership status API...\n";
$ch = curl_init('http://localhost:3000/api/membership/status');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Cookie: token=test_token'
]);

$statusResponse = curl_exec($ch);
$statusHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "Membership Status HTTP Code: $statusHttpCode\n";
echo "Membership Status Response: $statusResponse\n";

if ($statusHttpCode === 200) {
    $statusData = json_decode($statusResponse, true);
    if ($statusData && isset($statusData['success']) && $statusData['success']) {
        echo "✅ Membership status API working!\n";
        echo "canAccessIdCard: " . ($statusData['canAccessIdCard'] ? 'true' : 'false') . "\n";
        echo "hasCompletedPayment: " . (isset($statusData['hasCompletedPayment']) ? $statusData['hasCompletedPayment'] : 'false') . "\n";
        echo "membershipActive: " . (isset($statusData['membershipActive']) ? $statusData['membershipActive'] : 'false') . "\n";
        
        if ($statusData['canAccessIdCard']) {
            echo "✅ User CAN access membership card!\n";
        } else {
            echo "❌ User CANNOT access membership card\n";
        }
    } else {
        echo "❌ Membership status API not working properly\n";
    }
} else {
    echo "❌ Membership status API not responding (HTTP $statusHttpCode)\n";
}

echo "\n=== CLEANUP ===\n";
$db->exec("DELETE FROM membership_payments WHERE reference = '$paymentReference'");
$db->exec("UPDATE memberships SET payment_status = 'pending', status = 'pending', payment_date = NULL, amount_paid = 0, payment_reference = NULL WHERE user_id = $userId");

echo "Test data cleaned up\n";
echo "\n=== CONCLUSION ===\n";
echo "If membership status API returns canAccessIdCard: true, then the payment system is working!\n";
echo "If it returns false, then there's still an issue with the API logic.\n";
?>
