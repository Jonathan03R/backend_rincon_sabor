// insumo.js
const express = require('express');
const sql = require('mssql');
const { poolPromise } = require('../config/connection');

const SP_INSERTAR_INSUMO = 'Proc_InsertarInsumo';
const SP_LISTA_INSUMOS = 'Proc_ListarInsumos';
const SP_ACTUALIZAR_INSUMO = 'Proc_ActualizarInsumo';

const router = express.Router();

// Agregar insumo
router.post('/agregarInsumo', async (req, res) => {
    const {
        InsumoNombre,
        InsumoUnidadMedida,
        InsumoStockActual,
        InsumoCompraUnidad,
    } = req.body;

    if (!InsumoNombre || !InsumoUnidadMedida || InsumoStockActual == null || InsumoCompraUnidad == null) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input('InsumoNombre', sql.NVarChar(200), InsumoNombre);
        request.input('InsumoUnidadMedida', sql.NVarChar(50), InsumoUnidadMedida);
        request.input('InsumoStockActual', sql.Decimal(10, 2), InsumoStockActual);
        request.input('InsumoCompraUnidad', sql.Decimal(10, 2), InsumoCompraUnidad);

        await request.execute(SP_INSERTAR_INSUMO);

        res.status(201).json({
            success: true,
            message: 'Insumo agregado correctamente.'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

router.get('/ListaInsumos', async (req, res) => {
    try {
        const pool = await poolPromise;
    
        const result = await pool.request().execute(SP_LISTA_INSUMOS);
    
        res.status(200).json({
        success: true,
        data: result.recordset
        });
    } catch (error) {
        console.error('Error al obtener la lista de insumos:', error);
        res.status(500).json({
        success: false,
        message: 'Error interno al obtener la lista de insumos'
        });
    }
});


router.put('/actualizarInsumo', async (req, res) => {
    const {
        InsumoCodigo,
        InsumoNombre,
        InsumoUnidadMedida,
        InsumoStockActual,
        InsumoCompraUnidad,
    } = req.body;

    if (
        !InsumoCodigo ||
        !InsumoNombre ||
        !InsumoUnidadMedida ||
        InsumoStockActual == null ||
        InsumoCompraUnidad == null
    ) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        request.input('Codigo', sql.NChar(10), InsumoCodigo);
        request.input('Nombre', sql.NVarChar(200), InsumoNombre);
        request.input('UnidadMedida', sql.NVarChar(50), InsumoUnidadMedida);
        request.input('StockActual', sql.Decimal(10, 2), InsumoStockActual);
        request.input('CompraUnidad', sql.Decimal(10, 2), InsumoCompraUnidad);

        await request.execute(SP_ACTUALIZAR_INSUMO);

        res.status(200).json({
            success: true,
            message: 'Insumo actualizado correctamente.'
        });
    } catch (error) {
        console.error('Error al actualizar insumo:', error);
        res.status(500).json({ success: false, message: 'Error interno.' });
    }
});

module.exports = router;
