// pedido.js

const express = require('express');
const router = express.Router();
const { sql,poolPromise } = require('../config/connection');

const SP_ACTUALIZAR_DETALLES = 'Pedidos.Proc_ActualizarDetallesPedido';
const SP_OBTENER_PEDIDOS_POR_MESA = 'Proc_ObtenerPedidoPorMesa';
const SP_CREAR_PEDIDO = 'Pedidos.Proc_CrearPedido';
const SP_ELIMINAR_PEDIDO = 'Proc_EliminarPedidoPorCodigo';


router.get('/obtenerPorMesas/:MesaCodigo', async (req, res) => {
    try {
        const { MesaCodigo } = req.params;
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('MesaCodigo', MesaCodigo)
            .execute(SP_OBTENER_PEDIDOS_POR_MESA);

        const pedidosRaw = result.recordset;

        const pedidosMap = new Map();

        pedidosRaw.forEach(row => {
            const key = row.PedidoCodigo;
            if (!pedidosMap.has(key)) {
                pedidosMap.set(key, {
                    PedidoCodigo: row.PedidoCodigo,
                    PedidoFechaHora: row.PedidoFechaHora,
                    PedidoTotal: row.PedidoTotal,
                    PedidoEstado: row.PedidoEstado,
                    Detalles: []
                });
            }

            pedidosMap.get(key).Detalles.push({
                DetallePedidoCodigo: row.detallePedidoCodigo,
                Subtotal: row.detallePedidoSubtotal,
                Cantidad: row.detallePedidoCantidad,
                Estado: row.detallePedidoEstado,
                Notas: row.detallePedidoNotas,
                Producto: {
                    MenuCodigo: row.MenuCodigo,
                    MenuPlatos: row.MenuPlatos,
                    MenuPrecio: row.MenuPrecio,
                    MenuDescripcion: row.MenuDescripcion,
                    MenuImageUrl: row.MenuImageUrl,
                    MenuEstado: row.MenuEstado,
                    MenuEsPreparado: row.MenuEsPreparado,
                }
            });
        });


        const pedidos = Array.from(pedidosMap.values());

        res.status(200).json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        console.error('Error al obtener pedidos por mesa:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener pedidos por mesa'
        });
    }
});


router.post('/actualizarDetallesPedido', async (req, res) => {
    try {
        const { PedidoCodigo, Detalles } = req.body;

        if (!PedidoCodigo || !Array.isArray(Detalles)) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos. Se requiere PedidoCodigo y Detalles.'
            });
        }

        const pool = await poolPromise;
        const table = new sql.Table(); // no pongas nombre aquí, lo define SQL Server

        table.columns.add('detallePedidoCodigo', sql.NChar(10));
        table.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        table.columns.add('detallePedidoCantidad', sql.Int);
        table.columns.add('detallePedidoEstado', sql.NVarChar(20));
        table.columns.add('detallePedidoNotas', sql.NVarChar(200));
        table.columns.add('detallePedidoMenuCodigo', sql.NChar(10));

        Detalles.forEach(d => {
            table.rows.add(
                d.detallePedidoCodigo,
                d.detallePedidoSubtotal,
                d.detallePedidoCantidad,
                d.detallePedidoEstado,
                d.detallePedidoNotas,
                d.detallePedidoMenuCodigo
            );
        });

        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .input('Detalles', table)
            .execute(SP_ACTUALIZAR_DETALLES);

        res.status(200).json({
            success: true,
            message: 'Detalles actualizados correctamente'
        });
    } catch (error) {
        console.error('Error al actualizar detalles del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar detalles'
        });
    }
});


router.post('/crearPedido', async (req, res) => {
    try {
        const { MesaCodigo, Detalles } = req.body;

        if (!MesaCodigo || !Array.isArray(Detalles) || Detalles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos. Se requiere MesaCodigo y una lista de Detalles.'
            });
        }

        const pool = await poolPromise;
        const table = new sql.Table(); // tipo definido en SQL Server

        table.columns.add('detallePedidoCodigo', sql.NChar(10)); // será ''
        table.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        table.columns.add('detallePedidoCantidad', sql.Int);
        table.columns.add('detallePedidoEstado', sql.NVarChar(20));
        table.columns.add('detallePedidoNotas', sql.NVarChar(200));
        table.columns.add('detallePedidoMenuCodigo', sql.NChar(10));

        Detalles.forEach(d => {
            table.rows.add(
                '', // los códigos se generan en SQL
                d.detallePedidoSubtotal,
                d.detallePedidoCantidad,
                d.detallePedidoEstado,
                d.detallePedidoNotas,
                d.detallePedidoMenuCodigo
            );
        });

        await pool.request()
            .input('MesaCodigo', sql.NChar(10), MesaCodigo)
            .input('Detalles', table)
            .execute(SP_CREAR_PEDIDO);

        res.status(201).json({
            success: true,
            message: 'Pedido creado correctamente'
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al crear el pedido'
        });
    }
});

router.delete('/eliminar/:PedidoCodigo', async (req, res) => {
    try {
        const { PedidoCodigo } = req.params;

        if (!PedidoCodigo) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere PedidoCodigo para eliminar.'
            });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .execute(SP_ELIMINAR_PEDIDO);

        res.status(200).json({
            success: true,
            message: 'Pedido eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar pedido'
        });
    }
});
module.exports = router;
