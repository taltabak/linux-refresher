# Linux Drill

A mobile-first, offline-capable Linux command quiz app made with **plain HTML, CSS, and JavaScript**. No framework, API keys, accounts, server/database, or build step required.

## Features

- 90 distinct commands: 30 Beginner, 30 Intermediate, 30 Advanced.
- Select a difficulty, session size (5 / 10 / 20 / 30), and question type.
- Command → meaning and task → command, with four shuffled answers.
- Explanations, syntax, practical examples, and a memory tip after **every** response.
- A results screen showing your first-try score and missed commands.
- Retraining that retests every missed command. A missed answer is requeued and retraining ends **only when all are correct**.
- Searchable command reference library, progress dashboard, session history, and weak-command practice.
- Progress saved on the current device via `localStorage`; an unfinished session can be resumed after a reload.
- PWA manifest, icons, and service worker for offline use after the first successful online visit.

## Option 1: Open the one-file version on your phone

Download **Linux-Drill-Standalone.html** and open it in a mobile browser that supports opening local HTML files. All quiz code and questions are embedded in that file. Local-file persistence varies by browser, and this standalone version is not installable as a PWA.

## Option 2 (recommended): Install it like an Android app

1. Extract **Linux-Drill-PWA.zip**.
2. Upload its contents (keep `index.html`, the other files, and `icons/` together) to a static HTTPS host such as GitHub Pages or Netlify.
3. Open the resulting HTTPS URL on your Android phone in Chrome.
4. Use **Install app** when offered, or the browser menu's **Add to Home screen / Install app** option.
5. After the first visit with online access, the app's core files are cached for offline learning.

**Important:** Merely unzipping and opening `index.html` does not register the service worker. Installation and offline PWA support require HTTPS or localhost.

## Run locally on a computer

In the folder containing `index.html`, run:

```bash
python -m http.server 8000
```

Then visit http://localhost:8000/ in your browser.

## Run the logic tests

```bash
node tests/smoke.cjs
```

The tests validate 90 commands, both question types for all commands, distinct 4-option choices, session scoring, incorrect-answer retraining, repeating mistakes until mastery, history, and pause/resume.

## Project files

- `index.html` — app page
- `styles.css` — responsive dark-terminal design
- `data.js` — editable 90-command question bank
- `app.js` — quiz engine, retraining, progress, UI
- `sw.js` — offline cache
- `manifest.webmanifest` — installability metadata
- `icons/`, `favicon.svg` — app artwork
- `tests/smoke.cjs` — zero-dependency test

## Data and privacy

All progress stays in your browser's `localStorage`. It is not synchronized between phones or browsers. Incognito mode, clearing browser storage, or changing the app origin/URL can reset progress. No Linux commands are ever executed; the terminal UI is educational text only.

## Extending the question bank

Edit `data.js`. Each entry has `id`, `level`, `group`, `about`, `syntax`, `demo`, `meaning`, `task`, `answer`, `wrong` (3 different strings), `tip`, and `examples` (pairs of command and explanation). Keep IDs unique. If deploying an updated PWA, bump the cache version in `sw.js` to force offline asset updates.
