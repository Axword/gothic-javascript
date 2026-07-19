# ARCHITECTURE.md — Architektura techniczna

## Struktura katalogów

```
gothic-javascript/
├── index.html                  # Entry point HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.ts                 # Konfiguracja Phaser, start gry
│   ├── types/                  # Definicje TypeScript (interfejsy danych)
│   │   ├── index.ts            # Re-export wszystkich typów
│   │   ├── items.ts            # Przedmioty
│   │   ├── npc.ts              # NPC
│   │   ├── quests.ts           # Questy
│   │   ├── dialogues.ts        # Dialogi
│   │   ├── world.ts            # Świat/lokacje
│   │   ├── combat.ts           # Walka
│   │   └── save.ts             # Zapis
│   ├── scenes/                 # Sceny Phaser
│   │   ├── BootScene.ts        # Ładowanie assetów i danych
│   │   ├── MenuScene.ts        # Menu główne
│   │   ├── GameScene.ts        # Główna scena gry
│   │   ├── UIScene.ts          # Nakładka UI (HUD, ekwipunek)
│   │   └── DialogScene.ts      # Ekran dialogów
│   ├── systems/                # Systemy gry
│   │   ├── DataLoader.ts       # Ładowanie i walidacja JSON
│   │   ├── TimeSystem.ts       # Cykl dzień/noc
│   │   ├── QuestSystem.ts      # Zarządzanie stanem questów
│   │   ├── DialogSystem.ts     # System dialogów
│   │   ├── CombatSystem.ts     # Walka i obrażenia
│   │   ├── AISystem.ts         # AI NPC i potworów
│   │   ├── InventorySystem.ts  # Ekwipunek i przedmioty
│   │   ├── CrimeSystem.ts      # System przestępstw
│   │   ├── SaveSystem.ts       # Zapis/wczytanie
│   │   └── SkillSystem.ts      # Rozwój postaci i nauczyciele
│   ├── entities/               # Logika encji
│   │   ├── Player.ts           # Gracz
│   │   ├── NPC.ts              # NPC
│   │   ├── Monster.ts          # Potwory
│   │   └── Projectile.ts       # Pociski (magia/łuk)
│   └── ui/                     # Komponenty UI
│       ├── HUD.ts              # Pasek HP/many/stamina
│       ├── InventoryUI.ts      # Okno ekwipunku
│       ├── CharacterSheet.ts   # Karta postaci
│       ├── QuestJournal.ts     # Dziennik zadań
│       ├── DialogUI.ts         # Okno dialogowe
│       ├── MenuUI.ts           # Menu/pauza
│       └── OptionsUI.ts        # Opcje gry
├── public/
│   ├── data/
│   │   ├── json/               # Kanoniczne dane w JSON
│   │   └── schemas/            # JSON Schema dla walidacji
│   └── assets/
│       ├── sprites/            # Sprite'y i atlasy
│       ├── audio/              # Dźwięki i muzyka
│       └── maps/               # Tilemapy Tiled/JSON
├── tools/                      # Narzędzia deweloperskie
│   ├── validate-data.ts        # Walidator JSON
│   └── test.ts                 # Testy automatyczne
└── docs/                       # Dodatkowa dokumentacja
```

## Sceny Phaser

| Scena | Rola |
|-------|------|
| BootScene | Ładuje asseety, dane JSON, waliduje, pokazuje pasek postępu |
| MenuScene | Menu główne: Nowa gra, Wczytaj, Opcje |
| GameScene | Główna pętla gry: mapa, NPC, walka, interakcje |
| UIScene | Nakładka HUD, ekwipunek, karta postaci, dziennik (uruchomiona równolegle) |
| DialogScene | Pełnoekranowy ekran dialogu (uruchomiona równolegle) |

## Przepływ danych

1. **BootScene** → ładuje JSON z `public/data/json/` przez `DataLoader`
2. **DataLoader** → waliduje JSON przez JSON Schema (Ajv), raportuje błędy
3. **GameScene** → tworzy świat z danych, instancjonuje NPC, potwory, przedmioty
4. Systemy (Quest, Dialog, Combat, Crime) operują na stanie runtime
5. **SaveSystem** → serializuje stan runtime do JSON, zapisuje w IndexedDB
6. Przy wczytaniu → deserializacja, przywrócenie stanu encji

## System ECS-lite

Zamiast pełnego ECS, stosujemy kompozycję obiektów:
- Każda encja (Player, NPC, Monster) ma zestaw komponentów (stats, inventory, AI, schedule)
- Systemy operują na encjach przez iterację i sprawdzanie posiadanych komponentów
- Komunikacja przez zdarzenia Phaser (EventEmitter)

## Zapis

- **IndexedDB**: główny magazyn zapisów (wiele slotów)
- **localStorage**: tylko ustawienia (audio, rozdzielczość)
- **Eksport/Import**: JSON do pliku
- **Autosave**: przy wejściu do osady, przed ważną decyzją questową
- **Wersjonowanie**: każdy zapis ma wersję schematu; migracja przy odczycie
