<?php
header('Content-Type: application/json');

require_once 'db_connect.php';

try {
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    
    $sql = "SELECT m.*, mc.name AS category_name 
            FROM masters m 
            JOIN master_categories mc ON m.category_id = mc.id";
    
    if ($categoryId) {
        $sql .= " WHERE m.category_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$categoryId]);
    } else {
        $stmt = $conn->query($sql);
    }
    
    $masters = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'masters' => $masters
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error loading masters',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>