/**
 * Dev helper: seeds/clears demo meals so charts and stats can be inspected.
 *   node scripts/seed-demo.mjs seed     -> backs up db.json then writes demo meals
 *   node scripts/seed-demo.mjs restore  -> restores the backup
 */
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const DB = path.join(process.cwd(), 'data', 'db.json');
const BACKUP = path.join(process.cwd(), 'data', 'db.backup.json');
const TZ_OFFSET_HOURS = 3; // Asia/Riyadh

const FOODS = {
  egg: { name: 'Boiled egg', ar: 'بيض مسلوق', kcal: 155, p: 13, c: 1.1, f: 11, unit: 'piece', serving: 50 },
  chicken: { name: 'Cooked chicken breast', ar: 'صدر دجاج مطبوخ', kcal: 165, p: 31, c: 0, f: 3.6, unit: 'g', serving: 100 },
  rice: { name: 'White rice cooked', ar: 'أرز أبيض مطبوخ', kcal: 130, p: 2.7, c: 28, f: 0.3, unit: 'cup', serving: 158 },
  yogurt: { name: 'Yogurt', ar: 'زبادي', kcal: 59, p: 10, c: 3.6, f: 0.4, unit: 'cup', serving: 170 },
};

const r1 = (n) => Math.round(n * 10) / 10;

function item(key, grams) {
  const f = FOODS[key];
  const ratio = grams / 100;
  return {
    id: randomUUID(),
    meal_id: 'temp',
    food_id: key,
    name: f.name,
    name_ar: f.ar,
    name_en: f.name,
    quantity: r1(grams / f.serving),
    unit: f.unit,
    weight_g: grams,
    calories: r1(f.kcal * ratio),
    protein_g: r1(f.p * ratio),
    carbs_g: r1(f.c * ratio),
    fat_g: r1(f.f * ratio),
  };
}

function totals(items) {
  const s = items.reduce(
    (a, i) => ({
      c: a.c + i.calories,
      p: a.p + i.protein_g,
      cb: a.cb + i.carbs_g,
      f: a.f + i.fat_g,
    }),
    { c: 0, p: 0, cb: 0, f: 0 }
  );
  return {
    total_calories: Math.round(s.c),
    total_protein_g: r1(s.p),
    total_carbs_g: r1(s.cb),
    total_fat_g: r1(s.f),
  };
}

function makeMeal(logicalDate, mealType, hourLocal, items) {
  const id = randomUUID();
  const utcHour = hourLocal - TZ_OFFSET_HOURS;
  const ts = new Date(`${logicalDate}T00:00:00Z`);
  ts.setUTCHours(utcHour, 15, 0, 0);
  return {
    id,
    user_id: 'local-user',
    name: mealType,
    name_ar: mealType,
    name_en: mealType,
    timestamp: ts.toISOString(),
    logical_date: logicalDate,
    meal_type: mealType,
    items: items.map((i) => ({ ...i, meal_id: id })),
    ...totals(items),
    source: 'manual',
    created_at: ts.toISOString(),
    updated_at: ts.toISOString(),
  };
}

function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayLocal() {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + TZ_OFFSET_HOURS);
  return now.toISOString().slice(0, 10);
}

async function seed() {
  const raw = await fs.readFile(DB, 'utf-8');
  await fs.writeFile(BACKUP, raw, 'utf-8');
  const db = JSON.parse(raw);

  const today = todayLocal();
  const meals = [];

  // day offset -> [chicken grams, rice grams] tuned to give a spread of totals
  const plan = [
    [0, 180, 150],
    [-1, 200, 200],
    [-2, 150, 120],
    [-3, 260, 300],
    [-5, 170, 140],
    [-6, 190, 160],
    [-8, 210, 220],
    [-9, 160, 130],
  ];

  for (const [offset, chickenG, riceG] of plan) {
    const date = shiftDate(today, offset);
    meals.push(makeMeal(date, 'breakfast', 8, [item('egg', 150), item('yogurt', 170)]));
    meals.push(makeMeal(date, 'lunch', 14, [item('chicken', chickenG), item('rice', riceG)]));
  }

  db.meals = meals;
  await fs.writeFile(DB, JSON.stringify(db, null, 2), 'utf-8');
  console.log(`Seeded ${meals.length} meals across ${plan.length} days (backup: data/db.backup.json)`);
}

async function restore() {
  const raw = await fs.readFile(BACKUP, 'utf-8');
  await fs.writeFile(DB, raw, 'utf-8');
  await fs.unlink(BACKUP);
  console.log('Restored db.json from backup and removed the backup file.');
}

const mode = process.argv[2];
if (mode === 'seed') await seed();
else if (mode === 'restore') await restore();
else {
  console.error('Usage: node scripts/seed-demo.mjs seed|restore');
  process.exit(1);
}
