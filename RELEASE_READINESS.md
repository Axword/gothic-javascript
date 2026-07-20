# RELEASE_READINESS.md — ocena gotowości (po Iteracji 1)

**Status: CONDITIONALLY READY — ALPHA**

Build produkcyjny przechodzi, testy automatyczne przechodzą (73/73), dane są spójne, podstawowa pętla gry działa. Pozostają problemy P2/P3.

## Spełnione kryteria
- ✅ Build produkcyjny `npm run build` przechodzi bez błędów
- ✅ TypeScript (`tsc --noEmit`) bez błędów
- ✅ 73/73 testów automatycznych przechodzi
- ✅ 0 błędów walidatora danych
- ✅ Podstawowa pętla gry: ruch, walka wręcz/na dystans/magią, NPC z dialogami, skrzynie z lockpickingiem, zbieranie przedmiotów, questy, zapis/wczytanie
- ✅ Dzień/noc z nakładką wizualną
- ✅ NPC 66 szt., questy 1+5+5+10 = 21, czary 2, broń 30, zbroje 6, rośliny 10, potwory 6
- ✅ Wzajemne wykluczanie frakcji, wybór frakcji u lidera
- ✅ System kradzieży, świadkowie i reakcja
- ✅ Nauczyciele z kosztami w złocie i PN, odblokowujący czary
- ✅ Śmierć gracza i game-over ekran
- ✅ Proceduralna muzyka (drone + melodia) i 20+ SFX (walka, UI, czary, przedmioty, fanfary)
- ✅ Ekran epilogu po finale z podsumowaniem (poziom, złoto, questy)
- ✅ Sekwencja finałowa z liniami tekstu dla każdej frakcji
- ✅ Migający napis "kliknij aby rozpocząć" w menu głównym
- ✅ Opcje audio (muzyka/efekty WŁ/WYŁ) w menu

## Pozostałe problemy P2/P3 (nie blokują alpha)
1. Brak pełnego UI slotów zapisu (obecnie 1 slot + menu pokazuje najnowszy) — P2
2. Rangki treningu walki nie dodają jeszcze bonusów do obrażeń (F12) — P2
3. Brak kolizji pocisków z przeszkodami (G4) — P3
4. Brak grupowego alarmu NPC przy przestępstwie (G8) — P3
5. Brak pełnej karty postaci (K4) i porównania statystyk (K3) oraz pełnej karty ekwipunku (K2) — P2
6. NPC schedule dla 52 z 66 NPC nie istnieje (fallback działa) — P2
7. Brak testu E2E Playwright w tym środowisku — P2
8. Rozszerzenie dialogów dla pozostałych NPC (obecnie pełny dialog dla rozbitka, fallbacki dla reszty) — P2

## Rekomendacja
Gra jest uruchamialna w przeglądarce (`npm run dev` lub `npm run preview` po buildzie) i pozwala:
- poruszać się po świecie,
- rozmawiać z NPC, uczyć się u nauczycieli,
- walczyć z potworami (miecz/łuk/magia),
- zbierać przedmioty i rośliny,
- otwierać skrzynie minigrą wytrychów,
- okradać NPC z ryzykiem wykrycia,
- awansować postać (HP/MP/PN),
- robić questy kandydackie i dołączyć do frakcji,
- zapisywać i wczytywać grę.

Aby osiągnąć status READY (beta), należy zamknąć powyższe P2, szczególnie:
1. dodać dźwięk i muzykę,
2. dodać ekran epilogu po finale,
3. rozwinąć UI (slot zapisu, karta postaci, pełny ekwipunek),
4. rozszerzyć harmonogramy NPC,
5. dodać test E2E Playwright.
