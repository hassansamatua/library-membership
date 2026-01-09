<?php
// Test membership status API for different users
$baseUrl = 'http://localhost:3000';

// Test users from the database
$testUsers = [
    ['id' => 2, 'name' => 'HASSANI SAID SAMATUA', 'email' => 'juma@gmail.com'],
    ['id' => 8, 'name' => 'hassan said samatua', 'email' => 'hassansamatua60@gmail.com'],
    ['id' => 23, 'name' => 'Abbas Omar Ali', 'email' => 'abbasamo@gmail.com'],
];

echo "=== TESTING MEMBERSHIP STATUS API ===\n\n";

foreach ($testUsers as $user) {
    echo "Testing user: {$user['name']} (ID: {$user['id']})\n";
    
    // Get a valid token for this user (you'll need to implement login or use existing token)
    // For now, let's test the API endpoint directly
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/membership/status');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        // Add authentication header here if needed
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    echo "HTTP Status: {$httpCode}\n";
    echo "Response: " . substr($response, 0, 200) . "...\n\n";
}

echo "=== MANUAL VERIFICATION ===\n";
echo "Please test the membership card access manually:\n";
echo "1. Log in as any of the users above\n";
echo "2. Navigate to /dashboard/membership-card\n";
echo "3. Check if the membership card is displayed\n";
echo "4. If you see 'Membership Card Not Available', the issue persists\n\n";

echo "Expected behavior:\n";
echo "- Users with completed payments should see their membership card\n";
echo '- Status should show "Active" with membership number\n';
echo "- Card should display user details and membership info\n";
?>
