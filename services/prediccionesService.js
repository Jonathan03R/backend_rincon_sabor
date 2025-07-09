const { poolPromise } = require('../config/connection');

const SP_OBTENER_HISTORIAL_VENTAS = 'pro_ObtenerHistorialVentas';

const obtenerHistorialVentas = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .execute(SP_OBTENER_HISTORIAL_VENTAS);

    return result.recordset.map(row => ({
        PedidoFechaHora: row.PedidoFechaHora,
        MenuCodigo: row.MenuCodigo,
        MenuPlatos: row.MenuPlatos,
        CantidadVendida: row.detallePedidoCantidad
    }));
};

module.exports = {
    obtenerHistorialVentas
};
