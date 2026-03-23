-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de huevos
CREATE TABLE IF NOT EXISTS eggs (
    id SERIAL PRIMARY KEY,
    egg_number INT NOT NULL UNIQUE,
    qr_code_data VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de escaneos
CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    egg_id INT NOT NULL REFERENCES eggs(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, egg_id)
);

-- Insertar los 10 huevos
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..10 LOOP
        INSERT INTO eggs (egg_number, qr_code_data)
        VALUES (i, 'egg_' || i)
        ON CONFLICT (egg_number) DO NOTHING;
    END LOOP;
END $$;
