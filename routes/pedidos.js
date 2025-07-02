// pedido.js

const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/connection');
const { emitirActualizacionPedidos } = require('../sockets/pedidosSocket');

const SP_ACTUALIZAR_DETALLES = 'Pedidos.Proc_ActualizarDetallesPedido';
const SP_OBTENER_PEDIDOS_POR_MESA = 'Proc_ObtenerPedidoPorMesa';
const SP_CREAR_PEDIDO = 'Pedidos.Proc_CrearPedido';
const SP_PROCESAR_MENU = 'Proc_ProcesarMenu';
const SP_ELIMINAR_PEDIDO = 'Proc_EliminarPedidoPorCodigo';
const SP_DEVOLVER_STOCK_MENU = 'Pedidos.Proc_DevolverStockMenu';
const SP_OBTENER_PEDIDOS_ACTIVOS = 'Pedidos.Proc_ObtenerTodosLosPedidos';
const SP_ACTUALIZAR_ESTADO_PEDIDO = 'Pedidos.Proc_ActualizarEstadoPedido';
const SP_OBTENER_TODOS_LOS_PEDIDOS = 'Pedidos.Proc_ObtenerTodosLosPedidos';

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
    const { PedidoCodigo, Detalles } = req.body;
    if (!PedidoCodigo || !Array.isArray(Detalles)) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere PedidoCodigo y Detalles válidos.'
        });
    }

    try {
        const pool = await poolPromise;

        // 1) Leer detalles originales
        const orig = await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .query(`
        SELECT detallePedidoCodigo, detallePedidoMenuCodigo, detallePedidoCantidad
        FROM Pedidos.DetallePedido
        WHERE detallePedidoPedidoCodigo = @PedidoCodigo
      `);
        const originales = orig.recordset;

        // 2) Preparar TVP para el SP
        const table = new sql.Table();           // No se le pone nombre aquí
        table.columns.add('detallePedidoCodigo', sql.NChar(10));
        table.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        table.columns.add('detallePedidoCantidad', sql.Decimal(10, 2));
        table.columns.add('detallePedidoEstado', sql.NVarChar(20));
        table.columns.add('detallePedidoNotas', sql.NVarChar(200));
        table.columns.add('detallePedidoMenuCodigo', sql.NChar(10));

        Detalles.forEach(d => {
            table.rows.add(
                d.detallePedidoCodigo || '',
                d.detallePedidoSubtotal || 0,
                d.detallePedidoCantidad || 0,
                d.detallePedidoEstado || '',
                d.detallePedidoNotas || '',
                d.detallePedidoMenuCodigo || ''
            );
        });

        // 3) Ejecutar SP de CRUD de detalles
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .input('Detalles', sql.TVP('Pedidos.TipoDetallePedido'), table)
            .execute(SP_ACTUALIZAR_DETALLES);

        // 4a) Detectar eliminados y devolver stock
        const borrados = originales.filter(o =>
            !Detalles.find(d => d.detallePedidoCodigo === o.detallePedidoCodigo)
        );
        for (const b of borrados) {
            await pool.request()
                .input('MenuCodigo', sql.NChar(10), b.detallePedidoMenuCodigo)
                .input('Cantidad', sql.Decimal(10, 2), b.detallePedidoCantidad)
                .execute(SP_DEVOLVER_STOCK_MENU);
        }

        // 4b) Detectar nuevos y descontar stock
        const nuevos = Detalles.filter(d =>
            !originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo)
        );
        for (const n of nuevos) {
            await pool.request()
                .input('MenuCodigo', sql.NChar(10), n.detallePedidoMenuCodigo)
                .input('Cantidad', sql.Decimal(10, 2), n.detallePedidoCantidad)
                .execute(SP_PROCESAR_MENU);
        }

        // 4c) Detectar modificados y ajustar diferencia
        const comunes = Detalles.filter(d =>
            originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo)
        );
        for (const d of comunes) {
            const o = originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo);
            const diff = parseFloat(d.detallePedidoCantidad) - parseFloat(o.detallePedidoCantidad);
            if (diff === 0) continue;

            const proc = diff > 0
                ? SP_PROCESAR_MENU
                : SP_DEVOLVER_STOCK_MENU;

            await pool.request()
                .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                .input('Cantidad', sql.Decimal(10, 2), Math.abs(diff))
                .execute(proc);
        }

        res.json({ success: true, message: 'Detalles y stock actualizados.' });
    } catch (error) {
        console.error('Error en actualizarDetallesPedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno.'
        });
    }
});

