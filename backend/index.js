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

async function verifyStartup() {
    console.log(`Iniciando backend. PORT=${process.env.PORT || 3001}`);
    console.log(`DATABASE_URL configurada: ${Boolean(process.env.DATABASE_URL)}`);

    try {
        await pool.query('SELECT 1');
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
