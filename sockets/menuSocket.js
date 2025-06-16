let ioMenus;
function configurarMenuSockets(io) {
  ioMenus = io;
  io.on('connection', socket => {
    console.log('🟢 Cliente conectado WS Menús');
    socket.on('disconnect', ()=> console.log('🔴 Cliente desconectado WS Menús'));
  });
}
function emitirActualizacionMenus() {
  if (ioMenus) {
    ioMenus.emit('menus_actualizados');
    console.log('📢 menus_actualizados emitido');
  }
}
module.exports = { configurarMenuSockets, emitirActualizacionMenus };