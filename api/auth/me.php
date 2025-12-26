<?php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

require_once '../../config.php';
require_once '../../Database.php';
require_once '../../jwt.php';

$database = new Database();
$db = $database->getConnection();

// Get token from Authorization header
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = validateJWT($token);
    
    if ($decoded) {
        $query = 'SELECT id, name, email, is_admin, is_approved FROM users WHERE id = ? LIMIT 1';
        $stmt = $db->prepare($query);
        $stmt->execute([$decoded['id']]);
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            http_response_code(200);
            echo json_encode([
                'id' => $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'isAdmin' => (bool)$row['is_admin'],
                'isApproved' => (bool)$row['is_approved']
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
        }
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid or expired token']);
    }
} else {
    http_response_code(401);
    echo json_encode(['message' => 'Authorization header missing or invalid']);
}
?>
