require("dotenv").config();
require("./passport-config");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");

const authRoutes = require("./auth");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(bodyParser.json());
var http = require("http");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if you're using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.listen(5000, () => {
  console.log(`Server started on ${process.env.BACKEND_URL || 'http://localhost:5000'}`);
});

const websocketServer = require("websocket").server;
const httpServer = http.createServer();
//httpServer.listen(PORT, () => console.log(`Listening.. on ${PORT}`));
//hashmap clients
const clients = {};
const games = {};

const wsServer = new websocketServer({
  httpServer: httpServer,
});

wsServer.on("request", (request) => {
  //connect
  const connection = request.accept(null, request.origin);
  connection.on("open", () => console.log("opened!"));
  connection.on("close", () => console.log("closed!"));
  connection.on("message", (message) => {
    const result = JSON.parse(message.utf8Data);
    //I have received a message from the client
    //a user want to create a new game
    if (result.method === "create") {
      const clientId = result.clientId;
      const gameId = guid();
      games[gameId] = {
        id: gameId,
        balls: 20,
        clients: [],
      };

      const payLoad = {
        method: "create",
        game: games[gameId],
      };

      const con = clients[clientId].connection;
      con.send(JSON.stringify(payLoad));
    }

    //a client want to join
    if (result.method === "join") {
      const clientId = result.clientId;
      const gameId = result.gameId;
      const game = games[gameId];
      if (game.clients.length >= 3) {
        //sorry max players reach
        return;
      }
      const color = { 0: "Red", 1: "Green", 2: "Blue" }[game.clients.length];
      game.clients.push({
        clientId: clientId,
        color: color,
      });
      //start the game
      if (game.clients.length === 3) updateGameState();

      const payLoad = {
        method: "join",
        game: game,
      };
      //loop through all clients and tell them that people has joined
      game.clients.forEach((c) => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad));
      });
    }
    //a user plays
    if (result.method === "play") {
      const gameId = result.gameId;
      const ballId = result.ballId;
      const color = result.color;
      let state = games[gameId].state;
      if (!state) state = {};

      state[ballId] = color;
      games[gameId].state = state;
    }
  });

  //generate a new clientId
  const clientId = guid();
  clients[clientId] = {
    connection: connection,
  };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  //send back the client connect
  connection.send(JSON.stringify(payLoad));
});

function updateGameState() {
  //{"gameid", fasdfsf}
  for (const g of Object.keys(games)) {
    const game = games[g];
    const payLoad = {
      method: "update",
      game: game,
    };

    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
  }

  setTimeout(updateGameState, 500);
}

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
const guid = () =>
  (
    S4() +
    S4() +
    "-" +
    S4() +
    "-4" +
    S4().substr(0, 3) +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  ).toLowerCase();

app.get("/api/data", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});
