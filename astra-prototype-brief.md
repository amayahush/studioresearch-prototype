# Astra · High-fidelity prototype build brief

> For Claude Code. Put this file in an empty project folder, then say:
> "Read astra-prototype-brief.md. Ask me the questions in section 12 first, then build Phase 1."
> Build one phase at a time and stop for review after each phase. Do not build everything in one pass.

---

## 1. What Astra is

Astra is a concept product from my GD 503 Project 2 (NC State MGXD). It is an AI-assisted PRD tool for teams that build with coding agents.

- An AI drafts the PRD from conversations (kickoff calls, notes, spreadsheets). The PM owns final approval.
- Every stakeholder sees a role-filtered **slice** of the PRD (Developer, Design, SME, Business).
- Astra reaches people **inside the tools they already use** via MCP: Codex in VS Code for developers, a Figma plugin for designers, the Astra web app for the PM.
- When someone learns something that conflicts with the PRD, they **propose** a change with a reason and evidence. The change shows as **Pending** everywhere it matters ("don't build on this yet") until the PM approves, denies, or asks for more evidence.
- One approval updates the PRD and the linked work (Jira, Figma, Teams).

The research finding behind it: requirements are discovered through iteration, but agent workflows assume they are specified upfront. Official records lag behind what was decided in conversation. Astra is about keeping requirements clear **as they change**, with a human (the PM) always making the call.

## 2. What this prototype is for

1. **Usability testing.** A participant picks one role and completes that role's task. Each role is a scripted, guided path.
2. **Fall 2026 Symposium.** Visitors click through it at a live URL, desktop only.

So it must be:

- **A scripted front-end simulation.** No real backend, no real AI calls, no real Jira/Figma/Codex. Everything other people do is faked by the prototype (Wizard-of-Oz style). The only "real" state is what the participant clicks.
- **High fidelity.** It should look and feel like real software, matching my Figma frames closely.
- **Animated with purpose.** Motion should explain what is happening (a change propagating, a pending state, time passing), not decorate.
- **Deployable to a public URL** (see section 11).

## 3. Source of truth: Figma

- File key: `ZFPpMhc3ChZrg3a5t6bAhp`
- Section: **V3 High Fi Wireframes** (node `583:2691`)
- All frames are 1280 × 832.

If the Figma MCP server is connected in Claude Code, call `get_design_context` (and `get_screenshot`) on each frame node below before building it. Match spacing, type, radii, and exact copy from Figma.

**Important:** some component instance **layer names are stale** (for example a button layer named "Reject" may render as "Cancel", a chip layer named "Concur" may render as "Agreed"). Always trust the rendered text in the screenshot / design context, never the layer name. If they disagree, ask me.

If the Figma MCP is not available, ask me to export PNGs of each frame into `/reference`.

| ID | Frame | Node | Role · tool |
|---|---|---|---|
| 00 | Start · choose a role | `608:3631` | Any |
| 01 | Marcus · Codex spots a gap | `583:2692` | Marcus · VS Code + Codex |
| 02 | Marcus · PRD check | `583:2779` | Marcus · VS Code + Codex |
| 03 | Marcus · Propose a change to R4 | `583:2904` | Marcus · VS Code + Codex |
| 04 | Marcus · Proposal sent | `583:3018` | Marcus · VS Code + Codex |
| 05 | Priya · Pending change in Figma | `583:3125` | Priya · Figma + Astra plugin |
| 06 | Dana · Reviews the proposal | `583:3233` | Dana · Astra web app |
| 07 | Dana · Requests more evidence | `583:3421` | Dana · Astra web app |
| 07b | Dana · Evidence updated, approves v1.1 | `611:3506` | Dana · Astra web app |
| 08a | Marcus · Selects changelog lines as evidence | `607:3444` | Marcus · VS Code + Codex |
| 08b | Marcus · Evidence added, resend | `583:3593` | Marcus · VS Code + Codex |
| 09 | Marcus · R4 changed, preview the code update | `583:3713` | Marcus · VS Code + Codex |
| 10 | Map view | `583:3829` | Any · Astra web app |
| 11 | Screens view | `583:4013` | Any · Astra web app |
| 12 | Present view | `583:4148` | Any · Astra web app |
| ov | Overlay · Deny menu | `591:3466` | Dana |
| ov | Overlay · Export menu | `606:3489` | Any (opens from Export) |

