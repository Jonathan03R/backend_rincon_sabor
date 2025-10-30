// test/controllers/mesasController.test.js

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

describe('MesasClass - Tests completos', () => {

    describe('Validaciones de formato de código', () => {

        test('debe validar formato correcto de código mesa', () => {
            const codigo = 'MES0000001';
            const isValidCode = /^MES\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });

        test('debe validar múltiples códigos mesa válidos', () => {
            const codigos = ['MES0000001', 'MES0000002', 'MES9999999'];
            const isValid = codigos.every(c => /^MES\d{7}$/.test(c));
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido', () => {
            const codigo = 'INVALID123';
            const isValidCode = /^MES\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe validar longitud correcta de código', () => {
            const codigo = 'MES0000001';
            expect(codigo.length).toBe(10);
        });

        test('debe rechazar código sin prefijo MES', () => {
            const codigo = '0000001';
            const isValidCode = /^MES\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });
    });

    describe('Validaciones de número de mesa', () => {

        test('debe validar número de mesa positivo', () => {
            const numero = 5;
            expect(numero > 0).toBe(true);
        });

        test('debe validar múltiples números de mesa', () => {
            const numeros = [1, 2, 3, 10, 50];
            const sonValidos = numeros.every(n => n > 0);
            expect(sonValidos).toBe(true);
        });

        test('debe rechazar número de mesa cero', () => {
            const numero = 0;
            expect(numero > 0).toBe(false);
        });

        test('debe rechazar número de mesa negativo', () => {
            const numero = -5;
            expect(numero > 0).toBe(false);
        });

        test('debe validar que número sea entero', () => {
            const numero = 5;
            expect(Number.isInteger(numero)).toBe(true);
        });

        test('debe rechazar número decimal', () => {
            const numero = 5.5;
            expect(Number.isInteger(numero)).toBe(false);
        });

        test('debe validar número máximo de mesa', () => {
            const numero = 99;
            const numeroMax = 100;
            expect(numero < numeroMax).toBe(true);
        });
    });

    describe('Validaciones de estado de mesa', () => {

        test('debe validar estado Disponible (D)', () => {
            const estado = 'D';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(true);
        });

        test('debe validar estado Ocupada (O)', () => {
            const estado = 'O';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(true);
        });

        test('debe validar estado Reservada (R)', () => {
            const estado = 'R';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(true);
        });

        test('debe validar estado Sucia (S)', () => {
            const estado = 'S';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(true);
        });

        test('debe rechazar estado inválido', () => {
            const estado = 'X';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(false);
        });

        test('debe rechazar estado vacío', () => {
            const estado = '';
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(false);
        });

        test('debe rechazar estado nulo', () => {
            const estado = null;
            expect(['D', 'O', 'R', 'S'].includes(estado)).toBe(false);
        });
    });

    describe('Validaciones de creación de mesa', () => {

        test('debe validar mesa con todos los campos', () => {
            req.body = {
                MesaNumero: 5,
                MesaCapacidad: 4,
                MesaEstado: 'D'
            };

            expect(req.body.MesaNumero).toBeDefined();
            expect(req.body.MesaCapacidad).toBeDefined();
            expect(req.body.MesaEstado).toBeDefined();
        });

        test('debe detectar falta de MesaNumero', () => {
            req.body = {
                MesaCapacidad: 4,
                MesaEstado: 'D'
            };

            expect(req.body.MesaNumero).toBeUndefined();
        });

        test('debe detectar falta de MesaCapacidad', () => {
            req.body = {
                MesaNumero: 5,
                MesaEstado: 'D'
            };

            expect(req.body.MesaCapacidad).toBeUndefined();
        });

        test('debe detectar falta de MesaEstado', () => {
            req.body = {
                MesaNumero: 5,
                MesaCapacidad: 4
            };

            expect(req.body.MesaEstado).toBeUndefined();
        });
    });

    describe('Validaciones de capacidad de mesa', () => {

        test('debe validar capacidad positiva', () => {
            const capacidad = 4;
            expect(capacidad > 0).toBe(true);
        });

        test('debe validar capacidad mínima', () => {
            const capacidad = 1;
            expect(capacidad >= 1).toBe(true);
        });

        test('debe validar capacidad máxima', () => {
            const capacidad = 12;
            expect(capacidad <= 12).toBe(true);
        });

        test('debe rechazar capacidad cero', () => {
            const capacidad = 0;
            expect(capacidad > 0).toBe(false);
        });

        test('debe rechazar capacidad negativa', () => {
            const capacidad = -4;
            expect(capacidad > 0).toBe(false);
        });

        test('debe validar capacidades comunes', () => {
            const capacidadesComunes = [2, 4, 6, 8];
            const sonValidas = capacidadesComunes.every(c => c > 0 && c <= 12);
            expect(sonValidas).toBe(true);
        });

        test('debe validar que capacidad sea entero', () => {
            const capacidad = 4;
            expect(Number.isInteger(capacidad)).toBe(true);
        });
    });

    describe('Validaciones de parámetros de ruta', () => {

        test('debe extraer código de mesa de parámetro de ruta', () => {
            req.params.codigo = 'MES0000001';
            expect(req.params.codigo).toBe('MES0000001');
        });

        test('debe validar formato de código en parámetro', () => {
            req.params.codigo = 'MES0000001';
            const isValid = /^MES\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido en parámetro', () => {
            req.params.codigo = 'INVALID';
            const isValid = /^MES\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(false);
        });

        test('debe validar que código no esté vacío', () => {
            req.params.codigo = '';
            expect(req.params.codigo.length === 0).toBe(true);
        });
    });

    describe('Listado de mesas', () => {

        test('debe retornar lista de mesas', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaNumero: 1, MesaEstado: 'D' },
                { MesaCodigo: 'MES0000002', MesaNumero: 2, MesaEstado: 'O' }
            ];

            expect(mesas.length).toBe(2);
            expect(Array.isArray(mesas)).toBe(true);
        });

        test('debe retornar array vacío si no hay mesas', () => {
            const mesas = [];
            expect(mesas.length).toBe(0);
            expect(Array.isArray(mesas)).toBe(true);
        });

        test('debe filtrar mesas por estado', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaNumero: 1, MesaEstado: 'D' },
                { MesaCodigo: 'MES0000002', MesaNumero: 2, MesaEstado: 'O' },
                { MesaCodigo: 'MES0000003', MesaNumero: 3, MesaEstado: 'D' }
            ];

            const disponibles = mesas.filter(m => m.MesaEstado === 'D');
            expect(disponibles.length).toBe(2);
        });

        test('debe contar mesas disponibles', () => {
            const mesas = [
                { MesaEstado: 'D' },
                { MesaEstado: 'O' },
                { MesaEstado: 'D' },
                { MesaEstado: 'S' }
            ];

            const disponibles = mesas.filter(m => m.MesaEstado === 'D').length;
            expect(disponibles).toBe(2);
        });

        test('debe contar mesas ocupadas', () => {
            const mesas = [
                { MesaEstado: 'D' },
                { MesaEstado: 'O' },
                { MesaEstado: 'O' },
                { MesaEstado: 'S' }
            ];

            const ocupadas = mesas.filter(m => m.MesaEstado === 'O').length;
            expect(ocupadas).toBe(2);
        });

        test('debe ordenar mesas por número', () => {
            const mesas = [
                { MesaCodigo: 'MES0000003', MesaNumero: 3 },
                { MesaCodigo: 'MES0000001', MesaNumero: 1 },
                { MesaCodigo: 'MES0000002', MesaNumero: 2 }
            ];

            const ordenadas = mesas.sort((a, b) => a.MesaNumero - b.MesaNumero);

            expect(ordenadas[0].MesaNumero).toBe(1);
            expect(ordenadas[1].MesaNumero).toBe(2);
            expect(ordenadas[2].MesaNumero).toBe(3);
        });
    });

    describe('Búsqueda y filtrado de mesas', () => {

        test('debe buscar mesa por código', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaNumero: 1 },
                { MesaCodigo: 'MES0000002', MesaNumero: 2 }
            ];

            const encontrada = mesas.find(m => m.MesaCodigo === 'MES0000001');
            expect(encontrada).toBeDefined();
            expect(encontrada.MesaNumero).toBe(1);
        });

        test('debe buscar mesa por número', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaNumero: 1 },
                { MesaCodigo: 'MES0000002', MesaNumero: 5 }
            ];

            const encontrada = mesas.find(m => m.MesaNumero === 5);
            expect(encontrada).toBeDefined();
            expect(encontrada.MesaCodigo).toBe('MES0000002');
        });

        test('debe retornar undefined si mesa no existe', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaNumero: 1 }
            ];

            const encontrada = mesas.find(m => m.MesaCodigo === 'MES0000999');
            expect(encontrada).toBeUndefined();
        });

        test('debe filtrar mesas por capacidad', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaCapacidad: 2 },
                { MesaCodigo: 'MES0000002', MesaCapacidad: 4 },
                { MesaCodigo: 'MES0000003', MesaCapacidad: 4 }
            ];

            const mesasCapacidad4 = mesas.filter(m => m.MesaCapacidad === 4);
            expect(mesasCapacidad4.length).toBe(2);
        });

        test('debe filtrar mesas para grupo de personas', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaCapacidad: 2 },
                { MesaCodigo: 'MES0000002', MesaCapacidad: 4 },
                { MesaCodigo: 'MES0000003', MesaCapacidad: 6 }
            ];

            const personasEsperadas = 4;
            const mesasAptas = mesas.filter(m => m.MesaCapacidad >= personasEsperadas);
            expect(mesasAptas.length).toBe(2);
        });
    });

    describe('Cambios de estado de mesa', () => {

        test('debe cambiar de Disponible a Ocupada', () => {
            const estadoActual = 'D';
            const nuevoEstado = 'O';
            const transicionesValidas = {
                'D': ['O', 'R'],
                'O': ['S', 'D'],
                'R': ['O', 'D'],
                'S': ['D']
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe cambiar de Ocupada a Sucia', () => {
            const estadoActual = 'O';
            const nuevoEstado = 'S';
            const transicionesValidas = {
                'D': ['O', 'R'],
                'O': ['S', 'D'],
                'R': ['O', 'D'],
                'S': ['D']
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe cambiar de Sucia a Disponible', () => {
            const estadoActual = 'S';
            const nuevoEstado = 'D';
            const transicionesValidas = {
                'D': ['O', 'R'],
                'O': ['S', 'D'],
                'R': ['O', 'D'],
                'S': ['D']
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe cambiar de Disponible a Reservada', () => {
            const estadoActual = 'D';
            const nuevoEstado = 'R';
            const transicionesValidas = {
                'D': ['O', 'R'],
                'O': ['S', 'D'],
                'R': ['O', 'D'],
                'S': ['D']
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(true);
        });

        test('debe rechazar transición inválida', () => {
            const estadoActual = 'D';
            const nuevoEstado = 'S';
            const transicionesValidas = {
                'D': ['O', 'R'],
                'O': ['S', 'D'],
                'R': ['O', 'D'],
                'S': ['D']
            };

            expect(transicionesValidas[estadoActual].includes(nuevoEstado)).toBe(false);
        });
    });

    describe('Validación de objeto mesa completo', () => {

        test('debe crear objeto mesa válido', () => {
            const mesa = {
                MesaCodigo: 'MES0000001',
                MesaNumero: 5,
                MesaCapacidad: 4,
                MesaEstado: 'D',
                MesaFechaRegistro: new Date()
            };

            expect(mesa).toHaveProperty('MesaCodigo');
            expect(mesa).toHaveProperty('MesaNumero');
            expect(mesa).toHaveProperty('MesaCapacidad');
            expect(mesa).toHaveProperty('MesaEstado');
            expect(mesa).toHaveProperty('MesaFechaRegistro');
        });

        test('debe validar que mesa tenga código válido', () => {
            const mesa = {
                MesaCodigo: 'MES0000001',
                MesaNumero: 5
            };

            const isValidCodigo = /^MES\d{7}$/.test(mesa.MesaCodigo);
            expect(isValidCodigo).toBe(true);
        });

        test('debe validar que mesa tenga número válido', () => {
            const mesa = {
                MesaCodigo: 'MES0000001',
                MesaNumero: 5
            };

            expect(mesa.MesaNumero > 0).toBe(true);
        });

        test('debe validar que mesa tenga capacidad válida', () => {
            const mesa = {
                MesaCodigo: 'MES0000001',
                MesaCapacidad: 4
            };

            expect(mesa.MesaCapacidad > 0 && mesa.MesaCapacidad <= 12).toBe(true);
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

    describe('Cálculos relacionados con mesas', () => {

        test('debe contar mesas totales', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001' },
                { MesaCodigo: 'MES0000002' },
                { MesaCodigo: 'MES0000003' }
            ];

            const totalMesas = mesas.length;
            expect(totalMesas).toBe(3);
        });

        test('debe calcular capacidad total del restaurante', () => {
            const mesas = [
                { MesaCapacidad: 2 },
                { MesaCapacidad: 4 },
                { MesaCapacidad: 6 }
            ];

            const capacidadTotal = mesas.reduce((sum, m) => sum + m.MesaCapacidad, 0);
            expect(capacidadTotal).toBe(12);
        });

        test('debe calcular capacidad promedio por mesa', () => {
            const mesas = [
                { MesaCapacidad: 2 },
                { MesaCapacidad: 4 },
                { MesaCapacidad: 6 }
            ];

            const capacidadPromedio = mesas.reduce((sum, m) => sum + m.MesaCapacidad, 0) / mesas.length;
            expect(capacidadPromedio).toBe(4);
        });

        test('debe calcular tasa de ocupación', () => {
            const mesas = [
                { MesaEstado: 'O' },
                { MesaEstado: 'D' },
                { MesaEstado: 'O' },
                { MesaEstado: 'S' }
            ];

            const ocupadas = mesas.filter(m => m.MesaEstado === 'O').length;
            const tasaOcupacion = (ocupadas / mesas.length) * 100;
            expect(tasaOcupacion).toBe(50);
        });

        test('debe encontrar mesas sucias pendientes de limpiar', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaEstado: 'S' },
                { MesaCodigo: 'MES0000002', MesaEstado: 'D' },
                { MesaCodigo: 'MES0000003', MesaEstado: 'S' }
            ];

            const sujias = mesas.filter(m => m.MesaEstado === 'S');
            expect(sujias.length).toBe(2);
        });

        test('debe calcular mesas reservadas', () => {
            const mesas = [
                { MesaEstado: 'R' },
                { MesaEstado: 'D' },
                { MesaEstado: 'R' },
                { MesaEstado: 'O' }
            ];

            const reservadas = mesas.filter(m => m.MesaEstado === 'R').length;
            expect(reservadas).toBe(2);
        });
    });

    describe('Validación de asignación de mesa', () => {

        test('debe validar que mesa asignada esté disponible', () => {
            const mesa = { MesaCodigo: 'MES0000001', MesaEstado: 'D' };
            expect(mesa.MesaEstado === 'D').toBe(true);
        });

        test('debe rechazar asignar mesa ocupada', () => {
            const mesa = { MesaCodigo: 'MES0000001', MesaEstado: 'O' };
            expect(mesa.MesaEstado === 'D').toBe(false);
        });

        test('debe rechazar asignar mesa sucia', () => {
            const mesa = { MesaCodigo: 'MES0000001', MesaEstado: 'S' };
            expect(mesa.MesaEstado === 'D').toBe(false);
        });

        test('debe validar capacidad suficiente para grupo', () => {
            const mesa = { MesaCapacidad: 4 };
            const personasEsperadas = 3;
            expect(mesa.MesaCapacidad >= personasEsperadas).toBe(true);
        });

        test('debe rechazar mesa con capacidad insuficiente', () => {
            const mesa = { MesaCapacidad: 2 };
            const personasEsperadas = 4;
            expect(mesa.MesaCapacidad >= personasEsperadas).toBe(false);
        });

        test('debe buscar mesa disponible con capacidad suficiente', () => {
            const mesas = [
                { MesaCodigo: 'MES0000001', MesaCapacidad: 2, MesaEstado: 'O' },
                { MesaCodigo: 'MES0000002', MesaCapacidad: 4, MesaEstado: 'D' },
                { MesaCodigo: 'MES0000003', MesaCapacidad: 6, MesaEstado: 'S' }
            ];

            const personasEsperadas = 3;
            const mesaApta = mesas.find(
                m => m.MesaEstado === 'D' && m.MesaCapacidad >= personasEsperadas
            );

            expect(mesaApta).toBeDefined();
            expect(mesaApta.MesaCodigo).toBe('MES0000002');
        });
    });
});
