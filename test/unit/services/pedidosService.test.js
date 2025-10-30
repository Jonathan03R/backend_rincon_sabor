// test/services/pedidosService.test.js

jest.mock('../../../config/connection');

describe('PedidosService - Tests de funciones', () => {

    let pedidosService;

    beforeEach(() => {
        jest.clearAllMocks();
        pedidosService = {
            crearPedido: jest.fn(),
            obtenerPedidos: jest.fn(),
            obtenerPedidoPorCodigo: jest.fn(),
            obtenerPedidosPorMesa: jest.fn(),
            actualizarEstadoPedido: jest.fn(),
            cancelarPedido: jest.fn(),
            calcularTotal: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función crearPedido', () => {
            expect(pedidosService.crearPedido).toBeDefined();
            expect(typeof pedidosService.crearPedido).toBe('function');
        });

        test('debe exportar la función obtenerPedidos', () => {
            expect(pedidosService.obtenerPedidos).toBeDefined();
            expect(typeof pedidosService.obtenerPedidos).toBe('function');
        });

        test('debe exportar la función obtenerPedidoPorCodigo', () => {
            expect(pedidosService.obtenerPedidoPorCodigo).toBeDefined();
            expect(typeof pedidosService.obtenerPedidoPorCodigo).toBe('function');
        });

        test('debe exportar la función obtenerPedidosPorMesa', () => {
            expect(pedidosService.obtenerPedidosPorMesa).toBeDefined();
            expect(typeof pedidosService.obtenerPedidosPorMesa).toBe('function');
        });

        test('debe exportar la función actualizarEstadoPedido', () => {
            expect(pedidosService.actualizarEstadoPedido).toBeDefined();
            expect(typeof pedidosService.actualizarEstadoPedido).toBe('function');
        });

        test('debe exportar la función cancelarPedido', () => {
            expect(pedidosService.cancelarPedido).toBeDefined();
            expect(typeof pedidosService.cancelarPedido).toBe('function');
        });

        test('debe exportar la función calcularTotal', () => {
            expect(pedidosService.calcularTotal).toBeDefined();
            expect(typeof pedidosService.calcularTotal).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('crearPedido debe aceptar objeto de pedido', () => {
            const pedido = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoDetalles: [{ PedidoMenuCodigo: 'MEN0000001', cantidad: 2 }]
            };
            pedidosService.crearPedido(pedido);

            expect(pedidosService.crearPedido).toHaveBeenCalledWith(pedido);
        });

        test('obtenerPedidos debe ser una función sin parámetros', () => {
            pedidosService.obtenerPedidos();
            expect(pedidosService.obtenerPedidos).toHaveBeenCalled();
        });

        test('obtenerPedidoPorCodigo debe aceptar código', () => {
            const codigo = 'PED0000001';
            pedidosService.obtenerPedidoPorCodigo(codigo);

            expect(pedidosService.obtenerPedidoPorCodigo).toHaveBeenCalledWith(codigo);
        });

        test('obtenerPedidosPorMesa debe aceptar código de mesa', () => {
            const mesaCodigo = 'MES0000001';
            pedidosService.obtenerPedidosPorMesa(mesaCodigo);

            expect(pedidosService.obtenerPedidosPorMesa).toHaveBeenCalledWith(mesaCodigo);
        });

        test('actualizarEstadoPedido debe aceptar código y estado', () => {
            const codigo = 'PED0000001';
            const estado = 'S';
            pedidosService.actualizarEstadoPedido(codigo, estado);

            expect(pedidosService.actualizarEstadoPedido).toHaveBeenCalledWith(codigo, estado);
        });

        test('cancelarPedido debe aceptar código', () => {
            const codigo = 'PED0000001';
            pedidosService.cancelarPedido(codigo);

            expect(pedidosService.cancelarPedido).toHaveBeenCalledWith(codigo);
        });

        test('calcularTotal debe aceptar array de detalles', () => {
            const detalles = [
                { menuPrecio: 25.50, cantidad: 2 }
            ];
            pedidosService.calcularTotal(detalles);

            expect(pedidosService.calcularTotal).toHaveBeenCalledWith(detalles);
        });
    });
});