Each frame also has a "WHAT CHANGED" note below it in Figma. Read those notes; they explain intent.

## 4. Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** with the Astra tokens below mapped as theme colors
- **Motion for React** (formerly Framer Motion): `npm install motion`, import from `"motion/react"`
- **lucide-react** for icons (the Figma icon names match Lucide: `git-pull-request-arrow`, `circle-check`, `sparkles`, `triangle-alert`, `git-branch`, `git-fork`, `paperclip`, `crosshair`, `history`, etc.)
- **Zustand** (or a single `useReducer` context) for the shared story state
- No router library needed if a simple screen state machine is cleaner; if a router is used, keep URLs like `/marcus/03` so the facilitator can deep-link.

Keep it a static site. No server, no database.

## 5. Design tokens

From the Figma variables (collection `astra/*`). Dark theme only.

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0f1114` | App background |
| `sunken` | `#0b0d10` | Terminal, code blocks, inputs |
| `surface` | `#15181c` | Panels, cards |
| `raised` | `#1c2026` | Hover, popovers, menus |
| `line` | `#252a31` | Default borders |
| `line-strong` | `#343a43` | Emphasized borders |
| `fg` | `#e6e8ec` | Primary text |
| `muted` | `#9ba2ad` | Secondary text |
| `faint` | `#6a717c` | Labels, meta |
| `accent` | `#8ea6ff` | Primary actions, links, selection |
| `accent-weak` | `#1e2537` | Selected backgrounds |
| `pending` | `#e8aa4e` | Pending / needs attention |
| `pending-weak` | `#2b2318` | Pending backgrounds |
| `ok` | `#5dc79a` | Approved, sent, done |
| `ok-weak` | `#16271f` | Approved backgrounds |
| `bad` | `#f08473` | Deny, removed lines in diffs |

Typography, radii, and spacing were not exported as variables. Pull them from `get_design_context`. If unavailable, ask me before defaulting (likely a sans like Inter for UI and a mono like JetBrains Mono for the terminal and code).

**Status language must stay consistent everywhere:** AI drafted · Draft · Pending · Approved · Changed in v1.1 · Agreed · No reply yet.

## 6. Layout and shells

- Render every screen inside a fixed **1280 × 832 stage**, scaled to fit the browser window (CSS transform scale, centered, letterboxed on `bg`). This keeps it pixel-faithful on any symposium monitor.
- Three reusable shells:
  1. **VS Code + Codex shell** (01 to 04, 08a, 08b, 09): file tree (210px), Codex terminal pane, optional Astra side panel (360px), tab bar with branch name, "Ask Codex" input, status bar ("codex agent · Astra via MCP · Line Labor PRD v1 · read-only" plus a colored PRD status dot).
  2. **Figma UI3 shell** (05): file/layers panel (240px), canvas, bottom toolbar with a Astra plugin button, properties panel (240px), floating Astra plugin window.
  3. **Astra web app shell** (06, 07, 07b, 10 to 12): sidebar (212px: workspace switcher, search, Inbox, My work, Projects, Connected tools with freshness like "2m" or "live", Settings, Help), top bar (breadcrumb, version chip, view switcher Doc / Map / Screens / Present, Export, Share, avatar), slice tabs with status filter, main work area, right detail panel (350px).
- Shared components: Chip (variants per status + tool chips like "Jira LAB-15"), Avatar, Button (primary, secondary, split button with menu), Panel header/body/footer, Evidence row, Stance row, Code block, Diff row, Popover, Menu, Time divider, Astra hint line (◆ glyph + text + "view"), Stepper.

## 7. The story data

Put all of this in one `story.ts` data file so copy is editable in one place. Exact copy is in Figma; this is the skeleton.

