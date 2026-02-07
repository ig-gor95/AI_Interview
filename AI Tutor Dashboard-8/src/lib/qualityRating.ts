// Система качественной оценки без численных баллов

export type QualityRating = 'outstanding' | 'strong' | 'promising' | 'suitable';

export interface QualityLevel {
  rating: QualityRating;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  gradient: string;
}

export const qualityLevels: Record<QualityRating, QualityLevel> = {
  'outstanding': {
    rating: 'outstanding',
    label: 'Выдающийся',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '⭐',
    gradient: 'from-purple-500 to-purple-600'
  },
  'strong': {
    rating: 'strong',
    label: 'Сильный',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '💪',
    gradient: 'from-blue-500 to-blue-600'
  },
  'promising': {
    rating: 'promising',
    label: 'Перспективный',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '🌱',
    gradient: 'from-green-500 to-green-600'
  },
  'suitable': {
    rating: 'suitable',
    label: 'Подходящий',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    icon: '✓',
    gradient: 'from-teal-500 to-teal-600'
  }
};

// Генерирует случайную качественную оценку с распределением
export function generateQualityRating(): QualityRating {
  const random = Math.random() * 100;
  
  if (random < 20) return 'outstanding';
  if (random < 50) return 'strong';
  if (random < 80) return 'promising';
  return 'suitable';
}

// Преобразует старый численный балл в качественную оценку (для миграции)
export function scoreToQualityRating(score: number): QualityRating {
  if (score >= 85) return 'outstanding';
  if (score >= 70) return 'strong';
  if (score >= 55) return 'promising';
  return 'suitable';
}

// Возвращает объект с данными уровня качества
export function getQualityLevel(rating: QualityRating): QualityLevel {
  return qualityLevels[rating];
}

// Для статистики - распределение кандидатов по уровням
export function getRatingDistribution(ratings: (QualityRating | undefined)[]): {
  outstanding: number;
  strong: number;
  promising: number;
  suitable: number;
  total: number;
} {
  const validRatings = ratings.filter(r => r !== undefined) as QualityRating[];
  
  return {
    outstanding: validRatings.filter(r => r === 'outstanding').length,
    strong: validRatings.filter(r => r === 'strong').length,
    promising: validRatings.filter(r => r === 'promising').length,
    suitable: validRatings.filter(r => r === 'suitable').length,
    total: validRatings.length
  };
}

// Качественная оценка для группы - процент выдающихся и сильных кандидатов
export function getOverallQuality(ratings: (QualityRating | undefined)[]): QualityLevel {
  const validRatings = ratings.filter(r => r !== undefined) as QualityRating[];
  if (validRatings.length === 0) return qualityLevels['suitable'];
  
  const topCount = validRatings.filter(r => r === 'outstanding' || r === 'strong').length;
  const topPercentage = (topCount / validRatings.length) * 100;
  
  if (topPercentage >= 60) return qualityLevels['outstanding'];
  if (topPercentage >= 40) return qualityLevels['strong'];
  if (topPercentage >= 20) return qualityLevels['promising'];
  return qualityLevels['suitable'];
}

// Процент сильных кандидатов (выдающиеся + сильные)
export function getTopCandidatesPercentage(ratings: (QualityRating | undefined)[]): number {
  const validRatings = ratings.filter(r => r !== undefined) as QualityRating[];
  if (validRatings.length === 0) return 0;
  
  const topCount = validRatings.filter(r => r === 'outstanding' || r === 'strong').length;
  return Math.round((topCount / validRatings.length) * 100);
}