const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

function adminAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.slice(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.isAdmin) {
            return res.status(403).json({ error: 'Acceso solo para administradores' });
        }

        req.adminEmail = decoded.email;
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Token invalido' });
    }
}

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contrasena requeridos' });
    }

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'Credenciales de administrador no configuradas' });
    }

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
        {
            isAdmin: true,
            email: process.env.ADMIN_EMAIL
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    return res.json({
        token,
        admin: {
            email: process.env.ADMIN_EMAIL
        }
    });
});

router.get('/overview', adminAuthMiddleware, async (req, res) => {
    try {
        const recentScans = await pool.query(
            `SELECT
                s.id,
                s.user_email,
                s.egg_number,
                s.qr_code_data,
                s.is_winning,
                s.winning_number,
                s.scanned_at
             FROM scans s
             ORDER BY s.scanned_at DESC, s.id DESC
             LIMIT 50`
        );

        const summary = await pool.query(
            `SELECT
                COUNT(*)::int AS total_scans,
                COUNT(*) FILTER (WHERE is_winning)::int AS winning_scans,
                COUNT(*) FILTER (WHERE NOT is_winning)::int AS fake_scans
             FROM scans`
        );

        const claimed = await pool.query(
            `SELECT COUNT(*)::int AS claimed_prizes
             FROM eggs
             WHERE is_winning = TRUE
               AND claimed_by_user_id IS NOT NULL`
        );

        return res.json({
            scans: recentScans.rows,
            summary: {
                totalScans: summary.rows[0]?.total_scans || 0,
                winningScans: summary.rows[0]?.winning_scans || 0,
                fakeScans: summary.rows[0]?.fake_scans || 0,
                claimedPrizes: claimed.rows[0]?.claimed_prizes || 0
            }
        });
    } catch (error) {
        console.error('Error obteniendo panel admin:', error);
        return res.status(500).json({ error: 'No se pudo cargar la actividad administrativa' });
    }
});

module.exports = router;
