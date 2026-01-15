<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING MEMBERSHIP NUMBERS IN DATABASE ===\n\n";

// Test all users
$stmt = $db->query('SELECT u.id, u.name, u.email, up.membership_number FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id ORDER BY u.id');

echo "All users and their membership numbers:\n";
echo "========================================\n";
while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $membershipNumber = $row['membership_number'] ?? 'NULL';
    $status = ($membershipNumber !== 'NULL' && $membershipNumber !== '') ? '✓' : '✗';
    echo "{$status} User {$row['id']} ({$row['name']}): {$membershipNumber}\n";
}

echo "\n=== TESTING API RESPONSE FORMAT ===\n";

// Test with user ID 2
$userId = 2;
$stmt2 = $db->prepare('SELECT u.id, u.name, u.email, u.is_admin, u.is_approved, up.membership_number, up.membership_type, up.membership_status, up.join_date, up.expiry_date FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = ? LIMIT 1');
$stmt2->execute([$userId]);

if ($row2 = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    echo "\nAPI Response for User {$userId}:\n";
    echo "Name: " . $row2['name'] . "\n";
    echo "Membership Number: " . ($row2['membership_number'] ?? 'NULL') . "\n";
    
    // Simulate the API response format
    $apiResponse = [
        'id' => $row2['id'],
        'name' => $row2['name'],
        'email' => $row2['email'],
        'isAdmin' => (bool)$row2['is_admin'],
        'isApproved' => (bool)$row2['is_approved'],
        'membershipNumber' => $row2['membership_number'] ?: null
    ];
    
    echo "Formatted membershipNumber: " . ($apiResponse['membershipNumber'] ?? 'NULL') . "\n";
}
?>
