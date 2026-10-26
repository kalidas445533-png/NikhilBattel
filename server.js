
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const players = new Map();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).slice(2, 10);

  players.set(id, { id, x: 100, y: 100, health: 100 });

  ws.send(JSON.stringify({
    type: "welcome",
    id,
    players: Array.from(players.values())
  }));

  function broadcast() {
    const message = JSON.stringify({
      type: "players",
      players: Array.from(players.values())
    });

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcast();

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const player = players.get(id);
      if (!player) return;

      if (Number.isFinite(data.x) && Number.isFinite(data.y)) {
        player.x = Math.max(0, Math.min(5000, data.x));
        player.y = Math.max(0, Math.min(5000, data.y));
      }

      broadcast();
    } catch (_) {}
  });

  ws.on("close", () => {
    players.delete(id);
    broadcast();
  });
});

const port = process.env.PORT || 3000;
server.listen(port, "0.0.0.0", () => {
  console.log("Nikhil Battle server running on port " + port);
});
