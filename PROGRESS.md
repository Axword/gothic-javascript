# PROGRESS.md — Postęp prac

## Ukończone
- [x] Struktura projektu (Vite + TypeScript + Phaser 3)
- [x] Dokumentacja bazowa (README, GAME_DESIGN, WORLD_AND_LORE, ARCHITECTURE, itd.)
- [x] Nazwy własne świata (Kresy Północne, Gród Straży, Wolne Chaty, itd.)
- [x] Definicje typów TypeScript
- [x] JSON Schema dla wszystkich kategorii danych
- [x] Przykładowe dane JSON (20 plików, wszystkie zwalidowane)
- [x] DataLoader z walidacją referencji
- [x] Testy automatyczne (14 testów, wszystkie przechodzą)
- [x] Build produkcyjny (Vite) - działa
- [x] System dnia/nocy (TimeSystem)
- [x] System zapisu/wczytania (IndexedDB + localStorage)
- [x] Sceny Phaser (Boot, Menu, Game, UI, Dialog) - wszystkie zaimplementowane
- [x] Proceduralne generowanie assetów graficznych (mapa, drzewa, budynki, postacie)
- [x] System ruchu gracza (WASD/strzałki + bieg z Shift)
- [x] Kamera follow z zoomem
- [x] System interakcji (E - podświetlenie i rozmowa z NPC)
- [x] System dialogów z wyborami
- [x] NPC z harmonogramami (14 NPC z harmonogramami)
- [x] AI potworów (stany: idle/patrol/chase/attack/return)
- [x] Walka (monster attacks player)
- [x] HUD (HP, mana, XP, poziom, złoto, broń, czas)
- [x] Menu główne i pauza
- [x] Ekwipunek (podstawowy)
- [x] 6 gatunków potworów z różnymi zachowaniami
- [x] 27 NPC (old_order, new_order, neutral, bandit)
- [x] 19 przedmiotów (10 mieczy, 5 łuków, 6 zbroi, 10 roślin, 6 mikstur, misc)
- [x] 3 czary (2 w danych, do implementacji rzucania)

## W toku
- [ ] System questów (stan, progresja, warunki)
- [ ] System kradzieży i przestępstw
- [ ] Minigra zamków
- [ ] Skórowanie potworów
- [ ] System nauczycieli i rozwoju
- [ ] Ekwipunek - pełna implementacja (używanie, wyposażanie)
- [ ] Walka gracza (atakowanie potworów)
- [ ] Walka łukiem i magią
- [ ] 10+ dodatkowych NPC (docelowo ~65)
- [ ] Pełna mapa świata z 9 lokacjami
- [ ] Wszystkie questy (główne + 5 stare + 5 nowe + 10 pobocznych)
- [ ] Interfejs sklepu/handlu
- [ ] Opcje gry (audio, rozdzielczość)
- [ ] Cykl dnia/nocy z widocznymi zmianami oświetlenia
- [ ] Dźwięki i muzyka proceduralna

## Następny krok
Rozszerzenie systemu walki (gracz może atakować), implementacja questów, dodanie większej liczby NPC i przedmiotów.
