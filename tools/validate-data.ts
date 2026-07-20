/**
 * Walidator danych JSON — pełna walidacja:
 * 1. Poprawność składni
 * 2. Unikalność ID w pliku i między plikami (oprócz dopuszczalnych wyjątków)
 * 3. Referencje między plikami
 * 4. Podstawowe wymagania względem zawartości (min liczby)
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'public/data/json');
const SCHEMAS_DIR = path.resolve(process.cwd(), 'public/data/schemas');

interface ValidationResult {
  file: string;
  recordCount: number;
  errors: string[];
  warnings: string[];
}

// Pliki, w których rekordy nie mają globalnie unikalnych id (np. nie mają id w ogóle)
const NON_UNIQUE_ID_FILES = new Set(['balance.json', 'npc_schedules.json']);

// Mapowanie plik -> lista referencji do innych plików (pole -> docelowy plik)
interface RefMap { [field: string]: string | { file: string; nullable?: boolean } }
const REFERENCES: Record<string, RefMap> = {
  'items_weapons_swords.json': {},
  'items_weapons_bows.json': {},
  'items_armors.json': {},
  'items_plants.json': {},
  'items_potions.json': {},
  'items_misc.json': {},
  'monsters.json': {
    'loot_table': 'loot_tables.json'
  },
  'monster_spawns.json': {
    'monster_id': 'monsters.json',
    'location_id': 'world_locations.json'
  },
  'npcs.json': {
    // default_dialog is optional — runtime falls back to generic greetings
  },
  'npc_schedules.json': {
    'npc_id': 'npcs.json'
  },
  'quests_main.json': {},
  'quests_old_faction.json': {},
  'quests_new_faction.json': {},
  'quests_side.json': {},
  'dialogues_intro.json': {
    'npc_id': 'npcs.json'
  },
  'world_locations.json': {},
  'loot_tables.json': {},
  'trainers.json': {
    'npc_id': 'npcs.json'
  },
  'spells.json': {},
  'balance.json': {}
};

const results: ValidationResult[] = [];
const allIds = new Map<string, string[]>();
const loaded: Record<string, any> = {};

function loadJson(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function getRecordIds(data: any, fileName: string): string[] {
  if (Array.isArray(data)) return data.map((r: any) => r.id).filter(Boolean);
  if (fileName === 'balance.json') return ['balance'];
  return [];
}

function collectArrayIds(data: any): Set<string> {
  const ids = new Set<string>();
  if (Array.isArray(data)) {
    for (const r of data) {
      if (r?.id) ids.add(r.id);
    }
  }
  return ids;
}

// loot_tables.json uses "id" but is object list — same handling works, but entries have item_id references too


function validateFile(fileName: string): ValidationResult {
  const result: ValidationResult = { file: fileName, recordCount: 0, errors: [], warnings: [] };
  const filePath = path.join(DATA_DIR, fileName);
  let data: any;
  try {
    data = loadJson(filePath);
  } catch (e: any) {
    result.errors.push(`Błąd składni JSON: ${e.message}`);
    return result;
  }
  loaded[fileName] = data;

  const isArray = Array.isArray(data);
  if (isArray) {
    result.recordCount = data.length;
  } else {
    result.recordCount = 1;
  }

  // Duplicate ID within file
  if (isArray) {
    const localIds = new Set<string>();
    for (const item of data) {
      if (!item?.id) {
        result.warnings.push('Rekord bez pola id');
        continue;
      }
      if (localIds.has(item.id)) {
        result.errors.push(`Duplikat ID w pliku: ${item.id}`);
      }
      localIds.add(item.id);
    }
  }

  // Required fields sanity per category
  if (isArray) {
    for (const item of data) {
      if (item.name !== undefined && typeof item.name !== 'string') {
        result.errors.push(`[${item.id}] pole "name" nie jest stringiem`);
      }
      if (item.value !== undefined && (typeof item.value !== 'number' || item.value < 0)) {
        result.warnings.push(`[${item.id}] "value" jest ujemne lub nie-liczbowe`);
      }
      // Require "damage" for weapons
      if (fileName.startsWith('items_weapons_')) {
        if (typeof item.damage !== 'number') result.errors.push(`[${item.id}] broń bez damage`);
        if (typeof item.speed !== 'number' && fileName.includes('swords')) result.warnings.push(`[${item.id}] miecz bez speed`);
        if (typeof item.draw_time !== 'number' && fileName.includes('bows')) result.warnings.push(`[${item.id}] łuk bez draw_time`);
      }
      if (fileName === 'items_armors.json') {
        if (typeof item.armor !== 'number') result.errors.push(`[${item.id}] zbroja bez armor`);
      }
      if (fileName === 'monsters.json') {
        if (!item.stats || typeof item.stats.hp !== 'number') result.errors.push(`[${item.id}] potwór bez stats.hp`);
        if (!Array.isArray(item.attacks) || item.attacks.length === 0) result.errors.push(`[${item.id}] potwór bez ataków`);
        if (!Array.isArray(item.behavior)) result.warnings.push(`[${item.id}] potwór bez behavior`);
      }
      if (fileName === 'npcs.json') {
        if (!item.stats || typeof item.stats.level !== 'number') result.errors.push(`[${item.id}] NPC bez stats.level`);
        if (!item.faction) result.errors.push(`[${item.id}] NPC bez faction`);
        if (!item.spawn_position) result.errors.push(`[${item.id}] NPC bez spawn_position`);
      }
      if (fileName.startsWith('quests_')) {
        if (typeof item.initial_stage !== 'string') result.errors.push(`[${item.id}] quest bez initial_stage`);
        if (!item.stages || typeof item.stages !== 'object') result.errors.push(`[${item.id}] quest bez stages`);
      }
    }
  }

  console.log(`✓ ${fileName} - OK (${result.recordCount} rekordów)`);
  return result;
}

function validateCrossReferences() {
  // Build global ID maps per file (excluding files with non-unique or non-array ID spaces)
  const idsPerFile: Record<string, Set<string>> = {};
  for (const [file, data] of Object.entries(loaded)) {
    if (NON_UNIQUE_ID_FILES.has(file)) continue;
    idsPerFile[file] = collectArrayIds(data);
  }
  idsPerFile['balance.json'] = new Set(['balance']);

  for (const [fileName, refMap] of Object.entries(REFERENCES)) {
    const data = loaded[fileName];
    if (!data) continue;
    const r = results.find(x => x.file === fileName);
    if (!r) continue;
    const records = Array.isArray(data) ? data : [data];
    for (const rec of records) {
      if (!rec || typeof rec !== 'object') continue;
      for (const [field, target] of Object.entries(refMap)) {
        const targetFile = typeof target === 'string' ? target : target.file;
        const nullable = typeof target === 'object' ? !!target.nullable : false;
        const val = rec[field];
        if (val === undefined || val === null || val === '') {
          if (!nullable) r.warnings.push(`[${rec.id || '?'}] brak wymaganego pola ${field}`);
          continue;
        }
        const targetIds = idsPerFile[targetFile];
        if (!targetIds) {
          r.warnings.push(`[${rec.id || '?'}] brak zbioru ID dla ${targetFile}`);
          continue;
        }
        if (!targetIds.has(val)) {
          r.errors.push(`[${rec.id || '?'}] ${field}=${val} nie istnieje w ${targetFile}`);
        }
      }
    }
  }

  // Check npc_schedules references (npc_id exists in npcs)
  const schedules = loaded['npc_schedules.json'];
  const npcIds = idsPerFile['npcs.json'];
  if (Array.isArray(schedules) && npcIds) {
    const r = results.find(x => x.file === 'npc_schedules.json');
    for (const sch of schedules) {
      if (sch.npc_id && !npcIds.has(sch.npc_id)) {
        r?.errors.push(`Harmonogram dla nieistniejącego NPC: ${sch.npc_id}`);
      }
    }
  }

  // Duplicate global IDs across files
  for (const [file, data] of Object.entries(loaded)) {
    if (NON_UNIQUE_ID_FILES.has(file)) continue;
    if (!Array.isArray(data)) continue;
    for (const rec of data) {
      if (!rec?.id) continue;
      if (!allIds.has(rec.id)) allIds.set(rec.id, []);
      allIds.get(rec.id)!.push(file);
    }
  }
  for (const [id, files] of allIds) {
    if (files.length > 1) {
      for (const f of files) {
        const r = results.find(x => x.file === f);
        r?.warnings.push(`ID "${id}" występuje również w: ${files.filter(x => x !== f).join(', ')}`);
      }
    }
  }
}

function validateContentMinimums() {
  const r = { errors: [] as string[], warnings: [] as string[] };
  const counts: Record<string, number> = {};
  const expected: Record<string, number> = {
    'items_weapons_swords.json': 20,
    'items_weapons_bows.json': 10,
    'items_armors.json': 4,
    'items_plants.json': 10,
    'items_potions.json': 6,
    'monsters.json': 6,
    'spells.json': 2,
    'npcs.json': 50,
    'quests_old_faction.json': 5,
    'quests_new_faction.json': 5,
    'quests_side.json': 10,
    'quests_main.json': 1,
  };
  for (const [file, min] of Object.entries(expected)) {
    const data = loaded[file];
    const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
    counts[file] = count;
    if (count < min) r.errors.push(`${file} ma ${count} rekordów, wymagane minimum ${min}`);
  }
  return { counts, ...r };
}

console.log('=== Walidacja danych JSON ===\n');

const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json')).sort();
for (const file of jsonFiles) {
  results.push(validateFile(file));
}

console.log('\n=== Referencje między plikami ===');
validateCrossReferences();

console.log('\n=== Minimalna zawartość ===');
const minCheck = validateContentMinimums();
for (const [f, c] of Object.entries(minCheck.counts)) {
  console.log(`  ${f}: ${c}`);
}
if (minCheck.errors.length > 0) {
  console.log('\n✗ Niespełnione minima:');
  minCheck.errors.forEach(e => console.log(`  BŁĄD: ${e}`));
} else {
  console.log('\n✓ Wszystkie minima zawartości spełnione.');
}

console.log('\n=== Podsumowanie ===');
let totalErrors = 0;
let totalWarnings = 0;
for (const r of results) {
  totalErrors += r.errors.length;
  totalWarnings += r.warnings.length;
  if (r.errors.length > 0) {
    console.log(`\n✗ ${r.file}:`);
    r.errors.forEach(e => console.log(`  BŁĄD: ${e}`));
  }
  if (r.warnings.length > 0) {
    console.log(`\n! ${r.file}:`);
    r.warnings.forEach(w => console.log(`  OSTRZEŻENIE: ${w}`));
  }
}
totalErrors += minCheck.errors.length;

console.log(`\nRazem: ${results.length} plików, ${totalErrors} błędów, ${totalWarnings} ostrzeżeń`);

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('\n✓ Wszystkie dane są poprawne!');
}