router.post('/crearPedido', async (req, res) => {
    const { MesaCodigo, Detalles } = req.body;
    if (!MesaCodigo || !Array.isArray(Detalles) || Detalles.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Datos inválidos: se requiere MesaCodigo y lista de Detalles.'
        });
    }

    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);
    try {
        await tx.begin();

        // 1) Armar TVP para Detalles
        const tvp = new sql.Table('Pedidos.TipoDetallePedido'); // debe coincidir con el tipo definido en SQL Server
        tvp.columns.add('detallePedidoCodigo', sql.NChar(10));
        tvp.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        tvp.columns.add('detallePedidoCantidad', sql.Int);
        tvp.columns.add('detallePedidoEstado', sql.NVarChar(20));
        tvp.columns.add('detallePedidoNotas', sql.NVarChar(200));
        tvp.columns.add('detallePedidoMenuCodigo', sql.NChar(10));
        Detalles.forEach(d => {
            tvp.rows.add(
                '',
                d.detallePedidoSubtotal,
                d.detallePedidoCantidad,
                d.detallePedidoEstado,
                d.detallePedidoNotas,
                d.detallePedidoMenuCodigo
            );
        });

        // 2) Crear Pedido (header + detalles)
        await tx.request()
            .input('MesaCodigo', sql.NChar(10), MesaCodigo)
            .input('Detalles', tvp)
            .execute(SP_CREAR_PEDIDO);

        // 3) Por cada ítem, descontar stock con SP_ProcesarMenu
        for (const d of Detalles) {
            await tx.request()
                .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                .execute(SP_PROCESAR_MENU);
        }

        // 4) Commit si todo OK
        await tx.commit();
        emitirActualizacionPedidos();
        res.status(201).json({
            success: true,
            message: 'Pedido creado y stock actualizado correctamente'
        });

    } catch (err) {
        // Rollback si algo falla (stock insuficiente, SP error, etc.)
        if (tx._aborted === false) await tx.rollback();
        console.error('Error al crear pedido:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Error interno al crear pedido'
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

        // 1) Leer todos los detalles para devolver stock
        const detallesRes = await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .query(`
        SELECT detallePedidoMenuCodigo, detallePedidoCantidad
        FROM Pedidos.DetallePedido
        WHERE detallePedidoPedidoCodigo = @PedidoCodigo
      `);
        const detalles = detallesRes.recordset;

        // 2) Para cada detalle, ejecutar Proc_DevolverStockMenu
        for (const d of detalles) {
            await pool.request()
                .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                .execute(SP_DEVOLVER_STOCK_MENU);
        }

        // 3) Finalmente eliminar el pedido y sus detalles
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .execute(SP_ELIMINAR_PEDIDO);

        res.status(200).json({
            success: true,
            message: 'Pedido y stock restaurado correctamente.'
        });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar pedido'
        });
    }ß
});

//mostrar pedido
router.get('/activos', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .execute(SP_OBTENER_PEDIDOS_ACTIVOS);

        // Agrupar detalles por pedido
        const pedidosMap = new Map();
        result.recordset.forEach(row => {
            const key = row.PedidoCodigo;
            if (!pedidosMap.has(key)) {
                pedidosMap.set(key, {
                    PedidoCodigo: row.PedidoCodigo,
                    PedidoFechaHora: row.PedidoFechaHora,
                    PedidoTotal: row.PedidoTotal,
                    PedidoEstado: row.PedidoEstado,
                    MesaNumero: row.MesaNumero,
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
                    MenuImageUrl: row.MenuImageUrl
                }
            });
        });

        const pedidos = Array.from(pedidosMap.values());

        res.status(200).json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        console.error('Error al obtener pedidos activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener pedidos activos'
        });
    }
});

// Nuevo endpoint para cambiar el estado del pedido
router.put('/actualizarEstadoPedido/:PedidoCodigo', async (req, res) => {
    const { PedidoCodigo } = req.params;
    const { nuevoEstado } = req.body;

    if (!PedidoCodigo || !nuevoEstado) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere PedidoCodigo y nuevoEstado.'
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .input('nuevoEstado', sql.NVarChar(20), nuevoEstado)
            .execute(SP_ACTUALIZAR_ESTADO_PEDIDO);

        emitirActualizacionPedidos(PedidoCodigo);
        res.json({ success: true, message: 'Estado del pedido actualizado.' });
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar estado del pedido'
        });
    }
});

// Nuevo endpoint para obtener todos los pedidos con paginación
router.get('/todos', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const pool = await poolPromise;
    const result = await pool.request().execute(SP_OBTENER_TODOS_LOS_PEDIDOS);

    const pedidosMap = new Map();
    result.recordset.forEach(row => {
      const key = row.PedidoCodigo;
      if (!pedidosMap.has(key)) {
        pedidosMap.set(key, {
          PedidoCodigo: row.PedidoCodigo,
          PedidoFechaHora: row.PedidoFechaHora,
          PedidoTotal: row.PedidoTotal,
          PedidoEstado: row.PedidoEstado,
          MesaNumero: row.MesaNumero,
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
          MenuEsPreparado: row.MenuEsPreparado,
          MenuCategoria: row.MenuCategoria
        }
      });
    });

    const pedidos = Array.from(pedidosMap.values());
    const paginatedPedidos = pedidos.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedPedidos
    });
  } catch (error) {
    console.error('Error al obtener todos los pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener todos los pedidos'
    });
  }
});
module.exports = router;
