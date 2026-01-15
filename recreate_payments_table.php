<?php
require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "Recreating membership_payments table with correct structure...\n";

// Drop the existing table first
$db->exec("DROP TABLE IF EXISTS membership_payments");

// Create with correct column names matching the actual structure
$sql = "CREATE TABLE membership_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(100) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    cycle_year INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_cycle_year (cycle_year),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)";

try {
    $db->exec($sql);
    echo "✅ membership_payments table recreated successfully!\n";
} catch (Exception $e) {
    echo "❌ Error recreating table: " . $e->getMessage() . "\n";
}

// Also update memberships table to use reference instead of payment_reference
echo "\nUpdating memberships table to use 'reference' column...\n";
$alterSql = "ALTER TABLE memberships 
DROP COLUMN IF EXISTS payment_reference,
ADD COLUMN IF NOT EXISTS reference VARCHAR(100) NULL";

try {
    $db->exec($alterSql);
    echo "✅ memberships table updated to use 'reference' column!\n";
} catch (Exception $e) {
    echo "❌ Error updating memberships table: " . $e->getMessage() . "\n";
}
?>
