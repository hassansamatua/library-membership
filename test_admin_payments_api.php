<?php
// Test the admin payments API endpoint
$baseUrl = 'http://localhost:3000';

echo "=== TESTING ADMIN PAYMENTS API ===\n\n";

// Test the list endpoint
echo "1. Testing GET /api/admin/payments/list\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/admin/payments/list');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: {$httpCode}\n";
echo "Response: " . substr($response, 0, 500) . "...\n\n";

// Test with authentication (this would require a valid admin token)
echo "2. Testing with admin authentication (requires valid token)\n";
echo "Note: This test requires a valid admin JWT token\n";
echo "The frontend should handle authentication automatically\n\n";

echo "=== EXPECTED BEHAVIOR ===\n";
echo "- Admin users should be able to access /admin/payments\n";
echo "- Should see list of all payments with user details\n";
echo "- Should be able to filter by status, membership type, and date\n";
echo "- Should be able to export payments as CSV\n";
echo "- Should see payment statistics (revenue, counts)\n\n";

echo "=== TROUBLESHOOTING ===\n";
echo "If still seeing 'Failed to load payments':\n";
echo "1. Check browser console for specific error\n";
echo "2. Verify admin user is logged in\n";
echo "3. Check network tab for API response\n";
echo "4. Ensure JWT token is valid and user has admin rights\n";
?>
