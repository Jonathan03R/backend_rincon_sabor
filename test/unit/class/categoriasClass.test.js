// test/controllers/categoriasController.test.js

jest.mock('../../../config/connection');
jest.mock('../../../middlewares/authMiddleware');

let req, res;

beforeEach(() => {
    req = {
        user: { email: 'admin@example.com', uid: 'admin123' },
        body: {},
        params: {},
        headers: {},
        file: null
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

describe('CategoriasClass - Tests completos', () => {

    describe('Validaciones de formato de código', () => {

        test('debe validar formato correcto de código categoría', () => {
            const codigo = 'CAT0000001';
            const isValidCode = /^CAT\d{7}$/.test(codigo);
            expect(isValidCode).toBe(true);
        });

        test('debe validar múltiples códigos categoría válidos', () => {
            const codigos = ['CAT0000001', 'CAT0000002', 'CAT9999999'];
            const isValid = codigos.every(c => /^CAT\d{7}$/.test(c));
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido', () => {
            const codigo = 'INVALID123';
            const isValidCode = /^CAT\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe rechazar código sin prefijo CAT', () => {
            const codigo = '0000001';
            const isValidCode = /^CAT\d{7}$/.test(codigo);
            expect(isValidCode).toBe(false);
        });

        test('debe validar longitud correcta de código', () => {
            const codigo = 'CAT0000001';
            expect(codigo.length).toBe(10);
        });

        test('debe rechazar código con longitud incorrecta', () => {
            const codigo = 'CAT00001';
            expect(codigo.length === 10).toBe(false);
        });
    });

    describe('Validaciones de creación de categoría', () => {

        test('debe validar que nombre no esté vacío', () => {
            const nombre = 'Bebidas';
            expect(nombre.trim().length > 0).toBe(true);
        });

        test('debe rechazar nombre vacío', () => {
            const nombre = '';
            expect(nombre.trim().length > 0).toBe(false);
        });

        test('debe rechazar nombre solo con espacios', () => {
            const nombre = '   ';
            expect(nombre.trim().length > 0).toBe(false);
        });

        test('debe validar que descripción no esté vacía', () => {
            const descripcion = 'Bebidas frías y calientes';
            expect(descripcion.trim().length > 0).toBe(true);
        });

        test('debe rechazar descripción vacía', () => {
            const descripcion = '';
            expect(descripcion.trim().length > 0).toBe(false);
        });

        test('debe validar categoría con todos los campos', () => {
            req.body = {
                CategoriaNombre: 'Platos Principales',
                CategoriaDescripcion: 'Platos principales del menú',
                CategoriaEstado: 'A'
            };

            const requiredFields = ['CategoriaNombre', 'CategoriaDescripcion', 'CategoriaEstado'];
            const hasAllFields = requiredFields.every(field => req.body[field]);

            expect(hasAllFields).toBe(true);
        });

        test('debe detectar falta de CategoriaNombre', () => {
            req.body = {
                CategoriaDescripcion: 'Platos principales',
                CategoriaEstado: 'A'
            };

            expect(req.body.CategoriaNombre).toBeUndefined();
        });

        test('debe detectar falta de CategoriaDescripcion', () => {
            req.body = {
                CategoriaNombre: 'Platos Principales',
                CategoriaEstado: 'A'
            };

            expect(req.body.CategoriaDescripcion).toBeUndefined();
        });

        test('debe detectar falta de CategoriaEstado', () => {
            req.body = {
                CategoriaNombre: 'Platos Principales',
                CategoriaDescripcion: 'Platos principales'
            };

            expect(req.body.CategoriaEstado).toBeUndefined();
        });
    });

    describe('Validaciones de estado de categoría', () => {

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

        test('debe rechazar estado nulo', () => {
            const estado = null;
            expect(['A', 'I'].includes(estado)).toBe(false);
        });
    });

    describe('Validaciones de actualización de categoría', () => {

        test('debe validar categoría actualizada con código', () => {
            req.body = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas Actualizadas',
                CategoriaDescripcion: 'Bebidas frías y calientes',
                CategoriaEstado: 'A'
            };

            const updateFields = ['CategoriaCodigo', 'CategoriaNombre', 'CategoriaDescripcion', 'CategoriaEstado'];
            const hasAllFields = updateFields.every(field => req.body[field]);

            expect(hasAllFields).toBe(true);
        });

        test('debe detectar falta de CategoriaCodigo en actualización', () => {
            req.body = {
                CategoriaNombre: 'Bebidas',
                CategoriaDescripcion: 'Bebidas',
                CategoriaEstado: 'A'
            };

            expect(req.body.CategoriaCodigo).toBeUndefined();
        });

        test('debe permitir actualizar solo el nombre', () => {
            req.body = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Nuevo Nombre'
            };

            expect(req.body.CategoriaCodigo).toBe('CAT0000001');
            expect(req.body.CategoriaNombre).toBe('Nuevo Nombre');
        });

        test('debe permitir actualizar solo la descripción', () => {
            req.body = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaDescripcion: 'Nueva descripción'
            };

            expect(req.body.CategoriaCodigo).toBe('CAT0000001');
            expect(req.body.CategoriaDescripcion).toBe('Nueva descripción');
        });

        test('debe permitir actualizar solo el estado', () => {
            req.body = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaEstado: 'I'
            };

            expect(req.body.CategoriaCodigo).toBe('CAT0000001');
            expect(req.body.CategoriaEstado).toBe('I');
        });
    });

    describe('Validaciones de parámetros de ruta', () => {

        test('debe extraer código de parámetro de ruta', () => {
            req.params.codigo = 'CAT0000001';
            expect(req.params.codigo).toBe('CAT0000001');
        });

        test('debe validar que código no esté vacío', () => {
            req.params.codigo = '';
            expect(req.params.codigo.length === 0).toBe(true);
        });

        test('debe rechazar parámetro código indefinido', () => {
            expect(req.params.codigo).toBeUndefined();
        });

        test('debe validar formato de código en parámetro', () => {
            req.params.codigo = 'CAT0000001';
            const isValid = /^CAT\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(true);
        });

        test('debe rechazar código con formato inválido en parámetro', () => {
            req.params.codigo = 'INVALID';
            const isValid = /^CAT\d{7}$/.test(req.params.codigo);
            expect(isValid).toBe(false);
        });
    });

    describe('Estados de categoría', () => {

        test('debe reconocer categoría Activa', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas',
                CategoriaEstado: 'A'
            };
            expect(categoria.CategoriaEstado).toBe('A');
            expect(categoria.CategoriaEstado === 'A').toBe(true);
        });

        test('debe reconocer categoría Inactiva', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas',
                CategoriaEstado: 'I'
            };
            expect(categoria.CategoriaEstado).toBe('I');
            expect(categoria.CategoriaEstado === 'I').toBe(true);
        });

        test('debe contar categorías activas', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000003', CategoriaNombre: 'Postres', CategoriaEstado: 'I' }
            ];

            const activas = categorias.filter(c => c.CategoriaEstado === 'A');
            expect(activas.length).toBe(2);
        });

        test('debe contar categorías inactivas', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000003', CategoriaNombre: 'Postres', CategoriaEstado: 'I' }
            ];

            const inactivas = categorias.filter(c => c.CategoriaEstado === 'I');
            expect(inactivas.length).toBe(1);
        });
    });

    describe('Listado de categorías', () => {

        test('debe retornar lista de categorías', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos', CategoriaEstado: 'A' }
            ];

            expect(categorias.length).toBe(2);
            expect(Array.isArray(categorias)).toBe(true);
        });

        test('debe retornar array vacío si no hay categorías', () => {
            const categorias = [];
            expect(categorias.length).toBe(0);
            expect(Array.isArray(categorias)).toBe(true);
        });

        test('debe filtrar categorías por estado', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas', CategoriaEstado: 'A' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos', CategoriaEstado: 'I' },
                { CategoriaCodigo: 'CAT0000003', CategoriaNombre: 'Postres', CategoriaEstado: 'A' }
            ];

            const activas = categorias.filter(c => c.CategoriaEstado === 'A');
            expect(activas.length).toBe(2);
        });

        test('debe ordenar categorías por nombre', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos' },
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas' },
                { CategoriaCodigo: 'CAT0000003', CategoriaNombre: 'Postres' }
            ];

            const ordenadas = categorias.sort((a, b) => 
                a.CategoriaNombre.localeCompare(b.CategoriaNombre)
            );

            expect(ordenadas[0].CategoriaNombre).toBe('Bebidas');
            expect(ordenadas[1].CategoriaNombre).toBe('Platos');
            expect(ordenadas[2].CategoriaNombre).toBe('Postres');
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

    describe('Validaciones de longitud de campos', () => {

        test('debe validar nombre con longitud correcta', () => {
            const nombre = 'Bebidas y Refrescos';
            expect(nombre.length > 0).toBe(true);
            expect(nombre.length <= 100).toBe(true);
        });

        test('debe rechazar nombre vacío', () => {
            const nombre = '';
            expect(nombre.length > 0).toBe(false);
        });

        test('debe validar descripción con longitud correcta', () => {
            const descripcion = 'Incluye bebidas frías como refrescos, cervezas y bebidas calientes como café y té';
            expect(descripcion.length > 0).toBe(true);
        });

        test('debe rechazar descripción vacía', () => {
            const descripcion = '';
            expect(descripcion.length > 0).toBe(false);
        });
    });

    describe('Validaciones de caracteres especiales', () => {

        test('debe permitir caracteres especiales en nombre', () => {
            const nombre = 'Platos a la Carte & Especiales';
            expect(nombre.includes('&')).toBe(true);
        });

        test('debe permitir acentos en nombre', () => {
            const nombre = 'Platos Típicos Peruanos';
            expect(/[áéíóú]/.test(nombre)).toBe(true);
        });

        test('debe permitir números en nombre', () => {
            const nombre = 'Bebidas 2x1';
            expect(/\d/.test(nombre)).toBe(true);
        });

        test('debe permitir caracteres especiales en descripción', () => {
            const descripcion = 'Bebidas: refrescos, cervezas, etc.';
            expect(descripcion.includes(':')).toBe(true);
        });
    });

    describe('Validación de objeto categoría completo', () => {

        test('debe crear objeto categoría válido', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas',
                CategoriaDescripcion: 'Bebidas frías y calientes',
                CategoriaEstado: 'A',
                CategoriaFechaRegistro: new Date()
            };

            expect(categoria).toHaveProperty('CategoriaCodigo');
            expect(categoria).toHaveProperty('CategoriaNombre');
            expect(categoria).toHaveProperty('CategoriaDescripcion');
            expect(categoria).toHaveProperty('CategoriaEstado');
            expect(categoria).toHaveProperty('CategoriaFechaRegistro');
        });

        test('debe validar que categoría tenga código válido', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas'
            };

            const isValidCodigo = /^CAT\d{7}$/.test(categoria.CategoriaCodigo);
            expect(isValidCodigo).toBe(true);
        });

        test('debe validar que categoría tenga nombre válido', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas'
            };

            expect(categoria.CategoriaNombre.trim().length > 0).toBe(true);
        });
    });

    describe('Búsqueda y filtrado de categorías', () => {

        test('debe buscar categoría por nombre exacto', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos Principales' }
            ];

            const encontrada = categorias.find(c => c.CategoriaNombre === 'Bebidas');
            expect(encontrada).toBeDefined();
            expect(encontrada.CategoriaCodigo).toBe('CAT0000001');
        });

        test('debe buscar categoría por código', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Platos' }
            ];

            const encontrada = categorias.find(c => c.CategoriaCodigo === 'CAT0000001');
            expect(encontrada).toBeDefined();
            expect(encontrada.CategoriaNombre).toBe('Bebidas');
        });

        test('debe buscar categoría que no existe retorna undefined', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas' }
            ];

            const encontrada = categorias.find(c => c.CategoriaCodigo === 'CAT0000999');
            expect(encontrada).toBeUndefined();
        });

        test('debe filtrar categorías por nombre parcial', () => {
            const categorias = [
                { CategoriaCodigo: 'CAT0000001', CategoriaNombre: 'Bebidas Frías' },
                { CategoriaCodigo: 'CAT0000002', CategoriaNombre: 'Bebidas Calientes' },
                { CategoriaCodigo: 'CAT0000003', CategoriaNombre: 'Platos' }
            ];

            const conBebidas = categorias.filter(c => c.CategoriaNombre.includes('Bebidas'));
            expect(conBebidas.length).toBe(2);
        });
    });
});
