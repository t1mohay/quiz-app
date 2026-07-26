'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  questionText: string;
  type: 'TEXT' | 'IMAGE';
  imageUrl?: string;
  timeForAnswer: number;
  options: { optionText: string; isCorrect: boolean }[];
}

export default function CreateQuiz() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      questionText: '',
      type: 'TEXT',
      timeForAnswer: 15,
      options: [
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false },
        { optionText: '', isCorrect: false }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        type: 'TEXT',
        timeForAnswer: 15,
        options: [
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false }
        ]
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: string, value: any) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = { ...updated[qIndex].options[oIndex], [field]: value };
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Проверка что у каждого вопроса есть правильный ответ
    for (const question of questions) {
      const hasCorrect = question.options.some(opt => opt.isCorrect);
      if (!hasCorrect) {
        setError('❌ У каждого вопроса должен быть хотя бы один правильный ответ!');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://https://quiz-app-production-e651.up.railway.app/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          timeLimit,
          category: category || undefined,
          questions
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка создания квиза');
      }

      alert('✅ Квиз создан успешно!');
      router.push('/my-quizzes');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📝 Создать квиз</h1>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Основная информация</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-800 font-medium mb-2">Название квиза *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ color: '#000000 !important' }}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-800 font-medium mb-2">Категория</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ color: '#000000 !important' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-800 font-medium mb-2">Описание</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ color: '#000000 !important' }}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-gray-800 font-medium mb-2">Время на квиз (сек)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  style={{ color: '#000000 !important' }}
                  min={10}
                  max={600}
                />
              </div>
            </div>
          </div>

          {questions.map((question, qIndex) => (
            <div key={qIndex} className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Вопрос {qIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-500 hover:text-red-700 text-sm font-semibold"
                >
                  ❌ Удалить
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800 font-medium mb-2">Текст вопроса *</label>
                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{ color: '#000000 !important' }}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">Тип вопроса</label>
                    <select
                      value={question.type}
                      onChange={(e) => updateQuestion(qIndex, 'type', e.target.value as 'TEXT' | 'IMAGE')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ color: '#000000 !important' }}
                    >
                      <option value="TEXT">Текст</option>
                      <option value="IMAGE">Изображение</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">Время на ответ (сек)</label>
                    <input
                      type="number"
                      value={question.timeForAnswer}
                      onChange={(e) => updateQuestion(qIndex, 'timeForAnswer', Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ color: '#000000 !important' }}
                      min={5}
                      max={60}
                    />
                  </div>
                </div>

                {question.type === 'IMAGE' && (
                  <div>
                    <label className="block text-gray-800 font-medium mb-2">URL изображения</label>
                    <input
                      type="text"
                      value={question.imageUrl || ''}
                      onChange={(e) => updateQuestion(qIndex, 'imageUrl', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      style={{ color: '#000000 !important' }}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-800 font-medium mb-2">Варианты ответов *</label>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={option.optionText}
                          onChange={(e) => updateOption(qIndex, oIndex, 'optionText', e.target.value)}
                          placeholder={`Вариант ${oIndex + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          style={{ color: '#000000 !important' }}
                          required
                        />
                        <label className="flex items-center gap-1 text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                            className="w-4 h-4"
                          />
                          Правильный
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-4 flex-wrap">
            <button
              type="button"
              onClick={addQuestion}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-semibold"
            >
              ➕ Добавить вопрос
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? '⏳ Создание...' : '🚀 Создать квиз'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}   