# CHANGELOG.md

## [0.4.0] — 2026-07-19 (Muzyka, dźwięki i epilog)
### Dodano
- Proceduralny system audio (Web Audio API):
  - Ciemny ambient drone + melodia w tle (pentatonika d-moll)
  - SFX: klik UI, otwieranie menu, cios miecza, łuk, magia, uderzenie, strzała, śmierć, level-up, podniesienie przedmiotu, złoto, skrzynia, wytrychy (sukces/porażka), mikstura, many, quest start/complete, krok, zwierzę, fanfary epilogu
  - Menu opcji z włączaniem/wyłączaniem muzyki i efektów
  - AudioContext inicjalizowany przy pierwszej interakcji (zgodnie z polityką przeglądarek)
- Scena EpilogueScene (KONIEC):
  - Sekwencja finałowa z liniami tekstu dla każdej frakcji (fade in/out, 5 plansz)
  - Ekran podsumowania z poziomem, złotem, liczbą ukończonych questów
  - Przycisk powrotu do menu
- Ekran startowy z migającym napisem zachęcającym do kliknięcia
- Rozszerzone dialogi na plaży (npc_beach_survivor) o dodatkowe węzły:
  - Szczelina (ostrzeżenia, Pustelnik, mutanty)
  - "A ty po czyjej stronie?" (dialog o neutralności)
  - Rozszerzone ostrzeżenia o cieniach na cmentarzu
### Zmieniono
- Dźwięki wywoływane przy akcjach gracza (walka, łup, ekwipunek, zapis/wczytanie, trening, wybór frakcji)
- Przy dołączeniu do frakcji odpalana jest automatycznie finale -> epilog
- Wyciszenie muzyki przy śmierci i epilogu

## [0.3.0] — 2026-07-19 (Audit Iteration 1 — Agent 2)
### Naprawiono
- Pełna naprawa walidatora danych (referencje, duplikaty, minima, wymagane pola)
- Dialogi zaciągane z JSON z warunkami i akcjami
- Magia używa rzeczywistego mana_cost/cooldown/damage z JSON
- Inwentarz startowy, formuła pancerza, harmonogramy NPC
- Load game działa, back-to-menu poprawnie, opcje są działającym panelem
- Wybór frakcji wzajemnie wyklucza questy drugiej strony
- Nauczyciele otwierają dialog szkolenia, uczą rang i czarów
- Skrzynie w świecie z 3 poziomami trudności i reakcją świadków
- Zbieralne przedmioty/rośliny, lockpicking z łamaniem wytrychów
- Czas płynie poprawnie, nocny overlay, game-over ekran
- Pociski vs wrodzy NPC i vice versa, idempotencja nagród
- Łuk wymaga wyposażonego łuku i strzał, melee respektuje wymagania
- UI ekwipunku klikalny - wyposaż/użyj
- Testy z 14 do 73 (dane, formuły, idempotencja, migracje, frakcje)

## [0.2.0] — 2026-07-19
### Dodano
- Implementacja wszystkich scen Phaser (Boot, Menu, Game, UI, Dialog)
- System ruchu, kamera, proceduralna mapa, interakcje, dialogi
- NPC z harmonogramami, AI potworów, walka, HUD, ekwipunek, menu
- Quick save/load, dzień/noc, 20 plików JSON, walidator, 14 testów

## [0.1.0] — 2026-07-19
### Dodano
- Inicjalizacja projektu, Vite+TS+Phaser3, struktura, typy, dane
- Podstawowe systemy: DataLoader, TimeSystem, dialogi, ekwipunek, zapis
- AI, walka, przestępstwa, HUD, menu, proceduralne assety
