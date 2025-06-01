// usuarios.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { poolPromise } = require('../config/connection'); // Asegúrate de tener la conexión correctamente configurada

const SP_OBTENER_USUARIO_POR_CORREO = 'Proc_ObtenerUsuarioPorCorreo';

// Ruta protegida que requiere autenticación para obtener los datos del usuario
router.get('/infoUser', verifyToken, async (req, res) => {
    const correo = req.user.email; // Extraemos el correo del usuario desde el token

    if (!correo) {
        return res.status(400).json({
            success: false,
            message: 'Correo es requerido'
        });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('correo', correo)  // Se pasa el correo desde el token
            .execute(SP_OBTENER_USUARIO_POR_CORREO); // Ejecuta el procedimiento almacenado

        if (result.recordset.length > 0) {
            // Si encontramos al usuario en la base de datos
            const usuario = result.recordset[0];
            return res.json({
                success: true,
                data: usuario // Devuelves toda la información del usuario, incluyendo el rol
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los datos del usuario'
        });
    }
});

module.exports = router;
