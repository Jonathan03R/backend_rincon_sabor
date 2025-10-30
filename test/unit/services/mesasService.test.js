// test/services/mesasService.test.js

jest.mock('../../../config/connection');

describe('MesasService - Tests de funciones', () => {

    let mesasService;

    beforeEach(() => {
        jest.clearAllMocks();
        mesasService = {
            crearMesa: jest.fn(),
            obtenerMesas: jest.fn(),
            obtenerMesaPorCodigo: jest.fn(),
            actualizarEstadoMesa: jest.fn(),
            asignarMesa: jest.fn(),
            liberarMesa: jest.fn(),
            obtenerMesasDisponibles: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función crearMesa', () => {
            expect(mesasService.crearMesa).toBeDefined();
            expect(typeof mesasService.crearMesa).toBe('function');
        });

        test('debe exportar la función obtenerMesas', () => {
            expect(mesasService.obtenerMesas).toBeDefined();
            expect(typeof mesasService.obtenerMesas).toBe('function');
        });

        test('debe exportar la función obtenerMesaPorCodigo', () => {
            expect(mesasService.obtenerMesaPorCodigo).toBeDefined();
            expect(typeof mesasService.obtenerMesaPorCodigo).toBe('function');
        });

        test('debe exportar la función actualizarEstadoMesa', () => {
            expect(mesasService.actualizarEstadoMesa).toBeDefined();
            expect(typeof mesasService.actualizarEstadoMesa).toBe('function');
        });

        test('debe exportar la función asignarMesa', () => {
            expect(mesasService.asignarMesa).toBeDefined();
            expect(typeof mesasService.asignarMesa).toBe('function');
        });

        test('debe exportar la función liberarMesa', () => {
            expect(mesasService.liberarMesa).toBeDefined();
            expect(typeof mesasService.liberarMesa).toBe('function');
        });

        test('debe exportar la función obtenerMesasDisponibles', () => {
            expect(mesasService.obtenerMesasDisponibles).toBeDefined();
            expect(typeof mesasService.obtenerMesasDisponibles).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('crearMesa debe aceptar objeto de mesa', () => {
            const mesa = {
                MesaNumero: 5,
                MesaCapacidad: 4,
                MesaEstado: 'D'
            };
            mesasService.crearMesa(mesa);

            expect(mesasService.crearMesa).toHaveBeenCalledWith(mesa);
        });

        test('obtenerMesas debe ser una función sin parámetros', () => {
            mesasService.obtenerMesas();
            expect(mesasService.obtenerMesas).toHaveBeenCalled();
        });

        test('obtenerMesaPorCodigo debe aceptar código', () => {
            const codigo = 'MES0000001';
            mesasService.obtenerMesaPorCodigo(codigo);

            expect(mesasService.obtenerMesaPorCodigo).toHaveBeenCalledWith(codigo);
        });

        test('actualizarEstadoMesa debe aceptar código y estado', () => {
            const codigo = 'MES0000001';
            const estado = 'O';
            mesasService.actualizarEstadoMesa(codigo, estado);

            expect(mesasService.actualizarEstadoMesa).toHaveBeenCalledWith(codigo, estado);
        });

        test('asignarMesa debe aceptar código y datos de asignación', () => {
            const codigo = 'MES0000001';
            const datos = { pedidoCodigo: 'PED0000001' };
            mesasService.asignarMesa(codigo, datos);

            expect(mesasService.asignarMesa).toHaveBeenCalledWith(codigo, datos);
        });

        test('liberarMesa debe aceptar código', () => {
            const codigo = 'MES0000001';
            mesasService.liberarMesa(codigo);

            expect(mesasService.liberarMesa).toHaveBeenCalledWith(codigo);
        });

        test('obtenerMesasDisponibles debe aceptar capacidad mínima', () => {
            const capacidadMinima = 2;
            mesasService.obtenerMesasDisponibles(capacidadMinima);

            expect(mesasService.obtenerMesasDisponibles).toHaveBeenCalledWith(capacidadMinima);
        });
    });
});
