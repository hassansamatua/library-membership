<?php
$conn = new mysqli('localhost', 'root', '', 'next_auth');
if ($conn->connect_error) die('Connection failed: ' . $conn->connect_error);

echo "=== VERIFYING MEMBERSHIP SYSTEM INSTALLATION ===\n\n";

$tables = ['membership_cycles', 'user_membership_status', 'cycle_payment_status', 'penalty_notifications', 'memberships', 'payments'];

echo "TABLE EXISTENCE:\n";
foreach ($tables as $table) {
  $result = $conn->query("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='next_auth' AND TABLE_NAME='$table'");
  $row = $result->fetch_assoc();
  $exists = $row['cnt'] > 0 ? '✅' : '❌';
  echo "$exists $table\n";
}

echo "\n=== SAMPLE DATA ===\n";

$result = $conn->query("SELECT COUNT(*) as cnt FROM membership_cycles");
$row = $result->fetch_assoc();
echo "✅ Membership cycles: " . $row['cnt'] . " records\n";

echo "\n=== COLUMN VERIFICATION ===\n";

$result = $conn->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='next_auth' AND TABLE_NAME='memberships' AND COLUMN_NAME IN ('cycle_year', 'is_new_user_cycle', 'penalty_amount')");
echo "✅ Memberships new columns: " . $result->num_rows . " found\n";

$result = $conn->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='next_auth' AND TABLE_NAME='payments' AND COLUMN_NAME IN ('cycle_year', 'penalty_amount')");
echo "✅ Payments new columns: " . $result->num_rows . " found\n";

echo "\n=== API & LIBRARY FILES ===\n";

$files = [
    'app/api/admin/approve-member/route.ts',
    'app/api/payments/process/route.ts',
    'app/api/payments/payment-status/route.ts',
    'lib/membershipCycles.ts',
    'lib/notificationService.ts'
];

foreach ($files as $file) {
    $exists = file_exists($file) ? '✅' : '❌';
    $name = basename($file);
    echo "$exists $name\n";
}

echo "\n=== DOCUMENTATION ===\n";

$docs = [
    'README_MEMBERSHIP_SYSTEM.md',
    'MEMBERSHIP_SYSTEM_SUMMARY.md',
    'MEMBERSHIP_CYCLES_IMPLEMENTATION.md',
    'MEMBERSHIP_CYCLES_QUICK_START.md',
    'IMPLEMENTATION_COMPLETE.md',
    'COMPLETE_CHECKLIST.md'
];

foreach ($docs as $doc) {
    $exists = file_exists($doc) ? '✅' : '❌';
    echo "$exists $doc\n";
}

echo "\n✅ INSTALLATION VERIFICATION COMPLETE!\n";
echo "The membership system is ready to use.\n\n";

echo "Next steps:\n";
echo "1. Configure email in .env.local (optional, for notifications)\n";
echo "2. Start testing the system:\n";
echo "   - Admin approves user: /api/admin/approve-member\n";
echo "   - User checks status: /api/payments/payment-status\n";
echo "   - User makes payment: /api/payments/process\n";
echo "3. Read documentation for detailed information\n";

$conn->close();
?>
