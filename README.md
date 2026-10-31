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
4. **↺** in the top bar resets the story between participants. The clock icon shows a log of what happened.

## Story path

| Step | Role | Where | Frames |
|---|---|---|---|
| Codex flags R4, Marcus proposes a change | Engineer | Codex, Astra panel (`Alt+P`) | 01–04 |
| Priya agrees or disagrees | Designer | Figma, Astra plugin | 05 |
| Dana publishes v1 with requirements still assumed | Product manager | Astra, assumption check | 00 |
| Dana approves (with a reason), denies, or asks for more evidence | Product manager | Astra, Doc view | 06–07 |
| Marcus drag-selects changelog lines 58–60, adds them as evidence, resends | Engineer | Codex, timekeeping-api.md | 08a–08b |
| Dana approves v1.1, which also updates Jira, Figma, Teams and metrics | Product manager | Astra | 07b |
| R4's decision record: Recorder replays R4, pauses at 1:40 PM, Dana signs it off | Product manager | Astra, Recorder | 07 record |
| Marcus updates the code; Priya relabels the frame | Engineer, Designer | Codex, Figma | 09 |
| Explore | Any | Astra: Map, Recorder, Screens, Present | 10–12 |

### Single-role paths

Each role starts fresh at its own point in the story, and other people's actions happen off screen in **time skips**. A time skip ticks the clock forward and lists what happened. Clicking (or Space) shows every event at once, and it closes only when the participant chooses **Continue**.

- **Engineer:** Codex output streams in → PRD check → propose → time skip (Priya agrees, Dana asks for evidence) → add changelog lines 58–60 → time skip (Kim agrees, Dana approves v1.1) → update the code → end card.
- **Designer:** the Astra plugin starts closed; its toolbar button pulses → agree or disagree with a note → Keep designing → time skip (Dana asks Marcus for evidence, Marcus adds it, Dana approves v1.1; if Priya disagreed, Dana replies to her note) → Dana's comment on the Overview frame → relabel → end card.
- **Product manager:** starts on Oct 1 at the assumption check (00), where R4 shows a pattern from past PRDs → Publish anyway → time skip to Oct 8 → review R4 (06) → approve with a reason → time skip → the Recorder replays R4 and pauses at 1:40 PM (who knew what) → Keep playing → Sign off record → end card.

The Figma canvas pans and zooms like Figma: drag empty space or hold Space and drag, scroll to pan, Cmd/Ctrl + scroll to zoom, and click the zoom percentage to reset.

## Files

- `src/store.js`: story state, copy, and the reducer every screen shares
- `src/Codex.js`: Marcus in VS Code + Codex
- `src/Figma.js`: Priya in Figma with the Astra plugin
- `src/Astra.js`: Dana in the Astra web app (shell, Doc view, decision panel)
- `src/AstraViews.js`: Map, Screens and Present views
- `src/Recorder.js`: Recorder view, a flight data recorder for requirements (see below)
- `src/RolePicker.js`, `src/TesterBar.js`: start screen and facilitator bar

## Recorder view

A second take on the Map, modeled on an aircraft flight data recorder. The original Map view is unchanged; Recorder is its own tab.

- **Every requirement, every day:** one dot per requirement per day. Above the line is settled (filled = verified, hollow = assumed), below the line is still moving (amber = contested or pending, blue = AI draft). Green marks a requirement that changed and was verified that day. Click any dot to load its record.
- **Tracks:** what happened to the selected requirement, lane by lane (Conversation, PRD, Code + AI, Design, Decisions). AI actions are outlined in blue and always name the person who reviewed them. Amber bands show record lag: how long the PRD trailed what the build had already found, and how long code and design trailed the approval.
- **Replay:** drag the scrubber, click a mark, use the arrow keys, or press play. The right panel shows what the requirement said at that moment and who knew what. Anyone who hadn't heard anything since the requirement was contradicted is outlined as **On v1**.
- **Live:** the record is built from the story state, so it grows as the participant acts in Codex, Figma or Astra. When the playhead is at the newest event it stays there (Recording); otherwise it says Replaying and offers Go live.
- **Export record** downloads a Markdown decision record up to the playhead.
- **Pattern across 3 PRDs** is a speculative, FOQA-style trend card. It counts requirements and sources, never people.

### Recorder in the story

- **Assumption check (Dana, Oct 1):** R4's card shows a pattern from past PRDs. The Recorder's pattern card later points back to it.
- **Decision record (Dana, after approving):** the Recorder opens in sign-off mode, replays R4 from the kickoff, and pauses once at 1:40 PM to show who was still on v1. **Sign off record** ends the path.
- **Engineer and designer end cards:** **Replay what happened** opens the Recorder and replays the session with the participant's own actions outlined.
