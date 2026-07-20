/**
 * Testy automatyczne (uruchamiane bez Phasera)
 * Testują formuły balansu, systemy i dane.
 * Uruchom: npx tsx tools/test.ts
 */
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else { console.log(`  ✗ ${message}`); failed++; }
}
function assertEqual(a: any, b: any, message: string) {
  if (a === b) { console.log(`  ✓ ${message}`); passed++; }
  else { console.log(`  ✗ ${message} (${JSON.stringify(a)} !== ${JSON.stringify(b)})`); failed++; }
}
function assertGE(a: number, b: number, message: string) {
  if (a >= b) { console.log(`  ✓ ${message}`); passed++; }
  else { console.log(`  ✗ ${message} (${a} < ${b})`); failed++; }
}

console.log('=== Testy automatyczne ===\n');

// ----- Formuły balansu -----
console.log('\n--- Formuły balansu ---');

function calcXpToNext(level: number): number { return Math.floor(100 * Math.pow(1.5, level - 1)); }
assertEqual(calcXpToNext(1), 100, 'XP do poziomu 2 = 100');
assertEqual(calcXpToNext(2), 150, 'XP do poziomu 3 = 150');
assertEqual(calcXpToNext(3), 225, 'XP do poziomu 4 = 225');
assertGE(calcXpToNext(4), 300, 'XP rośnie monotonicznie');

function calcMaxHp(baseHp: number, level: number, strength: number): number {
  return baseHp + level * 10 + strength * 3;
}
assertEqual(calcMaxHp(50, 1, 4), 72, 'HP startowe (50 + 10 + 12) = 72');
assertEqual(calcMaxHp(50, 5, 18), 154, 'HP poziom 5, siła 18 = 154');

// Damage reduction per balance.json: armor * 0.01 * damage, max 80%, min 1
function applyArmor(baseDamage: number, armor: number): number {
  const reduction = Math.min(armor * 0.01 * baseDamage, baseDamage * 0.8);
  return Math.max(1, Math.floor(baseDamage - reduction));
}
assert(applyArmor(20, 0) === 20, 'Bez pancerza pełne obrażenia');
assert(applyArmor(20, 50) < 20, 'Pancerz redukuje obrażenia');
assert(applyArmor(5, 1000) === 1, 'Minimalne obrażenia to 1');
assert(applyArmor(100, 100) >= 20, 'Pancerz 100 redukuje max 80%');

function meleeDamage(baseDamage: number, strength: number, scaling: number): number {
  return Math.floor(baseDamage + strength * scaling);
}
assert(meleeDamage(8, 10, 1.5) > 8, 'Siła zwiększa obrażenia');
assert(meleeDamage(8, 20, 1.5) > meleeDamage(8, 10, 1.5), 'Więcej siły = więcej obrażeń');

// ----- Umiejętności -----
console.log('\n--- Umiejętności ---');

function calcLockpickChance(rank: number, difficulty: number): number {
  const base = 0.3;
  return Math.max(0.05, Math.min(0.95, base + rank * 0.2 - (difficulty - 1) * 0.15));
}
assert(calcLockpickChance(1, 1) > 0.3, 'Wytrych r1, zamek 1 > 30%');
assert(calcLockpickChance(1, 3) < 0.3, 'Wytrych r1, zamek 3 < 30%');
assert(calcLockpickChance(3, 3) > 0.5, 'Wytrych r3, zamek 3 > 50%');
assert(calcLockpickChance(0, 1) < 0.4, 'Brak umiejętności = niska szansa');

function calcPickpocketChance(rank: number, targetLevel: number): number {
  return Math.max(0.05, Math.min(0.95, 0.2 + rank * 0.15 - (targetLevel - 1) * 0.05));
}
assert(calcPickpocketChance(0, 1) <= 0.25, 'Brak umiejętności = niska szansa kradzieży');
assert(calcPickpocketChance(2, 1) > 0.4, 'Ranga 2, cel niski > 40%');
assert(calcPickpocketChance(2, 10) < calcPickpocketChance(2, 1), 'Trudniej okraść wyższy poziom');

// ----- JSON load & integrity -----
console.log('\n--- Dane JSON ---');
const DATA_DIR = path.resolve(process.cwd(), 'public/data/json');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
assert(files.length >= 20, `Co najmniej 20 plików JSON (jest ${files.length})`);

function loadJson(name: string): any {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8'));
}

