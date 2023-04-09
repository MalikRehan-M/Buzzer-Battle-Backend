const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
require("dotenv").config()

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*"
    }
});


// Connect to MongoDB
mongoose.connect(process.env.mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB');
});

// Define message schema
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String
});
const Message = mongoose.model('Message', messageSchema);

let left = [];
let right = [];

io.on('connection', (socket) => {
  console.log('a user connected');

  // Send the current player count to the client
  socket.on('name', (obj) => {
    if (obj.pos == 'right') {
      right.push({ ...obj, id: socket.id });
    }
    else {
      left.push({ ...obj, id: socket.id });
    }
    io.emit('updateUsers', { left, right });
  });

  // Listen for incoming messages from clients
  socket.on('chat message', async message => {
    // Save the message to the database
    const newMessage = new Message(message);
    await newMessage.save();

    // Broadcast the message to all clients
    io.emit('chat message', message);
  });

  socket.on('disconnect', () => {
    right = right.filter(i => i.id != socket.id);
    left = left.filter(i => i.id != socket.id);
    console.log('user disconnected');

    // Send the updated player count to the client
    io.emit('updateUsers', { left, right });
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
