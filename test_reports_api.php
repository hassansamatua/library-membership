<?php
// Database connection
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'next_auth';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== TESTING REPORTS DATABASE TABLES ===\n\n";
    
    // Test users table
    echo "1. USERS TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ Users table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ Users table error: " . $e->getMessage() . "\n";
    }
    
    // Test user_profiles table
    echo "\n2. USER_PROFILES TABLE:\n";
    try {
        $stmt = $pdo->query("DESCRIBE user_profiles");
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ user_profiles table exists with " . count($columns) . " columns\n";
        
        // Check for specific columns
        $columnNames = array_column($columns, 'Field');
        $requiredColumns = ['membership_number', 'membership_type', 'membership_status', 'join_date'];
        foreach ($requiredColumns as $col) {
            if (in_array($col, $columnNames)) {
                echo "  ✅ $col column exists\n";
            } else {
                echo "  ❌ $col column MISSING\n";
            }
        }
    } catch (Exception $e) {
        echo "❌ user_profiles table error: " . $e->getMessage() . "\n";
    }
    
    // Test payments table
    echo "\n3. PAYMENTS TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM payments");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ payments table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ payments table error: " . $e->getMessage() . "\n";
    }
    
    // Test memberships table
    echo "\n4. MEMBERSHIPS TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM memberships");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ memberships table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ memberships table error: " . $e->getMessage() . "\n";
    }
    
    // Test events table
    echo "\n5. EVENTS TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM events");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ events table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ events table error: " . $e->getMessage() . "\n";
    }
    
    // Test attendance table
    echo "\n6. ATTENDANCE TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM attendance");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ attendance table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ attendance table error: " . $e->getMessage() . "\n";
    }
    
    // Test inventory table
    echo "\n7. INVENTORY TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM inventory");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ inventory table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ inventory table error: " . $e->getMessage() . "\n";
    }
    
    // Test event_registrations table
    echo "\n8. EVENT_REGISTRATIONS TABLE:\n";
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM event_registrations");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "✅ event_registrations table exists: {$result['count']} records\n";
    } catch (Exception $e) {
        echo "❌ event_registrations table error: " . $e->getMessage() . "\n";
    }
    
    echo "\n=== TESTING SAMPLE QUERY ===\n";
    
    // Test a sample query like the API would use
    try {
        $query = "
            SELECT 
                u.id,
                u.name,
                u.email,
                u.is_approved,
                u.created_at,
                up.membership_number,
                up.membership_type,
                up.membership_status,
                up.join_date,
                m.expiry_date,
                m.payment_status
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            LEFT JOIN memberships m ON u.id = m.user_id
            WHERE u.created_at BETWEEN '2025-01-01' AND '2026-12-31'
            ORDER BY u.created_at DESC
            LIMIT 5
        ";
        $stmt = $pdo->query($query);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ Sample query executed successfully\n";
        echo "Found " . count($results) . " users\n";
        
        if (!empty($results)) {
            echo "Sample user:\n";
            $user = $results[0];
            echo "- Name: " . ($user['name'] ?? 'NULL') . "\n";
            echo "- Email: " . ($user['email'] ?? 'NULL') . "\n";
            echo "- Membership Number: " . ($user['membership_number'] ?? 'NULL') . "\n";
        }
    } catch (Exception $e) {
        echo "❌ Sample query error: " . $e->getMessage() . "\n";
    }
    
} catch (PDOException $e) {
    echo "Database connection error: " . $e->getMessage() . "\n";
}
?>
