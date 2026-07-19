# ART_BIBLE.md — Wytyczne wizualne

## Styl ogólny

- **Technika**: Pixel art / ręcznie rysowana ilustracja rastrowa 2D
- **Klimat**: Brudny, ciemny, ciężki, surowy
- **Rozdzielczość bazowa**: 32×32 px na tile (16×16 dla detali)
- **Skala gry**: 1024×768, skalowana FIT

## Paleta kolorów

- **Podstawowe**: ciemne brązy (#3d2b1f), szarości (#4a4a4a), zgaszona zieleń (#4a5d3a)
- **Akcenty**: rdza (#8b4513), krew (#8b0000), złoto (#b8860b)
- **Światło**: blade żółcie (#f5deb3) dla dnia, niebieskofiolet (#191970) dla nocy
- **UI**: pergamin (#d2b48c) + ciemny brąz (#2f1a0a)

## Skala i proporcje

- Postać gracza: 32×48 px (4 kierunki × 4-8 klatek animacji)
- NPC: 32×48 px z wariantami kolorystycznymi dla frakcji
- Potwory: 48×48 px do 64×64 px (większe)
- Budynki: 64×64 do 128×128 px
- Drzewa: 48×64 px
- Przedmioty w świecie: 16×16 do 32×32 px
- Ikony UI: 32×32 px

## Budżet assetów (v1.0)

- **Tilesety**: ~8 arkuszy (trakt, las, bagno, góry, plaża, osady, wnętrza, woda)
- **Sprite sheets postaci**: ~12 arkuszy (gracz, 2 frakcje × 5 wariantów, 2 neutralne)
- **Potwory**: 6 sprite sheets
- **Bronie**: 30 ikon + 30 sprite'ów w świecie
- **Zbroje**: 4 zestawy + warianty NPC
- **UI**: ~50 ikon + ramki, przyciski, tła
- **VFX**: ogień, lód, trafienie, cienie

## Animacje (wymagane)

- **Postacie**: idle (4 kl.), chód (6 kl.), bieg (6 kl.), obrót (4 kl. × 4 dir)
- **Walka**: dobywanie (2 kl.), atak lekki (4 kl.), atak mocny (6 kl.), blok (2 kl.), unik (3 kl.)
- **Łuk**: naciąg (3 kl.), strzał (4 kl.)
- **Magia**: rzucanie (4 kl.), pocisk (2-3 kl.)
- **Interakcja**: rozmowa (2 kl.), podniesienie (2 kl.), otwarcie (3 kl.)
- **Stany**: sen (2 kl.), praca (3 kl.), śmierć (4 kl.)
- **Potwory**: idle, chód, atak, trafienie, śmierć (minimum 3-4 kl. każda)

## Generowanie assetów

- Assetów nie zastępujemy opisami. Używamy proceduralnych kształtów i kolorów w Canvas jako placeholderów.
- Każdy placeholder ma oznaczenie TODO z promptem produkcyjnym.
- Docelowo: wygenerowane przez AI lub narysowane ręcznie, z licencją komercyjną.
