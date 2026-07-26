'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import io from 'socket.io-client';

const socket = io('https://quiz-app-production-e651.up.railway.app');

export default function StartQuiz() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id;
  
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [isCreated, setIsCreated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Подключено к WebSocket');
      setIsConnected(true);
    });

    socket.on('room-created', (data: { code: string }) => {
      console.log('📚 Комната создана:', data.code);
      setRoomCode(data.code);
      setIsCreated(true);
      setError('');
    });

    socket.on('players-update', (playersList: string[]) => {
      console.log('👥 Игроки обновлены:', playersList);
      setPlayers(playersList);
    });

    socket.on('quiz-started', () => {
      setIsQuizStarted(true);
      console.log('🎯 Квиз начат!');
    });

    socket.on('error', (msg: string) => {
      console.error('❌ Ошибка:', msg);
      setError(msg);
    });

    return () => {
      socket.off('connect');
      socket.off('room-created');
      socket.off('players-update');
      socket.off('quiz-started');
      socket.off('error');
    };
  }, []);

  const createRoom = () => {
    if (!socket || !isConnected) {
      setError('Нет соединения с сервером');
      return;
    }
    console.log('🎯 Создаём комнату для квиза:', quizId);
    socket.emit('create-room', Number(quizId));
  };

  const startQuiz = () => {
    if (!socket || !isConnected) return;
    if (players.length < 1) {
      setError('Нужен хотя бы 1 участник');
      return;
    }
    socket.emit('start-quiz', roomCode);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🚀 Запуск квиза</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              ❌ {error}
            </div>
          )}

          {!isConnected && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              ⏳ Подключение к серверу...
            </div>
          )}

          {isQuizStarted && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
              🎯 Квиз начат! Участники отвечают на вопросы.
            </div>
          )}

          {!isCreated ? (
            <button
              onClick={createRoom}
              disabled={!isConnected}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition text-lg font-semibold disabled:opacity-50"
            >
              🎯 Создать комнату
            </button>
          ) : (
            <div className="space-y-6">
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Код комнаты:</p>
                <p className="text-4xl font-bold text-purple-600 tracking-widest">{roomCode}</p>
                <p className="text-sm text-gray-500 mt-2">Поделись этим кодом с участниками</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">👥 Участники ({players.length})</h3>
                {players.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Ожидаем участников...</p>
                ) : (
                  <ul className="space-y-2">
                    {players.map((player: string, index: number) => (
                      <li key={index} className="bg-gray-50 p-3 rounded-lg flex items-center gap-3">
                        <span className="text-2xl">👤</span>
                        <span className="text-gray-800">{player}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!isQuizStarted ? (
                <button
                  onClick={startQuiz}
                  disabled={players.length < 1}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🚀 Начать квиз ({players.length} участников)
                </button>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition text-lg font-semibold"
                >
                  🏠 В дашборд
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}