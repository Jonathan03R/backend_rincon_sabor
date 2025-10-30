// test/__mocks__/connection.js
const mockPool = {
    request: jest.fn().mockReturnThis(),
    input: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue(true),
    close: jest.fn().mockResolvedValue(true)
};

const poolPromise = Promise.resolve(mockPool);

const sql = {
    NChar: jest.fn(),
    NVarChar: jest.fn(),
    Int: jest.fn(),
    Decimal: jest.fn(),
    MAX: 'MAX',
    Table: jest.fn().mockImplementation(() => ({
        columns: {
            add: jest.fn()
        },
        rows: {
            add: jest.fn()
        }
    })),
    Transaction: jest.fn().mockImplementation(() => ({
        begin: jest.fn().mockResolvedValue(),
        commit: jest.fn().mockResolvedValue(),
        rollback: jest.fn().mockResolvedValue(),
        request: jest.fn().mockReturnValue(mockPool),
        _aborted: false
    }))
};

module.exports = { poolPromise, sql };
