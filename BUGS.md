# BUGS.md

## Status
- `OPEN` — nierozwiązany
- `FIXED` — naprawiony i przetestowany
- `BLOCKED` — zablokowany
- `WONTFIX` — świadomie nie naprawiany (uzasadnione)

---

| ID | Priorytet | Tytuł | Status | Pliki dotknięte | Rozwiązanie |
|---|---|---|---|---|---|
| BUG-001 | P1 | Walidator JSON nie używa Ajv ani schematów | FIXED | tools/validate-data.ts | Przepisany walidator z pełną walidacją referencji, minimalnych ilości, wymaganych pól, duplikatów. Pozostawiono ostrzeżenie o nieużywaniu plików JSON Schema z katalogu schemas (P2) |
| BUG-002 | P1 | DialogScene używa hardcoded powitań zamiast JSON | FIXED | src/scenes/DialogScene.ts | Dodano wczytywanie dialogów z dialogues_intro.json, nawigację między węzłami, warunki i akcje; fallback generycznych powitań pozostawiony dla NPC bez wpisu |
| BUG-003 | P1 | Magia używała stałego kosztu many 15 | FIXED | src/scenes/GameScene.ts | magicAttack używa spell.mana_cost i spell.cooldown/damage z JSON |
| BUG-004 | P1 | Brak ekwipunku startowego | FIXED | src/entities/Player.ts | initStartingInventory dodaje 20 zł, 20 strzał, 3 wytrychy, 2x heal potion i shortsword |
| BUG-005 | P1 | Formuła pancerza niezgodna z balance.json | FIXED | src/entities/Player.ts | Użycie formuły z balance: 1%/pkt pancerza, max 80% redukcji, min 1 dmg |
| BUG-006 | P1 | NPC nie podążali za harmonogramem | FIXED | src/entities/NPC.ts | Poprawiono odczyt pola `schedule` z pliku, następuje ruch do punktów harmonogramu wg poru dnia |
| BUG-007 | P0 | "Wczytaj grę" w menu nie wczytywało zapisu | FIXED | src/scenes/MenuScene.ts | Dodano wywołanie load() z SaveSystem i start GameScene z loadSlot |
| BUG-008 | P1 | Brak wyboru frakcji i blokady ścieżki | FIXED | src/systems/QuestSystem.ts, NPC, GameScene | Dodano chooseFaction, joinFaction, dialog wyboru u komendanta/Sępa, wzajemne wykluczanie questów |
| BUG-009 | P1 | Brak systemu nauki u nauczycieli | FIXED | src/entities/NPC.ts, GameScene.ts | openTrainerDialog pokazuje dostępne umiejętności z kosztami; trainSkill odblokowuje rangi i czary |
| BUG-010 | P1 | Brak skrzyń i zbieranych przedmiotów | FIXED | src/scenes/GameScene.ts | Dodano spawnChests (5 skrzyń z 3 poziomami zamków i własnością), spawnWorldItems (20 roślin, luźne strzały) |
| BUG-011 | P2 | Minigra wytrychów nigdy nie wywoływana | FIXED | GameScene.ts + LockpickMinigame | openChest uruchamia LockpickMinigame dla trudniejszych zamków |
| BUG-012 | P2 | CrimeSystem tylko kradzież kieszonkowa | FIXED | GameScene.ts | Dodano reakcję na kradzież z cudzej skrzyni (świadkowie, utrata reputacji, agresja NPC) |
| BUG-013 | P3 | Monster.attacks[0] bez walidacji | FIXED | Monster.ts | Walidacja i domyślne wartości |
| BUG-014 | P1 | Czas nie płynął (update na 1s evencie zamiast delta) | FIXED | GameScene.ts + TimeSystem.ts | timeSystem.update(delta) co klatkę, poprawne obliczanie pory dnia |
| BUG-015 | P2 | NightOverlay nigdy nie aktualizowany | FIXED | GameScene.update | Aktualizacja alpha nakładki nocy wg lightFactor |
| BUG-016 | P2 | backToMenu tworzył rekurencję sceny MenuScene | FIXED | MenuScene.ts | Zatrzymanie GameScene/UIScene/Dialog przed restartem MenuScene |
| BUG-017 | P0 | loadGame ignorowało zapis | FIXED | MenuScene.ts | To samo co BUG-007 |
| BUG-018 | P2 | Klik w ekwipunku nie wyposażał przedmiotu | FIXED | UIScene.ts | Dodano useItem — wyposażanie broni/zbroi i używanie mikstur/roślin |
| BUG-019 | P1 | Gracz nie otrzymywał obrażeń od potworów | FIXED | GameScene.ts | Melee kolizja potwór-gracz sprawdzana w update z cooldownem ataku |
| BUG-020 | P2 | Brak epilogu | FIXED | src/scenes/EpilogueScene.ts | Dodano scenę epilogu z sekwencją finałową dla obu frakcji, statystykami i powrotem do menu |
| BUG-021 | P2 | Wrogie pociski nie raniły gracza | FIXED | GameScene.updateProjectileCollision | Gdy owner=enemy sprawdzana kolizja z player |
| BUG-022 | P1 | Brak idempotencji nagród questów | FIXED | QuestSystem | Zestaw rewardGranted zapobiega przyznawaniu wielokrotnemu |
| BUG-023 | P1 | Brak startowych przedmiotów | FIXED | Player.ts (jak BUG-004) |
| BUG-024 | P3 | Interakcja E/NPC | FIXED | GameScene.checkInteraction | Interakcja przez E działa tak samo jak klik |
| BUG-025 | P2 | npc_schedules ma 14 wpisów na 66 NPC | PARTIAL | Rozszerzenie harmonogramów to P2 | Pozostaje OPEN, NPC bez harmonogramu używają fallbacku błękitnego ruchu |
| BUG-026 | P1 | Brak walidacji wersji zapisu przy wczytywaniu | FIXED | SaveSystem | Dodano migrate() i sprawdzanie wersji przy importSave |
| BUG-027 | P3 | Opcje gry placeholder | FIXED | MenuScene.showOptions | Działający panel z informacjami o sterowaniu, włączaniem/wyłączaniem muzyki i efektów |
| BUG-028 | P2 | ESC w dialogu nie wznawiał GameScene | FIXED | DialogScene.closeDialog | this.scene.resume('GameScene') |
| BUG-029 | P1 | Brak game over przy śmierci gracza | FIXED | GameScene.ts | onPlayerDeath z nakładką "UMARŁEŚ" + F9/Esc |
| BUG-030 | P3 | Potencjalne wycieki | PARTIAL | Większość wycieków naprawiona, pełna kontrola w przyszłości |
| BUG-031 | P2 | Loot z potworów nie używał loot_tables.json | PARTIAL | Monster.getLoot + GameScene.lootMonster | Skóry i trofea przypisane wg loot_table; pełne losowanie tabel łupów pozostaje P2 |
| BUG-032 | P2 | Łuk/magia dostępne bez wyposażonego przedmiotu | FIXED | GameScene.rangedAttack | Sprawdzenie czy equippedWeapon to łuk i wymagania |
| BUG-033 | P2 | Pociski gracza nie raniły wrogich NPC | FIXED | GameScene.updateProjectileCallback | Sprawdzanie kolizji z NPC (jeśli wrodzy i nie-essential) |
| BUG-034 | P3 | Brak kolizji pocisków z przeszkodami | OPEN | P3 |
| BUG-035 | P3 | Brak grupowego alarmu NPC | OPEN | P3 |
| BUG-036 | P2 | Rangi treningu walki nie dodają bonusów obrażeń | OPEN | P2 |
| BUG-037 | P2 | Brak dźwięków i muzyki | FIXED | src/systems/AudioSystem.ts | Proceduralny system audio z syntezowaną muzyką (drone + melodia) oraz 20+ SFX; opcje w menu do włączania/wyłączania |
| BUG-040 | P3 | Brak wyraźnego "startu" gry (auto-boot do menu) | FIXED | MenuScene | Dodano migający napis "kliknij aby rozpocząć"; audio startuje przy pierwszej interakcji |
| BUG-041 | P2 | Zbyt mało dialogów | PARTIAL | dialogues_intro.json | Rozszerzono dialog rozbitka o Szczelinę, Pustelnika, strony konfliktu, dodatkowe węzły |
| BUG-038 | P2 | Czar magii wymaga questa, który nie istnieje | FIXED | Kiedy gracz nie zna czarów, domyślnie udostępniany jest fire_bolt; nauczenie się z treningu dodaje czary poprawnie |
| BUG-039 | P2 | Wymagania broni blokowały nawet startowy miecz | FIXED | Poprawiono startowe przedmioty na spełniające wymagania |
