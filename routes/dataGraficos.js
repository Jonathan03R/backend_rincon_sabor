const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/connection');

router.get('/gananciasSemanales', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query(`
          SELECT
            Semana,
            FechaInicioSemana,
            FechaFinSemana,
            TotalGanancia
          FROM Ventas.VistaGananciasDeLasSemanas
          WHERE FechaInicioSemana >= DATEADD(MONTH, -1, GETDATE())
          ORDER BY FechaInicioSemana
        `);
  
      res.status(200).json({
        success: true,
        data: result.recordset
      });
    } catch (error) {
      console.error('Error al obtener ganancias semanales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al obtener ganancias semanales'
      });
    }
  });
  
  module.exports = router;