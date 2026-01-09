<?php
// Database connection
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'next_auth';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== VERIFYING USER MEMBERSHIP STATUS ===\n\n";
    
    // Get the user who just made the payment
    $stmt = $pdo->prepare("
        SELECT p.*, u.name, u.email 
        FROM payments p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.reference = 'TLA-1767944794376-mzogfe7v2'
    ");
    $stmt->execute();
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$payment) {
        echo "Payment not found!\n";
        exit;
    }
    
    echo "User: {$payment['name']} ({$payment['email']})\n";
    echo "User ID: {$payment['user_id']}\n\n";
    
    // Check membership status
    $stmt = $pdo->prepare("
        SELECT * FROM memberships WHERE user_id = ?
    ");
    $stmt->execute([$payment['user_id']]);
    $membership = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$membership) {
        echo "❌ NO MEMBERSHIP FOUND!\n";
        exit;
    }
    
    echo "✅ MEMBERSHIP FOUND:\n";
    echo "Membership Number: {$membership['membership_number']}\n";
    echo "Type: {$membership['membership_type']}\n";
    echo "Status: {$membership['status']}\n";
    echo "Payment Status: {$membership['payment_status']}\n";
    echo "Expiry Date: {$membership['expiry_date']}\n";
    echo "Payment Date: {$membership['payment_date']}\n";
    echo "Amount Paid: {$membership['amount_paid']}\n\n";
    
    // Check if membership meets API criteria
    $expiryDate = new DateTime($membership['expiry_date']);
    $today = new DateTime();
    
    $statusActive = $membership['status'] === 'active';
    $paymentPaid = $membership['payment_status'] === 'paid';
    $notExpired = $expiryDate >= $today;
    
    echo "🔍 API CRITERIA CHECK:\n";
    echo "Status = 'active': " . ($statusActive ? '✅' : '❌') . "\n";
    echo "Payment Status = 'paid': " . ($paymentPaid ? '✅' : '❌') . "\n";
    echo "Not Expired ({$expiryDate->format('Y-m-d')} >= {$today->format('Y-m-d')}): " . ($notExpired ? '✅' : '❌') . "\n";
    
    $canAccessCard = $statusActive && $paymentPaid && $notExpired;
    echo "\n🎯 canAccessIdCard: " . ($canAccessCard ? '✅ TRUE' : '❌ FALSE') . "\n\n";
    
    if ($canAccessCard) {
        echo "🎉 USER SHOULD BE ABLE TO ACCESS MEMBERSHIP CARD!\n";
        echo "Instructions:\n";
        echo "1. User should log out and log back in\n";
        echo "2. Navigate to /dashboard/membership-card\n";
        echo "3. Should see membership card with details\n";
    } else {
        echo "❌ USER CANNOT ACCESS MEMBERSHIP CARD\n";
        echo "Issue: One or more criteria not met\n";
    }
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
