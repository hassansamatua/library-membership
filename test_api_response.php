<?php
// Test script to simulate the API response
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'next_auth';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $userId = 25;
    
    // Get user basic info
    $stmt = $pdo->prepare('SELECT id, name, email, is_admin, is_approved, created_at, updated_at, membership_number FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Get profile columns
    $stmt = $pdo->query('SHOW COLUMNS FROM user_profiles');
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $profileColumnSet = [];
    foreach ($columns as $col) {
        $profileColumnSet[] = $col['Field'];
    }
    
    // Build SELECT fields
    $selectFields = [
        'personal_info', 'contact_info', 'professional_info', 'membership_info',
        'membership_type', 'membership_number', 'membership_status', 'join_date',
        'education', 'employment', 'highest_degree', 'institution', 'year_of_graduation',
        'skills', 'job_title', 'current_position', 'company', 'work_email',
        'work_phone', 'years_of_experience', 'gender', 'date_of_birth', 'nationality',
        'place_of_birth', 'profile_picture', 'phone', 'address', 'city', 'state',
        'postal_code', 'country', 'facebook', 'twitter', 'linkedin', 'instagram', 'github'
    ];
    
    // Filter only existing columns
    $validFields = array_intersect($selectFields, $profileColumnSet);
    
    if (empty($validFields)) {
        $profile = [];
    } else {
        $stmt = $pdo->prepare('SELECT ' . implode(', ', $validFields) . ' FROM user_profiles WHERE user_id = ?');
        $stmt->execute([$userId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    
    // Simulate the API response structure
    $response = [
        'user' => $user,
        'profile_exists' => !empty($profile),
        'profile_fields_found' => $validFields,
        'profile_data' => $profile,
        'debug' => [
            'total_columns_in_table' => count($profileColumnSet),
            'selected_fields_count' => count($validFields),
            'profile_row_count' => $stmt->rowCount()
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
