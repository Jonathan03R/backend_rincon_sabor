// mesas.js
const express = require('express');
const { poolPromise } = require('../config/connection');


const SP_MOSTRAR_CATEGORIA = 'Proc_MostrarCategorias';

const router = express.Router();


router.get('/mostrarCategorias', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().execute(SP_MOSTRAR_CATEGORIA);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener las categorias 🏸:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener las mesas'
    });
  }
});


module.exports = router;