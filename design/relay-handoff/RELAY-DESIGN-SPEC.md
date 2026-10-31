# Relay prototype: visual design spec

Use this file to restyle the Relay prototype. It covers every screen in the V3 high-fi flow (Figma file `ZFPpMhc3ChZrg3a5t6bAhp`, section `622:3616` "V3 High Fi Wireframes").

The three files in `samples/` are the approved reference screens. Open them in a browser and match them. When this spec and a sample disagree, the sample wins.

**Change the visual layer only.** Keep every screen, the flow order, the 3-panel layouts, the content and the interactions as they are.

---

## 1. Two kinds of screens

The prototype shows Relay in two places, and each one gets its own style.

| Kind | What it is | Style | Reference |
|---|---|---|---|
| **Codex-hosted** | Marcus is working inside the Codex desktop app, and Relay shows up through MCP | The real Codex desktop app for the shell, and the **Relay style** for the Relay panel and notes | `samples/02-marcus-prd-check-codex.html` |
| **Relay-native** | Screens of the Relay app itself | **Relay style** throughout | `samples/06-dana-reviews-relay.html`, `samples/10-map-view-relay.html` |

Screen mapping:

- **Codex-hosted:** 01, 02, 03, 04, 08a, 08b, 09
- **Relay-native:** 00 (choose a role), 06, 07, 07b, 10 (Map), 11 (Screens), 12 (Present), plus the Deny and Export overlays
- **05 (Priya in Figma):** not decided yet. Leave it as is until Amaya decides.

---

## 2. Relay style tokens

These come from Amaya's R4 panel in Figma (`628:7535`), with the font sizes normalized.

### Color (dark)

| Token | Value | Use |
|---|---|---|
| `bg-app` | `#191A1A` | App background behind panels |
| `bg-sidebar` | `#161717` | Left workspace sidebar |
| `bg-panel` | `#1C1D1D` | Right Relay panel |
| `bg-card` | `#252727` | Cards, epic rows, map nodes |
| `bg-row` | `#2D2F2F` | Selected row, active segment, highlighted list row |
| `bg-canvas` | `#141515` + dot grid `#2C2E2E` (1px dots, 16px spacing) | Map canvas only |
| `line` | `#333535` | Dividers, card edges |
| `line-strong` | `#3A3C3C` | Chip outlines, outlined buttons, input borders |
| `text` | `#E6E8EC` | Primary text |
| `text-muted` | `#9BA2AD` | Secondary text, meta, icons |
| `text-label` | `#878E99` | Uppercase section labels, IDs, timestamps (raised from `#6A717C` so 11px text passes contrast) |
| `blue` / `blue-bg` | `#8EA6FF` / `#1E2537` | "via MCP" chip, AI draft tags, "other PRDs" links on the map |
| `amber` / `amber-bg` | `#E8AA4E` / `#372D1E` | **Pending or unresolved only**: tags, the 1px outline on a pending card or row, pending dots on slice tabs |
| `green` / `green-bg` | `#5DC79A` / `#1C2F27` | Approved, Agreed, "Changed in v1.1", map lines for changed items |
| `red` | `#F08473` | Removed text in code diffs only |

**Color rules**
- Hierarchy comes from weight, size and gray value. **Never from color.**
- Every accent color has one meaning, listed above. Don't use them for decoration.
- A pending item gets an amber 1px outline (`box-shadow: inset 0 0 0 1px #E8AA4E`), the same treatment as the "Refresh interval" card. Don't add amber fills or amber headings on top of that.
- Avatars may keep the person colors from Amaya's panel: Priya `#9F0064`, Kim `#C76A00`, Jordan `#4100E2`, Marcus `#3D5AFE`, Dana `#2F8A6B`.

### Type

- **UI font:** Inter (400, 500, 600). **Mono:** JetBrains Mono (400, 500), used only for IDs, code, file names and API values.
- **Remove Geist and Geist Mono everywhere.**
- Use only these sizes. **No half sizes** (10.5, 11.5, 12.5, 13.5).

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Page or doc title | 16 / 24 | 600 | "Line Labor Dashboard" in the document |
| Panel title | 14 / 20 | 600 | Header of the right panel, top-bar title |
| Body | 13 / 20 | 400 | Requirement text, paragraphs, nav items |
| Small body | 12 / 18 | 400 | Text inside the Relay panel, meta lines, chips, tags |
| Section label | 11 / 16 | 600, uppercase, letter-spacing 0.04em, `text-label` | "WHERE THIS COMES FROM", "LINKED TO R4", "PROBLEM", "REQUIREMENTS" |
| Mono | 11–12 / 18 | 400 | `R4`, `LAB-E1`, `PT1H`, code |

