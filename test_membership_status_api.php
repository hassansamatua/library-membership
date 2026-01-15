<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING MEMBERSHIP STATUS API ===\n\n";

// Test the membership status API directly
echo "1. Testing membership status API...\n";
$ch = curl_init('http://localhost:3000/api/membership/status');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Cookie: token=test_token'
]);

$statusResponse = curl_exec($ch);
$statusHttpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $statusHttpCode\n";
echo "Response: $statusResponse\n";

if ($statusHttpCode === 200) {
    echo "✅ Membership status API responding\n";
} else {
    echo "❌ Membership status API error (HTTP $statusHttpCode)\n";
    echo "Error details: $statusResponse\n";
}

echo "\n=== CONCLUSION ===\n";
echo "If API returns 200, then the issue is in the API logic.\n";
echo "If API returns 500, then there's a syntax or database error.\n";
?>
