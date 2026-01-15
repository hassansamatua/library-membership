<?php
// Simulate the exact same logic as /api/auth/me.php but without JWT
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING /api/auth/me.php LOGIC ===\n";

// Test with user ID 26 (eg eg eg)
$userId = 26;

$query = 'SELECT u.id, u.name, u.email, u.is_admin, u.is_approved, up.membership_number, up.membership_type, up.membership_status, up.join_date, up.membership_expiry 
           FROM users u 
           LEFT JOIN user_profiles up ON u.id = up.user_id 
           WHERE u.id = ? LIMIT 1';
$stmt = $db->prepare($query);
$stmt->execute([$userId]);

if ($stmt->rowCount() > 0) {
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "Raw database row:\n";
    print_r($row);
    
    echo "\nFormatted response (same as /api/auth/me.php):\n";
    $response = [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'isAdmin' => (bool)$row['is_admin'],
        'isApproved' => (bool)$row['is_approved'],
        'membershipNumber' => $row['membership_number'] ?: $row['membership_number'], // Prioritize user_profiles data
        'membershipType' => $row['membership_type'] ?: null,
        'membershipStatus' => $row['membership_status'] ?: null,
        'joinDate' => $row['join_date'] ?: null,
        'expiryDate' => $row['membership_expiry'] ?: null
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
    echo "\n\nSpecific membershipNumber value: " . ($response['membershipNumber'] ?? 'NULL') . "\n";
    echo "Type of membershipNumber: " . gettype($response['membershipNumber']) . "\n";
} else {
    echo "User not found!\n";
}
?>
