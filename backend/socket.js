const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
    init: (server) => {
        io = socketIO(server, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        });

        io.on('connection', (socket) => {
            console.log('Nuevo cliente conectado');

            socket.on('authenticate', (payload) => {
                try {
                    const token = typeof payload === 'string' ? payload : payload?.token;
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);

                    if (decoded.isAdmin) {
                        socket.join('admins');
                        console.log(`Administrador ${decoded.email} autenticado en socket`);
                        return;
                    }

                    console.log(`Usuario ${decoded.userId} autenticado en socket`);
                } catch (error) {
                    console.error('Error autenticando socket:', error.message);
                    socket.emit('auth_error', { error: 'Token invalido para socket' });
                }
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
