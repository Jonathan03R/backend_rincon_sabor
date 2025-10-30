// test/controllers/menuController.test.js

const {
    agregarMenu,
    mostrarMenus,
    eliminarMenuController,
    obtenerMenuController,
    actualizarMenuController,
    procesarMenuController
} = require('../../../controllers/menuController');

const menuService = require('../../../services/menuService');

jest.mock('../../../services/menuService');
jest.mock('../../../utils/cloudinaryHelper');
jest.mock('../../../config/connection');
jest.mock('../../../sockets/menuSocket', () => ({
    emitirActualizacionMenus: jest.fn()
}));

describe('MenuClass - Tests completos', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    // ========================================
    // TESTS PARA agregarMenu
    // ========================================
    describe('agregarMenu', () => {

        test('debe estar definida', () => {
            expect(agregarMenu).toBeDefined();
            expect(typeof agregarMenu).toBe('function');
        });

        test('debe agregar menú con receta (MenuEsPreparado = A)', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Ceviche',
                    MenuDescripcion: 'Delicioso ceviche',
                    MenuPrecio: 25.50,
                    MenuEsPreparado: 'A',
                    MenuCategoriaCodigo: 'CAT001',
                    DetallesReceta: JSON.stringify([
                        { insumoCodigo: 'INS001', cantidad: 0.5 }
                    ])
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.insertarMenuConReceta.mockResolvedValue({
                MenuCodigoCreado: 'MENU001',
                RecetaCodigoCreado: 'REC001'
            });

            await agregarMenu(req, res);

            expect(menuService.insertarMenuConReceta).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.any(Object)
            });
        });

        test('debe agregar menú con insumo directo (MenuEsPreparado = I)', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Inca Kola',
                    MenuDescripcion: 'Gaseosa',
                    MenuPrecio: 3.50,
                    MenuEsPreparado: 'I',
                    MenuCategoriaCodigo: 'CAT002',
                    InsumoUnidadMedida: 'Unidades',
                    InsumoStockActual: 50,
                    InsumoCompraUnidad: 2.00
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.insertarMenuConInsumo.mockResolvedValue({
                MenuCodigoCreado: 'MENU002'
            });

            await agregarMenu(req, res);

            expect(menuService.insertarMenuConInsumo).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('debe manejar error de JSON inválido en DetallesReceta', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Test',
                    MenuDescripcion: 'Test',
                    MenuPrecio: 10,
                    MenuEsPreparado: 'A',
                    MenuCategoriaCodigo: 'CAT001',
                    DetallesReceta: 'JSON inválido'
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await agregarMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'DetallesReceta no es un JSON válido'
            });
        });

        test('debe parsear DetallesReceta si viene como string válido', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Lomo Saltado',
                    MenuDescripcion: 'Lomo saltado',
                    MenuPrecio: 18,
                    MenuEsPreparado: 'A',
                    MenuCategoriaCodigo: 'CAT001',
                    DetallesReceta: '[{"insumoCodigo":"INS001","cantidad":0.3}]'
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.insertarMenuConReceta.mockResolvedValue({
                MenuCodigoCreado: 'MENU003'
            });

            await agregarMenu(req, res);

            expect(menuService.insertarMenuConReceta).toHaveBeenCalledWith({
                MenuPlatos: 'Lomo Saltado',
                MenuDescripcion: 'Lomo saltado',
                MenuPrecio: 18,
                imageUrl: null,
                MenuCategoriaCodigo: 'CAT001',
                DetallesReceta: [{ insumoCodigo: 'INS001', cantidad: 0.3 }]
            });
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('debe devolver error 400 si MenuEsPreparado es inválido', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Test',
                    MenuDescripcion: 'Test',
                    MenuPrecio: 10,
                    MenuEsPreparado: 'X',
                    MenuCategoriaCodigo: 'CAT001'
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await agregarMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Valor de MenuEsPreparado inválido'
            });
        });

        test('debe manejar errores del servicio', async () => {
            const req = {
                body: {
                    MenuPlatos: 'Test',
                    MenuDescripcion: 'Test',
                    MenuPrecio: 10,
                    MenuEsPreparado: 'A',
                    MenuCategoriaCodigo: 'CAT001',
                    DetallesReceta: '[]'
                },
                file: null
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.insertarMenuConReceta.mockRejectedValue(
                new Error('Error de base de datos')
            );

            await agregarMenu(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno al agregar menú'
            });
        });
    });

    // ========================================
    // TESTS PARA mostrarMenus
    // ========================================
    describe('mostrarMenus', () => {

        test('debe estar definida', () => {
            expect(mostrarMenus).toBeDefined();
        });

        test('debe obtener lista de menús', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockMenus = [
                { MenuCodigo: 'MENU001', MenuPlatos: 'Ceviche', MenuPrecio: 25 }
            ];

            menuService.obtenerMenus.mockResolvedValue(mockMenus);

            await mostrarMenus(req, res);

            expect(menuService.obtenerMenus).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMenus
            });
        });

        test('debe devolver array vacío si no hay menús', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.obtenerMenus.mockResolvedValue([]);

            await mostrarMenus(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: []
            });
        });

        test('debe manejar errores', async () => {
            const req = {};
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.obtenerMenus.mockRejectedValue(new Error('DB Error'));

            await mostrarMenus(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno al obtener menús'
            });
        });
    });

    // ========================================
    // TESTS PARA eliminarMenuController
    // ========================================
    describe('eliminarMenuController', () => {

        test('debe estar definida', () => {
            expect(eliminarMenuController).toBeDefined();
        });

        test('debe eliminar un menú por código', async () => {
            const req = { params: { codigo: 'MENU001' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.eliminarMenu.mockResolvedValue({
                message: 'Menú eliminado correctamente'
            });

            await eliminarMenuController(req, res);

            expect(menuService.eliminarMenu).toHaveBeenCalledWith('MENU001');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Menú eliminado correctamente'
            });
        });

        test('debe validar código requerido', async () => {
            const req = { params: {} };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await eliminarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Código de menú requerido'
            });
        });

        test('debe manejar errores del servicio', async () => {
            const req = { params: { codigo: 'MENU001' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.eliminarMenu.mockRejectedValue(
                new Error('Error de base de datos')
            );

            await eliminarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno al eliminar menú'
            });
        });
    });

    // ========================================
    // TESTS PARA obtenerMenuController
    // ========================================
    describe('obtenerMenuController', () => {

        test('debe estar definida', () => {
            expect(obtenerMenuController).toBeDefined();
        });

        test('debe obtener un menú por código', async () => {
            const req = { params: { codigo: 'MENU001' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            const mockMenu = {
                MenuCodigo: 'MENU001',
                MenuPlatos: 'Ceviche',
                MenuPrecio: 25
            };

            menuService.obtenerMenuPorCodigo.mockResolvedValue(mockMenu);

            await obtenerMenuController(req, res);

            expect(menuService.obtenerMenuPorCodigo).toHaveBeenCalledWith('MENU001');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockMenu
            });
        });

        test('debe manejar errores del servicio', async () => {
            const req = { params: { codigo: 'MENU001' } };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.obtenerMenuPorCodigo.mockRejectedValue(
                new Error('Error de base de datos')
            );

            await obtenerMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno al obtener menú'
            });
        });
    });

    // ========================================
    // TESTS PARA actualizarMenuController
    // ========================================
    describe('actualizarMenuController', () => {

        test('debe estar definida', () => {
            expect(actualizarMenuController).toBeDefined();
        });

        test('debe validar que se proporcione MenuCodigo', async () => {
            const req = {
                body: { MenuPlatos: 'Test' }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await actualizarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Falta el código de menú'
            });
        });

        test('debe actualizar un menú correctamente', async () => {
            const req = {
                body: {
                    MenuCodigo: 'MENU001',
                    MenuPlatos: 'Ceviche Actualizado',
                    MenuPrecio: 28
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.actualizarMenuCompleto.mockResolvedValue();

            await actualizarMenuController(req, res);

            expect(menuService.actualizarMenuCompleto).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Menú actualizado correctamente'
            });
        });

        test('debe manejar errores del servicio', async () => {
            const req = {
                body: {
                    MenuCodigo: 'MENU001',
                    MenuPlatos: 'Test'
                }
            };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            menuService.actualizarMenuCompleto.mockRejectedValue(
                new Error('Error de base de datos')
            );

            await actualizarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error interno al actualizar menú'
            });
        });
    });

    // ========================================
    // TESTS PARA procesarMenuController
    // ========================================
    describe('procesarMenuController', () => {

        test('debe estar definida', () => {
            expect(procesarMenuController).toBeDefined();
        });

        test('debe procesar un menú con datos válidos', async () => {
            const req = {
                body: {
                    MenuCodigo: 'MENU001',
                    Cantidad: 2
                }
            };
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            menuService.procesarMenu.mockResolvedValue();

            await procesarMenuController(req, res);

            expect(menuService.procesarMenu).toHaveBeenCalledWith('MENU001', 2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pedido procesado'
            });
        });

        test('debe validar datos requeridos', async () => {
            const req = { body: {} };
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            };

            await procesarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Faltan datos'
            });
        });

        test('debe manejar errores del servicio', async () => {
            const req = {
                body: {
                    MenuCodigo: 'MENU001',
                    Cantidad: 2
                }
            };
            const res = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis()
            };

            const errorMessage = 'Stock insuficiente';
            menuService.procesarMenu.mockRejectedValue(new Error(errorMessage));

            await procesarMenuController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: errorMessage
            });
        });
    });
});
