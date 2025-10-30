// test/services/prediccionesService.test.js

const prediccionesService = require('../../../services/prediccionesService');

describe('Pruebas del servicio prediccionesService', () => {

    test('debe exportar la función obtenerHistorialVentas', () => {
        expect(prediccionesService.obtenerHistorialVentas).toBeDefined();
        expect(typeof prediccionesService.obtenerHistorialVentas).toBe('function');
    });

    test('debe ser una función que retorna una promesa', () => {
        // Las funciones async siempre retornan promesas
        const result = prediccionesService.obtenerHistorialVentas();
        expect(result).toBeInstanceOf(Promise);
    });
});
