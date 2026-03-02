# Kalkulator Kurierów

Prosta aplikacja webowa (mobile-first) do rozliczania pracy kurierów.

## Co potrafi aplikacja

- Dodawanie i usuwanie pracowników.
- Edycja stawek pracownika (godzinowej i za zamówienie) w panelu zarządzania.
- Szybkie liczenie pojedynczego pracownika oraz łącznej wypłaty dla wszystkich.
- Obsługa nocnych zmian (np. `11:00 → 02:00`) jako jeden dzień pracy.
- Historia dni z podglądem szczegółów w popupie.
- Automatyczny zapis danych w `localStorage`.

## Jak liczone są wypłaty

- `godziny = koniec - start`
- jeśli `koniec < start`, aplikacja traktuje koniec jako następny dzień
- `wypłata_za_godziny = godziny × stawka_godzinowa`
- `wypłata_za_zamówienia = liczba_zamówień × stawka_za_zamówienie`
- jeśli brak liczby zamówień, część za zamówienia = `0`
- `razem = wypłata_za_godziny + wypłata_za_zamówienia`

## Uruchomienie lokalnie

1. Sklonuj repozytorium.
2. Otwórz `index.html` w przeglądarce
   lub uruchom przez lokalny serwer (np. Live Server w VS Code).

## Link do kalkulatora

Kalkulator jest dostępny pod adresem:

`https://widthdoctor.github.io/workcalculator/`

## Struktura projektu

- `index.html` — interfejs aplikacji
- `styles.css` — stylowanie
- `app.js` — logika aplikacji, obliczenia i zapis danych
