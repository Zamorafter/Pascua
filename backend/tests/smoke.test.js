const assert = require('node:assert/strict');
const test = require('node:test');

test('auth middleware exports a function', () => {
    const authMiddleware = require('../middleware/auth');
    assert.equal(typeof authMiddleware, 'function');
});

test('route modules export express routers', () => {
    const authRoutes = require('../routes/auth');
    const adminRoutes = require('../routes/admin');
    const scanRoutes = require('../routes/scan');
    const userRoutes = require('../routes/user');

    assert.equal(typeof authRoutes, 'function');
    assert.equal(typeof adminRoutes, 'function');
    assert.equal(typeof scanRoutes, 'function');
    assert.equal(typeof userRoutes, 'function');
});

test('socket module exposes init and getIO helpers', () => {
    const socketModule = require('../socket');

    assert.equal(typeof socketModule.init, 'function');
    assert.equal(typeof socketModule.getIO, 'function');
});
