# What Fits Where Design System

## 1. Atmosphere & Identity

This game should feel warm, clear, and reassuring for older adults using a tablet or WebView. The signature is a sunlit home setting with large rounded controls, soft beige borders, high-contrast green and brown text, and simple image-backed buttons that feel tactile without visual clutter.

## 2. Color

### Palette

| Role | Token | Light | Dark | Usage |
|------|-------|-------|------|-------|
| Surface/page | `--surface-page` | `#FAF7F0` | N/A | Browser fallback background |
| Surface/card | `--surface-card` | `#FFFFFF` | N/A | Modals, panels, cards |
| Surface/warm | `--surface-warm` | `#FFFDF8` | N/A | Soft panel backgrounds |
| Surface/cream | `--surface-cream` | `#FFF4D8` | N/A | Icon and arrow button fills |
| Surface/success-soft | `--surface-success-soft` | `#E8F7DD` | N/A | Selected state backgrounds |
| Text/primary | `--text-primary` | `#13182A` | N/A | General headings |
| Text/game-green | `--text-game-green` | `#293B1D` | N/A | Game screen titles |
| Text/brown | `--text-brown` | `#5A331F` | N/A | Warm action labels |
| Text/muted | `--text-muted` | `#4A5060` | N/A | Secondary copy |
| Border/warm | `--border-warm` | `#D9C894` | N/A | Main card borders |
| Border/button | `--border-button` | `#D5B16C` | N/A | Beige button borders |
| Accent/confirm | `--accent-confirm` | `#EAA0BC` | N/A | Pink confirm buttons |
| Accent/success | `--accent-success` | `#8ABC6A` | N/A | Selected mood state |

### Rules

- Use warm cream surfaces for pre-game screens and pure white for modal cards.
- Green text signals game identity and selected/success states.
- Pink is reserved for primary confirmation actions.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| Display | `clamp(48px, 7.6cqh, 76px)` | 800-1000 | 1.05-1.25 | 0 | Screen titles |
| H1 | `clamp(34px, 8cqh, 58px)` | 1000 | 1.05-1.1 | 0 | Modal titles |
| H2 | `clamp(24px, 5.5cqh, 38px)` | 1000 | 1.1 | 0 | Panel labels |
| Body/large | `clamp(28px, 3.6cqh, 40px)` | 800-900 | 1.16-1.5 | 0 | Instructions and button labels |
| Body | `36px` base | 400 | 1.5 | 0 | App base text |

### Font Stack

- Primary: `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`

### Rules

- Korean labels use `word-break: keep-all` where wrapping would split short phrases.
- Touch labels stay large and high contrast; body text should not fall below 20px in game screens.

## 4. Spacing & Layout

### Base Unit

Spacing follows a 4px base through `clamp()` values sized to the fixed 1280x720 stage container.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-2` | `8px` | Tight responsive gaps |
| `--space-3` | `12px` | Compact panel padding |
| `--space-4` | `16px` | Default controls |
| `--space-6` | `24px` | Modal panel gaps |
| `--space-8` | `32px` | Major card padding |

### Grid

- Stage size: 1280px by 720px, scaled to the viewport.
- Main modal width: about 1040-1120px within the stage.
- Breakpoints are expressed with container queries on `stage`.

### Rules

- Keep all core controls inside the single stage without page scroll.
- Preserve safe-area insets for WebView devices.
- Use container query units (`cqw`, `cqh`) for stage-relative sizing.

## 5. Components

### Modal Card

- **Structure**: `.modal-layer` centered over the active screen, containing `.modal-card`.
- **Variants**: condition check, post-condition check, pause, settings.
- **Spacing**: 24px panel gaps; 26-38px card padding on desktop-like landscape.
- **States**: hidden via `.is-hidden`; visible modal must cover or obscure inactive underlying controls.
- **Accessibility**: `role="dialog"` and `aria-modal="true"` where used.
- **Motion**: no layout animation for modal size changes.

### Game Button

- **Structure**: `.game-button` with variant classes for confirm and secondary actions.
- **Variants**: beige secondary, pink confirm.
- **Spacing**: minimum 64px touch height, larger on image-backed start controls.
- **States**: hover, active, and focus-visible rings are required.
- **Accessibility**: use real `button` elements.

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100-150ms | ease-out | Button press |
| Standard | 150-250ms | ease-in-out | Hover/filter changes |

### Rules

- Animate only `transform`, `opacity`, or `filter`.
- Do not animate modal width, height, padding, or layout properties.
- Touch targets should remain stable while pressed.

## 7. Depth & Surface

### Strategy

The project uses a mixed depth strategy: warm borders define panels, while soft shadows give large cards and image-backed buttons a tactile tabletop feel.

| Level | Value | Usage |
|-------|-------|-------|
| Panel border | `3px solid var(--border-warm)` | Modal/card boundaries |
| Button lift | `0 4px 0 ...` | Pressable controls |
| Modal depth | `var(--panel-shadow)` | Large overlay cards |

Existing CSS predates this file and still contains raw values. New UI changes should use the recorded roles above or extend this file first.
