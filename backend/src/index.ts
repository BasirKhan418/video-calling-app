import express from 'express';
import { createServer } from 'node:http';
import {Server} from 'socket.io';
const app = express();
const server =createServer(app);
const io = new Server(server);

io.on('connection',(socket)=>{
    console.log('A user connected',socket.id);
})


app.get("/",(req,res)=>{
    res.send('Hello World bro');
})
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
})