**People**
- Marcus Lee · Senior engineer (Developer slice)
- Jordan Kim · Developer
- Priya Shah · Designer (owns Figma "Dashboard / Overview" and its "Updated every 15 min" label)
- Dana Ortiz · Product manager · Approver
- Kim Alvarez · Business lead (owns the success metric)
- Sam Reed · SME
- Ravi Patel · Timekeeping data owner

**PRD: Line Labor Dashboard** (v1 published Oct 1, owner Dana)
- Problem, Users, Scope (in / out of scope v1), Data and constraints, Open questions (2), Milestones
- Requirements grouped by Jira epic:
  - LAB-E1 Live labor visibility: R1 (LAB-12 Done, GitLab !205 Merged), R2 85% flag (LAB-13), **R4 Refresh data every 15 minutes** (LAB-15, Figma Overview)
  - LAB-E2 Filtering and drill-down: R3 shift filter (LAB-14, Figma Filters), R5 department detail (AI draft)
- Goals and success metrics: "Leaders spot overtime risk by mid-shift. Weekly overtime drops 10% within one quarter."

**The conflict**
- R4 says every 15 minutes. The timekeeping API returns `sync_interval: "PT1H"`. Spec `timekeeping-api.md §3.2` (edited Mar 2023) says badge punches are batch-loaded hourly.
- Proposed R4: "Refresh data hourly, 5 minutes after the timekeeping system syncs."
- Reason (drafted by Codex, Marcus reviews): polling every 15 min returns the same data 3 of 4 times, so the dashboard would look live when it isn't.
- Dana asks for more evidence because §3.2 is from 2023.
- Marcus attaches changelog lines 58 to 60 (Sep 12, 2026, reviewed by Ravi Patel: sync stays hourly, no faster feed before the 2027 platform update).
- Priya agrees and will relabel to show the actual last sync time. Kim agrees if leaders still see risk before mid-shift.
- Dana approves → **PRD v1.1**. One approval also updates Jira LAB-15, comments on Figma Overview for Priya, posts in Teams #line-labor, adds a note to Success metrics.
- Marcus previews the code update: `schedule = '*/15 * * * *'` → `schedule = '5 * * * *' // R4 v1.1`, and in `Overview.tsx` "Updated every 15 min" → "Last synced {lastSync} · next {nextSync}".

**Timeline:** proposal sent 1:52 PM · Dana requests evidence 2:08 PM · Marcus resends 2:19 PM · Dana approves 2:21 PM.

**R4 state machine** (single source of truth that every shell reads):
`approved_v1` → `proposed` (pending) → `evidence_requested` (still pending) → `resent` (still pending) → `approved_v1_1` (or `denied`, which returns to `approved_v1`).

## 8. Screens, interactions, and role paths

The start screen sends the participant down one role path. Other people's actions happen "off screen" and are shown with a **time skip** transition (section 9). At the end of every path, offer "Explore the Astra web app" which opens the Map, Screens, and Present views in their v1.1 state.

### 00 · Start

- Eyebrow "ASTRA · USABILITY TEST", headline about the 15 minute vs hourly conflict, three role cards (Marcus, Priya, Dana), each with "Starts in [tool]", a one-line task, and a Start button.
- See my feedback in section 10 before building this one.

### Marcus path: 00 → 01 → 02 → 03 → 04 → (skip) → 08a → 08b → (skip) → 09 → end

**01 · Codex spots a gap**
- Marcus's prompt is already sent. Codex output **streams in line by line**: reading PRD context, reading the API doc, calling the sandbox API, the JSON response, then the Astra hint "◆ Astra · R4 may not match the API. 1 note · view · Alt P", then writing the file, writing tests, "Draft ready · 2 files changed · not committed".
- The conflicting lines (`sync_interval: PT1H` and the `*/15` schedule comment) get a subtle pending-colored highlight.
- Status bar dot turns pending: "Astra · 1 note".
- Click "view" or press Alt+P → 02.