- Emphasis inside a sentence is **weight 600**, not a bigger size. Example: "Every **15** minutes".
- No giant numbers.

### Shape and spacing
- **Spacing:** a 4px grid. Common values are 4, 6, 8, 10, 12, 14, 16, 20, 24, 28.
- **Radius:** 6 for tags, 8 for chips and nav rows, 10 for inner cards and rows, 12 for map nodes, 14 for the outer status card.
- **Buttons are pills** (`border-radius: 999px`, height 34, 13px, weight 500):
  - Primary: background `#E6E8EC`, text `#0F1114`. **One per view.**
  - Outline: transparent, 1px `line-strong` border.
  - Text: transparent, no border.
- **Tags:** 12px, padding 3×8, radius 6, colored background plus colored text, never wrapped.
- **Chips:** 12px, padding 5×10, radius 8, 1px inset `line-strong` outline, `text-muted`.
- **Icons:** 14–16px line icons, stroke 1.5, `text-muted`. **No sparkle or "AI magic" icon.** Relay's icon is the stacked-layers glyph.
- **Dividers** between panel sections: 1px `line`, 14px margin above and below.

---

## 3. Layout rules (these fixed the overlap bugs)

- **Fixed column widths.** Every side column needs `flex: 0 0 <w>; width: <w>; min-width: 0; overflow: hidden`.
  - Relay sidebar: **232px**
  - Relay review / selected panel: **320px**
  - Relay panel inside Codex: **360px**
  - Codex thread list: **228px**
  - Codex icon rail: **46px**
- **The center column** is `flex: 1; min-width: 0`.
- **Nothing in a header, tab row, chip or tag wraps.** Use `white-space: nowrap` and, for long names, `overflow: hidden; text-overflow: ellipsis`.
- **Relay top bar (52px), left to right:**
  - Title "Line Labor Dashboard" on one line, plus a version tag
  - Spacer
  - View switch (text only: Doc / Map / Screens / Present)
  - Export as an icon-only button with `aria-label`
  - Share (outline pill)
  - Avatar
- **Slice row (44px):** slice tabs on the left (amber dot when a slice has a pending change), and **one** "All requirements 5 ▾" dropdown on the right. No SLICE / SHOW labels, and no row of four filter pills.
- **Panel footers hold at most two buttons, plus one text button if it fits.** In the review footer, "Request evidence" lives inside the **Deny ▾** menu, next to "Approve & publish."
- **Collapsible left panels.** Add a sidebar-toggle icon button:
  - Relay: in the sidebar header, next to the workspace name.
  - Codex: in the title bar, right after the traffic lights.
- **The 1280×832 frame must not scroll horizontally.** Test at that size.

---

## 4. Codex-hosted screens (01–04, 08a, 08b, 09)

Match the real Codex desktop app (see `samples/02-marcus-prd-check-codex.html`). Amaya's reference screenshot is Figma node `628:7685`.

### The Codex shell

| Area | Spec |
|---|---|
| **Title bar (40px)** | Traffic lights, sidebar toggle, thread title with folder icon. On the right: the git branch and a small amber "Relay · 1 note" pill when Relay has something. |
| **Icon rail (46px)** | Rail icons, with Marcus's avatar at the bottom. |
| **Thread list (228px, `#232425`)** | "Codex" heading with bell and search, then New chat. "Projects" holds `labor-dashboard` with its threads indented underneath. "Recents" below that. |

**The conversation (`#1A1A1A`)**
- The user's prompt is a right-aligned blue bubble (`#24427E`, radius 16).
- The agent's steps are plain muted lines.
- Code and JSON go in rounded cards (`#262626`, radius 14) with a header row (icon, file name, copy).
- A single line inside code can be highlighted with `rgba(232,170,78,0.14)`.
- The Relay note in the thread is one compact amber row: "Relay · R4 may not match the API · Open in panel." No large callout.

**The input box**
- A rounded box (`#2A2A2A`, radius 18) with placeholder text "Work with Codex".
- Bottom row: +, "Approve for me", model name, mic, round send button.

**Shell font:** the system font stack (`-apple-system, SF Pro`). The Relay panel inside Codex still uses Inter.

### The Relay panel inside Codex (360px)

**Header:** Relay icon, "R4 may not match the API", a blue "via MCP" chip and a close button.

**Status card:** an amber 1px outline with radius 14.
- Top line: clock icon, "Refresh interval" and an "Unresolved" tag.
- Inside it, a comparison table in `bg-card`:
  - "PRD says · Every **15** minutes · R4, v1"
  - "API does · Every **60** minutes · PT1H"
- One muted sentence explaining the impact.

**Sections below the card:**
- WHERE THIS COMES FROM: source cards with the quote in mono.
- LINKED TO R4: chips plus the avatar stack.
- EVIDENCE · ATTACHED AUTOMATICALLY: chips, plus "Select code or text to add more evidence."

