<?php
require_once 'config.php';

$conn = new mysqli('localhost', 'root', '', 'next_auth');

if ($conn->connect_error) {
    echo 'DB Error: ' . $conn->connect_error;
    exit;
}

echo "Testing news API...\n";

// Get user ID for testing (using user ID 2 which exists)
$userId = 2;

// Check if user exists
$userCheck = $conn->query("SELECT id, is_admin FROM users WHERE id = $userId LIMIT 1");
if ($userCheck->num_rows === 0) {
    echo "User $userId not found\n";
    exit;
}

$user = $userCheck->fetch_assoc();
echo "Found user: ID={$user['id']}, Admin={$user['is_admin']}\n";

// Get a notification to test with
$notificationCheck = $conn->query("SELECT id FROM news_notifications WHERE is_active = 1 AND id NOT IN (SELECT notification_id FROM user_notification_reads WHERE user_id = $userId) LIMIT 1");
if ($notificationCheck->num_rows === 0) {
    echo "No unread notifications found. Creating a new one...\n";
    
    // Create a new notification for testing
    $conn->query("INSERT INTO news_notifications (title, message, type, sender_id, priority, target_audience, sent_at, is_active) VALUES 
        ('Test Notification', 'This is a test notification for debugging', 'notification', 3, 'medium', 'all', NOW(), 1)");
    
    $notificationCheck = $conn->query("SELECT id FROM news_notifications WHERE is_active = 1 AND id NOT IN (SELECT notification_id FROM user_notification_reads WHERE user_id = $userId) ORDER BY id DESC LIMIT 1");
}

if ($notificationCheck->num_rows === 0) {
    echo "No notifications available for testing\n";
    exit;
}

$notification = $notificationCheck->fetch_assoc();
$notificationId = $notification['id'];

echo "Testing with notification ID: $notificationId\n";

// Check if already read
$readCheck = $conn->query("SELECT id FROM user_notification_reads WHERE user_id = $userId AND notification_id = $notificationId");
echo "Already read: " . ($readCheck->num_rows > 0 ? 'Yes' : 'No') . "\n";

// Test marking as read
if ($readCheck->num_rows === 0) {
    $result = $conn->query("INSERT INTO user_notification_reads (user_id, notification_id, read_at) VALUES ($userId, $notificationId, NOW())");
    if ($result) {
        echo "✅ Successfully marked as read\n";
    } else {
        echo "❌ Failed to mark as read: " . $conn->error . "\n";
    }
}

$conn->close();
?>
