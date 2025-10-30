// test/__mocks__/firebaseConfig.js
const mockAuth = {
    verifyIdToken: jest.fn()
};

const admin = {
    auth: () => mockAuth
};

module.exports = admin;
