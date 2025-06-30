// pedido.js

const express = require('express');
const router = express.Router();
// import { utcToZonedTime, format } from 'date-fns-tz';
const { sql, poolPromise } = require('../config/connection');

const { emitirActualizacionMesas } = require('../sockets/mesasSocket');

const { emitirActualizacionPedidos } = require('../sockets/pedidosSocket');


const SP_ACTUALIZAR_DETALLES = 'Pedidos.Proc_ActualizarDetallesPedido';
const SP_OBTENER_PEDIDOS_POR_MESA = 'Proc_ObtenerPedidoPorMesa';
const SP_CREAR_PEDIDO = 'Pedidos.Proc_CrearPedido';
const SP_PROCESAR_MENU = 'Proc_ProcesarMenu';
const SP_ELIMINAR_PEDIDO = 'Proc_EliminarPedidoPorCodigo';
const SP_DEVOLVER_STOCK_MENU = 'Pedidos.Proc_DevolverStockMenu';

const SP_CAMBIAR_ESTADO_MESA = 'Pedidos.Proc_CambiarEstadoMesa';
const SP_FINALIZAR_PEDIDO = 'Pedidos.Proc_FinalizarPedido';
const SP_OBTENER_PEDIDOS_ACTIVOS = 'Pedidos.Proc_ObtenerTodosLosPedidos';
const SP_ACTUALIZAR_ESTADO_PEDIDO = 'Pedidos.Proc_ActualizarEstadoPedido';
const SP_ACTUALIZAR_ESTADO_DETALLE = 'Pedidos.Proc_ActualizarEstadoDetallePedido';



