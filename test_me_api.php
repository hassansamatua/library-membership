<?php
require_once 'Database.php';
require_once 'jwt.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING /api/auth/me ENDPOINT ===\n\n";

// Test with user ID 2 (HASSANI SAID SAMATUA who has TLA2500010)
$userId = 2;

$query = 'SELECT u.id, u.name, u.email, u.is_admin, u.is_approved, up.membership_number, up.membership_type, up.membership_status, up.join_date, up.expiry_date 
           FROM users u 
           LEFT JOIN user_profiles up ON u.id = up.user_id 
           WHERE u.id = ? LIMIT 1';
$stmt = $db->prepare($query);
$stmt->execute([$userId]);

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Raw database data for User ID {$userId}:\n";
    echo "Name: " . $row['name'] . "\n";
    echo "Email: " . $row['email'] . "\n";
    echo "Membership Number: " . ($row['membership_number'] ?? 'NULL') . "\n";
    echo "Membership Type: " . ($row['membership_type'] ?? 'NULL') . "\n";
    echo "Membership Status: " . ($row['membership_status'] ?? 'NULL') . "\n";
    echo "Join Date: " . ($row['join_date'] ?? 'NULL') . "\n";
    echo "Expiry Date: " . ($row['expiry_date'] ?? 'NULL') . "\n";
    
    echo "\nFormatted API response:\n";
    $apiResponse = [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'isAdmin' => (bool)$row['is_admin'],
        'isApproved' => (bool)$row['is_approved'],
        'membershipNumber' => $row['membership_number'] ?: $row['membership_number'],
        'membershipType' => $row['membership_type'] ?: null,
        'membershipStatus' => $row['membership_status'] ?: null,
        'joinDate' => $row['join_date'] ?: null,
        'expiryDate' => $row['expiry_date'] ?: null
    ];
    
    echo json_encode($apiResponse, JSON_PRETTY_PRINT);
} else {
    echo "User not found!\n";
}

echo "\n\n=== TESTING ALL USERS ===\n";
$stmt2 = $db->query('SELECT u.id, u.name, up.membership_number FROM users u LEFT JOIN user_profiles up ON u.id = up.user_id ORDER BY u.id LIMIT 5');
while($row = $stmt2->fetch(PDO::FETCH_ASSOC)) {
    echo "User {$row['id']} ({$row['name']}): " . ($row['membership_number'] ?? 'NULL') . "\n";
}
?>
