// mesas.js

const express = require('express');
const { poolPromise } = require('../connection');  

const router = express.Router();

// Ruta para obtener todas las mesas
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;  // Obtener la conexión a la base de datos
    const result = await pool.request().query('SELECT * FROM Pedidos.Mesa');  // Consulta a la tabla Mesa
    res.json(result.recordset);  // Devolver las mesas en formato JSON
  } catch (err) {
    console.error('Error al obtener las mesas:', err);
    res.status(500).send('Error al obtener las mesas');
  }
});

module.exports = router;