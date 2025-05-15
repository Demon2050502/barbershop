
DROP DATABASE IF EXISTS barbershop;

-- Создаем базу данных
CREATE DATABASE barbershop;

-- Используем созданную базу данных
USE barbershop;

-- Создаем таблицу мастеров
CREATE TABLE masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    photo VARCHAR(255),
    experience INT,
    rating DECIMAL(3,1),
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Добавляем мастеров
INSERT INTO masters (name, specialization, photo, experience, rating, description) VALUES
('Алексей Петров', 'Мужские стрижки, бритье', 'img/i.webp', 8, 4.9, 'Специалист по классическим и современным мужским стрижкам'),
('Елена Смирнова', 'Женские стрижки, окрашивание', 'img/i.webp', 10, 4.8, 'Мастер по креативным стрижкам и модным окрашиваниям'),
('Иван Козлов', 'Детские стрижки, стильные стрижки', 'img/i.webp', 5, 4.7, 'Специализируется на стрижках для детей и подростков');

-- Создаем таблицу временных слотов с привязкой к мастерам
CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    master_id INT NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by_name VARCHAR(100),
    booked_by_phone VARCHAR(20),
    booked_by_email VARCHAR(100),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (master_id) REFERENCES masters(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO time_slots (slot_date, slot_time, master_id)
SELECT 
    DATE_ADD(CURDATE(), INTERVAL n DAY) AS slot_date,
    time_slot,
    master_id
FROM (
    SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
    UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13
) AS days
CROSS JOIN (
    SELECT '09:00 - 10:00' AS time_slot UNION
    SELECT '10:00 - 11:00' UNION
    SELECT '11:00 - 12:00' UNION
    SELECT '12:00 - 13:00' UNION
    SELECT '13:00 - 14:00' UNION
    SELECT '14:00 - 15:00' UNION
    SELECT '15:00 - 16:00' UNION
    SELECT '16:00 - 17:00' UNION
    SELECT '17:00 - 18:00'
) AS times
CROSS JOIN (
    SELECT id AS master_id FROM masters
) AS masters_list
WHERE NOT EXISTS (
    SELECT 1 FROM time_slots ts 
    WHERE ts.slot_date = DATE_ADD(CURDATE(), INTERVAL n DAY)
    AND ts.slot_time = time_slot
    AND ts.master_id = master_id
);