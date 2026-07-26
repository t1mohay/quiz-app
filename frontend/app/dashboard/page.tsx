'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        // Если организатор, загружаем количество квизов
        if (parsed.role === 'ORGANIZER') {
          fetchQuizCount(token);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login');
      }
    }
    setLoading(false);
  }, [router]);

  const fetchQuizCount = async (token: string) => {
    try {
      const res = await fetch('http://https://quiz-app-production-e651.up.railway.app/api/quizzes/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizCount(data.length);
      }
    } catch (error) {
      console.error('Ошибка загрузки количества квизов:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">⏳ Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Навигация */}
      <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-purple-600">🎯 Quiz App</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-gray-700">👋 {user.name}</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {user.role === 'ORGANIZER' ? '🎯 Организатор' : '🎮 Участник'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      {/* Контент */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">📊 Панель управления</h2>
          <p className="text-gray-600 mt-1">
            {user.role === 'ORGANIZER' 
              ? 'Создавай и управляй своими квизами' 
              : 'Присоединяйся к квизам и участвуй'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Создать квиз - только для организатора */}
          {user.role === 'ORGANIZER' && (
            <Link href="/create-quiz">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 group">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition">Создать квиз</h3>
                <p className="text-gray-600 mt-2 text-sm">Создай новый квиз с вопросами и ответами</p>
                <div className="mt-3 text-purple-600 text-sm font-semibold">→ Создать</div>
              </div>
            </Link>
          )}

          {/* Мои квизы - только для организатора */}
          {user.role === 'ORGANIZER' && (
            <Link href="/my-quizzes">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 group">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">Мои квизы</h3>
                <p className="text-gray-600 mt-2 text-sm">Управляй созданными квизами</p>
                <div className="mt-3 text-blue-600 text-sm font-semibold">→ Просмотр</div>
              </div>
            </Link>
          )}

          {/* Присоединиться к квизу */}
          <Link href="/join">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-green-500 group">
              <div className="text-4xl mb-4">🔑</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition">Присоединиться</h3>
              <p className="text-gray-600 mt-2 text-sm">Введи код комнаты и участвуй в квизе</p>
              <div className="mt-3 text-green-600 text-sm font-semibold">→ Ввести код</div>
            </div>
          </Link>

          {/* История */}
          <Link href="/history">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-yellow-500 group">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-yellow-600 transition">История</h3>
              <p className="text-gray-600 mt-2 text-sm">Просмотр пройденных квизов и результатов</p>
              <div className="mt-3 text-yellow-600 text-sm font-semibold">→ Смотреть</div>
            </div>
          </Link>

          {/* Статистика */}
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900">Статистика</h3>
            <p className="text-gray-600 mt-2 text-sm">Твои достижения и рейтинг</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Создано квизов:</span>
                <span className="font-bold text-purple-600">{quizCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Пройдено квизов:</span>
                <span className="font-bold text-blue-600">0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Правильных ответов:</span>
                <span className="font-bold text-green-600">0%</span>
              </div>
            </div>
          </div>

          {/* Профиль */}
          <div className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-gray-900">Профиль</h3>
            <p className="text-gray-600 mt-2 text-sm">Настройки аккаунта</p>
            <div className="mt-4 space-y-1 text-sm">
              <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{user.email}</span></p>
              <p><span className="text-gray-500">Роль:</span> <span className="font-medium text-gray-900">{user.role === 'ORGANIZER' ? 'Организатор' : 'Участник'}</span></p>
              <p><span className="text-gray-500">Имя:</span> <span className="font-medium text-gray-900">{user.name}</span></p>
            </div>
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Быстрые действия</h3>
          <div className="flex flex-wrap gap-3">
            {user.role === 'ORGANIZER' && (
              <>
                <Link href="/create-quiz">
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm">
                    ➕ Новый квиз
                  </button>
                </Link>
                <Link href="/my-quizzes">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">
                    📚 Мои квизы
                  </button>
                </Link>
              </>
            )}
            <Link href="/join">
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm">
                🔑 Присоединиться
              </button>
            </Link>
            <Link href="/history">
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition text-sm">
                📊 История
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}