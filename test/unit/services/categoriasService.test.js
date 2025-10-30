// test/services/categoriasService.test.js

jest.mock('../../../config/connection');

describe('CategoriasService - Tests de funciones', () => {

    let categoriasService;

    beforeEach(() => {
        jest.clearAllMocks();
        categoriasService = {
            crearCategoria: jest.fn(),
            obtenerCategorias: jest.fn(),
            obtenerCategoriaPorCodigo: jest.fn(),
            actualizarCategoria: jest.fn(),
            eliminarCategoria: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función crearCategoria', () => {
            expect(categoriasService.crearCategoria).toBeDefined();
            expect(typeof categoriasService.crearCategoria).toBe('function');
        });

        test('debe exportar la función obtenerCategorias', () => {
            expect(categoriasService.obtenerCategorias).toBeDefined();
            expect(typeof categoriasService.obtenerCategorias).toBe('function');
        });

        test('debe exportar la función obtenerCategoriaPorCodigo', () => {
            expect(categoriasService.obtenerCategoriaPorCodigo).toBeDefined();
            expect(typeof categoriasService.obtenerCategoriaPorCodigo).toBe('function');
        });

        test('debe exportar la función actualizarCategoria', () => {
            expect(categoriasService.actualizarCategoria).toBeDefined();
            expect(typeof categoriasService.actualizarCategoria).toBe('function');
        });

        test('debe exportar la función eliminarCategoria', () => {
            expect(categoriasService.eliminarCategoria).toBeDefined();
            expect(typeof categoriasService.eliminarCategoria).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('crearCategoria debe aceptar objeto de categoría', () => {
            const categoria = {
                CategoriaNombre: 'Bebidas',
                CategoriaDescripcion: 'Bebidas frías y calientes'
            };
            categoriasService.crearCategoria(categoria);

            expect(categoriasService.crearCategoria).toHaveBeenCalledWith(categoria);
        });

        test('obtenerCategorias debe ser una función sin parámetros', () => {
            categoriasService.obtenerCategorias();
            expect(categoriasService.obtenerCategorias).toHaveBeenCalled();
        });

        test('obtenerCategoriaPorCodigo debe aceptar código', () => {
            const codigo = 'CAT0000001';
            categoriasService.obtenerCategoriaPorCodigo(codigo);

            expect(categoriasService.obtenerCategoriaPorCodigo).toHaveBeenCalledWith(codigo);
        });

        test('actualizarCategoria debe aceptar objeto de categoría', () => {
            const categoria = {
                CategoriaCodigo: 'CAT0000001',
                CategoriaNombre: 'Bebidas Actualizadas'
            };
            categoriasService.actualizarCategoria(categoria);

            expect(categoriasService.actualizarCategoria).toHaveBeenCalledWith(categoria);
        });

        test('eliminarCategoria debe aceptar código', () => {
            const codigo = 'CAT0000001';
            categoriasService.eliminarCategoria(codigo);

            expect(categoriasService.eliminarCategoria).toHaveBeenCalledWith(codigo);
        });
    });
});
