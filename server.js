// ---------- server.js (clean) ----------
const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

// 静的配信（lesson6配下）
app.use(express.static(ROOT));

// PC: / → game-balls.html
app.get('/', (_req, res) => {
  res.sendFile(path.join(ROOT, 'game-balls.html'));
});

// スマホ: /smart.html 明示
app.get('/smart.html', (_req, res) => {
  res.sendFile(path.join(ROOT, 'smart.html'));
});

// QR用: /go → /smart.html?authuser=0 に一意に転送（←ここは1つだけ！）
app.get('/go', (_req, res) => {
  res.redirect('/smart.html?authuser=0');
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('✅ client connected');
  socket.on('join', (room) => socket.join(room));
  socket.on('sensor', (data) => io.to('game').emit('sensor', data));
  socket.on('disconnect', () => console.log('❎ client disconnected'));
});

// エラーハンドラ（原因可視化）
app.use((err, _req, res, _next) => {
  console.error('SERVER ERROR:', err);
  res.status(500).send('Internal Server Error');
});

http.listen(PORT, () => console.log(`🚀 listening on port ${PORT}`));
