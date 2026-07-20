# PROGRESS.md — Postęp prac

## Ukończone (po audycie Agent 2 — 2026-07-19)
- [x] Struktura projektu (Vite + TypeScript + Phaser 3, strict mode)
- [x] Build produkcyjny przechodzący bez błędów
- [x] 73 automatyczne testy (formuły balansu, dane, idempotencja, migracje zapisów)
- [x] Pełny walidator danych (referencje, duplikaty, minima zawartości, wymagane pola)
- [x] Sceny: Boot, Menu, Game, UI, Dialog — działające
- [x] System ruchu gracza (WASD, bieg, kamera follow)
- [x] Proceduralna mapa z dwoma obozami, drogą, drzewami, skałami, biomami
- [x] Dzień/noc z działającym zegarem i nakładką nocną
- [x] NPC (66 szt.) z harmonogramami, dialogami, agresją po przestępstwie, nauczycielami
- [x] Dialogi oparte o JSON (dialogues_intro.json) z warunkami, akcjami, opcjami, liczbami 1-9
- [x] Potwory (6 typów) z AI: idle/patrol/chase/attack/return
- [x] Walka: miecz (z wymaganiami broni, scalingiem siły), łuk (strzały, zręczność), magia (mana, cooldown, fire/ice)
- [x] Obrażenia gracza od potworów, game-over ekran
- [x] System kradzieży (kieszonkowa, cudze skrzynie, świadkowie, eskalacja)
- [x] Minigra otwierania zamków (3 trudności, sekwencja L/P, wytrychy)
- [x] Skrzynie w świecie z łupem i własnością, zapis otwarcia
- [x] Zbieralne przedmioty/rośliny w świecie
- [x] System questów: start, progresja, rather nagrody, idempotencja, zapis/load, wybór frakcji, wzajemne wykluczanie
- [x] Nauczyciele (4 trenerów) — koszt złoto/PN, odblokowanie umiejętności i czarów
- [x] Skórowanie zależne od rangi
- [x] Zapis/wczytanie (IndexedDB + localStorage), autosave (F5), quickload (F9), migracja wersji, obsługa uszkodzonych zapisów
- [x] HUD: HP/MP/XP, poziom, złoto, broń, czas, komunikaty, tryb walki
- [x] Menu główne i pauza (Nowa/Wczytaj/Opcje/Wyjście/Wznów/Zapisz)
- [x] Ekwipunek (I) z listą, liczbami, klik aby użyć/wyposażić
- [x] Dziennik zadań (J) z aktywnymi i ukończonymi
- [x] Karta postaci (C) — komunikat ze statami
- [x] 20 mieczy, 10 łuków, 6 zbroi, 10 roślin, 6 mikstur, misc z złotem/wytrychami/kluczami/trofeami
- [x] Wybór frakcji u lidera (Komendant Starego / Sęp Wolnych) i blokada drugiej ścieżki
- [x] Proceduralne asety: tile, ikony, postacie, potwory, VFX, UI
- [x] Dokumentacja audytu (CHECKLIST, LOG, BUGS, TEST_RESULTS, RELEASE_READINESS)

## W toku (P2)
- [ ] Pełne dialogi dla wszystkich 66 NPC
- [ ] Dźwięk i muzyka
- [ ] Ekran epilogu po ukończeniu finału
- [ ] Pełna karta postaci z podglądem statystyk i porównaniem
- [ ] Pełny UI ekwipunku z kategoriami/ikonami/opisami
- [ ] Slotowy ekran zapisu z nazwami, datami i podglądem
- [ ] Harmonogramy dla pozostałych 52 NPC
- [ ] AI potworów reagujące na dzień/noc (np. Shade aktywny tylko nocą)
- [ ] Grupowy alarm NPC po przestępstwie
- [ ] Bonusy do obrażeń za rangi walki
- [ ] Rozszerzone tabele łupów (losowanie zamiast predefiniowanej listy)
- [ ] Kolizja pocisków z przeszkodami

## Następny krok
Zamknięcie P2: dźwięk, epilog, pełne okno ekwipunku i zapisów, rozszerzone harmonogramy.

## Status
`CONDITIONALLY READY — ALPHA` — gra jest uruchamialna, podstawowa pętla grywalna od początku do wyboru frakcji.
