'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl max-w-md w-full border border-white/20">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Quiz App
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Создавай и проходи квизы <br />в реальном времени!
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/auth/login" className="block">
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50">
              🔐 Войти
            </button>
          </Link>
          
          <Link href="/auth/register" className="block">
            <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50">
              ✨ Зарегистрироваться
            </button>
          </Link>
        </div>
        
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">✨ Организуй квизы и участвуй в них</p>
          <div className="flex justify-center gap-6 text-xs text-gray-400">
            <span>📝 Создавай</span>
            <span>🎮 Участвуй</span>
            <span>🏆 Побеждай</span>
          </div>
        </div>
      </div>
    </div>
  );
}