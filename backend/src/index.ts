import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/authRoutes';
import quizRoutes from './routes/quizRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://quiz-app-git-main-franken.vercel.app', 'https://quiz-app-franken.vercel.app'],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const prisma = new PrismaClient();

app.use(cors({
  origin: ['http://localhost:3000', 'https://quiz-app-git-main-franken.vercel.app', 'https://quiz-app-franken.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz API работает!' });
});

// --- WebSocket ---
interface Room {
  quizId: number;
  players: { id: string; name: string; score: number }[];
  currentQuestion: number;
  questions: any[];
  isActive: boolean;
  timer: NodeJS.Timeout | null;
}

const rooms: Map<string, Room> = new Map();

io.on('connection', (socket) => {
  console.log('👤 Новый клиент:', socket.id);

  // Создание комнаты
  socket.on('create-room', async (quizId: number) => {
    try {
      const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });

      if (!quiz) {
        socket.emit('error', 'Квиз не найден');
        return;
      }

      console.log(`📚 Загружено вопросов: ${quiz.questions.length}`);

      rooms.set(roomCode, {
        quizId,
        players: [],
        currentQuestion: 0,
        questions: quiz.questions,
        isActive: false,
        timer: null
      });

      socket.join(roomCode);
      socket.emit('room-created', { code: roomCode });
      console.log(`📚 Комната создана: ${roomCode} (Вопросов: ${quiz.questions.length})`);
    } catch (error) {
      console.error('Ошибка создания комнаты:', error);
      socket.emit('error', 'Ошибка создания комнаты');
    }
  });

  // Подключение к комнате (с новой логикой переподключения)
  socket.on('join-room', (roomCode: string, userName: string) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Комната не найдена');
      return;
    }
    
    // НОВАЯ ЛОГИКА: Если игрок уже есть — удаляем старого и добавляем нового
    const existingPlayerIndex = room.players.findIndex(p => p.name === userName);
    if (existingPlayerIndex !== -1) {
      room.players.splice(existingPlayerIndex, 1);
      console.log(`🔄 Игрок ${userName} переподключился`);
    }

    room.players.push({ id: socket.id, name: userName, score: 0 });
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.userName = userName;
    
    io.to(roomCode).emit('players-update', room.players.map(p => p.name));
    console.log(`👤 ${userName} присоединился к ${roomCode}`);
    console.log(`👥 Всего игроков: ${room.players.length}`);
    
    // Если квиз уже активен — отправляем текущий вопрос новому игроку
    if (room.isActive && room.currentQuestion < room.questions.length) {
      const question = room.questions[room.currentQuestion];
      const questionData = {
        id: question.id,
        questionText: question.questionText,
        options: question.options.map((opt: any) => ({
          id: opt.id,
          optionText: opt.optionText
        })),
        timeForAnswer: question.timeForAnswer || 15
      };
      socket.emit('question', questionData);
      console.log(`📤 Отправлен текущий вопрос новому игроку ${userName}`);
    }
  });

  // Начало квиза
  socket.on('start-quiz', (roomCode: string) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Комната не найдена');
      return;
    }

    if (room.questions.length === 0) {
      socket.emit('error', 'Нет вопросов для квиза');
      return;
    }

    if (room.players.length === 0) {
      socket.emit('error', 'Нет участников для квиза');
      return;
    }

    room.isActive = true;
    room.currentQuestion = 0;
    
    console.log(`🎯 Квиз начат в комнате ${roomCode}`);
    console.log(`📝 Всего вопросов: ${room.questions.length}`);
    console.log(`👥 Участников: ${room.players.length}`);
    
    io.to(roomCode).emit('quiz-started');
    
    // Отправляем первый вопрос через 2 секунды
    setTimeout(() => {
      sendQuestion(roomCode);
    }, 2000);
  });

  // Отправка вопроса
  function sendQuestion(roomCode: string) {
    const room = rooms.get(roomCode);
    if (!room) {
      console.log(`❌ Комната ${roomCode} не найдена`);
      return;
    }

    if (!room.isActive) {
      console.log(`❌ Комната ${roomCode} не активна`);
      return;
    }

    if (room.currentQuestion >= room.questions.length) {
      // Квиз закончен
      const leaderboard = room.players
        .sort((a, b) => b.score - a.score)
        .map((p, index) => ({
          position: index + 1,
          name: p.name,
          score: p.score
        }));
      
      io.to(roomCode).emit('quiz-ended', leaderboard);
      room.isActive = false;
      console.log(`🏆 Квиз закончен в комнате ${roomCode}`);
      return;
    }

    const question = room.questions[room.currentQuestion];
    const questionData = {
      id: question.id,
      questionText: question.questionText,
      options: question.options.map((opt: any) => ({
        id: opt.id,
        optionText: opt.optionText
      })),
      timeForAnswer: question.timeForAnswer || 15
    };

    console.log(`📝 Отправка вопроса ${room.currentQuestion + 1}/${room.questions.length}: ${question.questionText}`);
    console.log(`📤 Отправка в комнату ${roomCode} (участников: ${room.players.length})`);
    
    io.to(roomCode).emit('question', questionData);

    // Таймер на ответ
    if (room.timer) clearTimeout(room.timer);
    const timeForAnswer = (question.timeForAnswer || 15) * 1000;
    room.timer = setTimeout(() => {
      room.currentQuestion++;
      sendQuestion(roomCode);
    }, timeForAnswer + 2000);
  }

  // Получение ответа
  socket.on('answer', async (data: { 
    roomCode: string; 
    userName: string; 
    questionId: number; 
    optionId: number 
  }) => {
    const room = rooms.get(data.roomCode);
    if (!room || !room.isActive) {
      console.log(`❌ Ответ получен, но комната не активна`);
      return;
    }

    const player = room.players.find(p => p.name === data.userName);
    if (!player) {
      console.log(`❌ Игрок ${data.userName} не найден`);
      return;
    }

    try {
      const option = await prisma.answerOption.findUnique({
        where: { id: data.optionId }
      });

      if (option && option.isCorrect) {
        player.score += 10;
        console.log(`✅ ${data.userName} ответил правильно! Счёт: ${player.score}`);
        socket.emit('score-update', { score: player.score });
      } else {
        console.log(`❌ ${data.userName} ответил неправильно`);
      }
    } catch (error) {
      console.error('Ошибка проверки ответа:', error);
    }
  });

  // Отключение
  socket.on('disconnect', () => {
    const roomCode = socket.data.roomCode;
    const userName = socket.data.userName;
    
    if (roomCode && userName) {
      const room = rooms.get(roomCode);
      if (room) {
        room.players = room.players.filter(p => p.name !== userName);
        io.to(roomCode).emit('players-update', room.players.map(p => p.name));
        console.log(`👋 ${userName} покинул комнату ${roomCode}`);
      }
    }
    console.log('👋 Клиент отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 WebSocket готов`);
  console.log(`🔐 Аутентификация доступна по /api/auth`);
  console.log(`📝 Квизы доступны по /api/quizzes`);
});