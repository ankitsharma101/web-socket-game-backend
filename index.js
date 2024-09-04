require("dotenv").config();
require("./passport-config"); // Ensure your passport configuration is correct
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const http = require("http");
const websocketServer = require("websocket").server;
const authRoutes = require("./auth");

const app = express();
const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000"; // Local fallback

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware - Place it before routes
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use true for HTTPS in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Add this middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Routes
app.use("/auth", authRoutes);  // Auth routes after middleware

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/api/data", (req, res) => {
  res.json({ message: "Hello from the backend!" });
});

// Create an HTTP server and WebSocket server
const server = http.createServer(app); // Integrating with the Express app

const wsServer = new websocketServer({
  httpServer: server,
});

const clients = {};
const games = {};

// WebSocket Logic
wsServer.on("request", (request) => {
  const connection = request.accept(null, request.origin);
  
  // Log connection opened and closed
  connection.on("open", () => console.log("WebSocket connection opened!"));
  connection.on("close", () => console.log("WebSocket connection closed!"));

  connection.on("message", (message) => {
    try {
      const result = JSON.parse(message.utf8Data);
      handleWebSocketMessage(result, connection);
    } catch (error) {
      console.error("Invalid WebSocket message received:", error);
    }
  });

  // Assign a client ID
  const clientId = guid();
  clients[clientId] = { connection: connection };

  const payLoad = {
    method: "connect",
    clientId: clientId,
  };
  connection.send(JSON.stringify(payLoad));
});

// WebSocket message handling function
function handleWebSocketMessage(result, connection) {
  // Create a new game
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

  // Join an existing game
  if (result.method === "join") {
    const clientId = result.clientId;
    const gameId = result.gameId;
    const game = games[gameId];
    if (game.clients.length >= 3) {
      return; // Maximum players reached
    }
    const color = { 0: "Red", 1: "Green", 2: "Blue" }[game.clients.length];
    game.clients.push({
      clientId: clientId,
      color: color,
    });

    if (game.clients.length === 3) updateGameState();

    const payLoad = {
      method: "join",
      game: game,
    };
    game.clients.forEach((c) => {
      clients[c.clientId].connection.send(JSON.stringify(payLoad));
    });
  }

  // Play a move
  if (result.method === "play") {
    const gameId = result.gameId;
    const ballId = result.ballId;
    const color = result.color;
    let state = games[gameId].state;
    if (!state) state = {};

    state[ballId] = color;
    games[gameId].state = state;
  }
}

// Update the game state at regular intervals
function updateGameState() {
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

// Helper functions for generating unique IDs
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

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

// Start server
server.listen(PORT, () => {
  console.log(`Server started on ${BACKEND_URL}`);
});
