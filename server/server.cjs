"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = require("socket.io");
var http_1 = __importDefault(require("http"));
var tldraw_1 = require("tldraw");
var server = http_1.default.createServer();
var io = new socket_io_1.Server(server, {
    cors: {
        origin: "*", // Replace with your whiteboard app's domain
        methods: ["GET", "POST"],
    },
});
// Store for managing rooms and their respective data
var rooms = {};
// Throttled function to persist room data
var persistRoom = (0, tldraw_1.throttle)(function (roomId) {
    console.log("Persisting data for room ".concat(roomId, ":"), rooms[roomId]);
    // Add logic to save the specific room's data to a database
}, 1000);
io.on('connection', function (socket) {
    console.log('A client connected:', socket.id);
    var currentRoom = null;
    // Join a specific room
    socket.on('join-room', function (roomId) {
        currentRoom = roomId;
        socket.join(roomId);
        // Initialize room if not already present
        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }
        // Send the current state of the room to the client
        socket.emit('init', { snapshot: rooms[roomId] });
        console.log("Client ".concat(socket.id, " joined room ").concat(roomId));
    });
    // Handle updates from clients
    socket.on('update', function (message) {
        if (!currentRoom) {
            console.error("Client ".concat(socket.id, " tried to update without joining a room."));
            return;
        }
        try {
            var updates = message.updates;
            var roomRecords_1 = rooms[currentRoom];
            updates.forEach(function (update) {
                var _a, _b, _c;
                var changes = update.changes;
                (_a = changes.added) === null || _a === void 0 ? void 0 : _a.forEach(function (record) { return (roomRecords_1[record.id] = record); });
                (_b = changes.updated) === null || _b === void 0 ? void 0 : _b.forEach(function (_a) {
                    var to = _a[1];
                    return (roomRecords_1[to.id] = to);
                });
                (_c = changes.removed) === null || _c === void 0 ? void 0 : _c.forEach(function (record) { return delete roomRecords_1[record.id]; });
            });
            // Broadcast the changes to other clients in the same room
            socket.to(currentRoom).emit('update', message);
            // Persist the changes
            persistRoom(currentRoom);
        }
        catch (err) {
            console.error('Error processing updates:', err);
            socket.emit('recovery', { snapshot: rooms[currentRoom] });
        }
    });
    // Handle recovery requests
    socket.on('recovery', function () {
        if (currentRoom) {
            socket.emit('recovery', { snapshot: rooms[currentRoom] });
        }
    });
    socket.on('disconnect', function () {
        console.log("Client ".concat(socket.id, " disconnected from room ").concat(currentRoom));
        currentRoom = null;
    });
});
server.listen(3000, function () {
    console.log('Server is running on port 3000');
});
