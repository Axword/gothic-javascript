# CHANGELOG.md

## [0.2.0] — 2026-07-19
### Dodano
- Implementacja wszystkich scen Phaser (Boot, Menu, Game, UI, Dialog)
- System ruchu gracza (WASD, strzałki, bieg z Shift)
- Kamera follow z zoomem 2x
- Proceduralna mapa z drzewami, skałami, budynkami, ścieżkami
- System interakcji (E - rozmowa z NPC)
- System dialogów z wyborami i warunkami
- NPC z harmonogramami (14 NPC)
- AI potworów (6 typów, stany: idle/patrol/chase/attack/return)
- Walka potworów z graczem (obrażenia, paski zdrowia)
- HUD (HP, mana, XP, poziom, złoto, broń, czas)
- Ekwipunek (podstawowe otwieranie przez I)
- Menu główne z przyciskami
- Pauza z opcjami
- System zapisu/wczytania (IndexedDB + localStorage)
- Quick save (F5) / Quick load (F9)
- System dnia/nocy (zegar, czas)
- 20 plików danych JSON z pełną walidacją
- 14 testów automatycznych
- Tools: validate-data, test runner
- TypeScript strict mode - czysty build

## [0.1.0] — 2026-07-19
### Dodano
- Inicjalizacja projektu: Vite + TypeScript + Phaser 3
- Struktura katalogów i dokumentacja
- Definicje typów TypeScript (items, NPC, questy, dialogi, świat, walka, zapis)
- JSON Schema dla walidacji danych
- Przykładowe dane JSON (items, NPC, potwory, questy, dialogi, harmonogramy)
- System ładowania i walidacji danych (DataLoader)
- Podstawowa scena gry z mapą proceduralną
- System dnia/nocy (TimeSystem)
- System interakcji z NPC
- Podstawowy system dialogów
- System ekwipunku
- System zapisu/wczytania (IndexedDB + JSON)
- System rozwoju postaci i nauczycieli
- System walki (miecz, łuk, magia)
- System AI (podstawowe rutyny)
- System przestępstw
- Pełny HUD i UI
- Menu główne i pauza
- Generowanie proceduralnych assetów graficznych
