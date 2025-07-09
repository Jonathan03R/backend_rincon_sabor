const prediccionService = require('../services/prediccionesService');

const getHistorialVentas = async (req, res) => {
  try {
    const data = await prediccionService.obtenerHistorialVentas();
    res.json(data);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial de ventas' });
  }
};

module.exports = { getHistorialVentas };