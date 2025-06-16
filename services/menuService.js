const { poolPromise } = require('../config/connection');

const SP_MOSTRAR_MENU_COMPLETO = 'Proc_MostrarMenuCompleto';
const SP_INSERTAR_MENU = 'Proc_InsertarMenu';
const SP_CREAR_RECETA = 'Proc_CrearReceta';
const SP_INSERTAR_INSUMO = 'Proc_InsertarInsumo';
const SP_ELIMINAR_MENU = 'Proc_EliminarMenu';
const SP_PROCESAR_MENU = 'Proc_ProcesarMenu';

const insertarMenuConInsumo = async ({ MenuPlatos, MenuDescripcion, MenuPrecio, imageUrl, MenuCategoriaCodigo, InsumoUnidadMedida, InsumoStockActual, InsumoCompraUnidad }) => {
    const pool = await poolPromise;

    // 1. Insertar Insumo
    const insumo = await pool.request()
        .input('InsumoNombre', MenuPlatos)
        .input('InsumoUnidadMedida', InsumoUnidadMedida)
        .input('InsumoStockActual', InsumoStockActual)
        .input('InsumoCompraUnidad', InsumoCompraUnidad)
        .execute(SP_INSERTAR_INSUMO);

    const insumoCodigo = insumo.recordset[0].InsumoCodigoCreado;

    // 2. Insertar Menu con ese insumo
    const menu = await pool.request()
        .input('MenuPlatos', MenuPlatos)
        .input('MenuDescripcion', MenuDescripcion)
        .input('MenuPrecio', MenuPrecio)
        .input('MenuImageUrl', imageUrl)
        .input('MenuEsPreparado', 'I')
        .input('MenuInsumoCodigo', insumoCodigo)
        .input('MenuCategoriaCodigo', MenuCategoriaCodigo)
        .execute(SP_INSERTAR_MENU);
    emitirActualizacionMenus();
    return { MenuCodigoCreado: menu.recordset[0].MenuCodigoCreado };
};

const insertarMenuConReceta = async ({ MenuPlatos, MenuDescripcion, MenuPrecio, imageUrl, MenuCategoriaCodigo, DetallesReceta }) => {
    const pool = await poolPromise;

    // 1. Insertar Menu (sin Insumo)
    const menu = await pool.request()
        .input('MenuPlatos', MenuPlatos)
        .input('MenuDescripcion', MenuDescripcion)
        .input('MenuPrecio', MenuPrecio)
        .input('MenuImageUrl', imageUrl)
        .input('MenuEsPreparado', 'A')
        .input('MenuInsumoCodigo', null)
        .input('MenuCategoriaCodigo', MenuCategoriaCodigo)
        .execute(SP_INSERTAR_MENU);

    const menuCodigo = menu.recordset[0].MenuCodigoCreado;

    // 2. Insertar Receta
    const receta = await pool.request()
        .input('RecetaMenuCodigo', menuCodigo)
        .execute(SP_CREAR_RECETA);

    const recetaCodigo = receta.recordset[0].RecetaCodigoCreado;

    // 3. Insertar Detalles de Receta
    for (const detalle of DetallesReceta) {
        console.log('Insertando detalle:', detalle);
        await pool.request()
            .input('RecetaDetalleReceta', recetaCodigo)
            .input('RecetaDetalleInsumo', detalle.insumoCodigo)
            .input('RecetaCantidadPorPlato', detalle.cantidad)
            .execute('Proc_CrearDetalleReceta');
        console.log('Detalle de receta insertado:', detalle);
    }

    emitirActualizacionMenus();
    return { MenuCodigoCreado: menuCodigo, RecetaCodigoCreado: recetaCodigo };
};

const obtenerMenus = async () => {
    const pool = await poolPromise;

    const result = await pool.request()
        .execute(SP_MOSTRAR_MENU_COMPLETO);

    const menus = result.recordset.map(row => {
        return {
            MenuCodigo: row.MenuCodigo,
            MenuPlatos: row.MenuPlatos,
            MenuDescripcion: row.MenuDescripcion,
            MenuPrecio: row.MenuPrecio,
            MenuEstado: row.MenuEstado,
            MenuImageUrl: row.MenuImageUrl,
            MenuEsPreparado: row.MenuEsPreparado,
            MenuDisponible: row.MenuDisponible === 1,
            InsumosFaltantes: row.InsumosFaltantes,
            Categoria: {
                CategoriaCodigo: row.CategoriaCodigo,
                CategoriaNombre: row.CategoriaNombre,
                CategoriaDescripcion: row.CategoriaDescripcion,
                CategoriaEstado: row.CategoriaEstado
            },
            Insumo: row.MenuEsPreparado === 'I' ? {
                InsumoCodigo: row.InsumoCodigo,
                InsumoNombre: row.InsumoNombre,
                InsumoUnidadMedida: row.InsumoUnidadMedida,
                InsumoStockActual: row.InsumoStockActual,
                InsumoCompraUnidad: row.InsumoCompraUnidad,
                InsumoEstado: row.InsumoEstado
            } : null
        };
    });

    return menus;
};

const eliminarMenu = async (MenuCodigo) => {
    const pool = await poolPromise;

    await pool.request()
        .input('MenuCodigo', MenuCodigo)
        .execute(SP_ELIMINAR_MENU);
    emitirActualizacionMenus();
    return { message: `Menú ${MenuCodigo} eliminado correctamente` };
};

async function procesarMenu(menuCodigo, cantidad) {
    const pool = await poolPromise;
    const tx = new sql.Transaction(pool);
    try {
        await tx.begin();
        const req = new sql.Request(tx);
        req.input('MenuCodigo', sql.NChar(10), menuCodigo);
        req.input('Cantidad', sql.Decimal(10, 2), cantidad);
        await req.execute(SP_PROCESAR_MENU);
        await tx.commit();
    } catch (err) {
        await tx.rollback();
        throw err;
    }
}

module.exports = { insertarMenuConReceta, insertarMenuConInsumo, obtenerMenus, eliminarMenu, eliminarMenu, procesarMenu };
