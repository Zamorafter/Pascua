const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const scans = await pool.query(
            `SELECT e.egg_number, e.qr_code_data, s.scanned_at
             FROM scans s
             JOIN eggs e ON s.egg_id = e.id
             WHERE s.user_id = $1
             ORDER BY e.egg_number`,
            [req.userId]
        );
        const foundEggs = scans.rows.map(row => row.egg_number);
        const totalEggs = 10; // podrias obtener de COUNT en eggs
        const count = foundEggs.length;
        res.json({
            total: totalEggs,
            found: count,
            eggs: foundEggs,
            details: scans.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
});

module.exports = router;
