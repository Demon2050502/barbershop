<?php
header('Content-Type: application/json');

require_once 'db_connect.php';

try {
    $categoryId = (int)($_GET['category_id'] ?? 0);
    
    if ($categoryId <= 0) {
        throw new Exception('Invalid category ID');
    }
    
    $stmt = $conn->prepare("SELECT * FROM services WHERE category_id = ?");
    $stmt->execute([$categoryId]);
    $services = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'services' => $services
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error loading services',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>