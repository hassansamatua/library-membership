<?php
// Test the membership API directly to see if it's working
require_once 'Database.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "=== Testing Membership API Directly ===\n\n";
    
    // Simulate the exact API call
    $period = 'monthly';
    
    echo "1. Testing member growth data...\n";
    $growthData = $conn->query("
      SELECT 
        DATE_FORMAT(u.created_at, '%Y-%m') as period,
        COUNT(*) as new_members,
        COUNT(DISTINCT u.id) as unique_members
      FROM users u
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      GROUP BY DATE_FORMAT(u.created_at, '%Y-%m')
      ORDER BY period
    ")->fetchAll(PDO::FETCH_ASSOC);
    echo "   Growth records: " . count($growthData) . "\n";
    
    echo "\n2. Testing status distribution...\n";
    $statusDistribution = $conn->query("
      SELECT 
        m.status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM memberships), 2) as percentage
      FROM memberships m
      GROUP BY m.status
    ")->fetchAll(PDO::FETCH_ASSOC);
    echo "   Status records: " . count($statusDistribution) . "\n";
    
    echo "\n3. Testing active members list (the critical part)...\n";
    $activeMembersList = $conn->query("
      SELECT 
        u.id,
        u.name,
        u.email,
        m.membership_number,
        m.membership_type,
        m.status,
        m.expiry_date,
        m.joined_date,
        m.payment_status,
        m.created_at as membership_created_at
      FROM memberships m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.status = 'active' 
      AND m.expiry_date >= CURDATE()
      ORDER BY m.created_at DESC
      LIMIT 50
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    echo "   Active members found: " . count($activeMembersList) . "\n";
    
    if (count($activeMembersList) > 0) {
        echo "   Sample member:\n";
        $first = $activeMembersList[0];
        echo "   - ID: " . ($first['id'] ?: 'NULL') . "\n";
        echo "   - Name: " . ($first['name'] ?: 'MISSING') . "\n";
        echo "   - Email: " . ($first['email'] ?: 'MISSING') . "\n";
        echo "   - Membership: " . $first['membership_number'] . "\n";
    }
    
    echo "\n4. Building API response...\n";
    $apiResponse = [
        'success' => true,
        'data' => [
            'growth' => $growthData,
            'statusDistribution' => $statusDistribution,
            'activeMembersList' => $activeMembersList
        ]
    ];
    
    echo "   API Response structure:\n";
    echo "   - success: " . ($apiResponse['success'] ? 'true' : 'false') . "\n";
    echo "   - data.growth: " . count($apiResponse['data']['growth']) . " records\n";
    echo "   - data.statusDistribution: " . count($apiResponse['data']['statusDistribution']) . " records\n";
    echo "   - data.activeMembersList: " . count($apiResponse['data']['activeMembersList']) . " records\n";
    
    echo "\n=== API TEST RESULT ===\n";
    if (count($activeMembersList) > 0) {
        echo "✅ API should work! Found " . count($activeMembersList) . " active members.\n";
        echo "If the frontend still shows no data, the issue is in the JavaScript/React code.\n";
    } else {
        echo "❌ API issue! No active members found.\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
}
?>
