const express = require("express");
const path = require("path");
const socketio = require("socket.io");
const http = require("http");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const bodyParser = require("body-parser");
const { get } = require("https");

const PORT = process.env.PORT || 5000;

const app = express();

const server = http.createServer(app);

// const io = socketio(server);
const io = socketio(server, {
  path: "/app",
});

io.origins(["http://localhost:3000"]);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,PUT,POST,DELETE,PATCH,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});

// app.all("/app", (req, res) => {
//   res.send({ respone: "Res: I am alive" }).status(200);
// });

const chatBot = "ChatApp";

io.on("connection", (socket) => {
  // console.log("a user connected");

  socket.on("joinRoom", ({ userName, room }) => {
    const user = userJoin(socket.id, userName, room);
    socket.join(user.room);
    //WELKCOME CURRNET USER
    socket.emit("giveMeid", { id: socket.id });
    socket.emit(
      "message",
      formatMessage(null, chatBot, "Welcome to chat app!")
    );

    //BROADCAST WHEN A USER CONNECT
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(null, chatBot, `${user.userName} join the chat`)
      );
    //SEND USERS AND ROOMS INFO
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //LISTEN FOR CHAT MESSAGE
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit(
      "message",
      formatMessage(user.id, user.userName, msg)
    );
  });

  //RUN WHEN CLIENT DISCONNECT
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(null, chatBot, `${user.userName} has left the chat`)
      );
      //SEND USERS AND ROOMS INFO
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
