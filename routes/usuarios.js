// usuarios.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { poolPromise } = require('../config/connection'); // Asegúrate de tener la conexión correctamente configurada

const SP_OBTENER_USUARIO_POR_CORREO = 'Proc_ObtenerUsuarioPorCorreo';
const SP_LISTAR_USUARIOS = 'Proc_ListarUsuarios';
const SP_ACTUALIZAR_ESTADO_USUARIO = 'Proc_CambiarEstadoUsuario';
const SP_ELIMINAR_USUARIO = 'Proc_EliminarUsuario';
const SP_INSERTAR_USUARIO = 'Proc_CrearUsuario';

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

router.get('/listarUsuarios', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute(SP_LISTAR_USUARIOS); // Asegúrate de que este procedimiento exista

        if (result.recordset.length > 0) {
            return res.json({
                success: true,
                data: result.recordset // Devuelve la lista de usuarios
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron usuarios'
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al listar los usuarios'
        });
    }
});


router.put('/actualizarEstado', verifyToken, async (req, res) => {
    const { usuarioCodigo, nuevoEstado } = req.body;

    if (!usuarioCodigo || !nuevoEstado) {
        return res.status(400).json({
            success: false,
            message: 'usuarioCodigo y nuevoEstado son requeridos'
        });
    }

    // Validar nuevoEstado
    if (!['A', 'I'].includes(nuevoEstado)) {
        return res.status(400).json({
            success: false,
            message: "nuevoEstado debe ser 'A' (activo) o 'I' (inactivo)"
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request().input('UsuarioCodigo', usuarioCodigo).input('NuevoEstado', nuevoEstado).execute(SP_ACTUALIZAR_ESTADO_USUARIO);
        return res.json({
            success: true,
            message: `Estado actualizado a '${nuevoEstado === 'A' ? 'Activo' : 'Inactivo'}'`
        });
    } catch (error) {
        console.error(error);

        // Puedes diferenciar errores si quieres
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado del usuario',
            error: error.message
        });
    }
});

router.delete('/eliminar/:codigo', verifyToken , async (req, res) => {
    const { codigo } = req.params;

    if (!codigo) {
        return res.status(400).json({
            success: false,
            message: 'El código del usuario es requerido'
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request().input('Codigo', codigo).execute(SP_ELIMINAR_USUARIO);
        return res.json({
            success: true,
            message: `Usuario con código '${codigo}' eliminado correctamente`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el usuario',
            error: error.message
        });
    }
});


router.post('/crear', async (req, res) => {
    const { UsuarioNombre, UsuarioEmail, UsuarioDireccion, UsuarioTelefono, UsuarioRol } = req.body;

    if (!UsuarioNombre || !UsuarioEmail || !UsuarioDireccion || !UsuarioTelefono || !UsuarioRol) {
        return res.status(400).json({
            success: false,
            message: 'Todos los campos son requeridos'
        });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UsuarioNombre', UsuarioNombre)
            .input('UsuarioEmail', UsuarioEmail)
            .input('UsuarioDireccion', UsuarioDireccion)
            .input('UsuarioTelefono', UsuarioTelefono)
            .input('UsuarioRol', UsuarioRol)
            .execute(SP_INSERTAR_USUARIO);

        return res.json({
            success: true,
            message: 'Usuario creado correctamente'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: 'Error al crear el usuario',
            error: error.message
        });
    }
});


module.exports = router;
