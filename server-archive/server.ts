import { Server } from 'socket.io';
import http from 'http';
import { throttle } from 'tldraw';

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*", // Replace with your whiteboard app's domain
        methods: ["GET", "POST"],
    },
});

// Store for managing rooms and their respective data
const rooms: Record<string, Record<string, any>> = {};

// Throttled function to persist room data
const persistRoom = throttle((roomId: string) => {
    console.log(`Persisting data for room ${roomId}:`, rooms[roomId]);
    // Add logic to save the specific room's data to a database
}, 1000);

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    let currentRoom: string | null = null;

    // Join a specific room
    socket.on('join-room', (roomId: string) => {
        currentRoom = roomId;
        socket.join(roomId);

        // Initialize room if not already present
        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }

        // Send the current state of the room to the client
        socket.emit('init', { snapshot: rooms[roomId] });
        console.log(`Client ${socket.id} joined room ${roomId}`);
    });

    // Handle updates from clients
    socket.on('update', (message) => {
        if (!currentRoom) {
            console.error(`Client ${socket.id} tried to update without joining a room.`);
            return;
        }

        try {
            const { updates } = message;
            const roomRecords = rooms[currentRoom];

            updates.forEach((update: any) => {
                const { changes } = update;
                changes.added?.forEach((record: any) => (roomRecords[record.id] = record));
                changes.updated?.forEach(([, to]: [any, any]) => (roomRecords[to.id] = to));
                changes.removed?.forEach((record: any) => delete roomRecords[record.id]);
            });

            // Broadcast the changes to other clients in the same room
            socket.to(currentRoom).emit('update', message);

            // Persist the changes
            persistRoom(currentRoom);
        } catch (err) {
            console.error('Error processing updates:', err);
            socket.emit('recovery', { snapshot: rooms[currentRoom] });
        }
    });

    // Handle recovery requests
    socket.on('recovery', () => {
        if (currentRoom) {
            socket.emit('recovery', { snapshot: rooms[currentRoom] });
        }
    });

    socket.on('disconnect', () => {
        console.log(`Client ${socket.id} disconnected from room ${currentRoom}`);
        currentRoom = null;
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
