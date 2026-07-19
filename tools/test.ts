/**
 * Testy automatyczne
 * Uruchom: npx tsx tools/test.ts
 */

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(a: any, b: any, message: string) {
  if (a === b) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.log(`  ✗ ${message} (${a} !== ${b})`);
    failed++;
  }
}

console.log('=== Testy automatyczne ===\n');

// Test formuł balansu
console.log('\n--- Formuły balansu ---');

// Formuła XP
function calcXpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
assertEqual(calcXpToNext(1), 100, 'XP do poziomu 2 = 100');
assertEqual(calcXpToNext(2), 150, 'XP do poziomu 3 = 150');
assertEqual(calcXpToNext(3), 225, 'XP do poziomu 4 = 225');

// Formuła HP
function calcMaxHp(baseHp: number, level: number, strength: number): number {
  return baseHp + level * 10 + strength * 3;
}
assertEqual(calcMaxHp(50, 1, 4), 72, 'HP startowe (50 + 10 + 12) = 72');
assertEqual(calcMaxHp(50, 5, 18), 154, 'HP poziom 5, siła 18 = 154');

// Formuła obrażeń
function calcDamage(baseDamage: number, strength: number, scaling: number): number {
  return Math.floor(baseDamage + baseDamage * scaling * (strength / 10));
}
assert(calcDamage(14, 10, 0.6) >= 14, 'Obrażenia miecza przy sile 10');
assert(calcDamage(14, 20, 0.6) > calcDamage(14, 10, 0.6), 'Więcej siły = więcej obrażeń');

// Formuła redukcji pancerza
function calcDamageReduction(armor: number, baseDamage: number): number {
  const reduction = Math.min(armor * 0.5, baseDamage * 0.5);
  return Math.max(1, Math.floor(baseDamage - reduction));
}
assert(calcDamageReduction(5, 20) < 20, 'Pancerz redukuje obrażenia');
assert(calcDamageReduction(100, 5) >= 1, 'Minimalne obrażenia to 1');

// Test umiejętności
console.log('\n--- Umiejętności ---');

function calcLockpickChance(rank: number, difficulty: number): number {
  const baseChance = 0.3;
  const rankBonus = rank * 0.2;
  const difficultyPenalty = (difficulty - 1) * 0.15;
  return Math.max(0.05, Math.min(0.95, baseChance + rankBonus - difficultyPenalty));
}
assert(calcLockpickChance(1, 1) > 0.3, 'Wytrych poziom 1, zamek 1 > 30%');
assert(calcLockpickChance(1, 3) < 0.3, 'Wytrych poziom 1, zamek 3 < 30%');
assert(calcLockpickChance(3, 3) > 0.5, 'Wytrych poziom 3, zamek 3 > 50%');

// Test kradzieży
function calcPickpocketChance(rank: number, targetLevel: number): number {
  const baseChance = 0.2;
  const rankBonus = rank * 0.15;
  const levelPenalty = (targetLevel - 1) * 0.05;
  return Math.max(0.05, Math.min(0.95, baseChance + rankBonus - levelPenalty));
}
assert(calcPickpocketChance(0, 1) <= 0.2, 'Brak umiejętności = niska szansa');
assert(calcPickpocketChance(2, 1) > 0.4, 'Ranga 2, cel niski > 40%');

console.log('\n=== Podsumowanie ===');
console.log(`Przeszło: ${passed}, Nie przeszło: ${failed}`);
if (failed > 0) process.exit(1);
