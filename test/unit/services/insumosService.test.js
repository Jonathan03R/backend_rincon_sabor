// test/services/insumosService.test.js

jest.mock('../../../config/connection');

describe('InsumosService - Tests de funciones', () => {

    let insumosService;

    beforeEach(() => {
        jest.clearAllMocks();
        insumosService = {
            crearInsumo: jest.fn(),
            obtenerInsumos: jest.fn(),
            obtenerInsumoPorCodigo: jest.fn(),
            actualizarInsumo: jest.fn(),
            actualizarStock: jest.fn(),
            eliminarInsumo: jest.fn(),
            obtenerInsumosConBajoStock: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función crearInsumo', () => {
            expect(insumosService.crearInsumo).toBeDefined();
            expect(typeof insumosService.crearInsumo).toBe('function');
        });

        test('debe exportar la función obtenerInsumos', () => {
            expect(insumosService.obtenerInsumos).toBeDefined();
            expect(typeof insumosService.obtenerInsumos).toBe('function');
        });

        test('debe exportar la función obtenerInsumoPorCodigo', () => {
            expect(insumosService.obtenerInsumoPorCodigo).toBeDefined();
            expect(typeof insumosService.obtenerInsumoPorCodigo).toBe('function');
        });

        test('debe exportar la función actualizarInsumo', () => {
            expect(insumosService.actualizarInsumo).toBeDefined();
            expect(typeof insumosService.actualizarInsumo).toBe('function');
        });

        test('debe exportar la función actualizarStock', () => {
            expect(insumosService.actualizarStock).toBeDefined();
            expect(typeof insumosService.actualizarStock).toBe('function');
        });

        test('debe exportar la función eliminarInsumo', () => {
            expect(insumosService.eliminarInsumo).toBeDefined();
            expect(typeof insumosService.eliminarInsumo).toBe('function');
        });

        test('debe exportar la función obtenerInsumosConBajoStock', () => {
            expect(insumosService.obtenerInsumosConBajoStock).toBeDefined();
            expect(typeof insumosService.obtenerInsumosConBajoStock).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('crearInsumo debe aceptar objeto de insumo', () => {
            const insumo = {
                InsumoNombre: 'Harina de Trigo',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50
            };
            insumosService.crearInsumo(insumo);

            expect(insumosService.crearInsumo).toHaveBeenCalledWith(insumo);
        });

        test('obtenerInsumos debe ser una función sin parámetros', () => {
            insumosService.obtenerInsumos();
            expect(insumosService.obtenerInsumos).toHaveBeenCalled();
        });

        test('obtenerInsumoPorCodigo debe aceptar código', () => {
            const codigo = 'INS0000001';
            insumosService.obtenerInsumoPorCodigo(codigo);

            expect(insumosService.obtenerInsumoPorCodigo).toHaveBeenCalledWith(codigo);
        });

        test('actualizarInsumo debe aceptar objeto de insumo', () => {
            const insumo = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina Premium'
            };
            insumosService.actualizarInsumo(insumo);

            expect(insumosService.actualizarInsumo).toHaveBeenCalledWith(insumo);
        });

        test('actualizarStock debe aceptar código, cantidad y operación', () => {
            const codigo = 'INS0000001';
            const cantidad = 10;
            const operacion = 'restar';
            insumosService.actualizarStock(codigo, cantidad, operacion);

            expect(insumosService.actualizarStock).toHaveBeenCalledWith(codigo, cantidad, operacion);
        });

        test('eliminarInsumo debe aceptar código', () => {
            const codigo = 'INS0000001';
            insumosService.eliminarInsumo(codigo);

            expect(insumosService.eliminarInsumo).toHaveBeenCalledWith(codigo);
        });

        test('obtenerInsumosConBajoStock debe ser una función sin parámetros', () => {
            insumosService.obtenerInsumosConBajoStock();
            expect(insumosService.obtenerInsumosConBajoStock).toHaveBeenCalled();
        });
    });
});
