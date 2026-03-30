const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const socketSetup = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketSetup.init(server);

async function ensureRuntimeSchema() {
    const statements = [
        `CREATE TABLE IF NOT EXISTS admins (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS scans (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            egg_id INT NOT NULL REFERENCES eggs(id) ON DELETE CASCADE,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, egg_id)
        )`,
        'ALTER TABLE scans ADD COLUMN IF NOT EXISTS user_email VARCHAR(255)',
        'ALTER TABLE scans ADD COLUMN IF NOT EXISTS egg_number INT',
        'ALTER TABLE scans ADD COLUMN IF NOT EXISTS qr_code_data VARCHAR(50)',
        'ALTER TABLE scans ADD COLUMN IF NOT EXISTS is_winning BOOLEAN NOT NULL DEFAULT FALSE',
        'ALTER TABLE scans ADD COLUMN IF NOT EXISTS winning_number INT'
    ];

    for (const statement of statements) {
        await pool.query(statement);
    }
}

async function verifyStartup() {
    console.log(`Iniciando backend. PORT=${process.env.PORT || 3001}`);
    console.log(`DATABASE_URL configurada: ${Boolean(process.env.DATABASE_URL)}`);

    try {
        await pool.query('SELECT 1');
        await ensureRuntimeSchema();
        console.log('Conexion a PostgreSQL verificada correctamente');
    } catch (error) {
        console.error('Error verificando la conexion a PostgreSQL:', error);
        process.exit(1);
    }
}

// Configuracion de CORS (ajusta el origen segun tu frontend)
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',  // si usas live-server
    'https://tu-frontend.netlify.app'  // reemplaza por tu dominio
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.netlify.app')) {
            callback(null, true);
        } else {
            callback(new Error('CORS no permitido'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Inyectar io en los request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3001;

verifyStartup().then(() => {
    server.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
});
