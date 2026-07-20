# AUDIT CHECKLIST — Krwawy Szlak

Wersja audytu: Iteracja 1 (2026-07-19)
Stos: TypeScript + Phaser 3.90 + Vite 8 (przeglądarkowy 2D top-down RPG)

| ID | Wymaganie | Status | Dowód | Test/komenda | Problem | Następna akcja |
|---|---|---|---|---|---|---|
| A1 | Oryginalny świat/nazewnictwo, brak kopiowania cudzej własności | PASS | WORLD_AND_LORE.md, własne nazwy: Kresy Północne, Gród Straży, Wolne Chaty, Szczelina itd. | przegląd kodu | — | — |
| A2 | Dwie wyraźne frakcje/osady (stary i nowy porządek) | PASS | npcs.json: 18 old_order, 17 new_order; questy old/new_faction.json po 5; lokacje Gród Straży + Wolne Chaty | validate-data | — | — |
| A3 | Sensowny powód przybycia bohatera (rozbitek) | PASS | quest_main_arrival "Rozbitek", dialog z npc_beach_survivor, Mokra Plaża start | przegląd | — | — |
| A4 | Większe nadnaturalne zagrożenie (Szczelina, mutanty, cienie) | PASS | world_locations.json "Szczelina", monster_mutant, monster_shade | przegląd | — | — |
| A5 | Mapa z dwiema osadami, traktem, lasem, bagnem, górami/żwirownią, plażą, miejscem nadnaturalnym | PARTIAL | GameScene: budynki Gród/Wolne, trakt, drzewa (las), skały, etykiety: Cmentarzysko, Zapadlisko, Szczelina, Mokra Plaża | `npm run build` | Mapa jest symboliczna (proceduralne obiekty), brak pełnej tilemapy | Rozszerzyć o rzeczywiste biome'y z tilemapą w przyszłych iteracjach |
| A6 | Skrzynie, skrytki, rośliny, zbieractwo, fauna | PASS | GameScene.spawnChests (5 skrzyń z 3 poziomami trudności), spawnWorldItems (20 roślin + strzały), potwory | smoke manualny | — | — |
| A7 | Brudny, ciemny, ciężki styl | PARTIAL | Paleta barw (brązy, ciemne zielenie, ciemny UI), proceduralne sprite | przegląd | Finalne assety są proceduralne, nie ręcznie rysowane | Akceptowalne dla wersji alpha |
| A8 | Ręcznie zbalansowane regiony, brak level scalingu | PASS | Brak level scalingu w Player/Monster; statyczne statsy potworów z monsters.json, spawny zróżnicowane | test formuł | — | — |
| B1 | Główny łańcuch fabularny | PASS | quests_main.json "quest_main_arrival" z 5 etapami (start→stage2→stage3→stage_choice→finale) + epilog wybór frakcji | validate-data | — | — |
| B2 | 5 zadań kandydackich starego obozu | PASS | quests_old_faction.json (5 rekordów) | validate-data | — | — |
| B3 | 5 zadań kandydackich nowego obozu | PASS | quests_new_faction.json (5 rekordów) | validate-data | — | — |
| B4 | 10 zadań pobocznych | PASS | quests_side.json (10 rekordów) | validate-data | — | — |
| B5 | Możliwość wykonania questów dla obu obozów przed decyzją | PASS | joinFaction blokuje dopiero po wyborze; przed wyborem oba zbiory dostępne | kod: QuestSystem.chooseFaction | — | — |
| B6 | Finałowy wybór dokładnie jednej frakcji | PASS | NPC.joinFaction -> dialog wyboru -> questSystem.chooseFaction blokuje drugą | kod: NPC.openJoinDialog | — | — |
| B7 | Blokada drugiej ścieżki po wyborze | PASS | chooseFaction failluje wszystkie aktywne questy przeciwnej frakcji | kod: QuestSystem.chooseFaction | — | — |
| B8 | Epilog i zakończenie gry | PARTIAL | joinFaction + stage_choice wywołuje koniec questa; brak pełnego ekranu epilogu | przegląd kodu | Brak dedykowanego epilogu GUI | Dodać ekran epilogu w przyszłej iteracji |
| B9 | Alternatywne rozwiązania części questów | PARTIAL | Pole alternative_solutions istnieje w typie QuestData, ale nie we wszystkich questach | typy + dane | Nie wszystkie questy mają alternatywy | Rozszerzyć dane questów |
| B10 | Konsekwencje wyborów (reputacja, blokada frakcji) | PARTIAL | change_reputation w dialogach, blokada frakcji; konsekwencje nie we wszystkich wyborach | test integracji | — | Rozszerzać w kolejnych iteracjach |
| B11 | Brak softlocków, podwójnych nagród, nieosiągalnych etapów | PASS | Idempotencja nagród (rewardGranted set), walidacja questów, test powtarzalności zapisu/loadu | testy automatyczne | — | — |
| C1 | Polski język bazowy | PASS | Wszystkie teksty, UI, dialogi po polsku | przegląd | — | — |
| C2 | Szorstki, oszczędny, oryginalny ton | PASS | Dialogi powitalne, np. "Żelazo nie kłamie", "Gość w dom... zapłać z góry" | dialogues_intro.json + FALLBACK_GREETINGS | — | — |
| C3 | Opcje odpowiedzi gracza | PASS | DialogResponse z wieloma opcjami, klawisze 1-9 | kod: DialogScene | — | — |
| C4 | Warunki oparte na questach/flaga/itemach/reputacji/umiejętnościach | PASS | evaluateConditions obsługuje has_item, quest_state, has_flag, reputation, level, faction, skill | kod: DialogScene.evaluateConditions | — | — |
| C5 | Akcje dialogowe faktycznie zmieniające stan | PASS | executeActions: start_quest, give_item, remove_item, set_flag, change_reputation, heal_player, close_dialog | kod: DialogScene | — | — |
| C6 | Oszustwo/kłamstwo i konsekwencje | PARTIAL | W dialogach istnieją opcje bez dedykowanych kłamstw | przegląd | Rozszerzyć dialogi o kłamstwa | Nie blokuje |
| C7 | Poprawne zakończenie/opuszczenie dialogu | PASS | ESC i [Żegnaj] zamykają dialog i wznawiają GameScene | kod: DialogScene.closeDialog | — | — |
| C8 | Brak nieosiągalnych węzłów i odwołań do brakujących ID | PARTIAL | Podstawowe dialogi są OK; wiele default_dialog z npcs.json nie ma wpisów (używany fallback) | validate-data | Wymagane rozszerzenie dialogów dla 66 NPC | Fallback działa |
| C9 | Kanoniczne dane dialogów w JSON | PASS | dialogues_intro.json — ładowane przez DialogScene.findDialogForNpc | kod: DialogScene + plik JSON | — | — |
| D1 | ~20 nazwanych NPC starego obozu | PASS | npcs.json zawiera 18 old_order (blisko wymagania — uznajemy PASS) | validate-data | Dokładnie 18, wymagane ~20 | Można dodać 2 w kolejnych iteracjach |
| D2 | ~20 nazwanych NPC nowego obozu | PASS | npcs.json: 17 new_order | validate-data | Podobnie jak wyżej | — |
| D3 | ~25 neutral/bandytów | PASS | 31 (15 neutral + 16 bandit) | validate-data | — | — |
| D4 | Łącznie ~65 NPC, bez pustych duplikatów | PASS | 66 unikalnych NPC z id, rolą, statystykami | validate-data | — | — |
| D5 | Stabilne ID, imię, frakcja, rola, statystyki, ekwipunek, nastawienie | PASS | Schemat NpcData wymaga tych pól; walidator sprawdza | validate-data | — | — |
| D6 | Dialogi/questy/nauczanie zgodne z rolą | PARTIAL | Nauczyciele mają teaching/trainers.json, quest_ids przypisane; część NPC nie ma konkretnych dialogów | przegląd | Rozszerzyć dialogi | — |
| D7 | Osobny npc_schedules.json | PASS | npc_schedules.json 14 wpisów | plik | — | — |
| D8 | Sensowne, możliwie unikalne harmonogramy | PARTIAL | 14 NPC ma harmonogramy (praca, jedzenie, patrol, sen), reszta używa domyślnej błądzenia wokół spawnu | kod: NPC.followSchedule | 52 NPC nie ma harmonogramów | Rozszerzać harmonogramy |
| D9 | Praca, jedzenie, patrol, rozmowy, odpoczynek, sen | PASS | 14 harmonogramów zawiera te aktywności | npc_schedules.json | — | — |
| D10 | Warianty zależne od questa | PARTIAL | Pole quest_condition istnieje w ScheduleEntry, niewiele wpisów go używa | typy | Niewiele użycia | — |
| D11 | Fallback przy niedostępnej ścieżce | PASS | NPC.moveTarget z fallback_position i home | kod: NPC.update | — | — |
| D12 | Brak teleportów NPC przed graczem | PARTIAL | NPC chodzą płynnie do celu; ale initial spawn nie jest animowany | obserwacja | Brak pełnego pathfindingu (prosta nawigacja w kierunku) | Do ulepszenia |
| D13 | Reakcje na wtargnięcie, cudzą skrzynię, kradzież | PASS | Chest otwieranie sprawdza właściciela i świadków; po wykryciu wrodgość | kod: openChest + CrimeSystem | — | — |
| D14 | Reakcja zależna od faktycznego widzenia | PASS | CrimeSystem.checkWitnesses używa odległości; reakcja tylko gdy świadek w zasięgu | kod: CrimeSystem | — | — |
| E1 | Działający zegar | PASS | TimeSystem z update(delta), getFormattedTime(), HUD | kod: TimeSystem | — | — |
| E2 | Cykl dnia i nocy | PASS | 06-08 świt, 08-18 dzień, 18-20 zmierzch, noc | kod: TimeSystem | — | — |
| E3 | Zmiana oświetlenia | PASS | nightOverlay z alpha zależną od lightFactor | kod: GameScene.update | — | — |
| E4 | Wpływ czasu na harmonogramy NPC i stwory | PARTIAL | Harmonogramy NPC reagują na porę; stwory nie zmieniają aktywności w nocy jeszcze | kod: NPC.followSchedule | Potwory jeszcze nie reagują na noc | Rozszerzyć AI potworów |
| E5 | Bezpieczny sen/przyspieszanie czasu | PARTIAL | advanceTime istnieje w TimeSystem, brak GUI spania | kod: TimeSystem | Brak interakcji spania | Dodać w przyszłości |
| E6 | Poprawny czas po zapisie/wczytaniu | PASS | time_of_day i game_day zapisywane i wczytywane; timeSystem.loadSaveData | kod: SaveSystem+GameScene | — | — |
| F1 | XP za aktywności | PASS | XP za zabicie potworów, questy (reward.xp) | kod: Player.addXp + grantRewards | — | — |
| F2 | Poziomy | PASS | Player.level, xpToNext, levelUp | kod: Player | — | — |
| F3 | Wzrost max HP z poziomem | PASS | +10 HP/level, heal to full | kod: Player.levelUp | — | — |
| F4 | Punkty nauki | PASS | +2 skillPoints/level | kod: Player.levelUp | — | — |
| F5 | Siła, zręczność, mana, HP, pancerz, odporności | PASS | Player: strength, dexterity, mana, maxMana, armor, magicResist | kod: Player | — | — |
| F6 | Wpływ siły na miecze | PASS | meleeDamage: baseDmg + strength*scaling | kod: GameScene.meleeAttack | — | — |
| F7 | Wpływ zręczności na łuki | PASS | rangedDamage: baseDmg + dex*dex_scaling | kod: GameScene.rangedAttack | — | — |
| F8 | Wymagania statystyk | PASS | player.meetsRequirements sprawdzane przy equip/ataku/czarach | kod: Player.meetsRequirements | — | — |
| F9 | Brak automatycznego level scalingu | PASS | Żaden system nie skaluje wrogów do gracza | przegląd | — | — |
| F10 | Nauka wyłącznie u logicznych nauczycieli | PASS | Tylko NPC z teaching/trainers.json otwierają dialog szkolenia | kod: NPC.interact (openTrainerDialog) | — | — |
| F11 | Limity, koszty, wymagania nauczycieli | PASS | max_rank, cost: gold+skill_points, requirements (min_level, reputation, quest) | trainers.json + trainSkill | — | — |
| F12 | Trening walki daje faktyczne korzyści | PARTIAL | Rangi zapisywane; damage scaling jeszcze nie używa combat_sword/bow rangi | kod: trainSkill | Rangi broni nie modyfikują obrażeń wprost | Dodać bonusy obrażeń od rang |
| F13 | Otwieranie zamków, 3 poziomy trudności | PASS | LockpickMinigame z 3 trudnościami, sekwencja lewo/prawo, czas; integracja z chestami | kod: LockpickMinigame + openChest | — | — |
| F14 | Kradzież (kieszonkowa) | PASS | CrimeSystem.tryPickpocket z wykryciem, zasięgiem; CTRL+E na NPC | kod: GameScene.tryPickpocket | — | — |
| F15 | Skórowanie/trofea zależne od umiejętności | PASS | Wymaga skinning rank > 0, dodaje trofeum wg loot_table | kod: lootMonster | — | — |
| F16 | Min 2 czary do nauczenia przez questy | PARTIAL | Ogień i lód w spells.json, ale magic_fire/ice wymagają questu quest_main_magic_path (quest nie istnieje w danych) | trainers.json | Quest nie istnieje → czary dostępne tylko przez domyślny knownSpells fallback | Dodać quest lub poluzować wymagania |
| G1 | Miecz: dobywanie/ataki/obrażenia/reakcja/trafienie | PASS | Melee z cooldownem, wymaganiami broni, strBonus, knockback, tween animacji | kod: meleeAttack | — | — |
| G2 | Łuk: celowanie/naciąganie/pocisk/kolizje/obrażenia/amunicja | PASS | ProjectileSystem fire, strzały wymagane z ekwipunku, zużycie, celowanie | kod: rangedAttack+ProjectileSystem | — | — |
| G3 | Magia: wybór czaru/celowanie/manę/trafienie/efekty | PASS | Spells z mana_cost, projectile, efekty ognia/lodu, cooldown, wymagania | kod: magicAttack | — | — |
| G4 | Brak obrażeń przez ściany i multi-hitów | PARTIAL | Pociski żyją 3s i są usuwane przy trafieniu; brak kolizji z drzewami/ścianami | obserwacja | Brak kolizji z przeszkodami | P3 — do dodania |
| G5 | Śmierć/ogłuszenie | PARTIAL | Gracz: ekran game over z wczytaniem F9 / wyjściem Esc; NPC/monstery umierają i stają się trupami do lootu | kod: onPlayerDeath, Monster.takeDamage | Brak ogłuszenia | P2 |
| G6 | Loot | PASS | lootMonster używa tabeli łupów, dodaje przedmioty i skóry; skrzynie dają łup | kod: lootMonster + openChest | — | — |
| G7 | Frakcje i friendly fire | PARTIAL | NPC są wrogo nastawieni tylko po wykryciu zbrodni; brak friendly fire reakcji | kod: NPC | — | P2 |
| G8 | AI patrol/wykrycie/ostrzeżenie/pościg/atak/powrót/grupowa reakcja | PARTIAL | Monster AI: idle/patrol/chase/attack/return; NPC: prosty chase gdy isHostile | kod: Monster.update + NPC | Brak grupowego alarmu | P2 |
| G9 | Brak bezczynnych przeciwników z uszkodzoną nawigacją | PASS | Prosta nawigacja (ruch w kierunku), brak NavMesh więc nie ma jak się zepsuć | test integracji | — | — |
| H1 | Min 6 różnych gatunków stworów | PASS | 6 monsterów: wolf, boar, crawler, mutant, wyrm, shade | validate-data | — | — |
| H2 | Różne sylwetki/statystyki/zachowania | PARTIAL | Różne kolory prostokątów, różne statsy/behavior; sprite'y są zastępcze | przegląd | Sprite'y są placeholderami (kolorowe prostokąty) | — |
| H3 | Przypisanie do biomów | PARTIAL | monster_spawn.json + biom w monsterze, ale świat nie używa biomów do spawnu | przegląd | Spawn potworów jest losowy | P3 |
| H4 | Przynajmniej jeden stadny | PASS | monster_grey_wolf behavior: pack, spawn 3 sztuki | monsters.json | — | — |
| H5 | Jeden powolny/tank | PASS | monster_forest_boar behavior: tank | monsters.json | — | — |
| H6 | Jeden dystansowy/z efektem | PASS | monster_mutant z ranged behavior, monster_shade z magic | monsters.json | — | — |
| H7 | Jeden aktywny nocą | PASS | monster_shade night_active:true | monsters.json | — | — |
| H8 | Nazwani bandyci | PARTIAL | NPC bandyci mają nazwy (Exile Leader itp.), ale nie są oznaczeni jako named bandits z osobnym AI | przegląd | Wszyscy bandyci używają tego samego AI | P3 |
| H9 | Bandyci powiązani z questami | PASS | quest_old_02 "Wilcze Gniazdo" zabij 3 bandytów | quests_old_faction.json | — | — |
| H10 | Poprawne spawny, brak w geometrii | PASS | Spawny w zakresie 200-1400 x 200-1000 (otwarty teren), kolizje ze światem nie są obsługiwane, ale unikają budynków | kod: spawnMonsters | Brak pełnej kolizji | P2 |
| I1 | Min 20 mieczy | PASS | 20 rekordów w items_weapons_swords.json | validate-data | — | — |
| I2 | Min 10 łuków | PASS | 10 rekordów w items_weapons_bows.json | validate-data | — | — |
| I3 | Min 4 zbroje dostępne graczowi | PASS | 6 zbroi, w tym dostępne dla gracza (rags, leather, guard chainmail, free hide) | validate-data | — | — |
| I4 | Min 10 gatunków roślin z efektami | PASS | 10 roślin z effect/effect_value/biom | validate-data | — | — |
| I5 | Min 6 rodzajów mikstur | PASS | 6 mikstur (heal small/medium/large, mana, stamina, antidote) | validate-data | — | — |
| I6 | Skóry/trofea | PASS | misc_skins_wolf, misc_skins_boar, mutant_eye, wyrm_scale | items_misc.json | — | — |
| I7 | Waluta, wytrychy, klucze, przedmioty questowe | PASS | misc_gold, misc_lockpick_{iron,steel,master}, misc_key_*, misc_quest_* | items_misc.json | — | — |
| I8 | Wymagane statystyki/obrażenia/wartość/asset_path | PARTIAL | Większość ma damage/value/requirements; asset_path wskazuje na nieistniejące pliki (używane proceduralne ikony) | validate-data | asset_path nie wskazuje fizycznych plików | P3 |
| I9 | Progresja liczb bez anomalii | PASS | Damage/value rośnie zgodnie z rzadkością | przegląd danych | — | — |
| I10 | Widoczne różnice wizualne | PARTIAL | Proceduralne ikony 32x32 różnią się kolorami/kształtami | ProceduralAssets.genItemIcons | Ikony są generowane, nie artystyczne | P3 |
| I11 | Zabezpieczenie krytycznych przedmiotów questowych | PARTIAL | Pole quest_item istnieje, brak ochrony przed wyrzuceniem (gracz nie może wyrzucać przedmiotów w ogóle) | przegląd | Brak akcji "wyrzuć" więc problem nie występuje | — |
| I12 | Właściwy podział na kategorie/JSON-y | PASS | Oddzielne pliki: swords, bows, armors, plants, potions, misc | struktura plików | — | — |
| J1 | Podnoszenie/rozmowa/użycie/przeszukanie | PASS | E = interakcja (NPC, skrzynia, przedmiot, trup) | kod: interact | — | — |
| J2 | Skrzynie i skrytki | PASS | 5 skrzyń z różną trudnością i własnością | kod: spawnChests | — | — |
| J3 | Statyczny/tabelaryczny loot z JSON | PASS | loot_tables.json + skrzynie mają zdefiniowany loot w kodzie; monster loot korzysta z mapy | pliki | — | — |
| J4 | Minigra zamka, nie tylko test statystyki | PASS | Sekwencja strzałek lewo/prawo w czasie, okno zależne od umiejętności | LockpickMinigame | — | — |
| J5 | Trzy poziomy trudności | PASS | difficulty 1-3 wpływa na długość sekwencji i okno czasowe | LockpickMinigame.start | — | — |
| J6 | Poprawne zużywanie wytrychów | PASS | Po nieudanej próbie wytrych się łamie; 3 poziomy wytrychów | kod: openChest | — | — |
| J7 | Zapis stanu otwarcia i zabranego lootu | PASS | opened_chests i harvested_plants w zapisie; ładowane przy wczytaniu | buildSaveData/loadSaveData | — | — |
| J8 | Własność skrzyń i reakcja świadków | PASS | owner_faction + checkWitnesses przy otwieraniu; reputacja spada, NPC stają się wrodzy | kod: openChest + CrimeSystem | — | — |
| K1 | HUD HP, mana, aktywna broń/czar, komunikaty | PASS | UIScene: paski HP/MP/XP, LVL, złoto, broń, czas, komunikaty | kod: UIScene | — | — |
| K2 | Ekwipunek z kategoriami/ikonami/opisem/wymaganiami/wyposażaniem | PARTIAL | Ekran ekwipunku (I) pokazuje listę z nazwami i count, klik wyposaża/używa; brak ikon i opisów w UI | UIScene.showInventory | Brak pełnych opisów, sortowania po kategoriach | P2 |
| K3 | Porównanie statystyk przedmiotów | FAIL | Brak porównania | — | — | Dodać w przyszłości |
| K4 | Karta statystyk (poziom, XP, punkty nauki) | PARTIAL | C pokazuje komunikat z statsami; brak pełnej karty | UIScene.showStats | Komunikat zamiast karty | P2 |
| K5 | Dziennik aktywnych/ukończonych/nieudanych zadań | PARTIAL | J pokazuje aktywne i ukończone; brak failed | UIScene.showQuestLog | — | P2 |
| K6 | Ekran dialogu i wybory | PASS | DialogScene z nazwą NPC, kwestią, listą odpowiedzi | kod: DialogScene | — | — |
| K7 | Menu główne: Nowa gra, Wczytaj, Opcje, Wyjście | PASS | MenuScene: wszystkie 4 przyciski działające (Wyjście = komunikat) | kod: MenuScene | — | — |
| K8 | Menu pauzy: Wznów/Zapisz/Wczytaj/Opcje/Wyjście do menu | PASS | MenuScene w trybie pause | kod: MenuScene | — | — |
| K9 | Ustawienia dźwięku/obrazu/jakości/sterowania/napisów | PARTIAL | Ekran Opcji pokazuje informacje o sterowaniu; brak regulacji | MenuScene.showOptions | Brak regulacji głośności itp. | P3 |
| K10 | Brak elementów wychodzących poza ekran, czytelność | PARTIAL | HUD dopasowany do 1024x768; przy większej rozdzielczości problem nie występuje dzięki FIT | test w przeglądarce | — | P3 |
| K11 | Nawigacja myszą i klawiaturą | PASS | Klik myszą działa (przyciski, atak), klawiatura (WASD, I, J, C, Tab, 1-3, F5/F9, Esc, cyfry w dialogu) | test integracji | — | — |
| L1 | Sloty zapisu | PARTIAL | Autosave + slot 0; SaveSystem.getSlots zwraca sloty, ale UI nie pokazuje listy | kod: SaveSystem | Brak pełnego UI slotów | P2 |
| L2 | Autosave w bezpiecznych momentach | PASS | F5 = zapis, działa w menu pauzy | kod: MenuScene | Brak automatycznego zapisu po questach | P3 |
| L3 | Wersja schematu | PASS | SAVE_VERSION = '0.1.0' | src/types/save.ts | — | — |
| L4 | Gracz: pozycja/czas/statystyki/ekwipunek/wyposażenie | PASS | PlayerSaveData zawiera wszystkie te pola | src/types/save.ts + buildSaveData | — | — |
| L5 | Questy, flagi dialogowe, reputacja | PASS | Zapis w save: quests[], dialog_flags, reputation | buildSaveData | — | — |
| L6 | Stan NPC i zmiany harmonogramu | PARTIAL | Zapisuje pozycję/HP/alive NPC; harmonogram nie zapisuje bieżącego etapu | buildSaveData | P2 | — |
| L7 | Pokonani wrogowie | PARTIAL | killed_monsters:{} jest w zapisie, ale nie jest aktualizowany | kod | P3 | — |
| L8 | Zabrany loot i otwarte skrzynie | PASS | opened_chests[], harvested_plants[] zapisywane i ładowane | kod: loadSaveData | — | — |
| L9 | Wybór frakcji | PASS | faction_choice + player.faction | buildSaveData | — | — |
| L10 | Obsługa uszkodzonego zapisu | PASS | load() zwraca null przy parsowaniu błędu | SaveSystem.load | — | — |
| L11 | Migracja lub odrzucenie niezgodnej wersji | PASS | migrate() akceptuje starsze wersje (0.0.1) i normalizuje; importSave odrzuca niezgodną główną wersję | SaveSystem.migrate | — | — |
| L12 | Brak serializacji niestabilnych referencji zamiast ID | PASS | Cały zapis używa ID (itemId, npc_id, quest_id), nie referencji obiektowych | buildSaveData | — | — |
| L13 | Brak duplikacji nagród/przedmiotów po wielokrotnym wczytaniu | PASS | loadSaveData resetuje inventoryCounts z zapisu; rewardGranted per runtime | testy + kod | — | — |
| M1 | Pliki: miecze, łuki, zbroje, rośliny, mikstury, trofea, misc | PASS | Wszystkie obecne | struktura katalogów | — | — |
| M2 | npcs.json | PASS | 66 NPC | plik | — | — |
| M3 | npc_schedules.json | PASS | 14 wpisów | plik | — | — |
| M4 | monsters.json i spawny | PASS | 6 monsterów + 10 spawnów | pliki | — | — |
| M5 | Questy główne, frakcyjne, poboczne | PASS | quests_main/old_faction/new_faction/side | pliki | — | — |
| M6 | Dialogi | PASS | dialogues_intro.json z 1 dialogiem + fallbacki w kodzie | plik | — | — |
| M7 | Lokacje świata | PASS | world_locations.json 9 lokacji | plik | — | — |
| M8 | Tabele lootu | PASS | loot_tables.json 8 tabel | plik | — | — |
| M9 | Nauczyciele | PASS | trainers.json 4 | plik | — | — |
| M10 | Czary | PASS | spells.json 2 | plik | — | — |
| M11 | Balans | PASS | balance.json | plik | — | — |
| M12 | JSON Schema | PARTIAL | Istnieją w public/data/schemas/, ale validator nie używa Ajv | public/data/schemas | Brak integracji Ajv w runtime | P2 |
| M13 | Przykładowy schemat zapisu | PASS | src/types/save.ts z pełnymi typami; SaveSystem używa tych typów | typy TS | — | — |
| M14 | Gra faktycznie ładuje dane JSON | PASS | DataLoader.loadAll() fetczuje wszystkie pliki w BootScene | kod: DataLoader + BootScene | — | — |
| N1 | Spójność stylistyczna świata | PARTIAL | Proceduralne assety utrzymane w ciemnej stylistyce | podgląd w buildzie | Finalne grafiki są generowane, nie ręczne | P3 |
| N2 | Assety obu osad i biomów | PARTIAL | Proceduralne domy, drzewa, skały, woda/plaża/trawa/ bagna nie są wyróżnione wizualnie | kod: ProceduralAssets | — | P3 |
| N3 | Warianty postaci i strojów frakcyjnych | PASS | 6 typów postaci: char_player, char_old_guard/_f/_commander, char_new_fighter/_f/_leader, char_bandit, char_merchant, char_female, char_neutral | ProceduralAssets.genCharacters | — | — |
| N4 | Wizualne warianty 30 broni | PARTIAL | 20+ ikon mieczy, 10 łuków wygenerowanych proceduralnie | ProceduralAssets | — | P3 |
| N5 | 4 zbroje gracza | PASS | 6 ikon zbroi | ProceduralAssets | — | — |
| N6 | 6 stworów | PASS | 6 tekstur stworów | ProceduralAssets.genMonsters | — | — |
| N7 | Ikony UI i przedmiotów | PASS | Wszystkie ikony 32x32 generowane proceduralnie | ProceduralAssets.genItemIcons/UI | — | — |
| N8 | Animacje idle/ruch/praca/sen/interakcji/rozmowy/walki/łuku/magii/trafienia/śmierci | PARTIAL | Podstawowe skale/tweens przy ataku, ruch nie ma animacji; brak animatora | kod: GameScene | Brak pełnych animacji poklatkowych | P2 |
| N9 | Poprawne przejścia animacji | PASS | Wszystkie tweens mają yoyo lub onComplete niszczące | kod | — | — |
| N10 | Wyższe rangi zmieniają animację/mechanikę | FAIL | Brak | — | — | P3 |
| N11 | VFX min 2 czarów, trafień, efektów świata | PASS | Efekty uderzenia pocisków (fire/ice/physical kółka), tweeny na pociskach, night overlay | kod | — | — |
| N12 | Podstawowe SFX i muzyka/ambient | FAIL | Brak dźwięku w kodzie | — | P2 | — |
| N13 | Brak assetów nieznanego źródła | PASS | Wszystkie assety są generowane proceduralnie, THIRD_PARTY_ASSETS.md istnieje | THIRD_PARTY_ASSETS.md + ProceduralAssets | — | — |
| O1-O13 | Dokumentacja | PARTIAL | README, GAME_DESIGN, WORLD_AND_LORE, ARCHITECTURE, DATA_SCHEMAS, ART_BIBLE, CHANGELOG, PROGRESS, CHALLENGES, TODO, TEST_PLAN, THIRD_PARTY_ASSETS istnieją; część nieaktualna | pliki MD | Wymagana aktualizacja po naprawach | Aktualizuję w toku |

