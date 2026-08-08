import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Asia/Riyadh';
const logicalDate = (ts) => formatInTimeZone(new Date(ts), TZ, 'yyyy-MM-dd');

const cases = [
  ['2026-08-07T20:59:59Z', '2026-08-07', '23:59:59 Riyadh - still today'],
  ['2026-08-07T21:00:00Z', '2026-08-08', '00:00:00 Riyadh - rolls to next day'],
  ['2026-08-07T21:00:01Z', '2026-08-08', '00:00:01 Riyadh - new day'],
  ['2026-08-08T00:30:00Z', '2026-08-08', '03:30 Riyadh - late night still new day'],
  ['2026-08-08T20:59:59Z', '2026-08-08', '23:59:59 Riyadh next day'],
  ['2026-12-31T21:00:00Z', '2027-01-01', 'year boundary'],
];

let failed = 0;
for (const [ts, expected, label] of cases) {
  const actual = logicalDate(ts);
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n      ${ts} -> ${actual} (expected ${expected})`);
}

const derive = (calories) => {
  const protein = Math.round((calories * (680 / 1475)) / 4);
  const fat = Math.round((calories * (315 / 1475)) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { protein, carbs, fat, check: protein * 4 + carbs * 4 + fat * 9 };
};

console.log('\nAuto macro derivation:');
for (const kcal of [1475, 1800, 2000, 2500]) {
  const d = derive(kcal);
  const ok = Math.abs(d.check - kcal) <= 4;
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${kcal} kcal -> ${d.protein}p / ${d.carbs}c / ${d.fat}f = ${d.check} kcal`
  );
}

console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
