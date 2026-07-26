'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PARTICIPANT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('https://quiz-app-production-e651.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка регистрации');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Создать аккаунт
          </h1>
          <p className="text-gray-600 mt-2">Присоединяйся к сообществу квизов</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              👤 Как вас зовут?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-black placeholder-gray-400 bg-white"
              style={{ color: '#000000 !important' }}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-black placeholder-gray-400 bg-white"
              style={{ color: '#000000 !important' }}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              🔒 Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-black placeholder-gray-400 bg-white"
              style={{ color: '#000000 !important' }}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              🎯 Роль
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white text-black"
              style={{ color: '#000000 !important' }}
            >
              <option value="PARTICIPANT" className="text-black">🎮 Участник</option>
              <option value="ORGANIZER" className="text-black">🎯 Организатор</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Создаём аккаунт...' : '🚀 Зарегистрироваться'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-purple-600 hover:text-purple-800 font-semibold hover:underline transition-all">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}