/**
 * Narzędzie do walidacji danych JSON
 * Uruchom: npx tsx tools/validate-data.ts
 */
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'public/data/json');
const SCHEMAS_DIR = path.resolve(process.cwd(), 'public/data/schemas');

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

const results: ValidationResult[] = [];
const allIds = new Map<string, string[]>();

function validateFile(filePath: string): ValidationResult {
  const result: ValidationResult = { file: path.basename(filePath), errors: [], warnings: [] };
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let data: any;
    
    try {
      data = JSON.parse(content);
    } catch (e: any) {
      result.errors.push(`Błąd składni JSON: ${e.message}`);
      return result;
    }
    
    if (!Array.isArray(data) && typeof data !== 'object') {
      result.errors.push('Plik powinien zawierać tablicę lub obiekt');
      return result;
    }
    
    if (Array.isArray(data)) {
      // Sprawdź duplikaty ID
      const ids = new Set<string>();
      for (const item of data) {
        if (item.id) {
          if (ids.has(item.id)) {
            result.errors.push(`Duplikat ID: ${item.id}`);
          }
          ids.add(item.id);
          
          if (allIds.has(item.id)) {
            result.warnings.push(`ID "${item.id}" występuje też w: ${allIds.get(item.id)!.join(', ')}`);
          }
          allIds.set(item.id, [path.basename(filePath)]);
        }
      }
      
      // Sprawdź wymagane pola
      for (const item of data) {
        if (item.name && typeof item.name !== 'string') {
          result.errors.push(`Pole "name" w ${item.id || '???'} nie jest stringiem`);
        }
        if (item.value !== undefined && (typeof item.value !== 'number' || item.value < 0)) {
          result.warnings.push(`Pole "value" w ${item.id || '???'} jest ujemne lub nie jest liczbą`);
        }
      }
    }
    
    console.log(`✓ ${path.basename(filePath)} - OK (${Array.isArray(data) ? data.length : 1} rekordów)`);
    
  } catch (e: any) {
    result.errors.push(`Nie można odczytać pliku: ${e.message}`);
  }
  
  return result;
}

// Waliduj wszystkie JSON
const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

console.log('=== Walidacja danych JSON ===\n');

for (const file of jsonFiles) {
  const result = validateFile(path.join(DATA_DIR, file));
  results.push(result);
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
    r.warnings.forEach(w => console.log(`  OSTRZEŻENIE: ${w}`));
  }
}

console.log(`\nRazem: ${results.length} plików, ${totalErrors} błędów, ${totalWarnings} ostrzeżeń`);

if (totalErrors > 0) {
  process.exit(1);
} else {
  console.log('\n✓ Wszystkie dane są poprawne!');
}
