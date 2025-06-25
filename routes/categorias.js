// mesas.js
const express = require('express');
const { poolPromise } = require('../config/connection');
const sql = require('mssql');


const SP_MOSTRAR_CATEGORIA = 'Proc_MostrarCategorias';
const SP_INSERTAR_CATEGORIA = 'Proc_AgregarCategoria';
const SP_ACTUALIZAR_CATEGORIA = 'Proc_ActualizarCategorias';
const SP_ELIMINAR_CATEGORIA = 'Proc_EliminarCategoria';

const router = express.Router();


router.get('/mostrarCategorias', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().execute(SP_MOSTRAR_CATEGORIA);

    res.status(200).json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener las categorias 🏸:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al obtener las mesas'
    });
  }
});

router.post('/agregarCategoria', async (req, res) => {
  try {
    const { CategoriaNombre, CategoriaDescripcion, CategoriaEstado } = req.body;

    if (!CategoriaNombre || !CategoriaDescripcion) {
      return res.status(400).json({
        success: false,
        message: 'Los campos CategoriaNombre y CategoriaDescripcion son obligatorios.'
      });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('CategoriaNombre', sql.NVarChar(100), CategoriaNombre)
      .input('CategoriaDescripcion', sql.NVarChar(200), CategoriaDescripcion)
      .input('CategoriaEstado', sql.NChar(1), CategoriaEstado || 'A') // Estado por defecto: Activo
      .execute(SP_INSERTAR_CATEGORIA);

    res.status(201).json({
      success: true,
      message: 'Categoría agregada correctamente.',
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al agregar la categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al agregar la categoría.'
    });
  }
});

router.put('/actualizarCategoria', async (req, res) => {
  try {
    const { CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado } = req.body;

    if (!CategoriaCodigo || !CategoriaNombre || !CategoriaDescripcion || !CategoriaEstado) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios: CategoriaCodigo, CategoriaNombre, CategoriaDescripcion, CategoriaEstado.'
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('CategoriaCodigo', CategoriaCodigo)
      .input('CategoriaNombre', CategoriaNombre)
      .input('CategoriaDescripcion', CategoriaDescripcion)
      .input('CategoriaEstado', CategoriaEstado)
      .execute(SP_ACTUALIZAR_CATEGORIA);

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar la categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la categoría.'
    });
  }
});

router.delete('/eliminarCategoria/:CategoriaCodigo', async (req, res) => {
  try {
    const { CategoriaCodigo } = req.params;

    if (!CategoriaCodigo) {
      return res.status(400).json({
        success: false,
        message: 'El código de la categoría es obligatorio.'
      });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('CategoriaCodigo', sql.NChar(10), CategoriaCodigo)
      .execute(SP_ELIMINAR_CATEGORIA);

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada correctamente.'
    });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno al eliminar la categoría.'
    });
  }
});

module.exports = router;