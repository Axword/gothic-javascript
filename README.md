# Krwawy Szlak (Blood Trail)

**Mroczne action RPG 2D w przeglądarce z widokiem top-down.**

Inspirowane klimatem klasycznych europejskich RPG (Gothic 1/2, Drova), ale z własnym IP, światem i oryginalnymi rozwiązaniami. Brudny, ciężki pixel art, zwarty otwarty świat, silne frakcje, ręcznie projektowane zadania i wymagająca eksploracja.

## Wymagania

- Node.js 18+
- npm 9+
- Nowoczesna przeglądarka (Chrome, Firefox, Edge)

## Uruchomienie

```bash
npm install
npm run dev
```

Otwiera `http://localhost:3000` w domyślnej przeglądarce.

## Build produkcyjny

```bash
npm run build
npm run preview
```

Build trafia do `dist/` jako statyczna aplikacja webowa.

## Walidacja danych

```bash
npm run validate-data
```

Sprawdza wszystkie JSON-e w `public/data/` pod kątem schematów, duplikatów i referencji.

## Sterowanie

| Klawisz          | Akcja                          |
|------------------|--------------------------------|
| WASD / Strzałki  | Ruch                           |
| Lewy przycisk    | Atak / Interakcja              |
| Prawy przycisk   | Celowanie / Blok               |
| E                | Interakcja (rozmowa, podnieś)  |
| I                | Ekwipunek                      |
| C                | Karta postaci                  |
| J                | Dziennik zadań                 |
| M                | Mapa                           |
| Tab              | Zmiana broni/czaru             |
| 1-4              | Szybki wybór przedmiotu        |
| F5               | Szybki zapis                   |
| F9               | Szybkie wczytanie              |
| Esc              | Pauza / Menu                   |
| Shift (trzymaj)  | Bieg                           |

## Technologie

- **Silnik**: Phaser 3 (WebGL/Canvas)
- **Język**: TypeScript strict mode
- **Bundler**: Vite
- **Dane**: JSON + JSON Schema (Ajv)
- **Zapis**: IndexedDB + JSON export
- **Audio**: Web Audio API

## Licencja

MIT — z zastrzeżeniem licencji assetów zewnętrznych (patrz `THIRD_PARTY_ASSETS.md`).
