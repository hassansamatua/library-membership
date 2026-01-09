<?php
// Test the reports API endpoint
$baseUrl = 'http://localhost:3000';

echo "=== TESTING REPORTS API ENDPOINT ===\n\n";

// Test the generate endpoint
echo "1. Testing POST /api/admin/reports/generate\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/admin/reports/generate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'reportType' => 'users',
    'startDate' => '2025-01-01',
    'endDate' => '2026-12-31',
    'columns' => ['name', 'email', 'membership_type']
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: {$httpCode}\n";
echo "Response: " . substr($response, 0, 1000) . "...\n\n";

// Test different report types
$reportTypes = ['users', 'payments', 'events', 'membership', 'activity'];

foreach ($reportTypes as $type) {
    echo "2. Testing report type: {$type}\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/admin/reports/generate');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'reportType' => $type,
        'startDate' => '2025-01-01',
        'endDate' => '2026-12-31'
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "  Status: {$httpCode} - ";
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo "✅ Success (" . ($data['data'] ? count($data['data']) : 0) . " records)\n";
    } else {
        echo "❌ Failed\n";
    }
}

echo "\n=== COMMON ISSUES ===\n";
echo "If reports are failing:\n";
echo "1. Check browser console for specific error messages\n";
echo "2. Verify user is logged in as admin\n";
echo "3. Check network tab for API response details\n";
echo "4. Ensure JWT token is valid and has admin rights\n";
echo "5. Check if required tables exist in database\n";
echo "6. Verify date format is YYYY-MM-DD\n\n";

echo "=== EXPECTED BEHAVIOR ===\n";
echo "- Admin should be able to generate reports\n";
echo "- Reports should return data in JSON format\n";
echo "- Should support: users, payments, events, membership, activity\n";
echo "- Should filter by date range\n";
echo "- Should handle missing dates gracefully\n";
?>
