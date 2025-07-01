const { 
    insertarMenuConReceta, 
    insertarMenuConInsumo, 
    obtenerMenus, 
    eliminarMenu , 
    procesarMenu,
    obtenerMenuPorCodigo, 
    actualizarMenuCompleto
 } = require('../services/menuService');

const agregarMenu = async (req, res) => {
    try {
        const { MenuPlatos, MenuDescripcion, MenuPrecio, MenuEsPreparado, MenuCategoriaCodigo, DetallesReceta, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad } = req.body;
        const imageFile = req.file;

        let imageUrl = null;
        if (imageFile) {
            const { uploadImageToCloudinary } = require('../utils/cloudinaryHelper');
            imageUrl = await uploadImageToCloudinary(imageFile);
        }

        let result;
        if (MenuEsPreparado === 'A') {
            let detallesParsed = DetallesReceta;
            if (typeof DetallesReceta === 'string') {
                try {
                    detallesParsed = JSON.parse(DetallesReceta);
                } catch (error) {
                    return res.status(400).json({ success: false, message: 'DetallesReceta no es un JSON válido' });
                }
            }
            result = await insertarMenuConReceta({ MenuPlatos, MenuDescripcion, MenuPrecio, imageUrl, MenuCategoriaCodigo, DetallesReceta : detallesParsed});
        } else if (MenuEsPreparado === 'I') {
            result = await insertarMenuConInsumo({ MenuPlatos, MenuDescripcion, MenuPrecio, imageUrl, MenuCategoriaCodigo, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad });
        } else {
            return res.status(400).json({ success: false, message: 'Valor de MenuEsPreparado inválido' });
        }

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error al agregar menú:', error);
        res.status(500).json({ success: false, message: 'Error interno al agregar menú' });
    }
};

const mostrarMenus = async (req, res) => {
    try {
        const menus = await obtenerMenus();
        res.status(200).json({ success: true, data: menus });
    } catch (error) {
        console.error('Error al obtener menús:', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener menús' });
    }
};

const eliminarMenuController = async (req, res) => {
    try {
        const { codigo } = req.params;

        if (!codigo) {
            return res.status(400).json({ success: false, message: 'Código de menú requerido' });
        }

        const result = await eliminarMenu(codigo);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        console.error('Error al eliminar menú:', error);
        res.status(500).json({ success: false, message: 'Error interno al eliminar menú' });
    }
};

async function procesarMenuController(req, res) {
  const { MenuCodigo, Cantidad } = req.body;
  if (!MenuCodigo || !Cantidad) {
    return res.status(400).json({ success:false, message:'Faltan datos' });
  }
  try {
    await procesarMenu(MenuCodigo, Cantidad);
    res.json({ success:true, message:'Pedido procesado' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
}

const obtenerMenuController = async (req, res) => {
    try {
        const { codigo } = req.params;
        const menu = await obtenerMenuPorCodigo(codigo);
        res.status(200).json({ success: true, data: menu });
    } catch (error) {
        console.error('Error al obtener menú por código:', error);
        res.status(500).json({ success: false, message: 'Error interno al obtener menú' });
    }
};

const actualizarMenuController = async (req, res) => {
    try {
        const menu = req.body;

        if (!menu.MenuCodigo) {
            return res.status(400).json({ success: false, message: 'Falta el código de menú' });
        }

        await actualizarMenuCompleto(menu);

        res.status(200).json({ success: true, message: 'Menú actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar menú:', error);
        res.status(500).json({ success: false, message: 'Error interno al actualizar menú' });
    }
};


module.exports = { 
    agregarMenu, 
    mostrarMenus , 
    eliminarMenuController, 
    procesarMenuController,
    obtenerMenuController, 
    actualizarMenuController
};
