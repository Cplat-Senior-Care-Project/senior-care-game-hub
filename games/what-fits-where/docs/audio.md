# Audio assets

Put BGM, SFX, and voice guide files under `assets/audio` if the game later needs real audio files.

The playback hooks live in `../js/audio.js`.

Background music files live in `../assets/audio` and are mapped in `BGM_FILES`.

- `bgm-gameplay.mp3`: all BGM contexts, including pre-game, active gameplay, result, score, and post-check screens
- `bgm-pregame.mp3`: legacy asset retained in the folder, but not mapped for playback

Voice guide files live in `../assets/audio/voice` and are mapped in `VOICE_FILES`.

- `pre-game-condition.mp3`: pre-game mood and sleep check
- `choose-difficulty.mp3`: difficulty selection screen
- `countdown-start.mp3`: three-second countdown
- `choose-matching-intro.mp3`: matching-items mission intro
- `remove-mismatch-intro.mp3`: mismatched-items mission intro
- `guess-situation-intro.mp3`: situation-guessing mission intro
- `choose-matching-prompt.mp3`: matching-items question prompt
- `remove-mismatch-prompt.mp3`: mismatched-items question prompt
- `guess-situation-prompt.mp3`: situation-guessing question prompt
- `hint.mp3`: hint reveal
- `pause.mp3`: pause menu
- `well-done.mp3`: result screen
- `score-screen.mp3`: score screen
- `post-check-status.mp3`: first post-game condition check
- `post-check-more.mp3`: second post-game condition check
