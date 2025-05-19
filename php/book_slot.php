<?php
header('Content-Type: application/json');

// Проверяем метод запроса
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Метод не разрешен']));
}

require_once 'db_connect.php';


try {
    // Получаем входные данные
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Неверный формат JSON данных');
    }

    // Проверяем обязательные поля
    $required = ['slot_id', 'name', 'phone', 'master_id'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            throw new Exception("Не заполнено обязательное поле: $field");
        }
    }

    // Проверяем существование слота
    $stmt = $conn->prepare("SELECT id, slot_date, slot_time FROM time_slots WHERE id = ? AND is_booked = 0");
    $stmt->execute([$input['slot_id']]);
    $slot = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$slot) {
        throw new Exception('Выбранный слот уже занят или не существует');
    }

    // Получаем информацию о мастере
    $stmt = $conn->prepare("SELECT name FROM masters WHERE id = ?");
    $stmt->execute([$input['master_id']]);
    $master = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$master) {
        throw new Exception('Мастер не найден');
    }

    // Бронируем слот
    $stmt = $conn->prepare("
        UPDATE time_slots 
        SET is_booked = 1, 
            booked_by_name = ?, 
            booked_by_phone = ?, 
            booked_by_email = ?, 
            booking_date = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([
        $input['name'],
        $input['phone'],
        $input['email'] ?? null,
        $input['slot_id']
    ]);

    // Подготовка ответа
    $response = [
        'success' => true,
        'message' => 'Запись успешно создана',
        'slot_date' => $slot['slot_date'],
        'slot_time' => $slot['slot_time'],
        'master_name' => $master['name']
    ];

    // Отправляем email клиенту (если email указан)
    if (!empty($input['email'])) {
        $to = $input['email'];
        $subject = "Подтверждение записи";
        $message = "Вы записаны на {$slot['slot_date']} в {$slot['slot_time']} к мастеру {$master['name']}";
        $headers = "From: no-reply@salon.com";
        
        @mail($to, $subject, $message, $headers);
    }

    echo json_encode($response);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка базы данных: ' . $e->getMessage()]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

// Закрываем соединение
$conn = null;
exit;
?>