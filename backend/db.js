const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL no esta definida');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Error en el pool de conexiones:', err);
});

module.exports = pool;
