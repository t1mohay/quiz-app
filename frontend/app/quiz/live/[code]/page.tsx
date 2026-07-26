'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

interface Option {
  id: number;
  optionText: string;
}

interface Question {
  id: number;
  questionText: string;
  options: Option[];
  timeForAnswer: number;
}

interface LeaderboardPlayer {
  position: number;
  name: string;
  score: number;
}

export default function LiveQuiz() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomCode = params.code;
  const userName = searchParams.get('name') || 'Аноним';

  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [isWaiting, setIsWaiting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);

  const addDebug = (msg: string) => {
    console.log('🔍', msg);
    setDebug(prev => [...prev, msg]);
  };

  useEffect(() => {
    addDebug(`🚀 Страница загружена. Комната: ${roomCode}, Имя: ${userName}`);

    // Создаём подключение
    if (!socketRef.current || !socketRef.current.connected) {
      addDebug('🔌 Создаём новое подключение к WebSocket...');
      
      socketRef.current = io('http://https://quiz-app-production-e651.up.railway.app', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });
    }

    const socket = socketRef.current;

    // Обработка подключения
    const onConnect = () => {
      addDebug(`✅ ПОДКЛЮЧЕНО к WebSocket! ID: ${socket.id}`);
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Присоединяемся к комнате
      addDebug(`🔑 Присоединяемся к комнате ${roomCode}...`);
      socket.emit('join-room', roomCode, userName);
    };

    // Обработка переподключения
    const onReconnect = (attemptNumber: number) => {
      addDebug(`🔄 Переподключение #${attemptNumber}...`);
      reconnectAttempts.current = attemptNumber;
    };

    // Обработка ошибок
    const onConnectError = (err: Error) => {
      addDebug(`❌ Ошибка подключения: ${err.message}`);
      setIsConnected(false);
    };

    const onError = (msg: string) => {
      addDebug(`❌ Ошибка: ${msg}`);
    };

    // Получение вопроса
    const onQuestion = (data: Question) => {
      addDebug(`📨 ПОЛУЧЕН ВОПРОС: ${data.questionText}`);
      setQuestion(data);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(data.timeForAnswer || 15);
      setIsWaiting(false);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    const onScoreUpdate = (data: { score: number }) => {
      addDebug(`⭐ Обновление счёта: ${data.score}`);
      setScore(data.score);
    };

    const onQuizEnded = (data: LeaderboardPlayer[]) => {
      addDebug(`🏆 Квиз завершён!`);
      setIsQuizEnded(true);
      setLeaderboard(data);
      setQuestion(null);
    };

    const onQuizStarted = () => {
      addDebug(`🎯 Квиз начат!`);
      setIsWaiting(false);
    };

    const onDisconnect = (reason: string) => {
      addDebug(`🔌 Отключено от WebSocket: ${reason}`);
      setIsConnected(false);
    };

    // Подписываемся на события
    socket.on('connect', onConnect);
    socket.on('reconnect_attempt', onReconnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('question', onQuestion);
    socket.on('score-update', onScoreUpdate);
    socket.on('quiz-ended', onQuizEnded);
    socket.on('quiz-started', onQuizStarted);
    socket.on('disconnect', onDisconnect);

    // Если сокет уже подключен — вызываем сразу
    if (socket.connected) {
      onConnect();
    }

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('reconnect_attempt', onReconnect);
      socket.off('connect_error', onConnectError);
      socket.off('error', onError);
      socket.off('question', onQuestion);
      socket.off('score-update', onScoreUpdate);
      socket.off('quiz-ended', onQuizEnded);
      socket.off('quiz-started', onQuizStarted);
      socket.off('disconnect', onDisconnect);
    };
  }, [roomCode, userName]);

  const handleAnswer = (optionId: number) => {
    if (isAnswered || timeLeft === 0) return;
    addDebug(`📤 Отправка ответа: вопрос ${question?.id}, вариант ${optionId}`);
    setSelectedOption(optionId);
    setIsAnswered(true);
    socketRef.current?.emit('answer', { 
      roomCode, 
      userName, 
      questionId: question?.id, 
      optionId 
    });
  };

  if (isQuizEnded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">🏆 Квиз завершён!</h1>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">Ваш счёт: {score} баллов</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Лидерборд</h3>
            <div className="space-y-2">
              {leaderboard.map((player) => (
                <div 
                  key={player.position} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.name === userName ? 'bg-purple-100 border-2 border-purple-500' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-600">#{player.position}</span>
                    <span className="font-medium text-gray-800">
                      {player.name} {player.name === userName && '⭐'}
                    </span>
                  </div>
                  <span className="font-bold text-purple-600">{player.score} баллов</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            🏠 В дашборд
          </button>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800">Ожидание вопроса...</h2>
            <p className="text-gray-600 mt-2">Квиз скоро начнётся</p>
            <p className="text-gray-600 mt-2">Ваш счёт: {score}</p>
            <p className={`text-sm mt-4 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? '🟢 Подключено к серверу' : '🔴 Не подключено к серверу'}
            </p>
            <div className="mt-4 bg-gray-100 p-3 rounded-lg text-left max-h-60 overflow-auto">
              <p className="text-xs text-gray-600 font-bold">DEBUG:</p>
              {debug.map((msg, i) => (
                <p key={i} className="text-xs text-gray-500">{msg}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-2xl font-bold text-gray-800">Загрузка вопроса...</h2>
          <p className={`text-sm mt-4 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {isConnected ? '🟢 Подключено к серверу' : '🔴 Не подключено к серверу'}
          </p>
          <div className="mt-4 bg-gray-100 p-3 rounded-lg text-left max-h-60 overflow-auto">
            <p className="text-xs text-gray-600 font-bold">DEBUG:</p>
            {debug.map((msg, i) => (
              <p key={i} className="text-xs text-gray-500">{msg}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">🎯 Вопрос</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">👤 {userName}</span>
            <span className="text-sm text-blue-600 font-bold">⭐ {score}</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-2xl font-semibold text-gray-900">{question.questionText}</p>
            <div className={`px-4 py-2 rounded-lg font-bold ${
              timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700'
            }`}>
              ⏱️ {timeLeft}с
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                disabled={isAnswered || timeLeft === 0}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  isAnswered && isSelected
                    ? 'border-green-500 bg-green-50'
                    : isAnswered && !isSelected
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                } ${(isAnswered || timeLeft === 0) ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="text-gray-800">{option.optionText}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-blue-800">✅ Ответ отправлен! Ожидайте следующий вопрос.</p>
          </div>
        )}

        {timeLeft === 0 && !isAnswered && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg text-center">
            <p className="text-red-800">⏰ Время вышло!</p>
          </div>
        )}
      </div>
    </div>
  );
}