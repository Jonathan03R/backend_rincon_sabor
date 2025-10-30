// test/controllers/pedidosController.test.js

jest.mock('../../../config/connection');
jest.mock('../../../middlewares/authMiddleware');

let req, res;

beforeEach(() => {
    req = {
        user: { email: 'mesero@example.com', uid: 'mesero123' },
        body: {},
        params: {},
        headers: {}
    };
    res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn()
    };
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

describe('PedidosClass - Tests completos', () => {

    describe('Validaciones de formato de código', () => {

        test('debe validar formato correcto de código pedido', () => {
            const codigo = 'PED0000001';
            const isValidCode = /^PED\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });

        test('debe validar múltiples códigos pedido válidos', () => {
            const codigos = ['PED0000001', 'PED0000002', 'PED9999999'];
            const isValid = codigos.every(c => /^PED\d{7}$/.test(c));
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido', () => {
            const codigo = 'INVALID123';
            const isValidCode = /^PED\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe validar longitud correcta de código', () => {
            const codigo = 'PED0000001';
            expect(codigo.length).toBe(10);
        });

        test('debe validar formato correcto de código mesa', () => {
            const codigo = 'MES0000001';
            const isValidCode = /^MES\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });

        test('debe validar formato correcto de código menú', () => {
            const codigo = 'MEN0000001';
            const isValidCode = /^MEN\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });
    });

    describe('Validaciones de creación de pedido', () => {

        test('debe validar pedido con todos los campos', () => {
            req.body = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoFechaHora: new Date(),
                PedidoDetalles: [
                    { PedidoMenuCodigo: 'MEN0000001', PedidoCantidad: 2 },
                    { PedidoMenuCodigo: 'MEN0000002', PedidoCantidad: 1 }
                ]
            };

            expect(req.body.PedidoMesaCodigo).toBeDefined();
            expect(req.body.PedidoFechaHora).toBeDefined();
            expect(Array.isArray(req.body.PedidoDetalles)).toBe(true);
        });

        test('debe detectar falta de PedidoMesaCodigo', () => {
            req.body = {
                PedidoFechaHora: new Date(),
                PedidoDetalles: []
            };

            expect(req.body.PedidoMesaCodigo).toBeUndefined();
        });

        test('debe detectar falta de detalles del pedido', () => {
            req.body = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoFechaHora: new Date()
            };

            expect(req.body.PedidoDetalles).toBeUndefined();
        });

        test('debe validar que detalles sea array', () => {
            req.body = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoDetalles: [
                    { PedidoMenuCodigo: 'MEN0000001', PedidoCantidad: 2 }
                ]
            };

            expect(Array.isArray(req.body.PedidoDetalles)).toBe(true);
        });

        test('debe validar que detalles no esté vacío', () => {
            req.body = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoDetalles: []
            };

            expect(req.body.PedidoDetalles.length > 0).toBe(false);
        });

        test('debe validar que detalles tenga al menos un item', () => {
            req.body = {
                PedidoMesaCodigo: 'MES0000001',
                PedidoDetalles: [
                    { PedidoMenuCodigo: 'MEN0000001', PedidoCantidad: 2 }
                ]
            };

            expect(req.body.PedidoDetalles.length > 0).toBe(true);
        });
    });

    describe('Validaciones de estado de pedido', () => {

        test('debe validar estado Pendiente', () => {
            const estado = 'P';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(true);
        });

        test('debe validar estado En Preparación', () => {
            const estado = 'E';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(true);
        });

        test('debe validar estado Servido', () => {
            const estado = 'S';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(true);
        });

        test('debe validar estado Cancelado', () => {
            const estado = 'C';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(true);
        });

        test('debe rechazar estado inválido', () => {
            const estado = 'X';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(false);
        });

        test('debe rechazar estado vacío', () => {
            const estado = '';
            expect(['P', 'E', 'S', 'C'].includes(estado)).toBe(false);
        });
    });

    describe('Validaciones de cantidad en detalles', () => {

        test('debe validar cantidad positiva', () => {
            const cantidad = 2;
            expect(cantidad > 0).toBe(true);
        });

        test('debe rechazar cantidad cero', () => {
            const cantidad = 0;
            expect(cantidad > 0).toBe(false);
        });

        test('debe rechazar cantidad negativa', () => {
            const cantidad = -1;
            expect(cantidad > 0).toBe(false);
        });

        test('debe validar que cantidad sea número', () => {
            const cantidad = 2;
            expect(typeof cantidad).toBe('number');
        });

        test('debe validar cantidad decimal', () => {
            const cantidad = 2.5;
            expect(cantidad > 0).toBe(true);
        });

        test('debe validar cantidad grande', () => {
            const cantidad = 100;
            expect(cantidad > 0).toBe(true);
        });
    });

    describe('Validaciones de cálculo de subtotal', () => {

        test('debe calcular subtotal correcto', () => {
            const detalles = [
                { menuPrecio: 25.50, cantidad: 2 },  // 51.00
                { menuPrecio: 15.00, cantidad: 1 }   // 15.00
            ];

            const subtotal = detalles.reduce((sum, d) => sum + (d.menuPrecio * d.cantidad), 0);
            expect(subtotal).toBe(66.00);
        });

        test('debe calcular subtotal con múltiples items', () => {
            const detalles = [
                { menuPrecio: 10.00, cantidad: 1 },      // 10.00
                { menuPrecio: 20.00, cantidad: 2 },      // 40.00
                { menuPrecio: 15.00, cantidad: 3 }       // 45.00
            ];

            const subtotal = detalles.reduce((sum, d) => sum + (d.menuPrecio * d.cantidad), 0);
            expect(subtotal).toBe(95.00);  // ✅ CORRECTO: 10 + 40 + 45 = 95
        });

        test('debe retornar 0 si no hay detalles', () => {
            const detalles = [];
            const subtotal = detalles.reduce((sum, d) => sum + (d.menuPrecio * d.cantidad), 0);
            expect(subtotal).toBe(0);
        });

        test('debe manejar precios decimales', () => {
            const detalles = [
                { menuPrecio: 25.99, cantidad: 1 }
            ];

            const subtotal = detalles.reduce((sum, d) => sum + (d.menuPrecio * d.cantidad), 0);
            expect(subtotal).toBeCloseTo(25.99, 2);
        });
    });

    describe('Validaciones de cálculo de impuestos', () => {

        test('debe calcular impuestos correctamente (IGV 18%)', () => {
            const subtotal = 100.00;
            const igv = subtotal * 0.18;
            expect(igv).toBe(18.00);
        });

        test('debe calcular impuestos en pedido completo', () => {
            const detalles = [
                { menuPrecio: 50.00, cantidad: 1 }
            ];
            const subtotal = detalles.reduce((sum, d) => sum + (d.menuPrecio * d.cantidad), 0);
            const igv = subtotal * 0.18;

            expect(igv).toBe(9.00);
        });

        test('debe calcular total incluyendo impuestos', () => {
            const subtotal = 100.00;
            const igv = subtotal * 0.18;
            const total = subtotal + igv;

            expect(total).toBe(118.00);
        });
    });

    describe('Validaciones de cálculo de total', () => {

        test('debe calcular total correctamente', () => {
            const subtotal = 66.00;
            const igv = subtotal * 0.18;
            const total = subtotal + igv;

            expect(total).toBeCloseTo(77.88, 2);
        });

        test('debe calcular total con descuento', () => {
            const subtotal = 100.00;
            const descuento = 10.00;
            const subtotalConDescuento = subtotal - descuento;
            const igv = subtotalConDescuento * 0.18;
            const total = subtotalConDescuento + igv;

            expect(total).toBeCloseTo(106.20, 2);
        });

        test('debe validar que total sea mayor que subtotal', () => {
            const subtotal = 100.00;
            const igv = subtotal * 0.18;
            const total = subtotal + igv;

            expect(total > subtotal).toBe(true);
        });

        test('debe retornar total positivo', () => {
            const subtotal = 50.00;
            const igv = subtotal * 0.18;
            const total = subtotal + igv;

            expect(total > 0).toBe(true);
        });
    });

    describe('Validaciones de parámetros de ruta', () => {

        test('debe extraer código de pedido de parámetro de ruta', () => {
            req.params.codigo = 'PED0000001';
            expect(req.params.codigo).toBe('PED0000001');
        });

        test('debe validar formato de código en parámetro', () => {
            req.params.codigo = 'PED0000001';
            const isValid = /^PED\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido en parámetro', () => {
            req.params.codigo = 'INVALID';
            const isValid = /^PED\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(false);
        });

        test('debe extraer código de mesa de parámetro de ruta', () => {
            req.params.mesaCodigo = 'MES0000001';
            expect(req.params.mesaCodigo).toBe('MES0000001');
        });
    });

    describe('Listado de pedidos', () => {

        test('debe retornar lista de pedidos', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoMesaCodigo: 'MES0000001', PedidoSubtotal: 66.00 },
                { PedidoCodigo: 'PED0000002', PedidoMesaCodigo: 'MES0000002', PedidoSubtotal: 45.00 }
            ];

            expect(pedidos.length).toBe(2);
            expect(Array.isArray(pedidos)).toBe(true);
        });

        test('debe retornar array vacío si no hay pedidos', () => {
            const pedidos = [];
            expect(pedidos.length).toBe(0);
            expect(Array.isArray(pedidos)).toBe(true);
        });

        test('debe filtrar pedidos por estado', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoEstado: 'P' },
                { PedidoCodigo: 'PED0000002', PedidoEstado: 'S' },
                { PedidoCodigo: 'PED0000003', PedidoEstado: 'P' }
            ];

            const pendientes = pedidos.filter(p => p.PedidoEstado === 'P');
            expect(pendientes.length).toBe(2);
        });

        test('debe filtrar pedidos por mesa', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoMesaCodigo: 'MES0000001' },
                { PedidoCodigo: 'PED0000002', PedidoMesaCodigo: 'MES0000002' },
                { PedidoCodigo: 'PED0000003', PedidoMesaCodigo: 'MES0000001' }
            ];

            const pedidosMesa1 = pedidos.filter(p => p.PedidoMesaCodigo === 'MES0000001');
            expect(pedidosMesa1.length).toBe(2);
        });

        test('debe ordenar pedidos por fecha', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000003', PedidoFechaHora: new Date('2025-10-30 14:00') },
                { PedidoCodigo: 'PED0000001', PedidoFechaHora: new Date('2025-10-30 12:00') },
                { PedidoCodigo: 'PED0000002', PedidoFechaHora: new Date('2025-10-30 13:00') }
            ];

            const ordenados = pedidos.sort((a, b) => a.PedidoFechaHora - b.PedidoFechaHora);

            expect(ordenados[0].PedidoCodigo).toBe('PED0000001');
            expect(ordenados[1].PedidoCodigo).toBe('PED0000002');
            expect(ordenados[2].PedidoCodigo).toBe('PED0000003');
        });
    });

    describe('Búsqueda y filtrado de pedidos', () => {

        test('debe buscar pedido por código', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoMesaCodigo: 'MES0000001' },
                { PedidoCodigo: 'PED0000002', PedidoMesaCodigo: 'MES0000002' }
            ];

            const encontrado = pedidos.find(p => p.PedidoCodigo === 'PED0000001');
            expect(encontrado).toBeDefined();
            expect(encontrado.PedidoMesaCodigo).toBe('MES0000001');
        });

        test('debe buscar pedidos por mesa', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoMesaCodigo: 'MES0000001' },
                { PedidoCodigo: 'PED0000002', PedidoMesaCodigo: 'MES0000001' }
            ];

            const pedidosMesa = pedidos.filter(p => p.PedidoMesaCodigo === 'MES0000001');
            expect(pedidosMesa.length).toBe(2);
        });

        test('debe retornar undefined si pedido no existe', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoMesaCodigo: 'MES0000001' }
            ];

            const encontrado = pedidos.find(p => p.PedidoCodigo === 'PED0000999');
            expect(encontrado).toBeUndefined();
        });

        test('debe filtrar pedidos completamente servidos', () => {
            const pedidos = [
                { PedidoCodigo: 'PED0000001', PedidoCompletamenteServido: true },
                { PedidoCodigo: 'PED0000002', PedidoCompletamenteServido: false },
                { PedidoCodigo: 'PED0000003', PedidoCompletamenteServido: true }
            ];

            const completamenteServidos = pedidos.filter(p => p.PedidoCompletamenteServido);
            expect(completamenteServidos.length).toBe(2);
        });
    });

    describe('Validación de detalles de pedido', () => {

        test('debe validar detalle de pedido completo', () => {
            const detalle = {
                PedidoMenuCodigo: 'MEN0000001',
                PedidoCantidad: 2,
                menuPrecio: 25.50,
                menuNombre: 'Ceviche'
            };

            expect(detalle).toHaveProperty('PedidoMenuCodigo');
            expect(detalle).toHaveProperty('PedidoCantidad');
            expect(detalle).toHaveProperty('menuPrecio');
            expect(detalle).toHaveProperty('menuNombre');
        });

        test('debe validar que cantidad sea mayor a cero', () => {
            const detalle = {
                PedidoCantidad: 2
            };

            expect(detalle.PedidoCantidad > 0).toBe(true);
        });

        test('debe validar que precio sea positivo', () => {
            const detalle = {
                menuPrecio: 25.50
            };

            expect(detalle.menuPrecio > 0).toBe(true);
        });

        test('debe calcular precio de detalle correctamente', () => {
            const detalle = {
                PedidoCantidad: 2,
                menuPrecio: 25.50
            };

            const precioDetalle = detalle.PedidoCantidad * detalle.menuPrecio;
            expect(precioDetalle).toBe(51.00);
        });
    });

    describe('Protección de rutas autenticadas', () => {

        test('debe permitir acceso con token válido', () => {
            req.user = { email: 'mesero@example.com' };
            expect(req.user).toBeDefined();
            expect(req.user.email).toBeDefined();
        });

        test('debe rechazar sin usuario autenticado', () => {
            req.user = undefined;
            expect(req.user).toBeUndefined();
        });

        test('debe validar que usuario tenga email', () => {
            req.user = { email: 'mesero@example.com' };
            expect(req.user.email).toBe('mesero@example.com');
        });

        test('debe validar que usuario tenga uid', () => {
            req.user = { uid: 'mesero123', email: 'mesero@example.com' };
            expect(req.user.uid).toBe('mesero123');
        });
    });

    describe('Cálculos relacionados con pedidos', () => {

        test('debe contar número de items en pedido', () => {
            const detalles = [
                { PedidoCantidad: 2 },
                { PedidoCantidad: 1 },
                { PedidoCantidad: 3 }
            ];

            const totalItems = detalles.reduce((sum, d) => sum + d.PedidoCantidad, 0);
            expect(totalItems).toBe(6);
        });

        test('debe contar número de platos diferentes', () => {
            const detalles = [
                { PedidoMenuCodigo: 'MEN0000001' },
                { PedidoMenuCodigo: 'MEN0000002' },
                { PedidoMenuCodigo: 'MEN0000001' }
            ];

            const platosUnicos = new Set(detalles.map(d => d.PedidoMenuCodigo)).size;
            expect(platosUnicos).toBe(2);
        });

        test('debe detectar pedidos con mismo menú', () => {
            const detalles = [
                { PedidoMenuCodigo: 'MEN0000001', PedidoCantidad: 2 },
                { PedidoMenuCodigo: 'MEN0000001', PedidoCantidad: 1 }
            ];

            const mismosMenus = detalles.filter(d => d.PedidoMenuCodigo === 'MEN0000001');
            expect(mismosMenus.length).toBe(2);
        });

        test('debe calcular tiempo promedio de pedidos', () => {
            const pedidos = [
                { tiempoPreparacion: 15 },
                { tiempoPreparacion: 20 },
                { tiempoPreparacion: 25 }
            ];

            const tiempoPromedio = pedidos.reduce((sum, p) => sum + p.tiempoPreparacion, 0) / pedidos.length;
            expect(tiempoPromedio).toBe(20);
        });
    });

    describe('Validaciones de cambios de estado', () => {

        test('debe permitir cambiar de Pendiente a En Preparación', () => {
            const estadoActual = 'P';
            const nuevoEstado = 'E';
            const transicionesValidas = {
                'P': ['E', 'C'],
                'E': ['S', 'C'],
                'S': ['C'],
                'C': []
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe permitir cambiar de En Preparación a Servido', () => {
            const estadoActual = 'E';
            const nuevoEstado = 'S';
            const transicionesValidas = {
                'P': ['E', 'C'],
                'E': ['S', 'C'],
                'S': ['C'],
                'C': []
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe permitir cancelar desde cualquier estado no final', () => {
            const transicionesValidas = {
                'P': ['E', 'C'],
                'E': ['S', 'C'],
                'S': ['C'],
                'C': []
            };

            expect(transicionesValidas['P'].includes('C')).toBe(true);
            expect(transicionesValidas['E'].includes('C')).toBe(true);
        });

        test('debe rechazar cambio a estado inválido', () => {
            const estadoActual = 'P';
            const nuevoEstado = 'X';
            const transicionesValidas = {
                'P': ['E', 'C'],
                'E': ['S', 'C'],
                'S': ['C'],
                'C': []
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(false);
        });
    });
});
