# TEST_PLAN.md — Plan testów

## Testy automatyczne

### Narzędzie: `tsx tools/test.ts`

1. **DataLoader test**
   - Wszystkie JSON-e ładują się bez błędów składni
   - Wszystkie JSON-e przechodzą walidację schematów
   - Nie ma duplikatów ID w żadnym pliku
   - Wszystkie referencje między plikami są poprawne

2. **Formuły balansu**
   - Obliczenia obrażeń miecza (siła × baza)
   - Obliczenia obrażeń łuku (zręczność × baza)
   - Obliczenia obrażeń magii (mana × mnożnik)
   - Formuła XP (potwory, questy)
   - Skalowanie HP na poziom

3. **Save/Load test**
   - Serializacja pełnego stanu gry
   - Deserializacja i przywrócenie stanu
   - Migracja między wersjami schematu
   - Obsługa uszkodzonych danych

4. **Quest flow test**
   - Przejście głównego wątku
   - Rozgałęzienia zależne od wyborów
   - Warunki rozpoczęcia i zakończenia

## Testy manualne (smoke test)

Każdy build przed wydaniem:

1. Nowa gra → tutorial/start
2. Poruszanie się po mapie
3. Interakcja z NPC (rozmowa)
4. Wykonanie zadania pobocznego
5. Walka (miecz, łuk, magia)
6. Otwarcie zamka (minigra)
7. Kradzież i reakcja NPC
8. Skórowanie potwora
9. Rozwój u nauczyciela
10. Wybór frakcji
11. Zapis/wczytanie
12. Menu i pauza
13. Zmiana opcji (głośność, rozdzielczość)

## Regresja

- Każda większa zmiana: powtórzenie smoke testu
- Sprawdzenie czy żaden wymagany NPC ani przedmiot questowy nie zniknął
- Sprawdzenie czy wszystkie dialogi mają poprawne warunki