router.get('/obtenerPorMesas/:MesaCodigo', async (req, res) => {
    try {
        const { MesaCodigo } = req.params;
        const pool = await poolPromise;
        const result = await pool
            .request()
            .input('MesaCodigo', MesaCodigo)
            .execute(SP_OBTENER_PEDIDOS_POR_MESA);

        const pedidosRaw = result.recordset || [];;
        if (pedidosRaw.length === 0) {
            await pool.request()
                .input('MesaCodigo', sql.NChar(10), MesaCodigo)
                .input('nuevoEstado', sql.NVarChar(20), 'Disponible')
                .execute(SP_CAMBIAR_ESTADO_MESA);
            emitirActualizacionMesas();
        }

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

    console.log('Actualizar detalles pedido:', PedidoCodigo, Detalles);
    if (!PedidoCodigo || !Array.isArray(Detalles)) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere PedidoCodigo y Detalles válidos.'
        });
    }

    try {
        const pool = await poolPromise;

        // 1) Leer detalles originales
        const origRes = await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .query(`
        SELECT detallePedidoCodigo,
               detallePedidoMenuCodigo,
               detallePedidoCantidad
        FROM Pedidos.DetallePedido
        WHERE detallePedidoPedidoCodigo = @PedidoCodigo
      `);
        const originales = origRes.recordset;

        // 2) SP de CRUD de detalles con TVP
        const tvp = new sql.Table('Pedidos.TipoDetallePedido');
        tvp.columns.add('detallePedidoCodigo', sql.NChar(10));
        tvp.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        tvp.columns.add('detallePedidoCantidad', sql.Decimal(10, 2));
        tvp.columns.add('detallePedidoEstado', sql.NVarChar(20));
        tvp.columns.add('detallePedidoNotas', sql.NVarChar(200));
        tvp.columns.add('detallePedidoMenuCodigo', sql.NChar(10));
        Detalles.forEach(d => {
            tvp.rows.add(
                d.detallePedidoCodigo || '',
                d.detallePedidoSubtotal || 0,
                d.detallePedidoCantidad || 0,
                d.detallePedidoEstado || '',
                d.detallePedidoNotas || '',
                d.detallePedidoMenuCodigo || ''
            );
        });
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .input('Detalles', sql.TVP('Pedidos.TipoDetallePedido'), tvp)
            .execute(SP_ACTUALIZAR_DETALLES);

        // 3) a) Borrados → devolver stock
        const borrados = originales.filter(o =>
            !Detalles.find(d => d.detallePedidoCodigo === o.detallePedidoCodigo)
        );
        for (const b of borrados) {
            console.log('Devolviendo stock por eliminación:', b);
            // 1) Saber si tenía receta o no
            const menuInfo = await pool.request()
                .input('MenuCodigo', sql.NChar(10), b.detallePedidoMenuCodigo)
                .query(`
          SELECT MenuEsPreparado, MenuInsumoCodigo
          FROM Pedidos.Menu
          WHERE MenuCodigo = @MenuCodigo
        `);
            const { MenuEsPreparado, MenuInsumoCodigo } = menuInfo.recordset[0];
            if (MenuEsPreparado === 'A') {
                await pool.request()
                    .input('MenuCodigo', sql.NChar(10), b.detallePedidoMenuCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), b.detallePedidoCantidad)
                    .execute(SP_DEVOLVER_STOCK_MENU);
            } else {
                const upd = await pool.request()
                    .input('InsumoCodigo', sql.NChar(10), MenuInsumoCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), b.detallePedidoCantidad)
                    .query(`
            UPDATE Insumos
              SET InsumoStockActual = InsumoStockActual + @Cantidad
            WHERE InsumoCodigo = @InsumoCodigo
          `);
                console.log('Filas ajustadas insumo back:', upd.rowsAffected[0]);
            }
        }

        // 3) b) Nuevos → descontar stock
        const nuevos = Detalles.filter(d =>
            !originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo)
        );
        for (const n of nuevos) {
            console.log('Descontando stock por nuevo:', n);
            if (n.MenuEsPreparado === 'A') {
                await pool.request()
                    .input('MenuCodigo', sql.NChar(10), n.detallePedidoMenuCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), n.detallePedidoCantidad)
                    .execute(SP_PROCESAR_MENU);
            } else {
                // directo a insumo
                const menuInfo = await pool.request()
                    .input('MenuCodigo', sql.NChar(10), n.detallePedidoMenuCodigo)
                    .query(`SELECT MenuInsumoCodigo FROM Pedidos.Menu WHERE MenuCodigo = @MenuCodigo`);
                const insumo = menuInfo.recordset[0].MenuInsumoCodigo;
                const upd = await pool.request()
                    .input('InsumoCodigo', sql.NChar(10), insumo)
                    .input('Cantidad', sql.Decimal(10, 2), n.detallePedidoCantidad)
                    .query(`
            UPDATE Insumos
              SET InsumoStockActual = InsumoStockActual - @Cantidad
            WHERE InsumoCodigo = @InsumoCodigo
          `);
                console.log('Filas afectadas insumo new:', upd.rowsAffected[0]);
            }
        }

        // 3) c) Comunes → ajustar diferencia
        const comunes = Detalles.filter(d =>
            originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo)
        );
        for (const d of comunes) {
            const o = originales.find(o => o.detallePedidoCodigo === d.detallePedidoCodigo);
            const diff = parseFloat(d.detallePedidoCantidad) - parseFloat(o.detallePedidoCantidad);
            if (diff === 0) continue;
            console.log('Ajustando diff:', d, '→', diff);
            if (d.MenuEsPreparado === 'A') {
                await pool.request()
                    .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), Math.abs(diff))
                    .execute(diff > 0 ? SP_PROCESAR_MENU : SP_DEVOLVER_STOCK_MENU);
            } else {
                // directo insumo
                const menuInfo = await pool.request()
                    .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                    .query(`SELECT MenuInsumoCodigo FROM Pedidos.Menu WHERE MenuCodigo = @MenuCodigo`);
                const insumo = menuInfo.recordset[0].MenuInsumoCodigo;
                const upd = await pool.request()
                    .input('InsumoCodigo', sql.NChar(10), insumo)
                    .input('Cantidad', sql.Decimal(10, 2), Math.abs(diff))
                    .query(`
            UPDATE Insumos
              SET InsumoStockActual = InsumoStockActual ${diff > 0 ? '-' : '+'} @Cantidad
            WHERE InsumoCodigo = @InsumoCodigo
          `);
                console.log('Filas ajustadas insumo common:', upd.rowsAffected[0]);
            }
        }

        res.json({ success: true, message: 'Detalles y stock actualizados.' });
    } catch (error) {
        console.error('Error en actualizarDetallesPedido:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
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
        const tvp = new sql.Table('Pedidos.TipoDetallePedido');
        tvp.columns.add('detallePedidoCodigo', sql.NChar(10));
        tvp.columns.add('detallePedidoSubtotal', sql.Decimal(10, 2));
        tvp.columns.add('detallePedidoCantidad', sql.Int);
        tvp.columns.add('detallePedidoEstado', sql.NVarChar(20));
        tvp.columns.add('detallePedidoNotas', sql.NVarChar(200));
        tvp.columns.add('detallePedidoMenuCodigo', sql.NChar(10));
        Detalles.forEach(d => {
            tvp.rows.add(
                '',                          // generará código nuevo
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

        // 3) Descontar stock ítem a ítem
        for (const d of Detalles) {
            if (d.MenuEsPreparado === 'A') {
                // Menú con receta
                await tx.request()
                    .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                    .execute(SP_PROCESAR_MENU);
            } else {
                console.log('Descontando insumo directo para detalle:', d.detallePedidoMenuCodigo, '×', d.detallePedidoCantidad);

                // 1) Buscamos el insumo asociado al menú
                const menuRes = await tx.request()
                    .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                    .query(`
                    SELECT MenuInsumoCodigo 
                    FROM Pedidos.Menu 
                    WHERE MenuCodigo = @MenuCodigo
                `);
                const insumoCodigo = menuRes.recordset[0]?.MenuInsumoCodigo;
                if (!insumoCodigo) {
                    throw new Error(`No hay insumo asociado al menú ${d.detallePedidoMenuCodigo}`);
                }

                // 2) Descontamos stock
                const upd = await tx.request()
                    .input('InsumoCodigo', sql.NChar(10), insumoCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                    .query(`
                    UPDATE Insumos
                    SET InsumoStockActual = InsumoStockActual - @Cantidad
                    WHERE InsumoCodigo = @InsumoCodigo
                    AND InsumoStockActual >= @Cantidad;
                `);

                console.log(`Filas afectadas para ${insumoCodigo}:`, upd.rowsAffected[0]);
                if (upd.rowsAffected[0] === 0) {
                    throw new Error(`Stock insuficiente para insumo ${insumoCodigo}`);
                }
            }
        }
        // 4) Commit si todo OK
        await tx.commit();
        emitirActualizacionPedidos();
        res.status(201).json({
            success: true,
            message: 'Pedido creado y stock actualizado correctamente'
        });

    } catch (err) {
        if (!tx._aborted) await tx.rollback();
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

        // 1) Leer todos los detalles
        const detallesRes = await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .query(`
                SELECT detallePedidoMenuCodigo, detallePedidoCantidad
                FROM Pedidos.DetallePedido
                WHERE detallePedidoPedidoCodigo = @PedidoCodigo
            `);
        const detalles = detallesRes.recordset;

        // 2) Para cada detalle, devolver stock según tipo
        for (const d of detalles) {
            // 2.1) obtener si tiene receta o no
            const menuInfo = await pool.request()
                .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                .query(`
                   SELECT MenuEsPreparado, MenuInsumoCodigo
                   FROM Pedidos.Menu
                   WHERE MenuCodigo = @MenuCodigo
                `);
            const { MenuEsPreparado, MenuInsumoCodigo } = menuInfo.recordset[0];

            if (MenuEsPreparado === 'A') {
                // devuelve vía SP
                await pool.request()
                    .input('MenuCodigo', sql.NChar(10), d.detallePedidoMenuCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                    .execute(SP_DEVOLVER_STOCK_MENU);
            } else {
                // devuelve directo a Insumos
                const upd = await pool.request()
                    .input('InsumoCodigo', sql.NChar(10), MenuInsumoCodigo)
                    .input('Cantidad', sql.Decimal(10, 2), d.detallePedidoCantidad)
                    .query(`
                        UPDATE Insumos
                          SET InsumoStockActual = InsumoStockActual + @Cantidad
                        WHERE InsumoCodigo = @InsumoCodigo
                    `);
                console.log(
                    'Devolución insumo',
                    MenuInsumoCodigo,
                    'filas afectadas:', upd.rowsAffected[0]
                );
            }
        }

        // 3) Borrar pedido (cabecera + detalles)
        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .execute(SP_ELIMINAR_PEDIDO);

        res.status(200).json({
            success: true,
            message: 'Pedido eliminado y stock restaurado correctamente.'
        });
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar pedido'
        });
    } ß
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
                    MesaCodigo: row.PedidoMesaCodigo,
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

        // 2) Fecha “hoy” en Lima
        const { utcToZonedTime, format } = await import('date-fns-tz');
        const timeZone = 'America/Lima';
        const hoyIso = format(utcToZonedTime(new Date(), timeZone), 'yyyy-MM-dd', { timeZone });
        console.log('hoyIso (Peru):', hoyIso);

        // 3) Filtrar sólo pedidos de hoy y no servidos/cancelados
        const pedidos = Array.from(pedidosMap.values()).filter(p => {
            const pedidoPeru = utcToZonedTime(new Date(p.PedidoFechaHora), timeZone);
            const fechaIso   = format(pedidoPeru, 'yyyy-MM-dd', { timeZone });
            const estado     = p.PedidoEstado.toLowerCase();

            console.log(`Pedido ${p.PedidoCodigo}: fechaIso=${fechaIso}, estado=${estado}`);
            return fechaIso === hoyIso
                && !['servido','cancelado'].includes(estado);
        });

        console.log(`Pedidos filtrados: ${pedidos.length}`);
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


router.put('/actualizarEstadoDetalle/:detallePedidoCodigo', async (req, res) => {
    const { detallePedidoCodigo } = req.params;
    const { nuevoEstado } = req.body;

    if (!detallePedidoCodigo || !nuevoEstado) {
        return res.status(400).json({
            success: false,
            message: 'Se requiere detallePedidoCodigo y nuevoEstado.'
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('DetallePedidoCodigo', sql.NChar(10), detallePedidoCodigo)
            .input('NuevoEstado', sql.NVarChar(20), nuevoEstado)
            .execute(SP_ACTUALIZAR_ESTADO_DETALLE);

        emitirActualizacionPedidos(detallePedidoCodigo); // opcional, si quieres emitir
        res.json({ success: true, message: 'Estado del detalle actualizado.' });
    } catch (error) {
        console.error('Error al actualizar estado del detalle:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al actualizar estado del detalle'
        });
    }
});


router.post('/finalizar/:PedidoCodigo', async (req, res) => {
    try {
        const { PedidoCodigo } = req.params;
        if (!PedidoCodigo) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere PedidoCodigo para finalizar.'
            });
        }

        const pool = await poolPromise;
        // 1) Obtener el código de mesa asociado al pedido
        const pedidoRes = await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .query(`
        SELECT PedidoMesaCodigo
          FROM Pedidos.Pedido
         WHERE PedidoCodigo = @PedidoCodigo
      `);
        const mesaCodigo = pedidoRes.recordset[0]?.PedidoMesaCodigo;

        await pool.request()
            .input('PedidoCodigo', sql.NChar(10), PedidoCodigo)
            .execute(SP_FINALIZAR_PEDIDO);

        // opcional: si quieres liberar la mesa tras servido,
        // puedes descomentar esto:
        await pool.request()
            .input('MesaCodigo', sql.NChar(10), mesaCodigo)
            .input('nuevoEstado', sql.NVarChar(20), 'Disponible')
            .execute(SP_CAMBIAR_ESTADO_MESA);

        emitirActualizacionMesas();

        res.status(200).json({
            success: true,
            message: 'Pedido finalizado correctamente.'
        });
    } catch (error) {
        console.error('Error al finalizar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al finalizar pedido'
        });
    }
});


module.exports = router;
