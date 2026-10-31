# Rea · working prototype

Clickable prototype of Rea for the GD 503 research studio usability test.
Spec: [Figma frame 583:2691](https://www.figma.com/design/ZFPpMhc3ChZrg3a5t6bAhp/gd-503-personal?node-id=583-2691).

## Run it

No install needed. React, htm and lucide load from a CDN, so you need an internet connection.

```bash
cd "/Users/amaya.arie/Desktop/Studio Research Prototype" && python3 serve.py
```

Then open http://localhost:5173.

## How a test session works

1. The participant picks a role on the start screen: engineer, designer or product manager.
2. The bar at the top lets the facilitator switch roles at any point. **Next up** shows whose turn it is in the story, and a dot marks that role.
3. The story is shared: what one role does shows up for the others. It is saved in the browser, so a reload keeps it.
4. **↺** in the top bar resets the story between participants. The clock icon shows a log of what happened.

## Story path

| Step | Role | Where | Frames |
|---|---|---|---|
| Codex flags R4, Marcus proposes a change | Engineer | Codex, Rea panel (`Alt+P`) | 01–04 |
| Priya agrees or disagrees | Designer | Figma, Rea plugin | 05 |
| Dana publishes v1 with requirements still assumed | Product manager | Rea, assumption check | 00 |
| Dana approves (with a reason), denies, or asks for more evidence | Product manager | Rea, Doc view | 06–07 |
| Marcus drag-selects changelog lines 58–60, adds them as evidence, resends | Engineer | Codex, timekeeping-api.md | 08a–08b |
| Dana approves v1.1, which also updates Jira, Figma, Teams and metrics | Product manager | Rea | 07b |
| R4's decision record: assumed → contradicted → verified | Product manager | Rea | 07 record |
| Marcus updates the code; Priya relabels the frame | Engineer, Designer | Codex, Figma | 09 |
| Explore | Any | Rea: Map, Screens, Present | 10–12 |

### Single-role paths

Each role starts fresh at its own point in the story, and other people's actions happen off screen in **time skips**. A time skip ticks the clock forward and lists what happened. Clicking (or Space) shows every event at once, and it closes only when the participant chooses **Continue**.

- **Engineer:** Codex output streams in → PRD check → propose → time skip (Priya agrees, Dana asks for evidence) → add changelog lines 58–60 → time skip (Kim agrees, Dana approves v1.1) → update the code → end card.
- **Designer:** the Rea plugin starts closed; its toolbar button pulses → agree or disagree with a note → Keep designing → time skip (Dana asks Marcus for evidence, Marcus adds it, Dana approves v1.1; if Priya disagreed, Dana replies to her note) → Dana's comment on the Overview frame → relabel → end card.
- **Product manager:** starts on Oct 1 at the assumption check (00) → Publish anyway → time skip to Oct 8 → review R4 (06) → approve with a reason → time skip → R4 decision record → Done → end card.

The Figma canvas pans and zooms like Figma: drag empty space or hold Space and drag, scroll to pan, Cmd/Ctrl + scroll to zoom, and click the zoom percentage to reset.

## Files

- `src/store.js`: story state, copy, and the reducer every screen shares
- `src/Codex.js`: Marcus in VS Code + Codex
- `src/Figma.js`: Priya in Figma with the Rea plugin
- `src/Relay.js`: Dana in the Rea web app (shell, Doc view, decision panel)
- `src/RelayViews.js`: Map, Screens and Present views
- `src/RolePicker.js`, `src/TesterBar.js`: start screen and facilitator bar