**02 · PRD check panel**
- Codex pane narrows (1070 → 710px) as the Astra panel slides in from the right.
- Facts only, side by side: "PRD R4 SAYS Every 15 min" vs "TIMEKEEPING API Every 60 min". Sources with quoted lines. "Linked to R4" chips and people with a "+" to add someone. "Evidence · attached automatically" chips. Disclaimer "AI can make mistakes. Check the evidence."
- Footer: Dismiss (secondary, left), Propose PRD change (primary, right). Dismiss closes the panel and leaves the hint (decide with me what Dismiss leads to in the test).

**03 · Propose a change to R4**
- Proposed text and Reason are prefilled ("Drafted by Codex. Review before sending.") and editable.
- Evidence chips. **Hovering a chip shows a preview popover** of the source lines (file, section, line numbers, "Open in editor · Edited Mar 2023").
- Glanceable "on submit" rows: Slices notified (Developer, Design, Business), Stance from (2 avatars), PRD "Unchanged until Dana approves".
- Footer: Back, Submit to Dana (primary). Reason must be non-empty to submit.

**04 · Proposal sent**
- Green confirmation "Proposal sent to Dana · 1:52 PM" with a stepper: ✓ Sent → Stances 0/2 → Dana decides.
- Proposed vs current text, slices notified, stance requested (Priya, Kim), "Branch tagged pending-R4. Keep working."
- Tab bar branch becomes "lab-15-refresh · pending-R4". Earlier hint shows "· handled".
- Back to code → time skip ("2:08 PM · Dana asked for more evidence") → 08a.

**08a · Selects changelog lines as evidence**
- A new highlighted Astra notice with a "New" chip: "Astra · Dana asked for more evidence on R4 · view". Status bar "Astra · Dana replied".
- Panel shows Dana's message and current evidence. Reply field placeholder.
- The participant opens `timekeeping-api.md` (from the file tree or a link in the panel), **drag-selects lines 58 to 60**, and a floating selection toolbar appears: "Add to R4 evidence ⌘⇧E" and "Ask Codex". Make selection forgiving: clicking a line number or dragging across any part of 58 to 60 should snap to the full range.
- Add to R4 evidence → 08b.

**08b · Evidence added, resend**
- New evidence card "timekeeping-api.md · Changelog L58–60 · Sep 12, 2026 · reviewed by Ravi Patel, data owner" enters at the top with an "Added" chip.
- Optional reply (participant can type; offer the Figma copy as a suggestion).
- Attach reply and resend → time skip ("2:21 PM · Dana approved R4") → 09.

**09 · R4 changed, preview the code update**
- Older notices muted, newest highlighted: "Astra · R4 changed in PRD v1.1. Your draft doesn't match · view". Status bar shows PRD v1.1.
- Panel: "Dana approved your proposal 2:21 PM", R4 now says (old struck through, new text), "Also updated on approval" checklist, and a **diff preview** of the 2 files.
- Update the code to match → the diff applies in the Codex pane, then an end card. Not now → end card.

### Priya path: 00 → 05 → end (see section 12, this path is thin)

**05 · Pending change in Figma**
- Figma UI3 look. No banner. The Astra toolbar button has a pulsing pending dot; the "Last updated label" layer has an R4 chip; the canvas shows an "R4 · pending" pin on the frame.
- Clicking the Astra toolbar button opens the plugin window: "R4 · Data refresh rate · Pending", old vs new text, "Marcus Lee · via Codex · 1:52 PM", expandable "Reason and evidence · 2 sources ›", "IN THIS FRAME: 'Updated every 15 min' label · Select" (Select highlights that layer on the canvas and in the layers panel), "Keep designing. Edits to this layer are tagged pending R4."
- Bottom block "Your stance is requested · You own this frame": optional note for Dana, Disagree / Agree.
- Agree or Disagree → confirmation state in the plugin → end card.

### Dana path: 00 → 06 → Deny menu → 07 → (skip) → 07b → approve → end

