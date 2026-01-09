<?php
// Database connection
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'next_auth';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "Connected to database successfully\n";
    
    // Read and execute migration
    $migrationFile = __DIR__ . '/migrations/create_payments_table.sql';
    if (file_exists($migrationFile)) {
        $sql = file_get_contents($migrationFile);
        $statements = array_filter(array_map('trim', explode(';', $sql)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                try {
                    $pdo->exec($statement);
                    echo "✓ Executed: " . substr($statement, 0, 50) . "...\n";
                } catch (PDOException $e) {
                    echo "✗ Error: " . $e->getMessage() . "\n";
                    echo "Statement: " . substr($statement, 0, 100) . "...\n";
                }
            }
        }
        
        echo "Migration completed!\n";
    } else {
        echo "Migration file not found\n";
    }
    
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
?>
