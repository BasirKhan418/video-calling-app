"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = (0, node_http_1.createServer)(app);
const io = new socket_io_1.Server(server);
io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
});
app.get("/", (req, res) => {
    res.send('Hello World bro');
});
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
