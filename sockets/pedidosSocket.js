// sockets/pedidosSocket.js
//Esto notificará a la cocina en tiempo real.
const { Server } = require('socket.io');

let io;

function initSocket(server) {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });
}

function emitirActualizacionPedidos() {
    if (io) {
        io.emit('actualizar-pedidos');
    }
}

module.exports = { initSocket, emitirActualizacionPedidos };