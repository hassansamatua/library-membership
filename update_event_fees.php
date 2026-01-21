<?php
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "=== Updating events with proper fees ===\n";
    
    // Update Conference and AGM to have a proper fee
    $stmt = $pdo->prepare('UPDATE events SET fee = ? WHERE id = ? AND title = ?');
    $stmt->execute([25000, 3, 'Conference and AGM']);
    echo "✅ Updated 'Conference and AGM' fee to TZS 25,000\n";
    
    // Update Annual Meeting to have a proper fee  
    $stmt = $pdo->prepare('UPDATE events SET fee = ? WHERE id = ? AND title = ?');
    $stmt->execute([15000, 4, 'Annual Meeting']);
    echo "✅ Updated 'Annual Meeting' fee to TZS 15,000\n";
    
    // Show updated events
    echo "\n=== Updated events list ===\n";
    $stmt = $pdo->query('SELECT id, title, fee FROM events ORDER BY id');
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($events as $event) {
        $fee = (float)$event['fee'];
        $display = $fee === 0.00 ? 'Free' : 'TZS ' . number_format($fee);
        echo "ID: " . $event['id'] . " - " . $event['title'] . " - " . $display . "\n";
    }
    
} catch (PDOException $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
}
?>