**Footer:**
- "AI can make mistakes. Check the evidence." on its own line, 11px.
- Below it: "Save for later" (text button), "Deny" (outline), "Propose change" (primary).

---

## 5. Relay-native screens

### Doc view (06, 07, 07b)

See `samples/06-dana-reviews-relay.html`.

- **The document is a document, not code.** Section labels are uppercase 11px, followed by body text.
- **Requirements are grouped under epic rows.** Each epic row is `bg-card`, 30px tall, with a chevron, the mono ID, the name, and "1 of 3 done" on the right.
- **Each requirement row:** the mono ID, the text, then neutral chips for linked work (Jira, GitLab, Figma).
- **The pending requirement** gets the amber outline and an amber "Pending · Dana" tag.
- **Draft requirements** are italic muted text with a blue "Draft · AI from lead notes" tag.
- **Edits are never shown as strikethrough inside the document.** Show them in the panel as a Now / Proposed comparison.

### Review panel (320px)

- **Who proposed it:** avatar, "Marcus Lee proposed a change", "Developer · via Codex · 1:52 PM".
- **The change:** the same amber status card as the Codex panel, with rows "Now" and "Proposed", followed by the reason in muted text.
- **EVIDENCE:** chips.
- **OWNERS OF LINKED WORK:** a person row with an Agreed / No reply yet tag and an optional quote. Then "Informed, no action needed: …" at 11px.
- **Footer:** Deny ▾ and Approve & publish.

### Map view (10)

See `samples/10-map-view-relay.html`. The layout comes from the Combined Map board, styled in the Relay dark theme.

**Canvas:** the dot grid. The filter bar says "What R4 touches / Everything", and the note "Same records as the Doc view. Nothing is edited here." sits on the right of that bar.

**Nodes:**
- Nodes are cards with a 36px header (icon and title) and a body.
- **Evidence** is a node on the left with one row per source, and the two sources R4 used are highlighted.
- **R4** is the selected node in the middle: a green outline plus a 4px green glow. It contains a "NOW" label, the requirement text, "Was every 15 minutes · approved by Dana", and Reason / Evidence / **Traced to** tabs.
- **Linked work** is a column of nodes on the right: Jira LAB-15, GitLab !219, Figma · Overview, Success metric. The Figma node gets the amber outline because it needs an update.
- **"Other PRDs, same source"** is a dashed blue node below.

**Lines:** green solid lines mean "changed in v1.1", amber dashed lines mean evidence, and blue dashed lines mean other PRDs. A legend bar at the bottom explains them and holds the zoom and Fit controls.

**Right panel (320px):** REQUIREMENT, TRACED TO, STANCES, ALSO USES THIS SOURCE.

---

## 6. Content rules

- **The AI flags, a person defines.** Never title anything "Recommended Proposal" or have Relay write the new requirement on its own. Relay shows the conflict and the evidence. Marcus writes the proposal (Codex can help draft it), and Dana approves it.
- **Fix these typos where they appear:** "Pulling every 15 minutes" should be "**Polling** every 15 minutes", and "PTH1" should be "**PT1H**".
- **Use one wording for the proposal everywhere:** "Refresh data hourly, 5 minutes after the timekeeping system syncs." Don't call it "Every 60 minutes" on some screens and "hourly" on others.

---

## 7. Accessibility

- **Use real elements.** Buttons are `<button>`, links are `<a>`, and every icon-only button has an `aria-label`.
- **Contrast:** 4.5:1 for all text. That's why `text-label` is `#878E99`; don't go darker.
- **Decorative icons** get `aria-hidden="true"`.

---

## 8. Don'ts

- Geist or Geist Mono
- Half-point font sizes
- Giant numbers
- Uppercase text larger than 11px
- More than one primary button per view
- Colored pills for status that isn't pending, approved or draft
- Amber fill, amber border and amber text all on the same element
- Sparkle or "magic" AI icons
- Strikethrough edits inside the document
- Wrapping headers or tags
- Side panels without a fixed width

---

## 9. Done when

- [ ] Every screen in the mapping (section 1) uses its style. 05 is left as is.
- [ ] Only Inter and JetBrains Mono are loaded. No Geist anywhere.
- [ ] Only the type sizes from section 2 are used.
- [ ] Nothing wraps or overlaps at 1280×832, and there's no horizontal scroll.
- [ ] Side column widths match section 3.
- [ ] Both sidebars can be collapsed with an icon button.
- [ ] Amber appears only on pending or unresolved items, and green only on approved or changed ones.
- [ ] The typos are fixed and the proposal wording is the same everywhere.
- [ ] Each screen was compared side by side with the matching sample in `samples/`.
