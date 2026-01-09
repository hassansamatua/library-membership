<?php
// Run password reset migration
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'next_auth';

try {
    $conn = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully\n";
    
    // Add reset_token column
    $sql1 = "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL";
    $conn->exec($sql1);
    echo "Added reset_token column\n";
    
    // Add reset_token_expires_at column
    $sql2 = "ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMP NULL DEFAULT NULL";
    $conn->exec($sql2);
    echo "Added reset_token_expires_at column\n";
    
    echo "Migration completed successfully!\n";
    
} catch(PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
?>
