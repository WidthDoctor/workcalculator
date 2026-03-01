# Work Calculator

Mobilna aplikacja JS (responsywna strona webowa) do rozliczania wypłat kurierów.

## Uruchomienie

1. Otwórz plik `index.html` w przeglądarce.
2. Na telefonie możesz uruchomić ten sam plik przez lokalny serwer (np. Live Server w VS Code).

## Funkcje

- Dodawanie pracownika: imię, stawka godzinowa, stawka za zamówienie, godzina rozpoczęcia/zakończenia, liczba zamówień.
- Usuwanie pracownika.
- Indywidualne obliczenie przyciskiem obok pracownika.
- Obliczenie zbiorcze przyciskiem **"Oblicz łączną wypłatę"**.
- Szczegółowy podgląd wszystkich kurierów przyciskiem **"Pokaż wszystkich kurierów"**.
- Automatyczny zapis bieżących pracowników w `localStorage` (dane zostają po odświeżeniu).
- Historia dni: można wybrać datę, zapisać dzień i otworzyć go osobnym przyciskiem daty.

## Logika obliczeń

- Godziny = czas zakończenia - czas rozpoczęcia (jeśli zmiana przechodzi przez północ, jest liczona poprawnie).
- Wypłata za godziny = godziny × stawka godzinowa.
- Wypłata za zamówienia = liczba zamówień × stawka za zamówienie.
- Jeśli liczba zamówień nie jest podana, wypłata za zamówienia = 0.
- Razem = wypłata za godziny + wypłata za zamówienia.
