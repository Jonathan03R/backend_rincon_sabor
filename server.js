// server.js

require('dotenv').config();
const http = require('http');
const app = require('./index')
// pruebas host local

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});