require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const errorHandler = require("./error/Error.Handler");

const app = express();

// socket
const http = require("http");
const socketio = require("socket.io");
const {
  connectedUser,
  choices,
  moves,
  initializedChoice,
  userConnected,
  makeMove,
} = require("./utils/user");
const { rooms, createRoom, joinRoom, exitRoom } = require("./utils/room");
const server = http.createServer(app);

const io = socketio(server);

// router
const userRouter = require("./routes/user.router");
const dashboardRouter = require("./routes/dashboard.router");
const roomRouter = require("./routes/room.router");
const gameRouter = require("./routes/game.router");

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// konfigurasi ejs
app.set("view engine", "ejs");

// router
app.use(userRouter);
app.use(dashboardRouter);
app.use(roomRouter);
app.use(gameRouter);

// socket logic
io.on("connection", (socket) => {
  // create room
  socket.on("create-room", (roomId) => {
    if (rooms[roomId]) {
      const error = "This room is alredy exist";
      socket.emit("display-error", error);
    } else {
      userConnected(socket.client.id);
      createRoom(roomId, socket.client.id);
      socket.emit("room-created", roomId);
      socket.emit("player-1-connected");
      socket.join(roomId);
    }
  });

  // join room
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) {
      const error = "This room is doesn't exist";
      socket.emit("display-error", error);
    } else {
      userConnected(socket.client.id);
      joinRoom(roomId, socket.client.id);
      socket.join(roomId);

      socket.emit("room-joined", roomId);
      socket.emit("player-2-connected");
      socket.broadcast.to(roomId).emit("player-2-connected");
      initializedChoice(roomId);
    }
  });

  // join random room
  socket.on("join-random", () => {
    let roomId = "";

    for (let id in rooms) {
      if (rooms[id][1] === "") {
        roomId = id;
        break;
      }
    }

    if (roomId === "") {
      const error = "All rooms are full or none exists";
      socket.emit("display-error", error);
    } else {
      userConnected(socket.client.id);
      joinRoom(roomId, socket.client.id);
      socket.join(roomId);

      socket.emit("room-joined", roomId);
      socket.emit("player-2-connected");
      socket.broadcast.to(roomId).emit("player-2-connected");
      initializedChoice(roomId);
    }
  });

  // choice
  socket.on("make-move", ({ playerId, myChoice, roomId }) => {
    makeMove(roomId, playerId, myChoice);

    if (choices[roomId][0] !== "" && choices[roomId][1] !== "") {
      let playerOneChoice = choices[roomId][0];
      let playerTwoChoice = choices[roomId][1];

      if (playerOneChoice === playerTwoChoice) {
        let message = `both uof you chose ${playerOneChoice} . so it's draw`;
        io.to(roomId).emit("draw", message);
      } else if (moves[playerOneChoice] === playerTwoChoice) {
        let enemyChoice = "";

        if (playerId === 1) {
          enemyChoice = playerTwoChoice;
        } else {
          enemyChoice = playerOneChoice;
        }

        io.to(roomId).emit("player-1-wins", { myChoice, enemyChoice });
      } else {
        let enemyChoice = "";

        if (playerId === 1) {
          enemyChoice = playerTwoChoice;
        } else {
          enemyChoice = playerOneChoice;
        }

        io.to(roomId).emit("player-2-wins", { myChoice, enemyChoice });
      }

      choices[rooms] = ["", ""];
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    if (connectedUser[socket.client.id]) {
      let player;
      let roomId;

      for (let id in rooms) {
        if (
          rooms[id][0] === socket.client.id ||
          rooms[id][1] === socket.client.id
        ) {
          if (rooms[id][0] === socket.client.id) {
            player = 1;
          } else {
            player = 2;
          }
          roomId = id;
          break;
        }
      }
      exitRoom(roomId, player);

      if (player === 1) {
        io.to(roomId).emit("player-1-disconnected");
      } else {
        io.to(roomId).emit("player-2-disconnected");
      }
    }
  });
});

// error handler
app.use(errorHandler);
// // error handling
// app.use((err, req, res, next) => {
//   console.log(err);
//   const { message, code = 500, error = "internal server error" } = err;

//   return res.status(code).json({
//     message,
//     code,
//     error,
//   });
// });

// listen
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.info(`connect on port http://localhost:${PORT}`);
});
