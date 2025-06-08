// insumo.js
const express = require('express');
const sql = require('mssql');
const { poolPromise } = require('../config/connection');

const SP_INSERTAR_INSUMO = 'Proc_InsertarInsumo';
const SP_LISTA_INSUMOS = 'Proc_ListarInsumos';

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


module.exports = router;
