<?php
header('Content-Type: application/json');

require_once 'db_connect.php';

try {    
    // Получаем категории
    $stmt = $conn->query("SELECT * FROM master_categories");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Возвращаем результат
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ], JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    // Обработка ошибок
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>