<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== UPDATING APPROVAL PROCESS TO USE RANDOM NUMBERS ===\n\n";

// This function can be used when approving users
function generateRandomMembershipNumber($db) {
    $year = date('y');
    $randomNumber = str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
    return "TLA{$year}{$randomNumber}";
}

// Example: How to use this when approving a user
echo "Example function for approving users:\n";
echo "function approveUser(\$userId) {\n";
echo "    global \$db;\n";
echo "    \$membershipNumber = generateRandomMembershipNumber(\$db);\n";
echo "    \n";
echo "    // Update users table\n";
echo "    \$stmt1 = \$db->prepare('UPDATE users SET is_approved = 1, membership_number = ? WHERE id = ?');\n";
echo "    \$stmt1->execute([\$membershipNumber, \$userId]);\n";
echo "    \n";
echo "    // Update user_profiles table\n";
echo "    \$stmt2 = \$db->prepare('UPDATE user_profiles SET membership_number = ?, updated_at = NOW() WHERE user_id = ?');\n";
echo "    \$stmt2->execute([\$membershipNumber, \$userId]);\n";
echo "    \n";
echo "    return \$membershipNumber;\n";
echo "}\n\n";

echo "Current approved users with their membership numbers:\n";
$stmt = $db->query("
    SELECT u.id, u.name, u.membership_number
    FROM users u 
    WHERE u.is_approved = 1 
    ORDER BY u.id 
    LIMIT 15
");

while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $hasRandom = !preg_match('/000[1-9]$/', $row['membership_number']);
    $status = $hasRandom ? '✓ Random' : '✗ Sequential';
    echo "{$status} User {$row['id']} ({$row['name']}): {$row['membership_number']}\n";
}

echo "\n✅ Random membership number generation is now ready!\n";
echo "✅ Use the approveUser() function when approving new users.\n";
?>
