#!/usr/bin/env php
<?php
/**
 * Run membership cycles migration
 * This creates all necessary tables for the membership cycle system
 */

require_once 'Database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== RUNNING MEMBERSHIP CYCLES MIGRATION ===\n\n";

try {
    // Read the migration SQL file
    $migrationFile = __DIR__ . '/database/membership_cycles_migration.sql';
    
    if (!file_exists($migrationFile)) {
        die("❌ Migration file not found: $migrationFile\n");
    }
    
    $sql = file_get_contents($migrationFile);
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    
    $count = 0;
    foreach ($statements as $statement) {
        if (empty($statement)) continue;
        
        try {
            $db->exec($statement);
            $count++;
            echo "✅ Executed statement $count\n";
        } catch (Exception $e) {
            echo "❌ Error executing statement:\n";
            echo "   " . substr($statement, 0, 100) . "...\n";
            echo "   Error: " . $e->getMessage() . "\n";
            throw $e;
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    echo "✅ Created/Updated tables:\n";
    echo "   - membership_cycles\n";
    echo "   - user_membership_status\n";
    echo "   - cycle_payment_status\n";
    echo "   - penalty_notifications\n";
    echo "   - memberships (updated)\n";
    echo "   - payments (updated)\n\n";
    
    // Verify tables
    echo "=== VERIFYING TABLES ===\n\n";
    
    $tables = ['membership_cycles', 'user_membership_status', 'cycle_payment_status', 'penalty_notifications'];
    
    foreach ($tables as $table) {
        $result = $db->query("DESCRIBE $table");
        $columns = $result->fetchAll(PDO::FETCH_ASSOC);
        echo "✅ $table: " . count($columns) . " columns\n";
    }
    
    // Check cycle data
    echo "\n=== CHECKING CYCLE DATA ===\n\n";
    $result = $db->query("SELECT * FROM membership_cycles ORDER BY cycle_year");
    $cycles = $result->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($cycles) > 0) {
        echo "✅ Found " . count($cycles) . " membership cycles:\n";
        foreach ($cycles as $cycle) {
            echo "   - Cycle {$cycle['cycle_year']}: {$cycle['start_date']} to {$cycle['end_date']}\n";
            echo "     Base Fee: {$cycle['base_fee']} TZS, Penalty: {$cycle['penalty_per_month']} TZS/month\n";
        }
    } else {
        echo "⚠️  No membership cycles found - they should have been created.\n";
    }
    
    echo "\n✅ All migrations completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

?>
