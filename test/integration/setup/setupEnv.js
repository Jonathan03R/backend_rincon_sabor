// test/integration/setup/setupEnv.js
require('dotenv').config({ path: '.env.test' });

process.env.NODE_ENV = 'test';

console.log('✓ Variables de entorno de test cargadas');
console.log('✓ Base de datos:', process.env.DB_NAME);
