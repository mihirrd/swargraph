# Swargraph

Swargraph is a visual tool for exploring Indian classical music through the lens of numbers. It lets you plot the melodic contour of a raag, compare multiple sequences side by side, and understand the arithmetic relationships between notes — all in the browser.

---

## The Idea

Indian classical music is built on a system of twelve notes called *swaras*, arranged across octaves. Unlike Western notation, these notes carry names that feel like syllables of a language: Sa, Re, Ga, Ma, Pa, Dha, Ni. Each note has a natural pitch, but several of them come in two forms — a *shuddha* (natural) and a *komal* (flat) variant, giving the system its expressive range. Ma alone has a *tivra* (sharp) variant instead of a komal.

The insight behind Swargraph is simple: if you assign a number to each swara, music becomes geometry. Sa is 0, komal Re is 1, shuddha Re is 2, and so on up to shuddha Ni at 11. The octave above simply adds 12 — so the Sa an octave higher is 12, and the Sa an octave lower is −12. This mapping turns a raag's ascending scale (*aroha*) into a rising line on a graph, its descent (*avaroha*) into a falling one, and the distance between any two notes into a plain number.

---

## Note System

Swargraph uses the following mapping for the middle octave:

| Note | Value | Full Name     |
|------|-------|---------------|
| S    | 0     | Sa            |
| r    | 1     | komal Re      |
| R    | 2     | Re            |
| g    | 3     | komal Ga      |
| G    | 4     | Ga            |
| m    | 5     | Ma            |
| M    | 6     | tivra Ma      |
| P    | 7     | Pa            |
| d    | 8     | komal Dha     |
| D    | 9     | Dha           |
| n    | 10    | komal Ni      |
| N    | 11    | Ni            |

Octave is indicated with apostrophes: a trailing `'` raises by one octave (`S'` = 12), a leading `'` lowers by one (`'S` = −12). Multiple apostrophes stack: `S''` = 24, `''S` = −24.

Both short-form and full-name notation are accepted. You can write `S R G M P D N S'` or `Sa Re Ga Ma Pa Dha Ni Sa'` — or mix the two freely. Capitalisation carries musical meaning: `R` is shuddha Re, `r` is komal Re; `Dha` is shuddha, `dha` is komal.

---

## Features

**Note Plotter.** Type any sequence of swaras, separated by spaces, and press Plot. The tool draws a line graph where the x-axis shows your notes in order and the y-axis shows their numeric values. Hovering over any point reveals the note name, its value, and its full Indian name. The root note Sa (0) is marked with a faint reference line so the tonic is always visually anchored.

**Multi-sequence comparison.** Add up to four sequences to the same graph, each rendered in its own colour. This is especially useful for comparing the aroha and avaroha of a raag, or placing two raags side by side to see where their scales diverge. A legend identifies each line, and the tooltip shows all sequences at a given position simultaneously.

**Saved sequences.** Every sequence you plot is automatically saved to a recent list (up to four entries) that persists across sessions. Each entry is given a default label based on the sequence text, which you can rename by hovering and clicking the pencil icon. Clicking a saved entry loads it into the next available sequence slot, ready to plot immediately or combine with others.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

Swargraph is built with [Next.js](https://nextjs.org) (App Router), [Recharts](https://recharts.org) for the graph, and [Tailwind CSS](https://tailwindcss.com) for styling. Saved sequences are stored in `localStorage` — no backend, no accounts.

---

Developed by [Mihir Deshpande](https://www.mihirdeshpande.com)
