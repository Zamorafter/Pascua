const fs = require('fs');
const path = require('path');

// Crear config.js para Vercel con URL de Railway
const configContent = `window.APP_CONFIG = {
    API_BASE_URL: "${process.env.API_BASE_URL || 'https://tu-backend-production.up.railway.app'}"
};`;

// Escribir config.js en frontend
fs.writeFileSync(path.join(__dirname, '../frontend/config.js'), configContent);

console.log('✅ Configuración para Vercel preparada');
