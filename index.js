const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// Connect to MongoDB
mongoose.connect(process.env.mongoURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", function () {
  console.log("Connected to MongoDB");
});

// Define message schema
const messageSchema = new mongoose.Schema({
  sender: String,
  text: String,
});
const Message = mongoose.model("Message", messageSchema);

let left = [];
let right = [];
let questions=[
  {
    "id": 1,
    "question": "What is the name of the AI assistant created by Tony Stark?",
    "options": {
      "a": "JARVIS",
      "b": "FRIDAY",
      "c": "EDITH",
      "d": "ULTRON"
    },
    "answer": "a",
    "difficulty": "easy",
    "theme": "avengers"
  },
  {
    "id": 2,
    "question": "Who played the role of Black Widow in the Marvel Cinematic Universe?",
    "options": {
      "a": "Scarlett Johansson",
      "b": "Elizabeth Olsen",
      "c": "Brie Larson",
      "d": "Zoe Saldana"
    },
    "answer": "a",
    "difficulty": "easy",
    "theme": "avengers"
  },
  {
    "id": 3,
    "question": "What is the name of Thor's hammer?",
    "options": {
      "a": "Mjolnir",
      "b": "Stormbreaker",
      "c": "Axe of Anger",
      "d": "Gungnir"
    },
    "answer": "a",
    "difficulty": "easy",
    "theme": "avengers"
  },
  {
    "id": 4,
    "question": "Who is the main villain in the Avengers: Infinity War?",
    "options": {
      "a": "Thanos",
      "b": "Ultron",
      "c": "Loki",
      "d": "Red Skull"
    },
    "answer": "a",
    "difficulty": "medium",
    "theme": "avengers"
  },
  {
    "id": 5,
    "question": "Which Infinity Stone is green in color?",
    "options": {
      "a": "Power Stone",
      "b": "Time Stone",
      "c": "Soul Stone",
      "d": "Mind Stone"
    },
    "answer": "d",
    "difficulty": "medium",
    "theme": "avengers"
  },
  {
    "id": 6,
    "question": "Who is the archenemy of Iron Man?",
    "options": {
      "a": "Whiplash",
      "b": "Mandarin",
      "c": "Ultron",
      "d": "Obadiah Stane"
    },
    "answer": "b",
    "difficulty": "medium",
    "theme": "avengers"
  },
  {
    "id": 7,
    "question": "Who is the father of Quicksilver and Scarlet Witch?",
    "options": {
      "a": "Magneto",
      "b": "Professor X",
      "c": "Captain America",
      "d": "Iron Man"
    },
    "answer": "a",
    "difficulty": "hard",
    "theme": "avengers"
  },
  {
    "id": 8,
    "question": "What is the name of the alien race led by Thanos?",
    "options": {
      "a": "Chitauri",
      "b": "Sakaarans",
      "c": "Kree",
      "d": "Outriders"
    },
    "answer": "a",
    "difficulty": "hard",
    "theme": "avengers"
  },
  {
    "id": 9,
    "question": "Who played the role of Captain America in the Marvel Cinematic Universe?",
    "options": {
      "a": "Chris Hemsworth",
      "b": "Chris Pratt",
      "c": "Chris Evans",
      "d": "Chris Pine"
    },
    "answer": "c",
    "difficulty": "easy",
    "theme": "avengers"
  },
  {
    "id": 10,
    "question": "What is the name of the scientist who turns into the Hulk?",
    "options": {
      "a": "Bruce Wayne",
      "b": "Bruce Banner",
      "c": "Tony Stark",
      "d": "Peter Parker"
    },
    "answer": "b",
    "difficulty": "easy",
    "theme": "avengers"
  },
  {
    "id": 11,
    "question": "Who played the role of Hawkeye in the Marvel Cinematic Universe?",
    "options": {
      "a": "Chris Hemsworth",
      "b": "Jeremy Renner",
      "c": "Mark Ruffalo",
      "d": "Robert Downey Jr."
    },
    "answer": "b",
    "difficulty": "medium",
    "theme": "avengers"
  },
  {
    "id": 12,
    "question": "Who is the love interest of Tony Stark in the Marvel Cinematic Universe?",
    "options": {
      "a": "Black Widow",
      "b": "Pepper Potts",
      "c": "Jane Foster",
      "d": "Gamora"
    },
    "answer": "b",
    "difficulty": "medium",
    "theme": "avengers"
  },
  {
    "id": 13,
    "question": "What is the name of the city that is destroyed in the Avengers: Age of Ultron?",
    "options": {
      "a": "London",
      "b": "New York",
      "c": "Sokovia",
      "d": "Wakanda"
    },
    "answer": "c",
    "difficulty": "hard",
    "theme": "avengers"
  },
  {
    "id": 14,
    "question": "Which actor played the role of Thanos in the Marvel Cinematic Universe?",
    "options": {
      "a": "Josh Brolin",
      "b": "Tom Hiddleston",
      "c": "Michael Keaton",
      "d": "Ben Kingsley"
    },
    "answer": "a",
    "difficulty": "hard",
    "theme": "avengers"
  },
  {
    "id": 15,
    "question": "Who is the first Avenger to die in Avengers: Endgame?",
    "options": {
      "a": "Black Widow",
      "b": "Captain America",
      "c": "Iron Man",
      "d": "Thor"
    },
    "answer": "a",
    "difficulty": "hard",
    "theme": "avengers"
  }
];
// axios
//   .get("https://weak-skillful-snowman.glitch.me/avengers")
//   .then((res) => (questions = res.data));
let index = 0;
let time = 4;


io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("start", (chunnu) => {
    if (chunnu == "true" || index>0) {
      return;
    } else {
      io.emit("nextQuestion", {question:questions[index],index});
      index++;
      let munnu=setInterval(() => {
        if(index==15){
          clearInterval(munnu)
          index=0;
          time=4
          return
        }
        io.emit("nextQuestion", {question:questions[index],index});
        index++;
        time += 0.1;
      }, time * 1000);
    }
  });

  // Send the current player count to the client
  socket.on("name", (obj) => {
    if (obj.pos == "right") {
      right.push({ ...obj, id: socket.id });
    } else {
      left.push({ ...obj, id: socket.id });
    }
    io.emit("updateUsers", { left, right });
  });

  // Listen for incoming messages from clients
  socket.on("chat message", async (message) => {
    // Save the message to the database
    const newMessage = new Message(message);
    await newMessage.save();

    // Broadcast the message to all clients
    io.emit("chat message", message);
  });

  socket.on("disconnect", () => {
    right = right.filter((i) => i.id != socket.id);
    left = left.filter((i) => i.id != socket.id);
    console.log("user disconnected");


    // Send the updated player count to the client
    io.emit("updateUsers", { left, right });
  });
});

server.listen(4000, () => {
  console.log("listening on *:4000");
});
