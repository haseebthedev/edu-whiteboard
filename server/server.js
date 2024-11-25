// Server-side setup using Socket.io

const io = require('socket.io')(httpServer);

// When a tutor or student connects, broadcast their changes
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for changes on the tutor or student whiteboard
    socket.on('whiteboard-update', (data) => {
        // Broadcast the update to all connected users, except the sender
        socket.broadcast.emit('whiteboard-update', data);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});
