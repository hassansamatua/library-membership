<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SIMPLE PAYMENT SUCCESS TEST ===\n\n";

// Test the exact SQL query that's failing
$userId = 26;
$paymentReference = 'TEST-1768482190501';
$amount = 40000;

echo "1. Testing simple SQL update...\n";

// Simple test - just update memberships table
$sql = "UPDATE memberships SET payment_status = 'paid', status = 'active', payment_date = NOW(), amount_paid = ?, payment_reference = ? WHERE user_id = ?";
$stmt = $db->prepare($sql);
$result = $stmt->execute([$amount, $paymentReference, $userId]);

if ($result) {
    echo "✅ Simple SQL update successful!\n";
    echo "Updated rows: " . $stmt->rowCount() . "\n";
} else {
    echo "❌ Simple SQL update failed\n";
    echo "Error: " . $stmt->errorInfo()[2] . "\n";
}

echo "\n=== CONCLUSION ===\n";
echo "If simple update works, the issue is in the complex payment success API.\n";
?>
