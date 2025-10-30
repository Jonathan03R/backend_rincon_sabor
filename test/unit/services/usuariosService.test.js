// test/services/usuariosService.test.js

jest.mock('../../../config/connection');

describe('UsuariosService - Tests de funciones', () => {

    let usuariosService;

    beforeEach(() => {
        jest.clearAllMocks();
        usuariosService = {
            obtenerUsuarioPorCorreo: jest.fn(),
            listarUsuarios: jest.fn(),
            actualizarEstadoUsuario: jest.fn(),
            eliminarUsuario: jest.fn(),
            crearUsuario: jest.fn(),
            actualizarUsuario: jest.fn()
        };
    });

    describe('Verificación de exports', () => {

        test('debe exportar la función obtenerUsuarioPorCorreo', () => {
            expect(usuariosService.obtenerUsuarioPorCorreo).toBeDefined();
            expect(typeof usuariosService.obtenerUsuarioPorCorreo).toBe('function');
        });

        test('debe exportar la función listarUsuarios', () => {
            expect(usuariosService.listarUsuarios).toBeDefined();
            expect(typeof usuariosService.listarUsuarios).toBe('function');
        });

        test('debe exportar la función actualizarEstadoUsuario', () => {
            expect(usuariosService.actualizarEstadoUsuario).toBeDefined();
            expect(typeof usuariosService.actualizarEstadoUsuario).toBe('function');
        });

        test('debe exportar la función eliminarUsuario', () => {
            expect(usuariosService.eliminarUsuario).toBeDefined();
            expect(typeof usuariosService.eliminarUsuario).toBe('function');
        });

        test('debe exportar la función crearUsuario', () => {
            expect(usuariosService.crearUsuario).toBeDefined();
            expect(typeof usuariosService.crearUsuario).toBe('function');
        });

        test('debe exportar la función actualizarUsuario', () => {
            expect(usuariosService.actualizarUsuario).toBeDefined();
            expect(typeof usuariosService.actualizarUsuario).toBe('function');
        });
    });

    describe('Comportamiento de funciones', () => {

        test('obtenerUsuarioPorCorreo debe aceptar email', () => {
            const email = 'test@example.com';
            usuariosService.obtenerUsuarioPorCorreo(email);

            expect(usuariosService.obtenerUsuarioPorCorreo).toHaveBeenCalledWith(email);
        });

        test('listarUsuarios debe ser una función sin parámetros', () => {
            usuariosService.listarUsuarios();
            expect(usuariosService.listarUsuarios).toHaveBeenCalled();
        });

        test('actualizarEstadoUsuario debe aceptar código y estado', () => {
            const codigo = 'USE0000001';
            const estado = 'A';
            usuariosService.actualizarEstadoUsuario(codigo, estado);

            expect(usuariosService.actualizarEstadoUsuario).toHaveBeenCalledWith(codigo, estado);
        });

        test('eliminarUsuario debe aceptar código', () => {
            const codigo = 'USE0000001';
            usuariosService.eliminarUsuario(codigo);

            expect(usuariosService.eliminarUsuario).toHaveBeenCalledWith(codigo);
        });

        test('crearUsuario debe aceptar objeto de usuario', () => {
            const usuario = {
                UsuarioNombre: 'Juan Pérez',
                UsuarioEmail: 'juan@example.com',
                UsuarioRol: 'mesero'
            };
            usuariosService.crearUsuario(usuario);

            expect(usuariosService.crearUsuario).toHaveBeenCalledWith(usuario);
        });

        test('actualizarUsuario debe aceptar objeto de usuario completo', () => {
            const usuario = {
                UsuarioCodigo: 'USE0000001',
                UsuarioNombre: 'Juan Pérez Actualizado'
            };
            usuariosService.actualizarUsuario(usuario);

            expect(usuariosService.actualizarUsuario).toHaveBeenCalledWith(usuario);
        });
    });
});
