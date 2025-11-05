// index.js
// Minimal Express + Socket.IO server (Node 18+)

const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 同一オリジン前提（Cloud Shell/Renderの静的配信と同じホスト）
// 別オリジンになる場合は、corsオプションに origin を追加
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});

// 静的ファイル（public/）
app.use(express.static(path.join(__dirname, 'public')));

// インデックス（簡易リンク）
app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>Sensor Game Server</h1>
    <ul>
      <li><a href="/game-balloon.html">game-balloon.html (PC画面)</a></li>
      <li><a href="/smart.html">smart.html (スマホ用コントローラ)</a></li>
    </ul>
    <p>Health: <a href="/healthz">/healthz</a></p>
  `);
});

// ヘルスチェック
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ---- Socket.IO ----
io.on('connection', (socket) => {
  const sid = socket.id;
  console.log(`[connect] ${sid}`);

  // 任意：匿名IDをクライアントから受け取ったら「login」を通知（多人数拡張用）
  socket.on('hello', (devid) => {
    // 同じroom全員へ参加通知
    socket.data.devid = devid;
    socket.broadcast.emit('login', devid);
  });

  // ルーム参加
  socket.on('join', (room) => {
    try {
      socket.join(room);
      console.log(`[join] ${sid} -> room="${room}"`);
    } catch (e) {
      console.error('join error:', e);
    }
  });

  // センサデータの受信＆room中継
  // data 例: { id, room, b, g }
  socket.on('sensor', (data = {}) => {
    const room = data.room || 'game';
    // 送信元以外へ中継（PC表示タブが受け取る想定）
    socket.to(room).emit('sensor', data);
  });

  socket.on('disconnect', () => {
    const devid = socket.data?.devid;
    if (devid) socket.broadcast.emit('logout', devid);
    console.log(`[disconnect] ${sid}`);
  });
});

// ポート
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
