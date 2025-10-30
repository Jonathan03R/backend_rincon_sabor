// test/setup.js

// Mock global de la conexión a BD ANTES de cualquier require
jest.mock('../config/connection', () => ({
    poolPromise: Promise.resolve({
        request: jest.fn().mockReturnThis(),
        input: jest.fn().mockReturnThis(),
        output: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
            recordset: [],
            recordsets: [[]]
        }),
        query: jest.fn().mockResolvedValue({
            recordset: [],
            recordsets: [[]]
        }),
        close: jest.fn().mockResolvedValue()
    })
}));

// Aumentar timeout para tests
jest.setTimeout(10000);

// Suprimir logs en tests
global.console = {
    ...console,
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn()
};