**06 · Reviews the proposal (Doc view)**
- Long scrollable PRD with section status chips. Requirements grouped by epic, collapsible. R4 is outlined as selected, with chips "Jira LAB-15 · In progress", "Figma · Overview", "Pending · Dana", "Review".
- Clicking any section updates the right panel ("Click any section to see its details here").
- Slice tabs filter which sections show; status filter (All 5 / Approved 3 / Pending 1 / Draft 1) filters too. Both should actually work.
- Right panel for R4: From, Change, Reason, Evidence chips (with hover previews), Owners of linked work (Priya Agreed with quote, Kim No reply yet), "Informed, no action needed", callout "Also affects the success metric".
- Footer: **Deny split button** (chevron opens the Deny menu overlay: "Request more evidence · Keeps R4 pending and asks Marcus for more." / "Deny · Closes the proposal. R4 stays as written.") and Approve and publish v1.1.
- The test task wants Dana to choose Request more evidence. If she approves directly, still allow it and jump to the approval animation (log it for the test).

**07 · Requests more evidence**
- Panel shows "YOUR DECISION: Request more evidence · Change", the note to Marcus (prefilled with my copy, editable), "R4 stays pending. Nothing in the PRD changes until you approve."
- Footer buttons: use the rendered labels from Figma (verify, see section 12). Sending → time skip ("2:19 PM · Marcus sent more evidence") → 07b.

**07b · Evidence updated, approves v1.1**
- Header chip "Updated". Evidence now includes the changelog Marcus attached plus his note "Data owner confirmed hourly in Sept. Changelog attached." Both owners show Agreed with quotes.
- Highlighted block "ONE APPROVAL ALSO UPDATES" with checkboxes and tool chips: Update Jira LAB-15 description · Comment on Figma Overview for Priya · Post the change in Teams #line-labor · Add a note to Success metrics. Checkboxes toggle.
- Approve and publish v1.1 → **approval animation** (section 9) → version chip becomes v1.1 → end card, then offer the views.

### Any role: 10, 11, 12 (explore mode, v1.1 state)

**10 · Map view**
- Columns: Requirement, Jira, GitLab, Figma, People. Nodes and edges trace R1 to R4, including "!218 · no req." (work with no requirement) and the success metric goal.
- Selection pill "Selected R4 · Refresh rate ✕", "Show full map". Layer toggles (Epics, Jira, GitLab, Figma, Evidence, People, Other PRDs, Untraced work) actually show and hide layers.
- Evidence lane for R4 and "Other PRDs using the same source" (Shift Handoff R2, Compliance Tracker R6).
- Clicking a node selects it and highlights its traced path; other edges dim. Legend at bottom: Traced, Evidence, Other PRDs, Pending change, Changed in v1.1, Work with no requirement. Footnote "Same records as the Doc view. Nothing is edited here."

**11 · Screens view**
- Linked Figma frames with requirement pins (R1, R2, R3, R4). The label now reads "Last synced 1:00 PM · next 2:05 PM". Clicking a pin selects it (active ring, others dim) and fills the right panel; clicking again clears.

**12 · Present view**
- Audience picker (Leadership ▾), Customize slides, Present. Slide 2 of 5 "Dashboard data updates hourly, not every 15 minutes" with chips and evidence cards. Labeled thumbnails 1 Problem · 2 Decision · 3 Status · 4 Evidence · 5 Next steps; current one outlined; clicking switches slides. Footnote "Generated from the same PRD records. Pending changes show as decisions, never as facts."
- Present button enters a fullscreen slide mode with arrow-key navigation. Only slide 2 needs full content; the others can be simple but real.
- Export button (any web app view) opens the Export menu overlay: PDF, PowerPoint (.pptx), Image (PNG), Copy share link. These are simulated (show a toast); nothing downloads.

## 9. Animation spec

Principles:
- Motion explains state. The hero moments are: **the conflict surfacing, a change becoming Pending across tools, time passing, and one approval updating everything.**
- UI micro-interactions 120 to 220ms. Panels and layout 280 to 420ms. Use springs for panels (stiff, low bounce). Never block input longer than needed.
- Respect `prefers-reduced-motion`: replace movement with simple fades and skip typing effects.
- Every scripted animation must be skippable (click or Space to complete instantly) so a facilitator never waits.

