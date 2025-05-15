<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

try {
    $date = $_GET['date'] ?? date('Y-m-d');
    $master_id = $_GET['master_id'] ?? null;

    if (!$master_id) {
        throw new Exception("Не указан мастер");
    }

    // Проверяем существование мастера
    $stmt = $conn->prepare("SELECT id FROM masters WHERE id = ?");
    $stmt->execute([$master_id]);
    if (!$stmt->fetch()) {
        throw new Exception("Мастер не найден");
    }

    // Получаем слоты с информацией о бронировании
    $stmt = $conn->prepare("
        SELECT 
            id,
            slot_time,
            is_booked,
            booked_by_name
        FROM time_slots 
        WHERE slot_date = ? 
        AND master_id = ?
        ORDER BY slot_time
    ");
    $stmt->execute([$date, $master_id]);
    $slots = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Логируем результат запроса
    error_log("Found slots: " . print_r($slots, true));

    echo json_encode([
        'success' => true,
        'date' => $date,
        'master_id' => $master_id,
        'slots' => $slots
    ]);

} catch (Exception $e) {
    error_log("Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>