const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.post('/scan', authMiddleware, async (req, res) => {
    const { qrData } = req.body;
    const userId = req.userId;

    if (!qrData) {
        return res.status(400).json({ error: 'Datos QR no proporcionados' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const eggRes = await client.query(
            'SELECT id, egg_number FROM eggs WHERE qr_code_data = $1',
            [qrData]
        );
        if (eggRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Huevo no válido' });
        }
        const egg = eggRes.rows[0];

        const scanRes = await client.query(
            'SELECT id FROM scans WHERE user_id = $1 AND egg_id = $2',
            [userId, egg.id]
        );
        if (scanRes.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Ya escaneaste este huevo anteriormente' });
        }

        await client.query(
            'INSERT INTO scans (user_id, egg_id) VALUES ($1, $2)',
            [userId, egg.id]
        );

        await client.query('COMMIT');

        // Emitir notificacion WebSocket a todos los clientes
        const io = req.io;
        if (io) {
            io.emit('new_scan', {
                userId: userId,
                eggNumber: egg.egg_number,
                message: `¡El usuario ${userId} ha encontrado el huevo N°${egg.egg_number}!`
            });
        }

        res.json({ success: true, eggNumber: egg.egg_number, message: `¡Felicidades! Has encontrado el huevo N°${egg.egg_number}` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
});

module.exports = router;