Specific moments:
1. **Codex streaming (01):** lines appear one by one with a short stagger (about 150 to 300ms each, a bit longer for "Called sandbox…" to feel like a network call). JSON and code blocks reveal line by line. Spinner glyph on the active line, then ✓.
2. **Conflict highlight (01):** after the JSON lands, `sync_interval` and the `*/15` comment get a pending underline/glow that fades in. The ◆ glyph does a small rotate-in; the status bar dot cross-fades to pending.
3. **Panel open (01 → 02):** Codex pane width animates with a layout animation while the Astra panel springs in from the right. Compare cards: values count or flip into place.
4. **Evidence hover preview (03, 06):** popover scales 0.96 → 1 and fades, 120ms delay on enter, instant on leave.
5. **Submit (03 → 04):** button shows a brief loading state then a check; the stepper fills "Sent" and pulses the next step. The branch name in the tab bar morphs to "· pending-R4".
6. **Pending propagation:** whenever R4 becomes Pending, animate its chip from Approved to Pending (color tween plus a single soft pulse). In the Figma shell, the toolbar dot pulses slowly (2s loop, low amplitude) until the plugin is opened.
7. **Time skip interstitial:** a short dim overlay over the current shell with a clock that ticks from the last time to the new time (for example 1:52 → 2:08 PM) and one line saying what happened off screen ("Dana asked for more evidence"). About 1.5 to 2.5s total, skippable, then the new notice slides in highlighted with a "New" chip.
8. **Text selection (08a):** selected lines tint with accent-weak; the floating toolbar rises 6px and fades in above the selection.
9. **Evidence added (08b):** the new card enters at the top with a layout animation pushing the others down, with a brief ok-colored glow on "Added".
10. **Approval (07b):** in sequence: old R4 text gets a strikethrough draw, new text types or fades in, R4 chip Pending → Changed in v1.1, then each "one approval also updates" row checks off in order (about 120ms apart) with its tool chip, then the top bar chip flips v1 · 1 pending → v1.1. This is the signature moment; make it feel satisfying but keep it under about 2s.
11. **Code update (09):** diff rows: removed line tints bad and collapses, added line tints ok and expands. Then the file in the Codex pane updates.
12. **Map (10):** on enter, edges draw in left to right (path length). Selecting a node highlights its path and dims everything else; toggling a layer fades its nodes and edges.
13. **Screens (11):** selected pin gets an expanding ring once, then a steady ring.
14. **Present (12):** slide changes cross-fade with a slight horizontal shift; the outlined thumbnail slides to the new position.
15. **Screen-to-screen within a shell:** do not re-animate the whole shell. Only the parts that change should move.

## 10. My open feedback from the Figma board (implement these)

1. **Start screen (00):** "Make buttons more central to the role versus name." The role (Senior engineer, Designer, Product manager) and what that person does should lead each card and the Start button, more than the person's name. Example button label: "Start as the developer" (ask me to confirm wording).
2. **Start screen (00):** "Put this on a higher level (not just on the solution level) or allowing users to experience the story from this perspective." The start screen should frame the *problem story* (a requirement that changes mid-build and who it affects), not just jump into my solution. Propose 2 options for me to pick, for example: (a) a short animated intro that shows the conflict traveling between Marcus, Priya, and Dana before the role picker, or (b) a "Watch the whole astra" option that plays all three roles in sequence alongside the three single-role starts. Show me both as quick drafts before building fully.
3. **VS Code shell (01 and all Marcus screens):** "Option to close the left side panel with the icon." Add a toggle (an icon button in the tab bar or an activity-bar icon) that collapses the file tree, animated, with the Codex pane expanding to fill.

## 11. Facilitator tools, testing, and deployment

**Facilitator tools** (hidden from participants):
- Press `Shift + D` (or add `?facilitator=1` to the URL) to open a jump menu listing every screen and state, plus Reset.
- Deep links like `/marcus/03` or `?screen=07b` load that screen with the correct story state.
- An **event log** stored in localStorage: timestamp, role, screen entered, every button click, hover on evidence, time on each screen, and whether the expected path was followed. "Export log" downloads JSON and CSV. Wrap localStorage in try/catch. This feeds my usability testing documentation.
- A small optional "task" card per role that the facilitator can show or hide (the task text from the start screen).

