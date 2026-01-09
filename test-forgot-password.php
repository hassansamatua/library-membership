<?php
// Simple test for forgot password API
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'next_auth';

try {
    $conn = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully\n";
    
    // Test POST endpoint
    $data = [
        'email' => 'test@example.com'
    ];
    
    $ch = curl_init([
        CURLOPT_URL => 'http://localhost:3000/api/auth/forgot-password',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POST => true
    ]);
    
    curl_exec($ch);
    $response = curl_exec($ch);
    $result = json_decode($response, true);
    
    echo "POST Test Result:\n";
    print_r($result);
    
    // Test PUT endpoint (simulate reset)
    echo "\n\nTesting PUT endpoint with reset code...\n";
    
    // First, get a reset code (simulate from email)
    $resetData = [
        'email' => 'test@example.com',
        'resetCode' => '123456',
        'newPassword' => 'newpassword123'
    ];
    
    $ch = curl_init([
        CURLOPT_URL => 'http://localhost:3000/api/auth/forgot-password',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode($resetData),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_POST => true
    ]);
    
    curl_exec($ch);
    $response = curl_exec($ch);
    $result = json_decode($response, true);
    
    echo "PUT Test Result:\n";
    print_r($result);
    
} catch(PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
?>