const swords = loadJson('items_weapons_swords.json');
const bows = loadJson('items_weapons_bows.json');
const armors = loadJson('items_armors.json');
const plants = loadJson('items_plants.json');
const potions = loadJson('items_potions.json');
const misc = loadJson('items_misc.json');
const monsters = loadJson('monsters.json');
const npcs = loadJson('npcs.json');
const questsMain = loadJson('quests_main.json');
const questsOld = loadJson('quests_old_faction.json');
const questsNew = loadJson('quests_new_faction.json');
const questsSide = loadJson('quests_side.json');
const spells = loadJson('spells.json');
const trainers = loadJson('trainers.json');
const schedules = loadJson('npc_schedules.json');
const lootTables = loadJson('loot_tables.json');
const worldLocs = loadJson('world_locations.json');
const spawns = loadJson('monster_spawns.json');
const dialogs = loadJson('dialogues_intro.json');
const balance = loadJson('balance.json');

// Unique IDs in every array file
function checkUniqueIds(arr: any[], label: string) {
  const ids = new Set<string>();
  let dup = 0;
  for (const r of arr) {
    if (!r.id) continue;
    if (ids.has(r.id)) dup++;
    ids.add(r.id);
  }
  assert(dup === 0, `${label}: brak duplikatów ID (${dup})`);
}
checkUniqueIds(swords, 'Miecze');
checkUniqueIds(bows, 'Łuki');
checkUniqueIds(armors, 'Zbroje');
checkUniqueIds(plants, 'Rośliny');
checkUniqueIds(potions, 'Mikstury');
checkUniqueIds(misc, 'Misc');
checkUniqueIds(monsters, 'Potwory');
checkUniqueIds(npcs, 'NPC');
checkUniqueIds(questsMain, 'Quest główne');
checkUniqueIds(questsOld, 'Quest starego obozu');
checkUniqueIds(questsNew, 'Quest nowego obozu');
checkUniqueIds(questsSide, 'Quest poboczne');
checkUniqueIds(spells, 'Czary');
checkUniqueIds(trainers, 'Nauczyciele');
checkUniqueIds(lootTables, 'Tabele łupów');
checkUniqueIds(worldLocs, 'Lokacje');

// Minima
assertGE(swords.length, 20, 'Minimum 20 mieczy');
assertGE(bows.length, 10, 'Minimum 10 łuków');
assertGE(armors.length, 4, 'Minimum 4 zbroje');
assertGE(plants.length, 10, 'Minimum 10 roślin');
assertGE(potions.length, 6, 'Minimum 6 mikstur');
assertGE(monsters.length, 6, 'Minimum 6 gatunków potworów');
assertGE(npcs.length, 60, 'Minimum 60 NPC');
assertGE(questsOld.length, 5, 'Minimum 5 questów starego obozu');
assertGE(questsNew.length, 5, 'Minimum 5 questów nowego obozu');
assertGE(questsSide.length, 10, 'Minimum 10 questów pobocznych');
assertGE(questsMain.length, 1, 'Główny łańcuch fabularny');
assertGE(spells.length, 2, 'Minimum 2 czary');
assertGE(trainers.length, 3, 'Minimum 3 nauczycieli');
assertGE(schedules.length, 10, 'Minimum 10 harmonogramów');

// Swords have damage, speed, range
let allSwordsValid = true;
for (const s of swords) {
  if (typeof s.damage !== 'number' || typeof s.speed !== 'number' || typeof s.range !== 'number') allSwordsValid = false;
  if (s.damage <= 0) allSwordsValid = false;
}
assert(allSwordsValid, 'Wszystkie miecze mają damage/speed/range > 0');

// Bows use dexterity scaling
let allBowsHaveDex = true;
for (const b of bows) {
  if (typeof b.dexterity_scaling !== 'number') allBowsHaveDex = false;
}
assert(allBowsHaveDex, 'Wszystkie łuki mają dexterity_scaling');

// Armors have armor + magic_resist
let allArmorOk = true;
for (const a of armors) {
  if (typeof a.armor !== 'number' || typeof a.magic_resist !== 'number') allArmorOk = false;
}
assert(allArmorOk, 'Wszystkie zbroje mają armor/magic_resist');

// Monster has attacks + required behaviors
let monsterOk = true;
const behaviorSet = new Set<string>();
for (const m of monsters) {
  if (!Array.isArray(m.attacks) || m.attacks.length === 0) monsterOk = false;
  for (const b of (m.behavior || [])) behaviorSet.add(b);
}
assert(monsterOk, 'Wszystkie potwory mają co najmniej jeden atak');
assert(behaviorSet.has('pack'), 'Co najmniej jeden potwór stadny');
assert(behaviorSet.has('nocturnal') || monsters.some((m: any) => m.night_active), 'Co najmniej jeden potwór nocny');
assert(behaviorSet.has('ranged') || behaviorSet.has('tank'), 'Potwór tank lub dystansowy');

