const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/connection');

const SP_GANANCIAS_RESUMEN = 'Ventas.Proc_ResumenDiarioDelAnio';

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

router.get('/gananciasDiarias', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Ejemplo: año actual
    const anio = new Date().getFullYear();

    const result = await pool.request()
      .input('Anio', anio)
      .execute(SP_GANANCIAS_RESUMEN);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener ganancias diarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener ganancias diarias'
    });
  }
});

///LO USE EN LA GRAFICA CIRCULAR

router.get('/gananciasMensuales', async (req, res) => {
  try {
    const pool = await poolPromise;
     const anio = req.query.anio || new Date().getFullYear();

    const result = await pool.request()
      .input('Anio', anio)
      .execute(SP_GANANCIAS_RESUMEN);

    const data = result.recordset;

    // Agrupar por mes
    const mensual = {};
    data.forEach(row => {
      const mes = new Date(row.Fecha).getMonth() + 1; // 1-12
      if (!mensual[mes]) {
        mensual[mes] = { Mes: mes, Ganancias: 0, Pedidos: 0 };
      }
      mensual[mes].Ganancias += row.GananciasDelDia;
      mensual[mes].Pedidos += row.NumeroPedidos;
    });

    // Convertir a array ordenado
    const agrupado = Object.values(mensual).sort((a, b) => a.Mes - b.Mes);

    res.status(200).json({
      success: true,
      data: agrupado
    });

  } catch (error) {
    console.error('Error agrupando mensual:', error);
    res.status(500).json({ success: false });
  }
});


router.get('/gananciasSemanales2', async (req, res) => {
  try {
    const pool = await poolPromise;
    const anio = new Date().getFullYear();

    const result = await pool.request()
      .input('Anio', anio)
      .execute('Ventas.SP_ResumenDiarioDelAnio');

    const data = result.recordset;

    // Agrupar por semana
    const semanal = {};
    data.forEach(row => {
      // Solo agrupa si tiene algo
      if (row.NumeroPedidos > 0) {
        const fecha = new Date(row.Fecha);

        const firstDayOfYear = new Date(fecha.getFullYear(), 0, 1);
        const pastDaysOfYear = (fecha - firstDayOfYear) / 86400000;
        const semana = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

        if (!semanal[semana]) {
          semanal[semana] = { Semana: semana, Ganancias: 0, Pedidos: 0 };
        }
        semanal[semana].Ganancias += row.GananciasDelDia;
        semanal[semana].Pedidos += row.NumeroPedidos;
      }
    });

    const agrupado = Object.values(semanal).sort((a, b) => a.Semana - b.Semana);

    res.status(200).json({
      success: true,
      data: agrupado
    });

  } catch (error) {
    console.error('Error agrupando semanal:', error);
    res.status(500).json({ success: false });
  }
});


///Lo use en la grafca lineal EPICO

router.get('/gananciasSemanalesPorMes', async (req, res) => {
  try {
    const pool = await poolPromise;

    // Si no envían, usa actual
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const mes = parseInt(req.query.mes); // requerido

    if (!mes || mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro mes inválido'
      });
    }

    const result = await pool.request()
      .input('Anio', anio)
      .execute(SP_GANANCIAS_RESUMEN);

    let data = result.recordset;

    // Filtrar solo ese mes y año
    data = data.filter(row => {
      const fecha = new Date(row.Fecha);
      return fecha.getFullYear() === anio &&
             fecha.getMonth() + 1 === mes &&
             row.NumeroPedidos > 0;
    });

    // Agrupar por semana del mes
    const semanal = {};
    data.forEach(row => {
      const fecha = new Date(row.Fecha);
      const diaMes = fecha.getDate();
      const semana = Math.ceil(diaMes / 7);

      if (!semanal[semana]) {
        semanal[semana] = { SemanaDelMes: semana, Ganancias: 0, Pedidos: 0 };
      }
      semanal[semana].Ganancias += row.GananciasDelDia;
      semanal[semana].Pedidos += row.NumeroPedidos;
    });

    const agrupado = Object.values(semanal).sort((a, b) => a.SemanaDelMes - b.SemanaDelMes);

    res.status(200).json({
      success: true,
      data: agrupado
    });

  } catch (error) {
    console.error('Error agrupando semanal por mes:', error);
    res.status(500).json({ success: false });
  }
});



module.exports = router;