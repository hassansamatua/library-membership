<?php
// Database connection
$host = 'localhost';
$dbname = 'next_auth';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Test Login Flow ===\n\n";
    
    // Test the specific user login
    $email = 'name@gmail.com';
    $password = '1234';
    
    echo "Testing login for: $email\n";
    echo "Password: $password\n\n";
    
    // Get user from database
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo "✅ User found in database\n";
        echo "ID: " . $user['id'] . "\n";
        echo "Name: " . $user['name'] . "\n";
        echo "Email: " . $user['email'] . "\n";
        echo "Is Admin: " . ($user['is_admin'] ? 'YES' : 'NO') . "\n";
        echo "Is Approved: " . ($user['is_approved'] ? 'YES' : 'NO') . "\n";
        echo "Password Hash: " . substr($user['password'], 0, 20) . "...\n\n";
        
        // Test password verification
        if (password_verify($password, $user['password'])) {
            echo "✅ Password verification successful\n\n";
            
            // Simulate JWT token creation (simplified)
            $tokenPayload = [
                'id' => $user['id'],
                'email' => $user['email'],
                'isAdmin' => $user['is_admin']
            ];
            
            echo "Token payload would be:\n";
            echo json_encode($tokenPayload, JSON_PRETTY_PRINT) . "\n\n";
            
            // Check user profile
            $profileStmt = $pdo->prepare("SELECT * FROM user_profiles WHERE user_id = ?");
            $profileStmt->execute([$user['id']]);
            $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($profile) {
                echo "✅ User profile found\n";
                echo "Membership Number: " . ($profile['membership_number'] ?: 'NULL') . "\n";
                echo "Membership Status: " . ($profile['membership_status'] ?: 'NULL') . "\n";
            } else {
                echo "❌ No user profile found\n";
            }
            
        } else {
            echo "❌ Password verification failed\n";
            echo "This should not happen if login is successful\n";
        }
    } else {
        echo "❌ User not found in database\n";
    }
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
?>
