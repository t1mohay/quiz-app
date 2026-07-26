'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  timeLimit: number | null;
  createdAt: string;
  questions: any[];
}

export default function MyQuizzes() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://https://quiz-app-production-e651.up.railway.app/api/quizzes/my', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Ошибка загрузки квизов');

      const data = await res.json();
      setQuizzes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (id: number) => {
    if (!confirm('Удалить этот квиз?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://https://quiz-app-production-e651.up.railway.app/api/quizzes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Ошибка удаления');

      setQuizzes(quizzes.filter(q => q.id !== id));
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl text-gray-600">⏳ Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📚 Мои квизы</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            ← Назад
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            ❌ {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-md text-center">
            <p className="text-gray-500 text-lg">У вас пока нет созданных квизов</p>
            <Link href="/create-quiz">
              <button className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                ➕ Создать первый квиз
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h3>
                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-2">{quiz.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {quiz.category && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {quiz.category}
                    </span>
                  )}
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {quiz.questions?.length || 0} вопросов
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/quiz/${quiz.id}/start`}>
                      <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">
                        🚀 Запустить
                      </button>
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}