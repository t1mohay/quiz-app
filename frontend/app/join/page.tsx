'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';

const socket: Socket = io('http://https://quiz-app-production-e651.up.railway.app');

export default function JoinQuiz() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const joinRoom = () => {
    if (!roomCode || !userName) {
      setError('Введите код комнаты и ваше имя');
      return;
    }

    socket.emit('join-room', roomCode, userName);
    router.push(`/quiz/live/${roomCode}?name=${encodeURIComponent(userName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">🔑 Присоединиться к квизу</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            ❌ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-gray-800 font-medium mb-2">Код комнаты</label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Введите 6-значный код"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white text-center text-2xl tracking-widest"
              style={{ color: '#000000 !important' }}
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Ваше имя</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
              style={{ color: '#000000 !important' }}
            />
          </div>

          <button
            onClick={joinRoom}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition text-lg font-semibold"
          >
            🔑 Присоединиться
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition text-lg font-semibold"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
}