# Astra · working prototype

Clickable prototype of Astra for the GD 503 research studio usability test.
Spec: [Figma frame 583:2691](https://www.figma.com/design/ZFPpMhc3ChZrg3a5t6bAhp/gd-503-personal?node-id=583-2691).

## Run it

No install needed. React, htm and lucide load from a CDN, so you need an internet connection.

```bash
cd "/Users/amaya.arie/Desktop/Studio Research Prototype" && python3 serve.py
```

Then open http://localhost:4173. Set `PORT` to use a different port if needed.

## How a test session works

1. The participant picks a role on the start screen: engineer, designer or product manager.
2. The bar at the top lets the facilitator switch roles at any point. **Next up** shows whose turn it is in the story, and a dot marks that role.
3. The story is shared: what one role does shows up for the others. It is saved in the browser, so a reload keeps it.
4. **↺** in the top bar restarts the current scenario from its first step. Click **Astra** (top left) to go back to the start screen between participants. The clock icon shows a log of what happened.

## Story path

| Step | Role | Where | Frames |
|---|---|---|---|
| Codex flags R4, Marcus proposes a change | Engineer | Codex, Astra panel (`Alt+P`) | 01–04 |
| Priya agrees or disagrees | Designer | Figma, Astra plugin | 05 |
| Dana publishes v1 with requirements still assumed | Product manager | Astra, assumption check | 00 |
| Dana approves (with a reason), denies, or asks for more evidence | Product manager | Astra, Doc view | 06–07 |
| Marcus drag-selects changelog lines 58–60, adds them as evidence, resends | Engineer | Codex, timekeeping-api.md | 08a–08b |
| Dana approves v1.1, which also updates Jira, Figma, Teams and metrics | Product manager | Astra | 07b |
| R4's decision record: assumed → contradicted → verified | Product manager | Astra | 07 record |
| Marcus updates the code; Priya relabels the frame | Engineer, Designer | Codex, Figma | 09 |
| Explore | Any | Astra: Map, Screens, Present | 10–12 |

### Single-role paths

Each role starts fresh at its own point in the story, and other people's actions happen off screen in **time skips**. A time skip ticks the clock forward and lists what happened. Clicking (or Space) shows every event at once, and it closes only when the participant chooses **Continue**.

- **Engineer:** Codex output streams in → PRD check → propose → time skip (Priya agrees, Dana asks for evidence) → add changelog lines 58–60 → time skip (Kim agrees, Dana approves v1.1) → update the code → end card.
- **Designer:** the Astra plugin starts closed; its toolbar button pulses → agree or disagree with a note → Keep designing → time skip (Dana asks Marcus for evidence, Marcus adds it, Dana approves v1.1; if Priya disagreed, Dana replies to her note) → Dana's comment on the Overview frame → relabel → end card.
- **Product manager:** starts on Oct 1 at the assumption check (00) → Publish anyway → time skip to Oct 8 → review R4 (06) → approve with a reason → time skip → R4 decision record → Done → end card.

The Figma canvas pans and zooms like Figma: drag empty space or hold Space and drag, scroll to pan, Cmd/Ctrl + scroll to zoom, and click the zoom percentage to reset.

## Phones and tablets

Desktop (over 1100px) is unchanged. Smaller screens adapt:

- **Phones and portrait tablets (≤900px):** one panel at a time. Sidebars (Astra's workspace nav, Codex's threads) open as a drawer from the menu button. Detail panels (a requirement, the assumption check, Codex's Astra panel, the Figma plugin) slide up as bottom sheets; tap the dimmed area or ✕ to close. The view tabs (Doc, Map, Screens, Present) sit in a full-width row under the title. Figma's canvas starts zoomed to fit, pans with one finger and zooms with a pinch. The Map's record graph scrolls sideways and opens centered on the record. In Codex, opening the spec file lowers the Astra sheet so lines can be selected; tapping a changelog line selects 58–60, and adding it brings the sheet back.
- **Landscape tablets (901–1100px):** desktop layout, but Astra's sidebar and Codex's threads start collapsed, and Figma's properties panel is hidden.
- **Touch screens** say "tap" instead of "click" and leave out keyboard shortcuts in hints.

The breakpoints live in `src/lib.js` (`PHONE`, `TABLET`) and at the end of `styles.css`.

## Files

- `src/store.js`: story state, copy, and the reducer every screen shares
- `src/Codex.js`: Marcus in VS Code + Codex
- `src/Figma.js`: Priya in Figma with the Astra plugin
- `src/Astra.js`: Dana in the Astra web app (shell, Doc view, decision panel)
- `src/AstraViews.js`: Map, Screens and Present views
- `src/RolePicker.js`, `src/TesterBar.js`: start screen and facilitator bar
