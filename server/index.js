const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const PORT = 3001;

// 매칭 대기열 (메모리)
let waitingUsers = [];
let activePairs = new Map(); // socketId -> 상대 socketId

// 공통점 점수 계산 (관심사, 나이, 지역)
function calcScore(userA, userB) {
  let score = 0;
  // 관심사 겹치는 개수
  const commonInterests = userA.interests.filter(i => userB.interests.includes(i));
  score += commonInterests.length * 3;
  // 지역
  if (userA.region === userB.region) score += 2;
  // 나이차 3살 이내
  if (Math.abs(Number(userA.age) - Number(userB.age)) <= 3) score += 1;
  return score;
}

io.on('connection', (socket) => {
  console.log('새 클라이언트 접속:', socket.id);

  // 프로필 제출 및 매칭 시도
  socket.on('submit_profile', (profile) => {
    // 매칭 대기열에 추가
    const user = { ...profile, socketId: socket.id };
    // 대기열에 다른 유저가 있으면 매칭 시도
    if (waitingUsers.length > 0) {
      // 가장 점수 높은 유저와 매칭
      let bestMatch = null;
      let bestScore = -1;
      let bestIdx = -1;
      waitingUsers.forEach((other, idx) => {
        const score = calcScore(user, other);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = other;
          bestIdx = idx;
        }
      });
      if (bestMatch) {
        // 매칭 성사
        waitingUsers.splice(bestIdx, 1);
        activePairs.set(socket.id, bestMatch.socketId);
        activePairs.set(bestMatch.socketId, socket.id);
        // 양쪽에 매칭 완료 알림
        io.to(socket.id).emit('matched', { partner: bestMatch });
        io.to(bestMatch.socketId).emit('matched', { partner: user });
        return;
      }
    }
    // 대기열에 추가
    waitingUsers.push(user);
  });

  // 채팅 메시지 중계
  socket.on('chat_message', (msg) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('chat_message', msg);
    }
  });

  // 연결 해제 시 정리
  socket.on('disconnect', () => {
    // 대기열에서 제거
    waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
    // 매칭된 상대에게 알림
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner_disconnected');
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    console.log('클라이언트 연결 해제:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중`);
}); 