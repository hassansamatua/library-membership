<?php
require_once 'config.php';

echo "🔄 Complete End-to-End Password Reset Test\n\n";

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $email = 'hassansamatua60@gmail.com';
    
    echo "📧 Step 1: Test API call (simulate frontend)\n";
    
    // Simulate the API call to generate reset code
    $apiUrl = 'http://localhost:3000/api/auth/forgot-password';
    $data = json_encode(['email' => $email]);
    
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    echo "API Response: $response\n";
    echo "HTTP Status: $httpCode\n";
    
    if ($httpCode == 200) {
        $responseData = json_decode($response, true);
        if (isset($responseData->resetCode)) {
            echo "✅ API generated code: {$responseData->resetCode}\n";
            
            // Verify it was stored in database
            echo "\n📧 Step 2: Verify database storage\n";
            
            $stmt = $pdo->prepare("SELECT reset_token, reset_token_expires_at FROM users WHERE email = ? AND reset_token IS NOT NULL ORDER BY reset_token_expires_at DESC");
            $stmt->execute([$email]);
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $codeFound = false;
            foreach ($users as $user) {
                if ($user['reset_token'] === $responseData->resetCode) {
                    $codeFound = true;
                    $expiresAt = new DateTime($user['reset_token_expires_at']);
                    $now = new DateTime();
                    $isExpired = $expiresAt < $now;
                    
                    echo "✅ Code {$responseData->resetCode} found in database!\n";
                    echo "Expires at: {$expiresAt->format('Y-m-d H:i:s')}\n";
                    echo "Is expired: " . ($isExpired ? 'YES' : 'NO') . "\n";
                    break;
                }
            }
            
            if ($codeFound) {
                echo "✅ END-TO-END TEST SUCCESSFUL!\n";
                echo "✅ Code {$responseData->resetCode} properly stored and retrievable\n";
                echo "✅ User should be able to reset password with this code\n";
            } else {
                echo "❌ END-TO-END TEST FAILED!\n";
                echo "❌ Code {$responseData->resetCode} NOT found in database\n";
            }
        } else {
            echo "❌ API call failed\n";
        }
    } else {
        echo "❌ Could not reach API\n";
    }
    
    curl_close($ch);

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
