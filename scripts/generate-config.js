const fs = require('node:fs');
const path = require('node:path');

const frontendDir = path.join(__dirname, '..', 'frontend');
const configPath = path.join(frontendDir, 'config.js');

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

const fileContents = `window.APP_CONFIG = {
    API_BASE_URL: ${JSON.stringify(apiBaseUrl)}
};
`;

fs.writeFileSync(configPath, fileContents, 'utf8');
console.log(`config.js generado con API_BASE_URL=${apiBaseUrl}`);
