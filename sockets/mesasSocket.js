// sockets/mesasSocket.js

let ioGlobal;

function configurarSockets(io) {
  ioGlobal = io;

  io.on('connection', (socket) => {
    console.log('🟢 Cliente conectado al WebSocket');

    socket.on('disconnect', () => {
      console.log('🔴 Cliente desconectado');
    });
  });
}

function emitirActualizacionMesas() {
  if (ioGlobal) {
    ioGlobal.emit('mesas_actualizadas');
    console.log('📢 Se emitió actualización de mesas');
  }
}

module.exports = {
  configurarSockets,
  emitirActualizacionMesas,
};
