<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    $stmt = $conn->query("SELECT * FROM masters");
    $masters = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'masters' => $masters
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching masters: ' . $e->getMessage()
    ]);
}
?>