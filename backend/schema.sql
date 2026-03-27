-- Tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de huevos / QR
CREATE TABLE IF NOT EXISTS eggs (
    id SERIAL PRIMARY KEY,
    egg_number INT NOT NULL UNIQUE,
    qr_code_data VARCHAR(50) NOT NULL UNIQUE,
    is_winning BOOLEAN NOT NULL DEFAULT FALSE,
    winning_number INT,
    claimed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    claimed_at TIMESTAMP
);

ALTER TABLE eggs ADD COLUMN IF NOT EXISTS is_winning BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE eggs ADD COLUMN IF NOT EXISTS winning_number INT;
ALTER TABLE eggs ADD COLUMN IF NOT EXISTS claimed_by_user_id INT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE eggs ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;

-- Tabla de escaneos (mejorada con información del usuario)
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NOT NULL,
    egg_id INT NOT NULL REFERENCES eggs(id) ON DELETE CASCADE,
    egg_number INT NOT NULL,
    qr_code_data VARCHAR(50) NOT NULL,
    is_winning BOOLEAN NOT NULL,
    winning_number INT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, egg_id)
);

-- Cargar 80 QR sin borrar progreso.
-- 20 premios reales y 60 QR sin premio.
INSERT INTO eggs (egg_number, qr_code_data, is_winning, winning_number)
SELECT
    i,
    'egg_' || i,
    i <= 20,
    CASE WHEN i <= 20 THEN i ELSE NULL END
FROM generate_series(1, 80) AS i
ON CONFLICT (egg_number) DO UPDATE
SET
    qr_code_data = EXCLUDED.qr_code_data,
    is_winning = EXCLUDED.is_winning,
    winning_number = EXCLUDED.winning_number;
