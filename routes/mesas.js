// mesas.js

const express = require('express');
const { poolPromise } = require('../connection');

//consstantes creadas para los procedimientos almacenados

const SP_OBTENER_MESAS = 'Pedidos.Proc_ObtenerMesas';

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


module.exports = router;