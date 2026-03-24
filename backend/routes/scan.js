const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    const { qrData } = req.body;
    const userId = req.userId;

    if (!qrData) {
        return res.status(400).json({ error: 'Datos QR no proporcionados' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const eggRes = await client.query(
            `SELECT id, egg_number, is_winning, winning_number, claimed_by_user_id
             FROM eggs
             WHERE qr_code_data = $1
             FOR UPDATE`,
            [qrData]
        );

        if (eggRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'QR no valido' });
        }

        const egg = eggRes.rows[0];

        const userAnyScan = await client.query(
            `SELECT s.id, e.is_winning, e.winning_number, e.egg_number
             FROM scans s
             JOIN eggs e ON e.id = s.egg_id
             WHERE s.user_id = $1
             LIMIT 1`,
            [userId]
        );

        if (userAnyScan.rows.length > 0) {
            const previous = userAnyScan.rows[0];
            await client.query('ROLLBACK');
            return res.status(409).json({
                resultType: 'user_attempt_used',
                eggNumber: previous.winning_number || previous.egg_number,
                error: 'Este correo ya uso su unico intento'
            });
        }

        if (egg.is_winning) {
            if (egg.claimed_by_user_id && Number(egg.claimed_by_user_id) !== Number(userId)) {
                await client.query('ROLLBACK');
                return res.status(409).json({
                    resultType: 'claimed',
                    eggNumber: egg.winning_number,
                    error: `El huevo N°${egg.winning_number} ya se ha encontrado`
                });
            }

            await client.query(
                'INSERT INTO scans (user_id, egg_id) VALUES ($1, $2)',
                [userId, egg.id]
            );

            await client.query(
                `UPDATE eggs
                 SET claimed_by_user_id = $1, claimed_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [userId, egg.id]
            );

            await client.query('COMMIT');

            if (req.io) {
                req.io.emit('new_scan', {
                    resultType: 'winning',
                    userId,
                    eggNumber: egg.winning_number,
                    message: `El huevo N°${egg.winning_number} se ha encontrado`
                });
            }

            return res.json({
                success: true,
                resultType: 'winning',
                eggNumber: egg.winning_number,
                message: `Haz encontrado el premio del huevo N°${egg.winning_number}`
            });
        }

        await client.query(
            'INSERT INTO scans (user_id, egg_id) VALUES ($1, $2)',
            [userId, egg.id]
        );

        await client.query('COMMIT');

        return res.json({
            success: true,
            resultType: 'fake',
            eggNumber: egg.egg_number,
            message: 'No lo haz encontrado, sigue buscando'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

module.exports = router;
