const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware de autenticación para admin
const adminAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que sea admin
        const adminRes = await pool.query('SELECT id FROM admins WHERE id = $1', [decoded.userId]);
        if (adminRes.rows.length === 0) {
            return res.status(403).json({ error: 'Acceso no autorizado - se requiere rol de administrador' });
        }
        
        req.adminId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// Login de administrador
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const adminRes = await pool.query('SELECT id, email, password_hash FROM admins WHERE email = $1', [email]);
        
        if (adminRes.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const admin = adminRes.rows[0];
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: admin.id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });
    } catch (error) {
        console.error('Error en login admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los escaneos con información del usuario
router.get('/scans', adminAuthMiddleware, async (req, res) => {
    try {
        const scansRes = await pool.query(
            `SELECT 
                s.id,
                s.user_email,
                s.egg_number,
                s.qr_code_data,
                s.is_winning,
                s.winning_number,
                s.scanned_at,
                e.claimed_by_user_id,
                e.claimed_at
            FROM scans s
            JOIN eggs e ON e.id = s.egg_id
            ORDER BY s.scanned_at DESC`
        );

        res.json(scansRes.rows);
    } catch (error) {
        console.error('Error obteniendo escaneos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener estadísticas
router.get('/stats', adminAuthMiddleware, async (req, res) => {
    try {
        // Total escaneos
        const totalScansRes = await pool.query('SELECT COUNT(*) as total FROM scans');
        
        // Escaneos ganadores
        const winningScansRes = await pool.query('SELECT COUNT(*) as total FROM scans WHERE is_winning = true');
        
        // Huevos reclamados
        const claimedEggsRes = await pool.query('SELECT COUNT(*) as total FROM eggs WHERE claimed_by_user_id IS NOT NULL');
        
        // Escaneos de las últimas 24 horas
        const recentScansRes = await pool.query(`
            SELECT COUNT(*) as total 
            FROM scans 
            WHERE scanned_at >= NOW() - INTERVAL '24 hours'
        `);

        res.json({
            totalScans: parseInt(totalScansRes.rows[0].total),
            winningScans: parseInt(winningScansRes.rows[0].total),
            claimedEggs: parseInt(claimedEggsRes.rows[0].total),
            recentScans24h: parseInt(recentScansRes.rows[0].total)
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Crear administrador (solo para desarrollo)
router.post('/create', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    try {
        const existingAdminRes = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
        if (existingAdminRes.rows.length > 0) {
            return res.status(409).json({ error: 'El administrador ya existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdminRes = await pool.query(
            'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id, email',
            [email, hashedPassword]
        );

        res.status(201).json({
            message: 'Administrador creado exitosamente',
            admin: newAdminRes.rows[0]
        });
    } catch (error) {
        console.error('Error creando administrador:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;
