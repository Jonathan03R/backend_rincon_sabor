const { insertarMenuConReceta, insertarMenuConInsumo, obtenerMenus  } = require('../services/menuService');

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


module.exports = { agregarMenu, mostrarMenus  };
