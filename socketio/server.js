// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("message", (data) => {
    console.log("Received message:", data);
    socket.emit("message", data); // Echo back the received message
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/client.html");
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