**Deployment:**
- I need a live URL. Set up a GitHub repo and deploy with Vercel or GitHub Pages (if GitHub Pages, set the Vite `base` path correctly). Walk me through any step that needs my login, one step at a time; I am a designer, not a developer.
- Desktop only. On small screens show a polite "Best viewed on a desktop" message.

## 12. Ask me before building (wireframe inconsistencies I need to decide)

Do not guess on these. Ask me in one short list at the start:

1. **"Concur" vs "Agreed":** my notes on 06 say the label changed to "Agreed", but some instances (06, 07b, Map view stances) are still named "Concur". Confirm the rendered label and use one word everywhere.
2. **07b evidence chip** layer says "New · Teams reply from Ravi Patel", but my 07b note says evidence should show the changelog Marcus attached, not a Teams reply. Confirm.
3. **Spec wording for §3.2 line 43:** the hover preview in 03 says "Clients should not poll faster." while the editor in 08a/08b says "Clients should not poll more often than hourly." Pick one.
4. **07 footer buttons:** layer names say Reject / Approve and publish v1.1, but 06 and 07b use the Deny split button. Confirm what 07's footer actually shows (I believe it is Cancel / Send to Marcus).
5. **Draft count:** the status filter says Draft 1 (R5 is an AI draft per my 06 note), but R5 shows no Draft chip. Should R5 get a Draft chip?
6. **Priya's path is one screen.** Marcus has 8 screens and Dana has 3 plus an overlay. Should Priya's path continue after she agrees (for example a time skip to the v1.1 approval, then the Figma comment Astra posted, then the Screens view showing her relabeled frame)? Propose a 2 to 3 step extension for my approval; do not add it without asking.
7. **What does Dismiss on 02 do** in the test? Close the panel and keep the hint, or end the path?
8. **Typography** (if not readable from Figma): confirm fonts.

## 13. Build phases and acceptance criteria

Stop after each phase, deploy a preview if possible, and tell me what to look at.

**Phase 1 · Foundation**
- Project setup, tokens, 1280 × 832 scaled stage, story data file, R4 state machine, facilitator jump menu.
- Shared components with a simple `/components` gallery page so I can review them.
- Done when: every component matches Figma and the jump menu can load a blank shell for each screen ID.

**Phase 2 · Shells and static screens**
- All three shells and all 14 screens plus both overlays, static, with exact copy.
- Done when: side-by-side with Figma screenshots, layout, copy, and colors match at 1280 × 832.

**Phase 3 · Role paths**
- Start screen (after my section 10 decision), all clickable paths, time skips (without fancy animation yet), end cards, explore mode for 10 to 12, working filters, toggles, slice tabs, Deny menu, Export menu.
- Done when: I can complete each role path start to finish with only clicks, and Reset returns everything to the start.

**Phase 4 · Motion**
- Everything in section 9, reduced-motion fallback, skippable scripted animations.
- Done when: the four hero moments feel clear, nothing animates for more than about 2.5s without being skippable, and reduced motion still makes sense.

**Phase 5 · Testing and launch**
- Event log and export, facilitator task cards, desktop-only message, live deployment.
- Done when: I have a public URL and I can run a test session and export its log.

## 14. Out of scope

- Real AI, real integrations, auth, a real database, mobile layouts, editing the PRD text freely, other projects in the sidebar (Compliance Tracker, Shift Handoff can be non-clickable or show a "Not part of this prototype" toast).

## 15. How to work with me

- Build incrementally and show me work early. I will give direct, specific feedback.
- When I critique something, explain your reasoning, do not just silently comply.
- Keep approved versions intact; build new iterations as separate branches or routes so I can compare.
- Flag anything in my wireframes that seems inconsistent with the story or with itself instead of quietly "fixing" it.
