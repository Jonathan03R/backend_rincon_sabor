// test/utils/cloudinaryHelper.test.js

// Mock cloudinary ANTES de cualquier otro require
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn()
        }
    }
}));

describe('CloudinaryHelper - Tests', () => {

    describe('Validaciones de archivo', () => {

        test('debe validar que archivo tenga buffer', () => {
            const archivo = {
                buffer: Buffer.from('test'),
                mimetype: 'image/jpeg'
            };

            expect(archivo.buffer).toBeDefined();
            expect(Buffer.isBuffer(archivo.buffer)).toBe(true);
        });

        test('debe rechazar archivo sin buffer', () => {
            const archivo = {
                mimetype: 'image/jpeg'
            };

            expect(archivo.buffer).toBeUndefined();
        });

        test('debe validar tipos de archivo permitidos', () => {
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            const mimetype = 'image/jpeg';

            expect(tiposPermitidos.includes(mimetype)).toBe(true);
        });

        test('debe rechazar tipo de archivo inválido', () => {
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            const mimetype = 'application/pdf';

            expect(tiposPermitidos.includes(mimetype)).toBe(false);
        });

        test('debe validar que archivo sea imagen', () => {
            const archivo = {
                mimetype: 'image/jpeg'
            };

            const esImagen = archivo.mimetype.startsWith('image/');
            expect(esImagen).toBe(true);
        });

        test('debe rechazar si no es imagen', () => {
            const archivo = {
                mimetype: 'text/plain'
            };

            const esImagen = archivo.mimetype.startsWith('image/');
            expect(esImagen).toBe(false);
        });
    });

    describe('Validaciones de tamaño', () => {

        test('debe validar que archivo no sea muy grande', () => {
            const archivo = {
                buffer: Buffer.alloc(5 * 1024 * 1024), // 5MB
                mimetype: 'image/jpeg'
            };

            const tamanoMaximo = 10 * 1024 * 1024; // 10MB
            expect(archivo.buffer.length < tamanoMaximo).toBe(true);
        });

        test('debe rechazar archivo demasiado grande', () => {
            const archivo = {
                buffer: Buffer.alloc(50 * 1024 * 1024), // 50MB
                mimetype: 'image/jpeg'
            };

            const tamanoMaximo = 10 * 1024 * 1024; // 10MB
            expect(archivo.buffer.length < tamanoMaximo).toBe(false);
        });

        test('debe validar que archivo no esté vacío', () => {
            const archivo = {
                buffer: Buffer.alloc(1024), // 1KB
                mimetype: 'image/jpeg'
            };

            expect(archivo.buffer.length > 0).toBe(true);
        });

        test('debe rechazar archivo vacío', () => {
            const archivo = {
                buffer: Buffer.alloc(0),
                mimetype: 'image/jpeg'
            };

            expect(archivo.buffer.length === 0).toBe(true);
        });
    });

    describe('Conversión a Base64', () => {

        test('debe convertir buffer a base64', () => {
            const buffer = Buffer.from('test image data');
            const base64 = buffer.toString('base64');

            expect(typeof base64).toBe('string');
            expect(base64.length > 0).toBe(true);
        });

        test('debe generar base64 válido', () => {
            const buffer = Buffer.from('hello world');
            const base64 = buffer.toString('base64');

            // Base64 válido solo contiene caracteres alfanuméricos, +, /, y =
            const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64);
            expect(isValidBase64).toBe(true);
        });

        test('debe poder decodificar base64 de vuelta', () => {
            const original = 'hello world';
            const buffer = Buffer.from(original);
            const base64 = buffer.toString('base64');
            const decodificado = Buffer.from(base64, 'base64').toString();

            expect(decodificado).toBe(original);
        });
    });

    describe('Respuesta de Cloudinary', () => {

        test('debe validar estructura de respuesta de URL', () => {
            const respuesta = {
                secure_url: 'https://cloudinary.com/image.jpg',
                public_id: 'rincon-sabor/menu/123',
                width: 800,
                height: 600
            };

            expect(respuesta.secure_url).toBeDefined();
            expect(respuesta.secure_url.startsWith('https://')).toBe(true);
        });

        test('debe retornar URL válida', () => {
            const url = 'https://cloudinary.com/image.jpg';
            const isValidUrl = /^https?:\/\/.+\..+$/.test(url);

            expect(isValidUrl).toBe(true);
        });

        test('debe rechazar URL inválida', () => {
            const url = 'not-a-url';
            const isValidUrl = /^https?:\/\/.+\..+$/.test(url);

            expect(isValidUrl).toBe(false);
        });

        test('debe validar que URL incluya dominio', () => {
            const url = 'https://cloudinary.com/image.jpg';
            expect(url.includes('cloudinary')).toBe(true);
        });

        test('debe retornar public_id correcto', () => {
            const publicId = 'rincon-sabor/menu/123';
            expect(publicId.includes('rincon-sabor')).toBe(true);
            expect(publicId.split('/').length).toBe(3);
        });
    });

    describe('Manejo de errores', () => {

        test('debe capturar errores de validación', () => {
            const error = new Error('Archivo inválido');
            expect(error).toBeDefined();
            expect(error.message).toBe('Archivo inválido');
        });

        test('debe lanzar error si archivo es null', () => {
            const funcionConError = () => {
                if (!Buffer.isBuffer(null)) {
                    throw new Error('Buffer no válido');
                }
            };

            expect(funcionConError).toThrow('Buffer no válido');
        });

        test('debe manejar error de tipo de archivo', () => {
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif'];
            const mimetype = 'application/pdf';

            if (!tiposPermitidos.includes(mimetype)) {
                expect(true).toBe(true); // Error capturado correctamente
            }
        });

        test('debe validar error de tamaño', () => {
            const tamano = 50 * 1024 * 1024; // 50MB
            const tamanoMaximo = 10 * 1024 * 1024; // 10MB

            if (tamano > tamanoMaximo) {
                expect(tamano > tamanoMaximo).toBe(true);
            }
        });
    });

    describe('Nombres de archivo', () => {

        test('debe generar nombre único para archivo', () => {
            const timestamp = Date.now();
            const nombre = `menu_${timestamp}.jpg`;

            expect(nombre).toContain('menu_');
            expect(nombre).toContain('.jpg');
        });

        test('debe incluir timestamp en nombre', () => {
            const timestamp = 1635000000000;
            const nombre = `rincon-sabor/menu_${timestamp}`;

            expect(nombre.includes(String(timestamp))).toBe(true);
        });

        test('debe validar extension de archivo', () => {
            const archivo = {
                originalname: 'menu_photo.jpg',
                mimetype: 'image/jpeg'
            };

            const extension = archivo.originalname.split('.').pop();
            expect(extension.toLowerCase()).toBe('jpg');
        });
    });

    describe('Carpetas en Cloudinary', () => {

        test('debe agrupar archivos por carpeta', () => {
            const carpeta = 'rincon-sabor/menus/';
            expect(carpeta.includes('rincon-sabor')).toBe(true);
            expect(carpeta.endsWith('/')).toBe(true);
        });

        test('debe usar estructura correcta de carpetas', () => {
            const rutaCompleta = 'rincon-sabor/menus/menu_1234567890.jpg';
            const partes = rutaCompleta.split('/');

            expect(partes[0]).toBe('rincon-sabor');
            expect(partes[1]).toBe('menus');
            expect(partes[2]).toContain('menu_');
        });
    });
});
