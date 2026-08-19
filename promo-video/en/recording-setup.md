# Recording setup

Record on a **laptop**, but the picture must look like a **phone**. Use Chrome (or Edge) **device toolbar** — the developer-tools phone preset. This is not a real device capture.

## Viewport (locked)

**iPhone 14 Pro** — CSS viewport **390 × 844**, device pixel ratio **3**.

If 14 Pro is missing from the list: **iPhone 12 Pro** (same 390 × 844) or a custom preset named anything, size **390 × 844**, DPR **3**.

Do not use:

| Preset | Why not |
|--------|---------|
| iPhone 14 / 15 / 16 **Pro Max** | Too wide and tall. On a laptop you zoom out; clocks look small; the frame feels like a mini-tablet. |
| iPhone 16 Pro Max | Same problem, plus the preset may be missing on older Chrome. |
| Samsung / Galaxy | Android is common in Brazil, but ads in this market read as **iPhone**. Different bezel; looks cheaper in a mixed EN/LatAm cut. |

14 vs 15 vs 16 **non-Max** is invisible in a recording. The class that matters is **standard Pro, 390 × 844**, not Max.

390 × 844 is almost **9:16**, so the clip crops cleanly to Reels / Shorts / TikTok (**1080 × 1920**).

## Chrome steps

1. Open `https://cosmic-clock.info` (or local) in a clean window.
2. Locale for the main cut: **English**.
3. DevTools → **Toggle device toolbar** (`Cmd+Shift+M` on macOS).
4. Device: **iPhone 14 Pro**. Zoom next to the size: **100%** (not Fit, not 50% — Fit looks soft).
5. **Undock** DevTools to the bottom or a second display so the code panel is out of the recording.
6. Hide extra Chrome chrome if it shows in the capture (fullscreen the browser window, or crop to the phone frame in the editor).
7. Clear the guest **Summit / 1958-08-07** card before the take (or use a state where localStorage will not re-seed it in shot).

## Recording hygiene

- Cursor: visible, steady, no frantic hovering.
- Type names **slowly enough to read**.
- After each submit, **hold** until the clock face and hands are on screen.
- One take per language overlay is enough if the picture is English UI; Russian UI is a second picture pass.
- Do not demo features outside create-card → clock (no reorder lock, no account).

## Export

- Master: the phone frame, 9:16.
- Deliver: 1080 × 1920, overlay composited (URL + slogan from [overlay-copy.md](overlay-copy.md)).
- Same picture, three text tracks: EN, ES, PT. Russian: own picture if the UI is Russian.
