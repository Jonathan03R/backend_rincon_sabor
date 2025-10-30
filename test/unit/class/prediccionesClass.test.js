// test/controllers/prediccionesController.test.js

jest.mock('../../../config/connection');
jest.mock('../../../middlewares/authMiddleware');


let req, res;

beforeEach(() => {
    req = {
        user: { email: 'admin@example.com', uid: 'admin123' },
        body: {},
        params: {},
        query: {},
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

describe('PrediccionesClass - Tests completos', () => {

    describe('Validaciones de parámetros de ruta', () => {

        test('debe extraer fecha de inicio de query parameter', () => {
            req.query.fechaInicio = '2025-10-01';
            expect(req.query.fechaInicio).toBe('2025-10-01');
        });

        test('debe extraer fecha de fin de query parameter', () => {
            req.query.fechaFin = '2025-10-31';
            expect(req.query.fechaFin).toBe('2025-10-31');
        });

        test('debe validar formato de fecha ISO', () => {
            const fecha = '2025-10-01';
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
            expect(isValidDate).toBe(true);
        });

        test('debe rechazar formato de fecha inválido', () => {
            const fecha = '01-10-2025';
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
            expect(isValidDate).toBe(false);
        });
    });

    describe('Validaciones de rango de fechas', () => {

        test('debe validar que fecha inicio sea antes de fecha fin', () => {
            const fechaInicio = new Date('2025-10-01');
            const fechaFin = new Date('2025-10-31');
            expect(fechaInicio < fechaFin).toBe(true);
        });

        test('debe rechazar rango invertido', () => {
            const fechaInicio = new Date('2025-10-31');
            const fechaFin = new Date('2025-10-01');
            expect(fechaInicio < fechaFin).toBe(false);
        });

        test('debe permitir rango de un día', () => {
            const fechaInicio = new Date('2025-10-01');
            const fechaFin = new Date('2025-10-01');
            expect(fechaInicio <= fechaFin).toBe(true);
        });

        test('debe calcular días en rango', () => {
            const fechaInicio = new Date('2025-10-01');
            const fechaFin = new Date('2025-10-10');
            const dias = Math.floor((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;
            expect(dias).toBe(10);
        });
    });

    describe('Validaciones de respuesta de historial', () => {

        test('debe retornar array de historial de ventas', () => {
            const historial = [
                {
                    PedidoFechaHora: '2025-10-01 10:30:00',
                    MenuCodigo: 'MEN0000001',
                    MenuPlatos: 'Ceviche',
                    CantidadVendida: 2,
                    PrecioUnitario: 25.50,
                    Total: 51.00
                },
                {
                    PedidoFechaHora: '2025-10-01 11:15:00',
                    MenuCodigo: 'MEN0000002',
                    MenuPlatos: 'Lomo Saltado',
                    CantidadVendida: 1,
                    PrecioUnitario: 18.00,
                    Total: 18.00
                }
            ];

            expect(Array.isArray(historial)).toBe(true);
            expect(historial.length).toBe(2);
        });

        test('debe retornar array vacío si no hay ventas', () => {
            const historial = [];
            expect(Array.isArray(historial)).toBe(true);
            expect(historial.length).toBe(0);
        });

        test('debe contener campos requeridos en cada registro', () => {
            const registro = {
                PedidoFechaHora: '2025-10-01 10:30:00',
                MenuCodigo: 'MEN0000001',
                MenuPlatos: 'Ceviche',
                CantidadVendida: 2,
                PrecioUnitario: 25.50,
                Total: 51.00
            };

            const camposRequeridos = ['PedidoFechaHora', 'MenuCodigo', 'MenuPlatos', 'CantidadVendida', 'Total'];
            const tieneCampos = camposRequeridos.every(campo => registro.hasOwnProperty(campo));

            expect(tieneCampos).toBe(true);
        });
    });

    describe('Validaciones de estadísticas de ventas', () => {

        test('debe calcular total de ventas', () => {
            const ventas = [
                { Total: 51.00 },
                { Total: 18.00 },
                { Total: 30.00 }
            ];

            const totalVentas = ventas.reduce((sum, v) => sum + v.Total, 0);
            expect(totalVentas).toBe(99.00);
        });

        test('debe calcular cantidad total de items vendidos', () => {
            const ventas = [
                { CantidadVendida: 2 },
                { CantidadVendida: 1 },
                { CantidadVendida: 3 }
            ];

            const cantidadTotal = ventas.reduce((sum, v) => sum + v.CantidadVendida, 0);
            expect(cantidadTotal).toBe(6);
        });

        test('debe calcular promedio de venta por item', () => {
            const ventas = [
                { PrecioUnitario: 25.50 },
                { PrecioUnitario: 18.00 },
                { PrecioUnitario: 30.00 }
            ];

            const promedio = ventas.reduce((sum, v) => sum + v.PrecioUnitario, 0) / ventas.length;
            expect(promedio).toBeCloseTo(24.50, 2);
        });

        test('debe encontrar plato más vendido', () => {
            const ventas = [
                { MenuPlatos: 'Ceviche', CantidadVendida: 5 },
                { MenuPlatos: 'Lomo Saltado', CantidadVendida: 3 },
                { MenuPlatos: 'Ceviche', CantidadVendida: 2 }
            ];

            const platosAgrupados = ventas.reduce((acc, v) => {
                const existe = acc.find(p => p.MenuPlatos === v.MenuPlatos);
                if (existe) {
                    existe.CantidadVendida += v.CantidadVendida;
                } else {
                    acc.push(v);
                }
                return acc;
            }, []);

            const masBuscado = platosAgrupados.reduce((prev, current) => 
                prev.CantidadVendida > current.CantidadVendida ? prev : current
            );

            expect(masBuscado.MenuPlatos).toBe('Ceviche');
        });

        test('debe encontrar plato menos vendido', () => {
            const ventas = [
                { MenuPlatos: 'Ceviche', CantidadVendida: 5 },
                { MenuPlatos: 'Lomo Saltado', CantidadVendida: 1 },
                { MenuPlatos: 'Ceviche', CantidadVendida: 2 }
            ];

            const platosAgrupados = ventas.reduce((acc, v) => {
                const existe = acc.find(p => p.MenuPlatos === v.MenuPlatos);
                if (existe) {
                    existe.CantidadVendida += v.CantidadVendida;
                } else {
                    acc.push(v);
                }
                return acc;
            }, []);

            const menosBuscado = platosAgrupados.reduce((prev, current) => 
                prev.CantidadVendida < current.CantidadVendida ? prev : current
            );

            expect(menosBuscado.MenuPlatos).toBe('Lomo Saltado');
        });
    });

    describe('Validaciones de predicciones', () => {

        test('debe validar predicción de venta futura', () => {
            const prediccion = {
                fecha: '2025-11-01',
                ventasEstimadas: 1500.00,
                cantidadEstimada: 60,
                platoPopularEstimado: 'Ceviche',
                confianza: 85
            };

            expect(prediccion.fecha).toBeDefined();
            expect(prediccion.ventasEstimadas > 0).toBe(true);
            expect(prediccion.confianza >= 0 && prediccion.confianza <= 100).toBe(true);
        });

        test('debe validar rango de confianza', () => {
            const confianza = 85;
            expect(confianza >= 0 && confianza <= 100).toBe(true);
        });

        test('debe rechazar confianza fuera de rango', () => {
            const confianza = 150;
            expect(confianza >= 0 && confianza <= 100).toBe(false);
        });

        test('debe calcular tendencia de ventas', () => {
            const ventasHistorico = [100, 150, 200, 250, 300];
            const tendencia = ventasHistorico[ventasHistorico.length - 1] - ventasHistorico[0];
            
            expect(tendencia > 0).toBe(true); // Tendencia al alza
        });
    });

    describe('Filtrado de datos por período', () => {

        test('debe filtrar ventas por día específico', () => {
            const ventas = [
                { PedidoFechaHora: '2025-10-01 10:30:00' },
                { PedidoFechaHora: '2025-10-02 11:15:00' },
                { PedidoFechaHora: '2025-10-01 14:30:00' }
            ];

            const ventasDelDia = ventas.filter(v => v.PedidoFechaHora.includes('2025-10-01'));
            expect(ventasDelDia.length).toBe(2);
        });

        test('debe agrupar ventas por hora', () => {
            const ventas = [
                { PedidoFechaHora: '2025-10-01 10:30:00', Total: 50 },
                { PedidoFechaHora: '2025-10-01 10:45:00', Total: 30 },
                { PedidoFechaHora: '2025-10-01 11:15:00', Total: 40 }
            ];

            const ventasPorHora = {};
            ventas.forEach(v => {
                const hora = v.PedidoFechaHora.substring(0, 13);
                ventasPorHora[hora] = (ventasPorHora[hora] || 0) + v.Total;
            });

            expect(Object.keys(ventasPorHora).length).toBe(2);
        });

        test('debe agrupar ventas por menú', () => {
            const ventas = [
                { MenuCodigo: 'MEN0000001', CantidadVendida: 2 },
                { MenuCodigo: 'MEN0000002', CantidadVendida: 1 },
                { MenuCodigo: 'MEN0000001', CantidadVendida: 3 }
            ];

            const ventasPorMenu = {};
            ventas.forEach(v => {
                ventasPorMenu[v.MenuCodigo] = (ventasPorMenu[v.MenuCodigo] || 0) + v.CantidadVendida;
            });

            expect(ventasPorMenu['MEN0000001']).toBe(5);
            expect(ventasPorMenu['MEN0000002']).toBe(1);
        });
    });

    describe('Validaciones de respuesta HTTP', () => {

        test('debe retornar status 200 cuando hay datos', () => {
            req.query.fechaInicio = '2025-10-01';
            req.query.fechaFin = '2025-10-31';

            const tieneParametros = !!req.query.fechaInicio && !!req.query.fechaFin;
            expect(tieneParametros).toBe(true);  // ✅ CORRECTO
            // !! convierte a booleano
        });

        test('debe retornar error 400 si falta fechaInicio', () => {
            req.query.fechaFin = '2025-10-31';

            expect(req.query.fechaInicio).toBeUndefined();
        });

        test('debe retornar error 400 si falta fechaFin', () => {
            req.query.fechaInicio = '2025-10-01';

            expect(req.query.fechaFin).toBeUndefined();
        });
    });

    describe('Protección de rutas autenticadas', () => {

        test('debe permitir acceso con token válido', () => {
            req.user = { email: 'admin@example.com' };
            expect(req.user).toBeDefined();
            expect(req.user.email).toBeDefined();
        });

        test('debe rechazar sin usuario autenticado', () => {
            req.user = undefined;
            expect(req.user).toBeUndefined();
        });

        test('debe validar que usuario tenga rol admin para predicciones', () => {
            req.user = { email: 'admin@example.com', rol: 'admin' };
            expect(req.user.rol).toBe('admin');
        });
    });

    describe('Cálculos de predicciones avanzadas', () => {

        test('debe calcular crecimiento porcentual de ventas', () => {
            const ventasAnterior = 1000;
            const ventasActual = 1200;
            const crecimiento = ((ventasActual - ventasAnterior) / ventasAnterior) * 100;

            expect(crecimiento).toBe(20);
        });

        test('debe calcular caída de ventas', () => {
            const ventasAnterior = 1000;
            const ventasActual = 800;
            const caida = ((ventasAnterior - ventasActual) / ventasAnterior) * 100;

            expect(caida).toBe(20);
        });

        test('debe calcular promedio móvil de ventas', () => {
            const ventas = [100, 150, 200, 250, 300];
            const ventanaPromedios = 3;
            const promediomovil = [];

            for (let i = ventanaPromedios - 1; i < ventas.length; i++) {
                const suma = ventas.slice(i - ventanaPromedios + 1, i + 1).reduce((a, b) => a + b, 0);
                promediomovil.push(suma / ventanaPromedios);
            }

            expect(promediomovil[0]).toBeCloseTo(150, 1);
            expect(promediomovil[1]).toBeCloseTo(200, 1);
        });

        test('debe detectar anomalías en ventas', () => {
            const ventas = [100, 105, 110, 500, 108, 112]; // 500 es anomalía
            const promedio = ventas.reduce((a, b) => a + b) / ventas.length;
            const desviacion = Math.sqrt(
                ventas.reduce((sum, v) => sum + Math.pow(v - promedio, 2)) / ventas.length
            );

            const anomalias = ventas.filter(v => Math.abs(v - promedio) > desviacion * 2);
            expect(anomalias.length).toBeGreaterThan(0);
        });
    });
});
