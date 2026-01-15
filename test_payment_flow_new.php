<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING PAYMENT FLOW ===\n\n";

// Define variables at the top
$userId = 26;
$paymentReference = 'TEST-1768482190501';
$amount = 40000;
$paymentMethod = 'test';

echo "1. Testing NEW payment success endpoint...\n";

// Prepare the data that should be sent
$data = [
    'paymentReference' => $paymentReference,
    'amount' => $amount,
    'paymentMethod' => $paymentMethod
];

// Convert to JSON
$jsonData = json_encode($data);

// Use cURL to test the NEW endpoint
$ch = curl_init('http://localhost:3000/api/membership/payment-success');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Cookie: token=test_token' // You'll need to replace this with a valid token
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 200) {
    $responseData = json_decode($response, true);
    if ($responseData && isset($responseData['success']) && $responseData['success']) {
        echo "✅ NEW payment success endpoint working!\n";
        echo "Response contains 'success': true\n";
    } else {
        echo "❌ NEW payment success endpoint not working\n";
        echo "Response: $response\n";
    }
} else {
    echo "❌ NEW payment success endpoint not responding (HTTP $httpCode)\n";
}

$db->exec("UPDATE memberships SET payment_status = 'pending', status = 'pending', payment_date = NULL, amount_paid = 0, reference = NULL WHERE user_id = $userId");

echo "Membership record updated\n";

// Now test what the API returns
echo "\n2. Testing API response after payment simulation...\n";

// Get latest completed payment
$completedPaymentQuery = "SELECT * FROM membership_payments WHERE user_id = ? AND status = 'completed' ORDER BY payment_date DESC LIMIT 1";
$completedPaymentStmt = $db->prepare($completedPaymentQuery);
$completedPaymentStmt->execute([$userId]);
$completedPayment = $completedPaymentStmt->fetch(PDO::FETCH_ASSOC);

// Get latest membership
$membershipQuery = "SELECT * FROM memberships WHERE user_id = ? ORDER BY expiry_date DESC LIMIT 1";
$membershipStmt = $db->prepare($membershipQuery);
$membershipStmt->execute([$userId]);
$membership = $membershipStmt->fetch(PDO::FETCH_ASSOC);

$hasCompletedPayment = !empty($completedPayment);
$membershipActive = $membership && $membership['status'] === 'active' && $membership['payment_status'] === 'paid';

$canAccessIdCard = $hasCompletedPayment && $membershipActive;

echo "API Response after payment simulation:\n";
echo "  success: true\n";
echo "  canAccessIdCard: " . ($canAccessIdCard ? 'true' : 'false') . "\n";
echo "  hasCompletedPayment: " . ($hasCompletedPayment ? 'true' : 'false') . "\n";
echo "  membershipActive: " . ($membershipActive ? 'true' : 'false') . "\n";

if ($membership) {
    echo "  membership: {\n";
    echo "    membershipNumber: {$membership['membership_number']}\n";
    echo "    membershipType: {$membership['membership_type']}\n";
    echo "    status: {$membership['status']}\n";
    echo "    paymentStatus: {$membership['payment_status']}\n";
    echo "  }\n";
}

echo "\n=== CLEANUP ===\n";
// Clean up test data
$db->exec("DELETE FROM membership_payments WHERE payment_reference = 'TEST-1768482190501'");
$db->exec("UPDATE memberships SET payment_status = 'pending', status = 'pending', payment_date = NULL, amount_paid = 0, payment_reference = NULL WHERE user_id = $userId");

echo "Test data cleaned up\n";
echo "\n=== CONCLUSION ===\n";
if ($canAccessIdCard) {
    echo "✅ After payment simulation, user SHOULD be able to access membership card\n";
} else {
    echo "❌ After payment simulation, user will NOT be able to access membership card\n";
}

echo "\nNext steps:\n";
echo "1. Check if payment success API is actually being called after payment\n";
echo "2. Verify payment data is being stored correctly\n";
echo "3. Test membership card page after running this script\n";
?>
