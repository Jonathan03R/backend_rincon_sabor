// producto.js
const cloudinary = require('../config/cloudinary');
const express = require('express');
const sql = require('mssql');
const multer = require('multer');
const { poolPromise } = require('../config/connection');

const SP_INSERTAR_PRODUCTO = 'Proc_InsertarProducto';
const SP_ACTUALIZAR_IMAGEN_PRODUCTO = 'Pedidos.Proc_ActualizarImagenProducto';
const SP_MOSTRAR_PRODUCTOS = 'Proc_MostrarProductosConCategoria';

const router = express.Router();

// Config multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/agregar', upload.single('ProductoImage'), async (req, res) => {
    const {
        ProductoCodigo,
        ProductoPlatos,
        ProductoDescripcion,
        ProductoPrecio,
        ProductoCategoriaCodigo,
    } = req.body;

    if (!ProductoCodigo || !ProductoPlatos || ProductoPrecio == null || !ProductoCategoriaCodigo) {
        return res.status(400).json({ success: false, message: 'Faltan campos.' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Falta imagen.' });
    }

    try {
        // Subir imagen a Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            stream.end(req.file.buffer);
        });

        const pool = await poolPromise;
        const request = pool.request();

        request.input('ProductoCodigo', sql.NChar(10), ProductoCodigo);
        request.input('ProductoPlatos', sql.NVarChar(100), ProductoPlatos);
        request.input('ProductoDescripcion', sql.NVarChar(500), ProductoDescripcion);
        request.input('ProductoPrecio', sql.Decimal(10, 2), ProductoPrecio);

        // Guardar URL de imagen en la BD (campo tipo nvarchar)
        request.input('ProductoImageUrl', sql.NVarChar(500), uploadResult.secure_url);

        request.input('ProductoCategoriaCodigo', sql.NChar(10), ProductoCategoriaCodigo);

        await request.execute(SP_INSERTAR_PRODUCTO);

        return res.status(201).json({
            success: true,
            message: 'Producto agregado correctamente.',
            url: uploadResult.secure_url
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: 'Error interno.' });
    }
});


router.post('/agregarImagenProducto', upload.single('ProductoImage'), async (req, res) => {
    const { ProductoCodigo } = req.body;

    if (!ProductoCodigo || !req.file) {
        return res.status(400).json({ success: false, message: 'Falta ProductoCodigo o imagen.' });
    }

    try {
        // Subir imagen a Cloudinary
        const result = await cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary error:', error);
                    return res.status(500).json({ success: false, message: 'Error subiendo imagen.' });
                }

                try {
                    const pool = await poolPromise;
                    const request = pool.request();

                    request.input('ProductoCodigo', sql.NChar(10), ProductoCodigo);
                    request.input('ProductoImageUrl', sql.NVarChar(500), result.secure_url); // usar URL

                    await request.execute(SP_ACTUALIZAR_IMAGEN_PRODUCTO);

                    return res.status(200).json({
                        success: true,
                        message: 'Imagen actualizada correctamente.',
                        url: result.secure_url
                    });
                } catch (err) {
                    console.error('DB error:', err);
                    return res.status(500).json({ success: false, message: 'Error interno.' });
                }
            }
        );

        // Escribir el buffer al stream
        result.end(req.file.buffer);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno.',
        });
    }
});


router.get('/mostrarProductos', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute(SP_MOSTRAR_PRODUCTOS);

        // Envía tal cual lo que devuelve el procedimiento
        const productos = result.recordset.map(p => ({
            ProductoCodigo: p.ProductoCodigo,
            ProductoPlatos: p.ProductoPlatos,
            ProductoDescripcion: p.ProductoDescripcion,
            ProductoPrecio: p.ProductoPrecio,
            ProductoEstado: p.ProductoEstado,
            ProductoImageUrl: p.ProductoImageUrl,
            ProductoCategoria: {
                CategoriaCodigo: p.CategoriaCodigo,
                CategoriaNombre: p.CategoriaNombre,
                CategoriaDescripcion: p.CategoriaDescripcion,
                CategoriaEstado: p.CategoriaEstado
            }
        }));

        res.status(200).json({
            success: true,
            data: productos
        });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al obtener los productos',
        });
    }
});



module.exports = router;
