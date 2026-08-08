import { Meal } from '@/types';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const MEAL_SOURCES = ['scan', 'manual', 'favorite'] as const;

export const MEAL_EMOJI: Record<Meal['meal_type'], string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍛',
  snack: '🥣',
};

/** Picks a sensible default meal type from the local hour of day. */
export function inferMealType(hour: number): Meal['meal_type'] {
  if (hour >= 4 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}

export function isMealType(value: unknown): value is Meal['meal_type'] {
  return MEAL_TYPES.includes(value as Meal['meal_type']);
}

export function isMealSource(value: unknown): value is Meal['source'] {
  return MEAL_SOURCES.includes(value as Meal['source']);
}
