const pool = require('../db');

async function resetGame() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE scans RESTART IDENTITY');
        await client.query(
            `UPDATE eggs
             SET claimed_by_user_id = NULL,
                 claimed_at = NULL`
        );
        await client.query('COMMIT');
        console.log('Juego reiniciado correctamente');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error reiniciando el juego:', error);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

resetGame();
