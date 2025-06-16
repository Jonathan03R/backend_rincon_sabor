// server.js

require('dotenv').config();
const http = require('http');
const app = require('./index')
const { configurarSockets } = require('./sockets/mesasSocket');
const { configurarMenuSockets }= require('./sockets/menuSocket');
const { Server } = require('socket.io');
// pruebas host local

/**
 * Puerto en el que se ejecuta el servidor.
 *
 * Se asigna a la variable PORT el valor de la variable de entorno process.env.PORT si está definida;
 * de lo contrario, se utiliza el puerto 8080.
 *
 * @constant {number|string} PORT - Puerto configurado para el servidor.
 */
const PORT = process.env.PORT || 8080;

/**
 * Esta instancia del servidor se crea utilizando http.createServer de Node.js y es responsable de manejar las solicitudes HTTP entrantes y enviar las respuestas.
 */
const server = http.createServer(app);


// WebSocket Server
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

// Configurar eventos de WebSocket
configurarSockets(io);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡️Servidor corriendo en el puerto ${PORT}`);
});