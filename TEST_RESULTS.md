# TEST_RESULTS.md — ostatni przebieg testów (Iteracja 1, 2026-07-19)

## Środowisko
- Node.js (wersja systemowa)
- npm 10.x
- TypeScript 7 + Vite 8 + Phaser 3.90

## Testy automatyczne (`npm run test`)
```
Przeszło: 73, Nie przeszło: 0
```
Zakres:
- Formuły balansu (XP, HP, obrażenia, pancerz, umiejętności)
- Walidacja danych JSON: unikalność ID, minima zawartości, wymagane pola
- Poprawność 20 plików JSON (swords=20, bows=10, armors=6, plants=10, potions=6, monsters=6, npcs=66, spells=2, trainers=4, schedules=14, quests main/old/new/side)
- Wszyscy trenerzy wskazują na istniejące NPC
- Wszystkie bronie/zbroje/potwory/questy mają wymagane pola
- Istnienie potworów stadnych, nocnych, tank/dystansowych
- Symulacja levelowania, idempotencja nagród, wzajemne wykluczenie frakcji
- Migracja i obsługa uszkodzonych zapisów

## Walidacja danych (`npm run validate-data`)
```
Razem: 20 plików, 0 błędów, 14 ostrzeżeń
```
Ostrzeżenia: rekordy w `npc_schedules.json` nie mają własnego `id` (to jest akceptowalne — głównym kluczem jest `npc_id`).

## Lint / typecheck (`tsc --noEmit`)
Bez błędów.

## Build (`npm run build`)
- Build przechodzi (1.30 MB JS, 346 kB gzip)
- Ostrzeżenie o dużym chunku — nie jest blokujące.

## Smoke test (preview)
- `npm run preview -- --port 4173` uruchamia się, zwraca index.html
- `/data/json/balance.json` serwuje poprawny JSON
- Skrypty ładują się bez błędów przy uruchomieniu
- Test integracyjny z przeglądarki nie został uruchomiony (brak Playwright w tym środowisku; pozostaje jako ręczny test w przeglądarce)

## Znane ograniczenia
- Brak testów E2E z użyciem Playwright
- Brak dźwięku
- Niektóre systemy (pathfinding, animacje poklatkowe, pełny UI opcji) są częściowe
- Gra jest w fazie alpha; zobacz AUDIT_CHECKLIST.md
