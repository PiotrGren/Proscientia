# Proscientia – UI Color Guide

Bazujemy na kolorystyce logo (pomarańcze) + ciemne tło (dark mode first).

## Kolory brandu

- **Primary Orange**  
  `#FF8A00`  
  Główne akcenty (przyciski, aktywne elementy, gradienty).

- **Primary Orange Dark**  
  `#FF5A00`  
  Ciemniejszy akcent pomarańczowy, druga strona gradientu lub hover.

- **Secondary Amber**  
  `#FFC857`  
  Jaśniejsze akcenty w gradientach, ikonach, małych highlightach.

## Tło i powierzchnie

- **Page Background (Dark)**  
  `#020617` (Tailwind `bg-slate-950`)  
  Domyślne tło aplikacji.

- **Surface / Card**  
  `#020617`–`#020617` z przezroczystością i borderem  
  Użycie w Tailwind:  
  - `bg-slate-900/80`  
  - `border border-slate-800`  
  - `shadow-xl shadow-orange-900/30` (dla ważnych cardów)

## Tekst

- **Primary Text**  
  `#F9FAFB` (Tailwind `text-slate-50`) – nagłówki, ważne treści.

- **Secondary Text**  
  `#CBD5F5` / `#9CA3AF` (Tailwind `text-slate-300` / `text-slate-400`) – opisy, pomocniczy tekst.

- **Muted Text**  
  `#6B7280` (Tailwind `text-slate-500`) – hinty, labelki, disclaimery.

## Stany i komunikaty

- **Error**  
  - tło: `#7F1D1D` z przezroczystością (`bg-red-950/40`)  
  - border: `#991B1B` (`border-red-800/50`)  
  - tekst: `#FCA5A5` (`text-red-400`)

- **Success / OK**  
  - `#22C55E` (`green-500`) jako drobny akcent, np. ikonki.

## Gradienty

Najczęściej używany gradient przycisków / akcentów:

```css
background-image: linear-gradient(
  90deg,
  #FF5A00 0%,
  #FF8A00 50%,
  #FFC857 100%
);
