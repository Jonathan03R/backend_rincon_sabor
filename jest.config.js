// jest.config.js

module.exports = {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'controllers/**/*.js',
        'services/**/*.js',
        'middlewares/**/*.js',
        'utils/**/*.js',
        '!**/node_modules/**',
        '!**/config/**',
        '!**/sockets/**'
    ],
    testMatch: ['**/test/**/*.test.js'],
    verbose: true,
    forceExit: true,
    detectOpenHandles: false,
    testTimeout: 10000,
    
    // Mock automático de la conexión a BD
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    
    // Ignorar warnings de tedious
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    
    // Configuración para manejar async
    bail: false,
    maxWorkers: '50%'
};
