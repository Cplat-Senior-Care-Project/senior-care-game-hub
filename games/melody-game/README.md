# Kungjak Melody Drum Structure Guide

This project now uses one codebase with mode-based runtime branches for standard, reminder, care, and ai_assisted modes.

## Run examples

```text
index.html?mode=standard
index.html?mode=reminder&difficulty=normal&auto_start=true
index.html?mode=care&difficulty=easy&auto_start=true
index.html?mode=ai_assisted&difficulty=easy&auto_start=true
```

## CSS structure

```text
css/
  base.css          shared variables, reset, buttons, app shell
  screens.css       loading, home, settings, difficulty, how-to, result screens
  game-layout.css   play screen, pads, symbols, progress layout
  feedback.css      feedback, pause, orientation overlays, animations
  modes.css         body.mode-* mode-specific styles
  responsive.css    responsive and landscape adaptations
  style.css         import-only aggregate file
```

## JS structure

```text
js/
  core-config.js     normalizes URL query and WebView CONFIG messages into runtime settings
  audio.js           sound and melody playback
  audio-display.js   fullscreen/orientation requests and host postMessage helpers
  result.js          result calculation and result screen rendering
  result-bridge.js   SESSION_START/COMPLETE/ABORT and RETURN_TO_APP payloads
  game.js            melody drum gameplay
  screen-flow.js     screen transitions, settings, difficulty selection, auto start
  main.js            app bootstrap
```

## Mode management

- Runtime defaults and config parsing: js/core-config.js
- Mode-specific CSS: css/modes.css
- App result/return events: js/result-bridge.js
- Review data: data/melody-drum-content.json

## Result collection server

The result collection server was copied into the result server folder. Run it separately for local review.

```bash
cd 결과수집서버
npm start
```

To send game results directly, pass result_endpoint by URL/config.

```text
index.html?mode=care&auto_start=true&result_endpoint=http://127.0.0.1:3100/results
```