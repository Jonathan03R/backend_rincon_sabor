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
    // Solo tests unitarios
    testMatch: ['**/test/unit/**/*.test.js'],
    
    verbose: true,
    forceExit: true,
    detectOpenHandles: false,
    testTimeout: 10000,
    
    // Mock automático de la conexión a BD
    setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
    
    // CORRECCIÓN: Sin asteriscos en testPathIgnorePatterns
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/integration/'],
    
    bail: false,
    maxWorkers: '50%'
};
