const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const claimedPrizes = await pool.query(
            `SELECT winning_number, claimed_at
             FROM eggs
             WHERE is_winning = TRUE
               AND claimed_by_user_id IS NOT NULL
             ORDER BY winning_number`,
        );

        const userPrize = await pool.query(
            `SELECT winning_number
             FROM eggs
             WHERE is_winning = TRUE
               AND claimed_by_user_id = $1
             LIMIT 1`,
            [req.userId]
        );

        const usedAttempt = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM scans
             WHERE user_id = $1`,
            [req.userId]
        );

        const foundEggs = claimedPrizes.rows.map((row) => row.winning_number);

        res.json({
            total: 20,
            found: foundEggs.length,
            eggs: foundEggs,
            details: claimedPrizes.rows,
            userPrize: userPrize.rows[0]?.winning_number || null,
            attemptUsed: usedAttempt.rows[0]?.total > 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener progreso' });
    }
});

module.exports = router;
