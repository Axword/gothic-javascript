# AUDIT LOG — Krwawy Szlak (Phaser 3 + TypeScript + Vite)

## Iteracja 1 — Wstępny audyt (2026-07-19)

### Rozpoznanie
- **Stos technologiczny**: TypeScript + Phaser 3.90 + Vite 8 + Ajv
- **Package manager**: npm
- **Skrypty**: `dev`, `build`, `preview`, `validate-data`, `lint` (tsc --noEmit), `test`
- **Build**: `dist/` — build produkcyjny przechodzi (1.27 MB JS, ostrzeżenie o wielkości chunków).
- **Dane JSON**: 20 plików w `public/data/json/`, schematy w `public/data/schemas/` (ale walidator nie używa Ajv ani schematów — patrz BUG-001).
- **Systemy**: Player, NPC, Monster, TimeSystem, SaveSystem (IndexedDB+localStorage), QuestSystem (podstawowy), ProjectileSystem, LockpickMinigame, CrimeSystem, ProceduralAssets, DataLoader.
- **Sceny**: BootScene, MenuScene, GameScene, UIScene, DialogScene.
- **Testy**: `tools/test.ts` — 14 testów formuł balansu (nie dotyczy faktycznego kodu gry — duplikują formuły zamiast importować je).
- **Walidator**: `tools/validate-data.ts` — sprawdza tylko poprawność składni JSON i duplikaty ID, NIE używa JSON Schema ani Ajv, NIE waliduje referencji między plikami.

### Wykonane komendy
| Komenda | Wynik |
|---|---|
| `npm install` | OK (31 pakietów) |
| `npm run lint` (tsc --noEmit) | OK, brak błędów typów |
| `npm run build` | OK, 0 błędów (ostrzeżenie >500 kB) |
| `npm run validate-data` | OK wg własnego skryptu (ale skrypt nie sprawdza referencji, schematów, wymaganych pól) |
| `npm run test` | 14/14 przechodzi, ale testy nie testują kodu runtime |

### Wykryte problemy P0/P1
Pełna lista w `BUGS.md`. Najważniejsze:

1. **BUG-001**: Walidator `validate-data.ts` nie używa Ajv ani schematów JSON — fałszywie oznacza wszystko jako OK.
2. **BUG-002**: DialogScene używa hardcodowanych powitań zamiast `dialogues_intro.json`. Dane JSON dialogów są martwe.
3. **BUG-003**: magicAttack zużywa stałe 15 many zamiast `spell.mana_cost`, i wybiera zaklęcie źle (zawsze fire_bolt z powtarzającą się inkremenacją indeksu).
4. **BUG-004**: Player.start nie inicjalizuje ekwipunku startowego (brak strzał, wytrychów, złota zgodnego z balance.json).
5. **BUG-005**: Player.takeDamage używa formuły redukcji `armor*0.5` zamiast formuły z balance.json (1%/pkt, max 80%).
6. **BUG-006**: NPC.followSchedule jest pusty — teleportery/pozycje nie są używane, schedule nie działa. NPC stoją w miejscu lub losowo dryfują.
7. **BUG-007**: Load Game w menu nie wczytuje zapisu — zawsze zaczyna nową grę.
8. **BUG-008**: Brak systemu wyboru frakcji i blokady drugiej ścieżki. `player.faction` nigdy nie jest ustawiane przez grę.
9. **BUG-009**: Brak integracji nauczycieli/uczenia — `trainers.json` jest martwym plikiem, nie ma sposobu na naukę umiejętności.
10. **BUG-010**: Brak skrzyń, roślin, podnoszonych przedmiotów w świecie — loot w grze istnieje tylko z potworów.
11. **BUG-011**: LockpickMinigame nie jest wywoływany w grze (brak skrzyń/interakcji z zamkami).
12. **BUG-012**: CrimeSystem jest wywołany tylko dla kradzieży z NPC (SPACE), ale nie ma reakcji świadków w świecie ani eskalacji.
13. **BUG-013**: Monster.attacks[0] zakłada, że potwór ma co najmniej 1 atak — brak walidacji.
14. **BUG-014**: TimeSystem.update jest wołany co sekundę z GameScene a nie z delta, więc czas nie płynie.
15. **BUG-015**: Nakładka nocy (nightOverlay) jest tworzona ale nigdy nie aktualizowana — dzień/noc nie jest widoczny.
16. **BUG-016**: BackToMenu w MenuScene tworzy rekurencję sceny MenuScene zamiast wracać do pustego menu.
17. **BUG-017**: loadGame w MenuScene ignoruje faktyczny zapis, zawsze wywołuje newGame.
18. **BUG-018**: Equip/unequip przedmiotów z ekwipunku nie jest zaimplementowany — klik nie działa.
19. **BUG-019**: Gracz nie otrzymuje obrażeń od potworów w praktyce (potwór atakuje dystans 0, brak kolizji).
20. **BUG-020**: Brak zakończeń/epilogu po finale questu.
21. **BUG-021**: ProjectileSystem nie sprawdza kolizji z graczem (dla wrogich pocisków).
22. **BUG-022**: Idempotencja nagród questów — brak ochrony przed wielokrotnym przyznawaniem.
23. **BUG-023**: Brak ekwipunku startowego (misc_arrow, misc_lockpick_iron, potion_healing_small).
24. **BUG-024**: NPC.setInteractive tylko gdy spawn — brak dialogu przez E (działa tylko klik myszą na NPC, nie klawisz E).
25. **BUG-025**: Dane `npc_schedules.json` (14) nie pokrywają się z liczbą NPC (66).
26. **BUG-026**: Brak walidacji wersji zapisu przy wczytywaniu.
27. **BUG-027**: Opcje gry to placeholder "Opcje - w budowie".
28. **BUG-028**: Opuszczenie dialogu nie wznawia GameScene poprawnie — ESC pozostawia pauzę.
29. **BUG-029**: Brak śmierci/respawnu gracza — gdy HP=0, nic się nie dzieje.
30. **BUG-030**: Brak zniszczenia/respawnu projektów i pożywki — potencjalny wyciek pamięci (choć projectileSystem czyści lifetime).
31. **BUG-031**: Loot z potworów zawiera tylko predefiniowane ID skór/trofeów, nie używa loot_tables.json.
32. **BUG-032**: Brak łuków w danych NPC — łuki można użyć bez wyposażonego łuku.

### Następne kroki
Naprawa P0/P1 w kolejności:
1. Dodać prawdziwy walidator z Ajv i schematami oraz referencjami.
2. Zintegrować dialogi z JSON.
3. Naprawić czas, noc, obrażenia, ekwipunek startowy, magię (koszt many).
4. Dodać działający load game, menu opcji, śmierć gracza.
5. Dodać skrzynie i lockpicking do gry, skórowanie zależne od umiejętności, nauczycieli.
6. Uzupełnić quest system o wybór frakcji i blokadę.
7. Dodać brakujące testy integracyjne.
