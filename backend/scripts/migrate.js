const fs = require('node:fs');
const path = require('node:path');
const pool = require('../db');

async function runMigration() {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Ejecutando schema.sql...');

    try {
        await pool.query(sql);
        console.log('Migracion completada correctamente');
    } catch (error) {
        console.error('Error ejecutando la migracion:', error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigration();
