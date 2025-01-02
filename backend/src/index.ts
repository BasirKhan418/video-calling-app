import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    //joing in a room
    socket.on('join-room', (roomid) => {
        socket.join(roomid);
        console.log('User joined room', roomid);
    })
    //for sending message to clients
    socket.on('send-message', (roomid, message) => {
        io.to(roomid).emit('recieve-message', message);
    })
    //for sending offer to clients
    socket.on('send-offer', (roomid, offer) => {
        console.log('Offer sent',offer);   
        io.to(roomid).emit('recieve-offer', offer);
    })
    //for creating offer
    socket.on('send-answer', (roomid, answer) => {
        console.log('Answer sent', answer);
        io.to(roomid).emit('recieve-answer', answer);
    })
    //send ice candidate to users
    socket.on('send-icecandidate', (roomid, icecandidate) => {
        console.log('Ice candidate sent', icecandidate);
        io.to(roomid).emit('recieve-icecandidate', icecandidate);
    })
    //send ice candidate to admin
    socket.on('send-icecandidate-admin', (roomid, icecandidate) => {
        console.log('Ice candidate sent to admin', icecandidate);
        io.to(roomid).emit('recieve-icecandidate-admin', icecandidate);
    })
    //disconnecting from the server
    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
    })
})


app.get("/", (req, res) => {
    res.send('Hello World bro');
})
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})