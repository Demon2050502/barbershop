DROP DATABASE IF EXISTS barbershop;

CREATE DATABASE barbershop;
USE barbershop;

-- Таблица категорий мастеров
CREATE TABLE master_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO master_categories (name) VALUES 
('Парикмахер'),
('Маникюр'),
('Барбер'),
('Визажист'),
('Косметолог');

-- Таблица мастеров с категориями
CREATE TABLE masters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    photo VARCHAR(255),
    experience INT,
    rating DECIMAL(3,1),
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Добавляем 5 мастеров с разными категориями
INSERT INTO masters (name, specialization, category_id, photo, experience, rating, description) VALUES
('Алексей Петров', 'Мужские стрижки, бритье', 3, 'img/i.webp', 8, 4.9, 'Специалист по классическим и современным мужским стрижкам'),
('Елена Смирнова', 'Женские стрижки, окрашивание', 1, 'img/i.webp', 10, 4.8, 'Мастер по креативным стрижкам и модным окрашиваниям'),
('Иван Козлов', 'Детские стрижки, стильные стрижки', 1, 'img/i.webp', 5, 4.7, 'Специализируется на стрижках для детей и подростков'),
('Ольга Иванова', 'Маникюр, педикюр', 2, 'img/i.webp', 7, 4.8, 'Профессиональный мастер маникюра и педикюра'),
('Анна Сидорова', 'Вечерний макияж, свадебный макияж', 4, 'img/i.webp', 6, 4.9, 'Визажист с художественным образованием');

-- Таблица услуг
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    duration INT NOT NULL COMMENT 'Длительность в минутах',
    price DECIMAL(10,2),
    FOREIGN KEY (category_id) REFERENCES master_categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO services (name, category_id, duration, price) VALUES
('Мужская стрижка', 1, 60, 1500),
('Женская стрижка', 1, 90, 2000),
('Окрашивание волос', 1, 120, 3000),
('Классический маникюр', 2, 60, 1200),
('Мужская стрижка машинкой', 3, 30, 800),
('Вечерний макияж', 4, 90, 2500);

-- Таблица временных слотов
CREATE TABLE time_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(50) NOT NULL,
    master_id INT NOT NULL,
    service_id INT,
    is_booked BOOLEAN DEFAULT FALSE,
    booked_by_name VARCHAR(100),
    booked_by_phone VARCHAR(20),
    booked_by_email VARCHAR(100),
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (master_id) REFERENCES masters(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELIMITER //
CREATE PROCEDURE generate_slots()
BEGIN
    DELETE FROM time_slots WHERE slot_date < DATE_SUB(CURDATE(), INTERVAL 7 DAY);
    
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
    )
    AND DATE_ADD(CURDATE(), INTERVAL n DAY) >= CURDATE();
END //
DELIMITER ;

CALL generate_slots();

-- Создаем событие для ежедневного обновления слотов
CREATE EVENT IF NOT EXISTS update_time_slots
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE, '00:00:01')
DO CALL generate_slots();