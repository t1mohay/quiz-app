import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Создание квиза
export const createQuiz = async (req: Request, res: Response) => {
  try {
    const { title, description, timeLimit, category, questions } = req.body;
    const authorId = (req as any).userId;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Название и вопросы обязательны' });
    }

    // Приводим category к строке
    const categoryStr = typeof category === 'string' ? category : undefined;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        timeLimit: timeLimit || 60,
        category: categoryStr,
        authorId,
        questions: {
          create: questions.map((q: any, index: number) => ({
            questionText: q.questionText,
            type: q.type || 'TEXT',
            imageUrl: q.imageUrl,
            timeForAnswer: q.timeForAnswer || 15,
            order: index,
            options: {
              create: q.options.map((opt: any) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect || false
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Квиз создан успешно',
      quiz
    });
  } catch (error) {
    console.error('Ошибка создания квиза:', error);
    res.status(500).json({ message: 'Ошибка при создании квиза' });
  }
};

// Получить все квизы пользователя
export const getMyQuizzes = async (req: Request, res: Response) => {
  try {
    const authorId = (req as any).userId;

    const quizzes = await prisma.quiz.findMany({
      where: { authorId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(quizzes);
  } catch (error) {
    console.error('Ошибка получения квизов:', error);
    res.status(500).json({ message: 'Ошибка получения квизов' });
  }
};

// Получить квиз по ID
export const getQuizById = async (req: Request, res: Response) => {
  try {
    // Безопасно получаем id
    const idParam = req.params.id;
    const quizId = typeof idParam === 'string' ? parseInt(idParam, 10) : Number(idParam);

    if (isNaN(quizId)) {
      return res.status(400).json({ message: 'Неверный ID квиза' });
    }

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
      return res.status(404).json({ message: 'Квиз не найден' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Ошибка получения квиза:', error);
    res.status(500).json({ message: 'Ошибка получения квиза' });
  }
};

// Удалить квиз
export const deleteQuiz = async (req: Request, res: Response) => {
  try {
    // Безопасно получаем id
    const idParam = req.params.id;
    const quizId = typeof idParam === 'string' ? parseInt(idParam, 10) : Number(idParam);

    if (isNaN(quizId)) {
      return res.status(400).json({ message: 'Неверный ID квиза' });
    }

    const authorId = (req as any).userId;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        authorId
      }
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Квиз не найден или у вас нет прав на удаление' });
    }

    await prisma.quiz.delete({
      where: { id: quizId }
    });

    res.json({ message: 'Квиз удалён' });
  } catch (error) {
    console.error('Ошибка удаления квиза:', error);
    res.status(500).json({ message: 'Ошибка удаления квиза' });
  }
};