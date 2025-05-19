<?php
header('Content-Type: application/json');
require_once '../db_connect.php';

// Проверяем соединение с БД
if (!isset($conn)) {
    echo json_encode(['success' => false, 'message' => 'Database connection error']);
    exit;
}

try {
    // Получаем параметры фильтрации
    $masterId = isset($_GET['master_id']) ? (int)$_GET['master_id'] : null;
    $date = isset($_GET['date']) ? $_GET['date'] : null;
    
    // Основной запрос
    $sql = "
        SELECT 
            ts.slot_date,
            ts.slot_time,
            m.name AS master_name,
            ts.booked_by_name,
            ts.booked_by_phone,
            s.name AS service_name
        FROM time_slots ts
        JOIN masters m ON ts.master_id = m.id
        LEFT JOIN services s ON ts.service_id = s.id
        WHERE ts.is_booked = 1
    ";
    
    $params = [];
    
    // Добавляем условия фильтрации
    if ($masterId) {
        $sql .= " AND ts.master_id = ?";
        $params[] = $masterId;
    }
    
    if ($date) {
        $sql .= " AND ts.slot_date = ?";
        $params[] = $date;
    }
    
    // Сортировка
    $sql .= " ORDER BY ts.slot_date DESC, ts.slot_time ASC";
    
    // Выполняем запрос
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>