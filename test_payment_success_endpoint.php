<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING PAYMENT SUCCESS ENDPOINT ===\n\n";

// Test the payment success endpoint directly
$paymentReference = 'TEST-1767482190501';
$amount = 40000;
$paymentMethod = 'test';

echo "1. Testing payment success endpoint...\n";

// Prepare the data that should be sent
$data = [
    'paymentReference' => $paymentReference,
    'amount' => $amount,
    'paymentMethod' => $paymentMethod
];

// Convert to JSON
$jsonData = json_encode($data);

// Use cURL to test the endpoint
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
        echo "✅ Payment success endpoint working!\n";
        echo "Response contains 'success': true\n";
    } else {
        echo "❌ Payment success endpoint not working properly\n";
        echo "Response: $response\n";
    }
} else {
    echo "❌ Payment success endpoint not responding (HTTP $httpCode)\n";
}

// Clean up test data
echo "\n=== CLEANUP ===\n";
$db->exec("DELETE FROM membership_payments WHERE reference = '$paymentReference'");
$db->exec("UPDATE memberships SET payment_status = 'pending', status = 'pending', payment_date = NULL, amount_paid = 0, reference = NULL WHERE user_id = 26");
?>
