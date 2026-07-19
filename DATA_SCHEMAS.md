# DATA_SCHEMAS.md — Schematy danych JSON

Wszystkie kanoniczne dane przechowywane w `public/data/json/`, walidowane przy starcie przez JSON Schema (Ajv).

## Pliki danych

| Plik | Zawartość |
|------|-----------|
| `items_weapons_swords.json` | Miecze (20+) — nazwa, opis, obrażenia, wymaganie siły, wartość, masa, asset |
| `items_weapons_bows.json` | Łuki (10+) — obrażenia, wymaganie zręczności, szybkość naciągu, asset |
| `items_armors.json` | Zbroje (4+ dostępne graczowi) — pancerz, frakcja, waga, asset |
| `items_plants.json` | Rośliny (10+) — efekty, zastosowania, rzadkość, biom |
| `items_potions.json` | Mikstury (6+) — efekty, czas trwania, wartość |
| `items_trophies.json` | Trofea/skóry — z jakiego potwora, wartość, zastosowanie |
| `items_misc.json` | Pozostałe: amunicja, wytrychy, waluta, klucze, przedmioty questowe |
| `npcs.json` | NPC — ID, imię, frakcja, statystyki, wyposażenie, ekwipunek, powiązania |
| `npc_schedules.json` | Harmonogramy NPC — przedziały czasu, lokalizacja, aktywność |
| `monsters.json` | Potwory (6+) — statystyki, zachowanie, loot, biom |
| `monster_spawns.json` | Miejsca spawnu potworów |
| `quests_main.json` | Główny wątek fabularny |
| `quests_old_faction.json` | Zadania Starego Porządku |
| `quests_new_faction.json` | Zadania Nowego Porządku |
| `quests_side.json` | Zadania poboczne |
| `dialogues_*.json` | Dialogi (podzielone na pliki według NPC/regionu) |
| `world_locations.json` | Lokacje, markery, przejścia |
| `loot_tables.json` | Tabele losowania lootu |
| `trainers.json` | Nauczyciele — statystyki/umiejętności, koszt, wymagania |
| `spells.json` | Czary — efekty, koszt many, czas rzucania |
| `balance.json` | Stałe balansu: formuły XP, obrażeń, skalowania |

## Zasady ID

- Każdy rekord ma stabilne tekstowe ID (np. `npc_old_komendant`, `item_sword_iron_longsword`)
- Odwołania między plikami przez ID
- ID nie mogą zawierać spacji ani znaków specjalnych poza `_` i `-`

## Walidacja

- Każdy plik JSON ma odpowiadający schema w `public/data/schemas/`
- Walidator sprawdza: typy, wymagane pola, duplikaty, brakujące referencje
- Uruchamiany przez `npm run validate-data` i przy starcie gry
