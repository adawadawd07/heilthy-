export interface Food {
  id: string;
  name: string;
  name_ar: string;
  name_en: string;
  serving_unit: string;
  serving_weight_g: number;
  calories_per_100g: number;
  protein_g_per_100g: number;
  carbs_g_per_100g: number;
  fat_g_per_100g: number;
  fiber_g_per_100g?: number;
  source: string;
}

export interface MealItem {
  id: string;
  meal_id: string;
  food_id: string;
  name: string;
  name_ar: string;
  name_en: string;
  quantity: number;
  unit: string;
  weight_g: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  name_ar: string;
  name_en: string;
  timestamp: string;
  logical_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  image_url?: string;
  ai_analysis?: FoodAnalysisResult;
  source: 'scan' | 'manual' | 'favorite';
  created_at: string;
  updated_at: string;
}

export interface AnalyzedFoodItem {
  name: string;
  name_ar: string;
  name_en: string;
  estimated_count?: number;
  unit: string;
  estimated_weight_g: number;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
  calories_per_100g?: number;
  protein_g_per_100g?: number;
  carbs_g_per_100g?: number;
  fat_g_per_100g?: number;
}

export interface FoodAnalysisResult {
  items: AnalyzedFoodItem[];
  notes: string[];
}

export interface DailySummary {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_count: number;
  scan_count: number;
  manual_count: number;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  email?: string;
  display_name?: string;
  language: 'ar' | 'en';
  timezone: string;
  theme: 'system' | 'light' | 'dark';
  notifications_enabled: boolean;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
  created_at: string;
}

/** User object safe to send to the browser: never carries the password hash. */
export type PublicUser = Omit<User, 'password_hash'>;

export interface Session {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface UserPreferences {
  user_id: string;
  language: 'ar' | 'en';
  timezone: string;
  theme: 'system' | 'light' | 'dark';
  notifications_enabled: boolean;
  daily_calories: number;
  daily_protein_g: number;
  daily_carbs_g: number;
  daily_fat_g: number;
}

export interface FavoriteMeal {
  id: string;
  user_id: string;
  name: string;
  name_ar: string;
  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}
