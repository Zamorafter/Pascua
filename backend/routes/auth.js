const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
            [email, hashedPassword]
        );
        const userId = result.rows[0].id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, userId });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        console.error(err);
        res.status(500).json({ error: 'Error en el registro' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    try {
        const result = await pool.query(
            'SELECT id, password_hash FROM users WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, userId: user.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en el login' });
    }
});

module.exports = router;
