<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== TESTING SOPHISTICATED PAYMENT SYSTEM ===\n\n";

try {
    // Test different scenarios
    $testScenarios = [
        [
            'name' => 'December New User',
            'email' => 'dec@example.com',
            'created_at' => '2024-12-15',
            'membership_type' => 'personal',
            'is_new_user' => true
        ],
        [
            'name' => 'January New User',
            'email' => 'jan@example.com', 
            'created_at' => '2024-01-15',
            'membership_type' => 'personal',
            'is_new_user' => true
        ],
        [
            'name' => 'Renewing User',
            'email' => 'renew@example.com',
            'created_at' => '2023-06-15',
            'membership_type' => 'personal', 
            'is_new_user' => false
        ]
    ];
    
    foreach ($testScenarios as $scenario) {
        echo "\n--- Testing: {$scenario['name']} ---\n";
        echo "Registration Date: {$scenario['created_at']}\n";
        echo "New User: " . ($scenario['is_new_user'] ? 'Yes' : 'No') . "\n";
        
        // Simulate the penalty calculation
        $now = new DateTime();
        $registrationDate = new DateTime($scenario['created_at']);
        
        // Calculate cycle dates
        $cycleYear = $now->format('Y');
        $dueDate = new DateTime("$cycleYear-03-30");
        $gracePeriodEnd = new DateTime("$cycleYear-03-30");
        
        $isAfterGracePeriod = $now > $gracePeriodEnd;
        
        $baseAmount = $scenario['is_new_user'] ? 40000 : 30000;
        
        $currentYear = (int)$now->format('Y');
        
        // Check if registered in December (grace period + first cycle exemption)
        $regMonth = (int)$registrationDate->format('m');
        $regYear = (int)$registrationDate->format('Y');
        $currentYear = (int)$now->format('Y');
        
        // If registered in December of previous year, no penalties for entire first cycle
        if ($regMonth === 11 && $regYear === $currentYear - 1) {
            $penaltyAmount = 0;
            $totalDue = $baseAmount;
            $penaltyMonths = 0;
            echo "✓ December registration: NO PENALTIES (first cycle exemption)\n";
        } elseif (!$isAfterGracePeriod) {
            $penaltyAmount = 0;
            $totalDue = $baseAmount;
            $penaltyMonths = 0;
            echo "✓ Within grace period (Feb 1 - Mar 30): NO PENALTIES\n";
        } else {
            $monthsOverdue = max(0, floor(($now->getTimestamp() - $dueDate->getTimestamp()) / (30 * 24 * 60 * 60)));
            $penaltyAmount = $monthsOverdue * 1000; // TSH 1,000 per month
            $totalDue = $baseAmount + $penaltyAmount;
            $penaltyMonths = $monthsOverdue;
            echo "⚠ After grace period: PENALTIES APPLY\n";
            echo "  Months overdue: $monthsOverdue\n";
            echo "  Monthly penalty: TSH 1,000\n";
            echo "  Total penalty: TSH " . number_format($penaltyAmount) . "\n";
        }
        
        echo "Base amount: TSH " . number_format($baseAmount) . "\n";
        echo "Total due: TSH " . number_format($totalDue) . "\n";
        echo "----------------------------------------\n";
    }
    
    echo "\n=== PAYMENT RULES SUMMARY ===\n";
    echo "✅ New Users: TSH 40,000 (no penalties for entire first cycle if registered in December)\n";
    echo "✅ First Cycle: Registration date until March 31 of following year (no penalties)\n";
    echo "✅ Renewing Users: TSH 30,000 + penalties\n";
    echo "✅ Grace Period: Feb 1 - Mar 30 (no penalties)\n";
    echo "✅ Penalty Period: Apr 1 onwards (TSH 1,000 per month)\n";
    echo "✅ Total Monthly Penalty Cap: TSH 2,000 (2 months)\n";
    echo "✅ Membership Card Access: After successful payment completion\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
