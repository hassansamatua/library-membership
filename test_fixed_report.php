<?php
// Test the fixed report generation
$baseUrl = 'http://localhost:3000';

echo "=== TESTING FIXED REPORT GENERATION ===\n\n";

// Test the payments report specifically (the one that was failing)
echo "Testing payments report (previously failing):\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/admin/reports/generate');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'reportType' => 'payments',
    'startDate' => '2025-12-01',
    'endDate' => '2026-01-09',
    'columns' => ['name', 'email', 'amount', 'status']
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: {$httpCode}\n";
echo "Response: " . substr($response, 0, 1000) . "...\n\n";

if ($httpCode === 200) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        echo "✅ SUCCESS: Report generated!\n";
        echo "Record Count: " . ($data['recordCount'] ?? 0) . "\n";
        echo "Report Type: " . ($data['reportType'] ?? 'Unknown') . "\n";
        echo "Generated At: " . ($data['generatedAt'] ?? 'Unknown') . "\n";
    } else {
        echo "❌ FAILED: API returned success=false\n";
        echo "Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ FAILED: HTTP {$httpCode}\n";
    $errorData = json_decode($response, true);
    if ($errorData && isset($errorData['message'])) {
        echo "Error Message: " . $errorData['message'] . "\n";
    }
}

echo "\n=== TESTING OTHER REPORT TYPES ===\n";

$reportTypes = ['users', 'events', 'membership'];
foreach ($reportTypes as $type) {
    echo "\nTesting {$type} report:\n";
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

    if ($httpCode === 200) {
        $data = json_decode($response, true);
        echo "  ✅ {$type}: " . ($data['recordCount'] ?? 0) . " records\n";
    } else {
        echo "  ❌ {$type}: HTTP {$httpCode}\n";
    }
}

echo "\n=== NEXT STEPS ===\n";
echo "1. Log in as admin user in the browser\n";
echo "2. Navigate to /admin/reports\n";
echo "3. Try generating a payments report\n";
echo "4. Should work without the 'description' column error\n";
echo "5. Check browser console for any remaining issues\n";
?>
