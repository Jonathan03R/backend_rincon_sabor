// jest.integration.config.js
module.exports = {
    testEnvironment: 'node',
    
    // Solo ejecutar tests de integración
    testMatch: ['**/test/integration/**/*.test.js'],
    
    // Setup y teardown de base de datos
    globalSetup: '<rootDir>/test/integration/setup/setupTestDB.js',
    globalTeardown: '<rootDir>/test/integration/setup/teardownTestDB.js',
    
    // Configuración para tests con SQL Server
    testTimeout: 60000, // 60 segundos
    maxWorkers: 1, // Tests secuenciales
    
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,
    
    // NO usar mocks
    automock: false,
    
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/unit/'],
    
    // Cargar variables de entorno
    setupFilesAfterEnv: ['<rootDir>/test/integration/setup/setupEnv.js']
};
