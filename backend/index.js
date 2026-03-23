const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const userRoutes = require('./routes/user');
const socketSetup = require('./socket');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketSetup.init(server);

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
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
