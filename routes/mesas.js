// mesas.js

const express = require('express');
const { poolPromise } = require('../config/connection');
const { emitirActualizacionMesas } = require('../sockets/mesasSocket');

//consstantes creadas para los procedimientos almacenados

const SP_OBTENER_MESAS = 'Pedidos.Proc_ObtenerMesas';
const SP_CAMBIAR_ESTADO_MESA = 'Pedidos.Proc_CambiarEstadoMesa';

const router = express.Router();


router.get('/obtener', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().execute(SP_OBTENER_MESAS);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener las mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener las mesas'
    });
  }
});


router.put('/actualizar', async (req, res) => {
  try {
    const { MesaCodigo, nuevoEstado } = req.body;

    if (!MesaCodigo || !nuevoEstado) {
      return res.status(400).json({ success: false, message: 'Parámetros incompletos' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('MesaCodigo', MesaCodigo)
      .input('nuevoEstado', nuevoEstado)
      .execute(SP_CAMBIAR_ESTADO_MESA);

    // 🔊 Emitimos la actualización a todos los clientes
    emitirActualizacionMesas();

    res.status(200).json({ success: true, message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estado de mesa:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});



module.exports = router;