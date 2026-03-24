const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const scans = await pool.query(
            `SELECT winning_number, claimed_at
             FROM eggs
             WHERE is_winning = TRUE
               AND claimed_by_user_id = $1
             ORDER BY winning_number`,
            [req.userId]
        );

        const foundEggs = scans.rows.map((row) => row.winning_number);

        res.json({
            total: 20,
            found: foundEggs.length,
            eggs: foundEggs,
            details: scans.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
});

module.exports = router;