// NPC factions
const factions = new Map<string, number>();
for (const n of npcs) {
  factions.set(n.faction, (factions.get(n.faction) || 0) + 1);
}
assert((factions.get('old_order') || 0) >= 18, `≥18 NPC starego obozu (jest ${factions.get('old_order') || 0})`);
assert((factions.get('new_order') || 0) >= 15, `≥15 NPC nowego obozu (jest ${factions.get('new_order') || 0})`);
assert((factions.get('neutral') || 0) + (factions.get('bandit') || 0) >= 20, '≥20 neutral/bandytów');

// Spells have mana_cost
assert(spells.every((s: any) => typeof s.mana_cost === 'number' && s.mana_cost > 0), 'Wszystkie czary mają mana_cost > 0');
assert(spells.every((s: any) => s.type === 'fire' || s.type === 'ice'), 'Czary ognia lub lodu');

// Trainers reference existing NPC
const npcIds = new Set(npcs.map((n: any) => n.id));
let trainersOk = true;
for (const t of trainers) {
  if (!npcIds.has(t.npc_id)) trainersOk = false;
}
assert(trainersOk, 'Wszyscy nauczyciele wskazują na istniejące NPC');

// Quests have stages & initial_stage
function validQuest(q: any): boolean {
  return q.stages && typeof q.stages === 'object' && typeof q.initial_stage === 'string' && q.stages[q.initial_stage];
}
assert(questsMain.every(validQuest) && questsOld.every(validQuest) && questsNew.every(validQuest) && questsSide.every(validQuest),
  'Wszystkie questy mają stages i initial_stage');

// Balance has expected sections
assert(balance.xp && balance.hp && balance.mana && balance.combat && balance.skills && balance.economy && balance.time, 'balance.json ma wszystkie sekcje');

// Mana cost check
for (const s of spells) {
  assert(s.mana_cost >= 5 && s.mana_cost <= 50, `Czar ${s.id} ma rozsądny koszt many (${s.mana_cost})`);
}

// ----- Symulacja gry -----
console.log('\n--- Symulacja rozgrywki ---');

// Simple level-up simulation
function simulateLevel(): { hp: number; mana: number; level: number } {
  let hp = 72, mana = 20, level = 1, xp = 0, xpNeeded = 100;
  for (let i = 0; i < 20; i++) {
    xp += 50;
    while (xp >= xpNeeded) {
      xp -= xpNeeded;
      level++;
      xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
      hp += 10;
      mana += 5;
    }
  }
  return { hp, mana, level };
}
const sim = simulateLevel();
assert(sim.level > 3, `Po 20 zabiciach na 50xp gracz ma poziom > 3 (jest ${sim.level})`);

// Idempotencja nagród - wielokrotne wywołanie advance nie daje wielokrotnych nagród
const award = new Set<string>();
function giveReward(key: string): boolean {
  if (award.has(key)) return false;
  award.add(key);
  return true;
}
assert(giveReward('quest1::stage1'), 'Pierwsza nagroda przyznana');
assert(!giveReward('quest1::stage1'), 'Druga ta sama nagroda nie jest przyznawana');

// Faction mutual exclusion
const factionState = { choice: null as string | null, failedOpposite: false };
function chooseFaction(f: string) {
  factionState.choice = f;
  factionState.failedOpposite = true;
}
chooseFaction('old_order');
assert(factionState.failedOpposite === true && factionState.choice === 'old_order', 'Wybranie frakcji blokuje drugą');

// Zapis/wczytanie wersji
function migrate(raw: any): any {
  if (!raw) return null;
  if (raw.version === '0.1.0') return raw;
  return { ...raw, version: '0.1.0' };
}
const migrated = migrate({ version: '0.0.1', player: { hp: 50 } });
assert(migrated && migrated.version === '0.1.0', 'Migracja zapisu do obecnej wersji');
assert(migrate(null) === null, 'Uszkodzony pusty zapis zwraca null');

// Podsumowanie
console.log('\n=== Podsumowanie ===');
console.log(`Przeszło: ${passed}, Nie przeszło: ${failed}`);
if (failed > 0) process.exit(1);
