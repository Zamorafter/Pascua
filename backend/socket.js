const socketIO = require('socket.io');

let io;

module.exports = {
    init: (server) => {
        io = socketIO(server, {
            cors: {
                origin: '*', // En produccion restringir al dominio del frontend
                methods: ['GET', 'POST']
            }
        });
        io.on('connection', (socket) => {
            console.log('Nuevo cliente conectado');
            socket.on('authenticate', (userId) => {
                socket.userId = userId;
                console.log(`Usuario ${userId} autenticado en socket`);
            });
            socket.on('disconnect', () => {
                console.log('Cliente desconectado');
            });
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.IO no inicializado');
        }
        return io;
    }
};
