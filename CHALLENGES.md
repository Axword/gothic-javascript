# CHALLENGES.md — Wyzwania i decyzje

## Główne wyzwania

### 1. Obfitość assetów graficznych
**Problem**: Gra wymaga ~30 broni, 4 zbroi, 6 potworów, 65 NPC z animacjami — to setki sprite'ów.
**Decyzja**: Używamy proceduralnie generowanych assetów (Canvas API) jako placeholderów. Każdy placeholder ma specyfikację dla docelowego artysty. Wszystkie miecze, łuki i zbroje są wizualnie rozróżnialne przez kształt, kolor i detale.

### 2. 65 NPC z unikalnymi harmonogramami
**Problem**: Ręczne projektowanie 65 wiarygodnych harmonogramów jest czasochłonne.
**Decyzja**: Tworzymy około 20 kluczowych NPC z pełnymi harmonogramami (każda frakcja + neutralni), resztę z prostszymi rutynami (dzień w osadzie, noc w domu). System fallbacku teleportuje NPC poza wzrokiem gracza, gdy nawigacja jest zablokowana.

### 3. Kompleksowy system dialogów z warunkami
**Problem**: JSON z węzłami, odpowiedziami, warunkami i akcjami musi być czytelny i walidowalny.
**Decyzja**: Każdy dialog to tablica węzłów; każdy węzeł ma tekst, odpowiedzi, warunki (np. `quest_state`, `has_item`, `skill_check`, `reputation`) i akcje (np. `set_flag`, `give_item`, `start_quest`).

### 4. Brak level-scalingu
**Problem**: Świat musi być ręcznie zbalansowany — niektóre obszary są zbyt trudne dla początkujących.
**Decyzja**: Oznaczamy obszary poziomem trudności w danych lokacji, wyświetlamy subtelne wskazówki wizualne (silniejsze potwory mają większe sylwetki, ciemniejszą aurę).

### 5. System przestępstw bazujący na widzeniu
**Problem**: NPC reagują tylko na faktycznie widziane czyny, nie wszechwiedząco.
**Decyzja**: Każda encja ma pole widzenia (stożek + dystans). System sprawdza, czy świadek ma linię widzenia do zdarzenia przestępstwa. Używamy raycastingu do detekcji przeszkód.

### 6. Minigra zamków
**Problem**: Potrzebna mała, ale wciągająca minigra respektująca poziom umiejętności.
**Decyzja**: Minigra polega na ustawieniu zapadek we właściwej kolejności — pokazana jest sekwencja lewo/prawo do odtworzenia. Poziom umiejętności zwiększa okno czasowe i zmniejsza liczbę wymaganych poprawnych zapadek.

## Kompromisy

- **Audio**: W v1.0 używamy proceduralnych dźwięków (Web Audio API) zamiast samplowanych. Muzyka to proste pętle. Docelowo: legalnie licencjonowane utwory.
- **Mapa**: Zamiast Tiled, używamy danych tilemapy w JSON z kafelkami 32×32 generowanymi proceduralnie.
- **Animacje**: Nie wszystkie 65 NPC ma unikalne animacje; używamy współdzielonych sheetów z wariantami kolorystycznymi (palette swap).
