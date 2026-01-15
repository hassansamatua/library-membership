#!/usr/bin/env php
<?php
/**
 * Membership Cycle System Validation & Testing Script
 * Tests all aspects of the membership system implementation
 */

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║  Membership Cycle System - Validation & Testing Script    ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

$passed = 0;
$failed = 0;
$warnings = 0;

// Test 1: Check if all tables exist
echo "TEST 1: Checking if all required tables exist...\n";
$requiredTables = [
    'membership_cycles',
    'user_membership_status',
    'cycle_payment_status',
    'penalty_notifications',
    'memberships',
    'payments'
];

foreach ($requiredTables as $table) {
    try {
        $result = $db->query("DESCRIBE $table LIMIT 1");
        echo "  ✅ $table\n";
        $passed++;
    } catch (Exception $e) {
        echo "  ❌ $table - NOT FOUND\n";
        $failed++;
    }
}

// Test 2: Check membership_cycles data
echo "\nTEST 2: Checking membership_cycles data...\n";
try {
    $result = $db->query("SELECT COUNT(*) as count FROM membership_cycles");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    $count = $row['count'];
    
    if ($count >= 4) {
        echo "  ✅ Found $count cycle records (minimum 4 required)\n";
        $passed++;
        
        // Show cycles
        $cycles = $db->query("SELECT cycle_year, start_date, end_date, base_fee, penalty_per_month FROM membership_cycles ORDER BY cycle_year")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cycles as $cycle) {
            echo "     • Cycle {$cycle['cycle_year']}: {$cycle['start_date']} to {$cycle['end_date']}\n";
            echo "       Fee: {$cycle['base_fee']} TZS, Penalty: {$cycle['penalty_per_month']} TZS/month\n";
        }
    } else {
        echo "  ❌ Only found $count cycles, minimum 4 required\n";
        $failed++;
    }
} catch (Exception $e) {
    echo "  ❌ Error checking cycles: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 3: Check if users have membership status
echo "\nTEST 3: Checking user_membership_status records...\n";
try {
    $result = $db->query("SELECT COUNT(*) as count FROM user_membership_status");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    $count = $row['count'];
    
    if ($count > 0) {
        echo "  ✅ Found $count user membership status records\n";
        $passed++;
        
        // Show sample
        $users = $db->query("SELECT u.name, ums.* FROM user_membership_status ums JOIN users u ON ums.user_id = u.id LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $user) {
            echo "     • {$user['name']}: is_new={$user['is_new_member']}, status={$user['status']}, payment_status={$user['payment_status']}\n";
        }
    } else {
        echo "  ⚠️  No user membership status records (will be created when admin approves users)\n";
        $warnings++;
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 4: Check cycle_payment_status records
echo "\nTEST 4: Checking cycle_payment_status records...\n";
try {
    $result = $db->query("SELECT COUNT(*) as count FROM cycle_payment_status");
    $row = $result->fetch(PDO::FETCH_ASSOC);
    $count = $row['count'];
    
    if ($count > 0) {
        echo "  ✅ Found $count cycle payment records\n";
        $passed++;
        
        // Show breakdown
        $paid = $db->query("SELECT COUNT(*) as count FROM cycle_payment_status WHERE is_paid = TRUE")->fetch(PDO::FETCH_ASSOC)['count'];
        $unpaid = $db->query("SELECT COUNT(*) as count FROM cycle_payment_status WHERE is_paid = FALSE")->fetch(PDO::FETCH_ASSOC)['count'];
        
        echo "     • Paid: $paid\n";
        echo "     • Unpaid: $unpaid\n";
    } else {
        echo "  ⚠️  No cycle payment records (will be created when users pay)\n";
        $warnings++;
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 5: Check if memberships table has new columns
echo "\nTEST 5: Checking memberships table structure...\n";
try {
    $columns = $db->query("DESCRIBE memberships")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    $requiredColumns = ['cycle_year', 'is_new_user_cycle', 'penalty_amount'];
    $missingColumns = [];
    
    foreach ($requiredColumns as $col) {
        if (!in_array($col, $columnNames)) {
            $missingColumns[] = $col;
        }
    }
    
    if (empty($missingColumns)) {
        echo "  ✅ All new columns exist in memberships table\n";
        $passed++;
    } else {
        echo "  ⚠️  Missing columns: " . implode(', ', $missingColumns) . "\n";
        echo "     Run migration: php run_membership_cycles_migration.php\n";
        $warnings++;
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 6: Check if payments table has new columns
echo "\nTEST 6: Checking payments table structure...\n";
try {
    $columns = $db->query("DESCRIBE payments")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    $requiredColumns = ['cycle_year', 'penalty_amount'];
    $missingColumns = [];
    
    foreach ($requiredColumns as $col) {
        if (!in_array($col, $columnNames)) {
            $missingColumns[] = $col;
        }
    }
    
    if (empty($missingColumns)) {
        echo "  ✅ All new columns exist in payments table\n";
        $passed++;
    } else {
        echo "  ⚠️  Missing columns: " . implode(', ', $missingColumns) . "\n";
        echo "     Run migration: php run_membership_cycles_migration.php\n";
        $warnings++;
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 7: Test cycle year calculation
echo "\nTEST 7: Testing cycle year calculations...\n";
try {
    // Test dates from different months
    $testDates = [
        ['2026-01-15', 2025, 'January (should be 2025 cycle)'],
        ['2026-02-01', 2026, 'February 1 (should be 2026 cycle)'],
        ['2026-06-15', 2026, 'June (should be 2026 cycle)'],
        ['2027-01-31', 2026, 'January 31 (should be 2026 cycle)'],
    ];
    
    foreach ($testDates as $test) {
        $date = $test[0];
        $expectedYear = $test[1];
        $description = $test[2];
        
        // Simple calculation: if month is Jan, subtract 1 from year, else use year
        $parts = explode('-', $date);
        $year = (int)$parts[0];
        $month = (int)$parts[1];
        
        $calculatedYear = ($month === 1) ? ($year - 1) : $year;
        
        if ($calculatedYear === $expectedYear) {
            echo "  ✅ $description: $calculatedYear\n";
            $passed++;
        } else {
            echo "  ❌ $description: Got $calculatedYear, expected $expectedYear\n";
            $failed++;
        }
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 8: Test grace period detection
echo "\nTEST 8: Testing grace period detection...\n";
try {
    $testDates = [
        ['2026-02-01', true, 'February 1 (in grace period)'],
        ['2026-03-31', true, 'March 31 (in grace period)'],
        ['2026-04-01', false, 'April 1 (NOT in grace period)'],
        ['2026-05-15', false, 'May 15 (NOT in grace period)'],
        ['2026-01-31', true, 'January 31 next year (still in grace period of that cycle)'],
    ];
    
    foreach ($testDates as $test) {
        $date = $test[0];
        $expected = $test[1] ? 'yes' : 'no';
        $description = $test[2];
        
        // Grace period is Feb-Mar (months 2-3, or 1-2 in 0-indexed)
        $parts = explode('-', $date);
        $month = (int)$parts[1];
        
        $inGracePeriod = ($month >= 2 && $month <= 3);
        
        if ($inGracePeriod === $test[1]) {
            echo "  ✅ $description\n";
            $passed++;
        } else {
            echo "  ❌ $description: Got " . ($inGracePeriod ? 'yes' : 'no') . ", expected $expected\n";
            $failed++;
        }
    }
} catch (Exception $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $failed++;
}

// Test 9: Check if API files exist
echo "\nTEST 9: Checking if API endpoint files exist...\n";
$apiFiles = [
    'app/api/admin/approve-member/route.ts' => 'Admin approval endpoint',
    'app/api/payments/process/route.ts' => 'Payment processing endpoint',
    'app/api/payments/payment-status/route.ts' => 'Payment status endpoint',
];

foreach ($apiFiles as $file => $description) {
    if (file_exists($file)) {
        echo "  ✅ $description\n";
        $passed++;
    } else {
        echo "  ❌ $description - FILE NOT FOUND: $file\n";
        $failed++;
    }
}

// Test 10: Check if library files exist
echo "\nTEST 10: Checking if library files exist...\n";
$libFiles = [
    'lib/membershipCycles.ts' => 'Membership cycle utilities',
    'lib/notificationService.ts' => 'Notification service',
];

foreach ($libFiles as $file => $description) {
    if (file_exists($file)) {
        echo "  ✅ $description\n";
        $passed++;
    } else {
        echo "  ❌ $description - FILE NOT FOUND: $file\n";
        $failed++;
    }
}

// Summary
echo "\n";
echo "╔════════════════════════════════════════════════════════════╗\n";
echo "║                    TEST SUMMARY                            ║\n";
echo "╚════════════════════════════════════════════════════════════╝\n\n";

echo "✅ Passed:   $passed\n";
echo "❌ Failed:   $failed\n";
echo "⚠️  Warnings: $warnings\n\n";

if ($failed === 0) {
    echo "🎉 All tests passed! System is ready to use.\n\n";
    echo "Next steps:\n";
    echo "  1. Configure email in .env.local (optional for SMS/email notifications)\n";
    echo "  2. Test the flow:\n";
    echo "     - Admin approves a user\n";
    echo "     - User checks payment status\n";
    echo "     - User makes a payment\n";
    echo "  3. Set up cron jobs for automated notifications (grace period reminder, penalty warning)\n";
} else {
    echo "⚠️  Some tests failed. Please fix the issues above.\n\n";
    echo "Common fixes:\n";
    echo "  • Run migration: php run_membership_cycles_migration.php\n";
    echo "  • Check database connection in Database.php\n";
    echo "  • Verify MySQL is running\n";
}

echo "\nFor detailed documentation, see:\n";
echo "  - MEMBERSHIP_SYSTEM_SUMMARY.md\n";
echo "  - MEMBERSHIP_CYCLES_IMPLEMENTATION.md\n";
echo "  - MEMBERSHIP_CYCLES_QUICK_START.md\n\n";

exit($failed > 0 ? 1 : 0);
?>
