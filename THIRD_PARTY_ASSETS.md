# THIRD_PARTY_ASSETS.md — Aktywa zewnętrzne

Obecnie gra używa wyłącznie proceduralnie generowanych assetów (Canvas API) oraz domyślnych zasobów silnika Phaser 3. Nie wykorzystano żadnych zewnętrznych grafik, dźwięków ani czcionek wymagających osobnego licencjonowania.

| Asset | Źródło | Autor | Licencja | Uwagi |
|-------|--------|-------|----------|-------|
| Phaser 3 | npm | Photon Storm | MIT | Silnik gry |
| Czcionka domyślna | Phaser | Phaser | MIT | Bitmap Text |

## Zasady dodawania assetów zewnętrznych

1. Każdy zewnętrzny asset musi mieć jasno określoną licencję komercyjną lub CC0/CC-BY/MIT.
2. Źródło, autor i licencja muszą być odnotowane w tym pliku.
3. Asset musi być dołączony do repozytorium lub ładowany z CDN z zachowaniem licencji.
4. W przypadku assetów AI-generowanych: dołączamy prompt i narzędzie.

## Docelowe źródła assetów

- **Sprite'y + UI**: itch.io (CC0/MIT), OpenGameArt.org
- **Dźwięki**: freesound.org (CC0), opengameart.org
- **Muzyka**: własna kompozycja proceduralna (Web Audio)
- **Czcionki**: Google Fonts (OFL) — np. IM Fell English lub UnifrakturCook
