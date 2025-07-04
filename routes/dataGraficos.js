const express = require('express');
const router = express.Router();
const { poolPromise } = require('../config/connection');

const SP_GANANCIAS_RESUMEN = 'Ventas.Proc_ResumenDiarioDelAnio';
const SP_OBTENER_PEDIDOS_ACTIVOS = 'Pedidos.Proc_ObtenerTodosLosPedidos';
const SP_OBTENER_MESAS = 'Pedidos.Proc_ObtenerMesas';

// Función para formatear la fecha según la zona horaria de Lima
function formatFechaLima(fecha) {
  const lima = new Date(fecha.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  return [
      lima.getFullYear(),
      String(lima.getMonth() + 1).padStart(2, '0'),
      String(lima.getDate()).padStart(2, '0')
  ].join('-');
}

router.get('/ventasHoy', async (req, res) => {
  try {
    // Obtener la fecha de hoy en Lima
    const hoyIso = formatFechaLima(new Date());
    console.log('hoyIso (Lima):', hoyIso);
    
    const pool = await poolPromise;
    const result = await pool.request().execute(SP_OBTENER_PEDIDOS_ACTIVOS);

    // Filtrar solo los pedidos cuya fecha (PedidoFechaHora) sea hoy en Lima
    const pedidosHoy = result.recordset.filter(row => {
      const fechaIso = formatFechaLima(new Date(row.PedidoFechaHora));
      return fechaIso === hoyIso;
    });

    // Sumar el total de ventas de hoy, considerando la columna PedidoTotal
    const totalVentas = pedidosHoy.reduce((ac, row) => ac + Number(row.PedidoTotal), 0);

    res.status(200).json({
      success: true,
      data: {
        fecha: hoyIso,
        totalVentas
      }
    });
  } catch (error) {
    console.error('Error al obtener las ventas de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener las ventas de hoy'
    });
  }
});

router.get('/pedidosHoy', async (req, res) => {
  try {
    // Obtener la fecha de hoy en Lima
    const hoyIso = formatFechaLima(new Date());
    console.log('hoyIso (Lima):', hoyIso);

    const pool = await poolPromise;
    const result = await pool.request().execute(SP_OBTENER_PEDIDOS_ACTIVOS);

    // Filtrar solo los pedidos cuya fecha (PedidoFechaHora) sea hoy en Lima
    const filteredRecords = result.recordset.filter(row => {
      const fechaIso = formatFechaLima(new Date(row.PedidoFechaHora));
      return fechaIso === hoyIso;
    });

    // Agrupar los detalles por PedidoCodigo
    const groupedData = filteredRecords.reduce((acc, row) => {
      if (!acc[row.PedidoCodigo]) {
        acc[row.PedidoCodigo] = {
          PedidoCodigo: row.PedidoCodigo,
          Detalles: []
        };
      }
      acc[row.PedidoCodigo].Detalles.push({
        detallePedidoCodigo: row.detallePedidoCodigo,
        detallePedidoSubtotal: row.detallePedidoSubtotal
      });
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: Object.values(groupedData)
    });
  } catch (error) {
    console.error('Error al obtener pedidos activos filtrados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener pedidos activos filtrados'
    });
  }
});

router.get('/disponibles', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute(SP_OBTENER_MESAS);
    const mesas = result.recordset;

    // Filtrar las mesas que tienen MesaEstado "Disponible"
    const disponibles = mesas.filter(mesa => mesa.MesaEstado === 'Disponible').length;
    const total = mesas.length;

    res.status(200).json({
      success: true,
      data: `${disponibles}/${total}`,
      mesas: mesas.map(mesa => ({
        MesaCodigo: mesa.MesaCodigo,
        MesaEstado: mesa.MesaEstado
      }))
    });
  } catch (error) {
    console.error('Error al obtener mesas disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener mesas disponibles'
    });
  }
});

router.get('/gananciasMesActual', async (req, res) => {
  try {
    // Obtener la fecha actual en la zona horaria de Lima
    const hoy = new Date();
    const hoyLima = new Date(
      hoy.toLocaleString('en-US', { timeZone: 'America/Lima' })
    );
    const anio = hoyLima.getFullYear();
    const mes = hoyLima.getMonth() + 1;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Anio', anio)
      .execute(SP_GANANCIAS_RESUMEN);

    // Filtrar los registros para el mes actual (usando la conversión a zona Lima)
    const registrosMesActual = result.recordset.filter(row => {
      const fechaRow = new Date(row.Fecha);
      const fechaLima = new Date(
        fechaRow.toLocaleString('en-US', { timeZone: 'America/Lima' })
      );
      return fechaLima.getFullYear() === anio && (fechaLima.getMonth() + 1) === mes && row.NumeroPedidos > 0;
    });

    // Calcular totales del mes actual
    const totalGanancias = registrosMesActual.reduce((ac, row) => ac + row.GananciasDelDia, 0);
    const totalPedidos = registrosMesActual.reduce((ac, row) => ac + row.NumeroPedidos, 0);

    res.status(200).json({
      success: true,
      data: {
        anio,
        mes,
        totalGanancias,
        totalPedidos,
        detalles: registrosMesActual
      }
    });
  } catch (error) {
    console.error('Error al obtener ganancias del mes actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener las ganancias del mes actual'
    });
  }
});

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