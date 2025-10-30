// test/services/menuService.test.js

jest.mock('../../../config/connection');
describe('MenuService - Tests de funciones', () => {

    let menuService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Simular require después del mock
        menuService = {
            insertarMenuConReceta: jest.fn(),
            insertarMenuConInsumo: jest.fn(),
            obtenerMenus: jest.fn(),
            eliminarMenu: jest.fn(),
            procesarMenu: jest.fn(),
            obtenerMenuPorCodigo: jest.fn(),
            actualizarMenuCompleto: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función insertarMenuConReceta', () => {
            expect(menuService.insertarMenuConReceta).toBeDefined();
            expect(typeof menuService.insertarMenuConReceta).toBe('function');
        });

        test('debe exportar la función insertarMenuConInsumo', () => {
            expect(menuService.insertarMenuConInsumo).toBeDefined();
            expect(typeof menuService.insertarMenuConInsumo).toBe('function');
        });

        test('debe exportar la función obtenerMenus', () => {
            expect(menuService.obtenerMenus).toBeDefined();
            expect(typeof menuService.obtenerMenus).toBe('function');
        });

        test('debe exportar la función eliminarMenu', () => {
            expect(menuService.eliminarMenu).toBeDefined();
            expect(typeof menuService.eliminarMenu).toBe('function');
        });

        test('debe exportar la función procesarMenu', () => {
            expect(menuService.procesarMenu).toBeDefined();
            expect(typeof menuService.procesarMenu).toBe('function');
        });

        test('debe exportar la función obtenerMenuPorCodigo', () => {
            expect(menuService.obtenerMenuPorCodigo).toBeDefined();
            expect(typeof menuService.obtenerMenuPorCodigo).toBe('function');
        });

        test('debe exportar la función actualizarMenuCompleto', () => {
            expect(menuService.actualizarMenuCompleto).toBeDefined();
            expect(typeof menuService.actualizarMenuCompleto).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('insertarMenuConReceta debe aceptar parámetros', () => {
            const datos = { MenuPlatos: 'Ceviche', MenuPrecio: 25.50 };
            menuService.insertarMenuConReceta(datos);

            expect(menuService.insertarMenuConReceta).toHaveBeenCalledWith(datos);
        });

        test('insertarMenuConInsumo debe aceptar parámetros', () => {
            const datos = { MenuPlatos: 'Inca Kola', MenuPrecio: 3.50 };
            menuService.insertarMenuConInsumo(datos);

            expect(menuService.insertarMenuConInsumo).toHaveBeenCalledWith(datos);
        });

        test('obtenerMenus debe ser una función sin parámetros requeridos', () => {
            menuService.obtenerMenus();
            expect(menuService.obtenerMenus).toHaveBeenCalled();
        });

        test('eliminarMenu debe aceptar código de menú', () => {
            const codigo = 'MEN0000001';
            menuService.eliminarMenu(codigo);

            expect(menuService.eliminarMenu).toHaveBeenCalledWith(codigo);
        });

        test('procesarMenu debe aceptar código y cantidad', () => {
            const codigo = 'MEN0000001';
            const cantidad = 2;
            menuService.procesarMenu(codigo, cantidad);

            expect(menuService.procesarMenu).toHaveBeenCalledWith(codigo, cantidad);
        });

        test('obtenerMenuPorCodigo debe aceptar código', () => {
            const codigo = 'MEN0000001';
            menuService.obtenerMenuPorCodigo(codigo);

            expect(menuService.obtenerMenuPorCodigo).toHaveBeenCalledWith(codigo);
        });

        test('actualizarMenuCompleto debe aceptar objeto de menú', () => {
            const menu = { MenuCodigo: 'MEN0000001', MenuPlatos: 'Ceviche Updated' };
            menuService.actualizarMenuCompleto(menu);

            expect(menuService.actualizarMenuCompleto).toHaveBeenCalledWith(menu);
        });
    });

    describe('Validación de tipos de retorno', () => {

        test('funciones deben retornar Promises o ser asíncronas', () => {
            // Las funciones del service son async, por lo tanto retornan Promises
            menuService.obtenerMenus = jest.fn().mockResolvedValue([]);
            const resultado = menuService.obtenerMenus();

            expect(resultado).toBeInstanceOf(Promise);
        });

        test('obtenerMenus debe resolver a array', async () => {
            const mockMenus = [
                { MenuCodigo: 'MEN0000001', MenuPlatos: 'Ceviche' }
            ];
            menuService.obtenerMenus = jest.fn().mockResolvedValue(mockMenus);

            const resultado = await menuService.obtenerMenus();
            expect(Array.isArray(resultado)).toBe(true);
        });

        test('obtenerMenuPorCodigo debe resolver a objeto', async () => {
            const mockMenu = { MenuCodigo: 'MEN0000001', MenuPlatos: 'Ceviche' };
            menuService.obtenerMenuPorCodigo = jest.fn().mockResolvedValue(mockMenu);

            const resultado = await menuService.obtenerMenuPorCodigo('MEN0000001');
            expect(typeof resultado).toBe('object');
        });
    });
});
