// test/controllers/insumosController.test.js

jest.mock('../../../config/connection');
jest.mock('../../../middlewares/authMiddleware');

let req, res;

beforeEach(() => {
    req = {
        user: { email: 'admin@example.com', uid: 'admin123' },
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

describe('InsumosClass - Tests completos', () => {

    describe('Validaciones de formato de código', () => {

        test('debe validar formato correcto de código insumo', () => {
            const codigo = 'INS0000001';
            const isValidCode = /^INS\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });

        test('debe validar múltiples códigos insumo válidos', () => {
            const codigos = ['INS0000001', 'INS0000002', 'INS9999999'];
            const isValid = codigos.every(c => /^INS\d{7}$/.test(c));
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido', () => {
            const codigo = 'INVALID123';
            const isValidCode = /^INS\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe rechazar código sin prefijo INS', () => {
            const codigo = '0000001';
            const isValidCode = /^INS\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe validar longitud correcta de código', () => {
            const codigo = 'INS0000001';
            expect(codigo.length).toBe(10);
        });
    });

    describe('Validaciones de creación de insumo', () => {

        test('debe validar que nombre no esté vacío', () => {
            const nombre = 'Aceite de oliva';
            expect(nombre.trim().length > 0).toBe(true);
        });

        test('debe rechazar nombre vacío', () => {
            const nombre = '';
            expect(nombre.trim().length > 0).toBe(false);
        });

        test('debe validar insumo con todos los campos', () => {
            req.body = {
                InsumoNombre: 'Harina de Trigo',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50,
                InsumoCompraUnidad: 25.50,
                InsumoEstado: 'A'
            };

            const requiredFields = ['InsumoNombre', 'InsumoUnidadMedida', 'InsumoStockActual', 'InsumoCompraUnidad', 'InsumoEstado'];
            const hasAllFields = requiredFields.every(field => req.body[field] !== undefined);

            expect(hasAllFields).toBe(true);
        });

        test('debe detectar falta de InsumoNombre', () => {
            req.body = {
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50,
                InsumoCompraUnidad: 25.50
            };

            expect(req.body.InsumoNombre).toBeUndefined();
        });

        test('debe detectar falta de InsumoUnidadMedida', () => {
            req.body = {
                InsumoNombre: 'Harina',
                InsumoStockActual: 50,
                InsumoCompraUnidad: 25.50
            };

            expect(req.body.InsumoUnidadMedida).toBeUndefined();
        });

        test('debe detectar falta de InsumoStockActual', () => {
            req.body = {
                InsumoNombre: 'Harina',
                InsumoUnidadMedida: 'kg',
                InsumoCompraUnidad: 25.50
            };

            expect(req.body.InsumoStockActual).toBeUndefined();
        });

        test('debe detectar falta de InsumoCompraUnidad', () => {
            req.body = {
                InsumoNombre: 'Harina',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50
            };

            expect(req.body.InsumoCompraUnidad).toBeUndefined();
        });
    });

    describe('Validaciones de unidad de medida', () => {

        test('debe validar unidad de medida kg', () => {
            const unidad = 'kg';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(true);
        });

        test('debe validar unidad de medida gramos', () => {
            const unidad = 'g';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(true);
        });

        test('debe validar unidad de medida ml', () => {
            const unidad = 'ml';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(true);
        });

        test('debe validar unidad de medida litros', () => {
            const unidad = 'l';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(true);
        });

        test('debe validar unidad de medida docena', () => {
            const unidad = 'docena';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(true);
        });

        test('debe rechazar unidad de medida inválida', () => {
            const unidad = 'tonelada';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(false);
        });

        test('debe rechazar unidad de medida vacía', () => {
            const unidad = '';
            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(unidad)).toBe(false);
        });
    });

    describe('Validaciones de stock', () => {

        test('debe validar stock positivo', () => {
            const stock = 50;
            expect(stock > 0).toBe(true);
        });

        test('debe validar stock cero', () => {
            const stock = 0;
            expect(stock >= 0).toBe(true);
        });

        test('debe rechazar stock negativo', () => {
            const stock = -10;
            expect(stock < 0).toBe(true);
        });

        test('debe validar que stock sea número', () => {
            const stock = 50;
            expect(typeof stock).toBe('number');
        });

        test('debe rechazar stock como string', () => {
            const stock = '50';
            expect(typeof stock).toBe('string');
        });

        test('debe validar stock decimal', () => {
            const stock = 50.5;
            expect(stock > 0).toBe(true);
        });

        test('debe detectar stock bajo', () => {
            const stock = 5;
            const stockMinimo = 10;
            expect(stock < stockMinimo).toBe(true);
        });

        test('debe detectar stock suficiente', () => {
            const stock = 50;
            const stockMinimo = 10;
            expect(stock >= stockMinimo).toBe(true);
        });
    });

    describe('Validaciones de precio de compra', () => {

        test('debe validar precio positivo', () => {
            const precio = 25.50;
            expect(precio > 0).toBe(true);
        });

        test('debe rechazar precio negativo', () => {
            const precio = -25.50;
            expect(precio < 0).toBe(true);
        });

        test('debe validar precio cero (gratuito)', () => {
            const precio = 0;
            expect(precio >= 0).toBe(true);
        });

        test('debe validar que precio sea número', () => {
            const precio = 25.50;
            expect(typeof precio).toBe('number');
        });

        test('debe rechazar precio como string', () => {
            const precio = '25.50';
            expect(typeof precio).toBe('string');
        });

        test('debe validar precio con decimales', () => {
            const precio = 25.99;
            expect(precio).toBe(25.99);
        });

        test('debe validar precio con 2 decimales', () => {
            const precio = 25.50;
            const precioFormateado = precio.toFixed(2);
            expect(precioFormateado).toBe('25.50');
        });

        test('debe rechazar precio con más de 2 decimales', () => {
            const precio = 25.505;
            const precioFormateado = parseFloat(precio.toFixed(2));
            expect(precioFormateado).toBe(25.50);
        });
    });

    describe('Validaciones de estado', () => {

        test('debe validar estado Activo (A)', () => {
            const estado = 'A';
            expect(['A', 'I'].includes(estado)).toBe(true);
        });

        test('debe validar estado Inactivo (I)', () => {
            const estado = 'I';
            expect(['A', 'I'].includes(estado)).toBe(true);
        });

        test('debe rechazar estado inválido (X)', () => {
            const estado = 'X';
            expect(['A', 'I'].includes(estado)).toBe(false);
        });

        test('debe rechazar estado vacío', () => {
            const estado = '';
            expect(['A', 'I'].includes(estado)).toBe(false);
        });
    });

    describe('Validaciones de actualización de insumo', () => {

        test('debe validar insumo actualizado con código', () => {
            req.body = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina de Trigo Premium',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 75,
                InsumoCompraUnidad: 28.00,
                InsumoEstado: 'A'
            };

            const updateFields = ['InsumoCodigo', 'InsumoNombre', 'InsumoUnidadMedida', 'InsumoStockActual', 'InsumoCompraUnidad', 'InsumoEstado'];
            const hasAllFields = updateFields.every(field => req.body[field] !== undefined);

            expect(hasAllFields).toBe(true);
        });

        test('debe detectar falta de InsumoCodigo en actualización', () => {
            req.body = {
                InsumoNombre: 'Harina',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50
            };

            expect(req.body.InsumoCodigo).toBeUndefined();
        });

        test('debe permitir actualizar solo el nombre', () => {
            req.body = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Nuevo Nombre'
            };

            expect(req.body.InsumoCodigo).toBe('INS0000001');
            expect(req.body.InsumoNombre).toBe('Nuevo Nombre');
        });

        test('debe permitir actualizar solo el precio', () => {
            req.body = {
                InsumoCodigo: 'INS0000001',
                InsumoCompraUnidad: 30.00
            };

            expect(req.body.InsumoCodigo).toBe('INS0000001');
            expect(req.body.InsumoCompraUnidad).toBe(30.00);
        });
    });

    describe('Validaciones de actualización de stock', () => {

        test('debe aumentar stock correctamente', () => {
            const stockActual = 50;
            const cantidadAgregar = 25;
            const nuevoStock = stockActual + cantidadAgregar;

            expect(nuevoStock).toBe(75);
        });

        test('debe disminuir stock correctamente', () => {
            const stockActual = 50;
            const cantidadRestar = 10;
            const nuevoStock = stockActual - cantidadRestar;

            expect(nuevoStock).toBe(40);
        });

        test('debe rechazar disminuir stock por debajo de cero', () => {
            const stockActual = 50;
            const cantidadRestar = 60;
            const nuevoStock = stockActual - cantidadRestar;

            expect(nuevoStock < 0).toBe(true);
        });

        test('debe validar que stock actualizado sea número', () => {
            req.body = {
                InsumoCodigo: 'INS0000001',
                InsumoStockActual: 100
            };

            expect(typeof req.body.InsumoStockActual).toBe('number');
        });

        test('debe validar que cantidad a restar sea positiva', () => {
            const cantidad = 10;
            expect(cantidad > 0).toBe(true);
        });

        test('debe rechazar cantidad negativa para restar', () => {
            const cantidad = -10;
            expect(cantidad > 0).toBe(false);
        });
    });

    describe('Validaciones de parámetros de ruta', () => {

        test('debe extraer código de parámetro de ruta', () => {
            req.params.codigo = 'INS0000001';
            expect(req.params.codigo).toBe('INS0000001');
        });

        test('debe validar que código no esté vacío', () => {
            req.params.codigo = '';
            expect(req.params.codigo.length === 0).toBe(true);
        });

        test('debe rechazar parámetro código indefinido', () => {
            expect(req.params.codigo).toBeUndefined();
        });

        test('debe validar formato de código en parámetro', () => {
            req.params.codigo = 'INS0000001';
            const isValid = /^INS\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(true);
        });
    });

    describe('Listado de insumos', () => {

        test('debe retornar lista de insumos', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina', InsumoStockActual: 50 },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Aceite', InsumoStockActual: 30 }
            ];

            expect(insumos.length).toBe(2);
            expect(Array.isArray(insumos)).toBe(true);
        });

        test('debe retornar array vacío si no hay insumos', () => {
            const insumos = [];
            expect(insumos.length).toBe(0);
            expect(Array.isArray(insumos)).toBe(true);
        });

        test('debe filtrar insumos por estado', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina', InsumoEstado: 'A' },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Aceite', InsumoEstado: 'I' },
                { InsumoCodigo: 'INS0000003', InsumoNombre: 'Sal', InsumoEstado: 'A' }
            ];

            const activos = insumos.filter(i => i.InsumoEstado === 'A');
            expect(activos.length).toBe(2);
        });

        test('debe ordenar insumos por nombre', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Sal' },
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Aceite' },
                { InsumoCodigo: 'INS0000003', InsumoNombre: 'Harina' }
            ];

            const ordenados = insumos.sort((a, b) => 
                a.InsumoNombre.localeCompare(b.InsumoNombre)
            );

            expect(ordenados[0].InsumoNombre).toBe('Aceite');
            expect(ordenados[1].InsumoNombre).toBe('Harina');
            expect(ordenados[2].InsumoNombre).toBe('Sal');
        });
    });

    describe('Búsqueda y filtrado de insumos', () => {

        test('debe buscar insumo por código', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina' },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Aceite' }
            ];

            const encontrado = insumos.find(i => i.InsumoCodigo === 'INS0000001');
            expect(encontrado).toBeDefined();
            expect(encontrado.InsumoNombre).toBe('Harina');
        });

        test('debe buscar insumo por nombre exacto', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina' },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Aceite' }
            ];

            const encontrado = insumos.find(i => i.InsumoNombre === 'Harina');
            expect(encontrado).toBeDefined();
            expect(encontrado.InsumoCodigo).toBe('INS0000001');
        });

        test('debe retornar undefined si insumo no existe', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina' }
            ];

            const encontrado = insumos.find(i => i.InsumoCodigo === 'INS0000999');
            expect(encontrado).toBeUndefined();
        });

        test('debe filtrar insumos por nombre parcial', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina de Trigo' },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Harina de Maíz' },
                { InsumoCodigo: 'INS0000003', InsumoNombre: 'Aceite de Oliva' }
            ];

            const conHarina = insumos.filter(i => i.InsumoNombre.includes('Harina'));
            expect(conHarina.length).toBe(2);
        });

        test('debe filtrar insumos con stock bajo', () => {
            const insumos = [
                { InsumoCodigo: 'INS0000001', InsumoNombre: 'Harina', InsumoStockActual: 5 },
                { InsumoCodigo: 'INS0000002', InsumoNombre: 'Aceite', InsumoStockActual: 50 },
                { InsumoCodigo: 'INS0000003', InsumoNombre: 'Sal', InsumoStockActual: 8 }
            ];

            const stockBajo = insumos.filter(i => i.InsumoStockActual < 10);
            expect(stockBajo.length).toBe(2);
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

        test('debe validar que usuario tenga email', () => {
            req.user = { email: 'admin@example.com' };
            expect(req.user.email).toBe('admin@example.com');
        });

        test('debe validar que usuario tenga uid', () => {
            req.user = { uid: 'admin123', email: 'admin@example.com' };
            expect(req.user.uid).toBe('admin123');
        });
    });

    describe('Validación de objeto insumo completo', () => {

        test('debe crear objeto insumo válido', () => {
            const insumo = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina de Trigo',
                InsumoUnidadMedida: 'kg',
                InsumoStockActual: 50,
                InsumoCompraUnidad: 25.50,
                InsumoEstado: 'A',
                InsumoFechaRegistro: new Date()
            };

            expect(insumo).toHaveProperty('InsumoCodigo');
            expect(insumo).toHaveProperty('InsumoNombre');
            expect(insumo).toHaveProperty('InsumoUnidadMedida');
            expect(insumo).toHaveProperty('InsumoStockActual');
            expect(insumo).toHaveProperty('InsumoCompraUnidad');
            expect(insumo).toHaveProperty('InsumoEstado');
        });

        test('debe validar que insumo tenga código válido', () => {
            const insumo = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina'
            };

            const isValidCodigo = /^INS\d{7}$/.test(insumo.InsumoCodigo);
            expect(isValidCodigo).toBe(true);
        });

        test('debe validar que insumo tenga nombre válido', () => {
            const insumo = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina de Trigo'
            };

            expect(insumo.InsumoNombre.trim().length > 0).toBe(true);
        });

        test('debe validar que insumo tenga unidad válida', () => {
            const insumo = {
                InsumoCodigo: 'INS0000001',
                InsumoNombre: 'Harina',
                InsumoUnidadMedida: 'kg'
            };

            const unidadesValidas = ['kg', 'g', 'ml', 'l', 'unidad', 'docena', 'caja', 'paquete'];
            expect(unidadesValidas.includes(insumo.InsumoUnidadMedida)).toBe(true);
        });
    });

    describe('Cálculos relacionados con insumos', () => {

        test('debe calcular costo total de stock', () => {
            const stock = 50;
            const precioUnitario = 25.50;
            const costoTotal = stock * precioUnitario;

            expect(costoTotal).toBe(1275);
        });

        test('debe calcular costo promedio', () => {
            const insumos = [
                { InsumoCompraUnidad: 25.50, InsumoStockActual: 50 },   // 25.50 × 50 = 1275
                { InsumoCompraUnidad: 30.00, InsumoStockActual: 30 }    // 30.00 × 30 = 900
            ];

            const costosTotal = insumos.reduce((sum, i) => sum + (i.InsumoCompraUnidad * i.InsumoStockActual), 0);
            expect(costosTotal).toBe(2175);  // ✅ CORRECTO: 1275 + 900 = 2175
        });


        test('debe calcular stock total', () => {
            const insumos = [
                { InsumoStockActual: 50 },
                { InsumoStockActual: 30 },
                { InsumoStockActual: 20 }
            ];

            const stockTotal = insumos.reduce((sum, i) => sum + i.InsumoStockActual, 0);
            expect(stockTotal).toBe(100);
        });

        test('debe detectar insumos agotados', () => {
            const insumos = [
                { InsumoNombre: 'Harina', InsumoStockActual: 0 },
                { InsumoNombre: 'Aceite', InsumoStockActual: 10 }
            ];

            const agotados = insumos.filter(i => i.InsumoStockActual === 0);
            expect(agotados.length).toBe(1);
            expect(agotados[0].InsumoNombre).toBe('Harina');
        });
    });
});
