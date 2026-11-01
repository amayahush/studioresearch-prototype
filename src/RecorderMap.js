import { html, useState, useEffect, useLayoutEffect, useRef, useMemo, cx, Fragment } from './lib.js';
import { useStore, TEXT, EVIDENCE, PEOPLE } from './store.js';
import { Avatar, Tag, StatusChip, Diff } from './ui.js';
import { getReqs } from './Astra.js';
import {
  FileText, ListTree, Box, GitBranch, Code, Frame, Target, Link2, Mic, Users, ChevronDown, ChevronRight,
  Play, Pause, SkipBack, SkipForward, Braces,
} from 'lucide-react';

/* Recorder map: the Map view replayed.
   Columns: what a record came from (left), the record (center), the work it drives (right), the people on it (below).
   The tape at the bottom replays the story; every card and connector shows its state at that moment.
   Everything is derived from the shared story state, so the map always ends where the participant's story is. */

// ---------- time ----------
// T = minutes since Sep 24 00:00. Days: Sep 24 = 0, Oct 1 = 7 … Oct 8 = 14.
const D = (day, h, m) => day * 1440 + h * 60 + m;
const OCT8 = 14, ZFROM = 13 * 60 + 30, ZTO = 14 * 60 + 30, PUB = D(7, 16, 0);
const DAYS = [0, 7, 8, 9, 10, 11, 12, 13];
const AT = { flag: D(OCT8, 13, 40), propose: D(OCT8, 13, 52), priya: D(OCT8, 13, 58), ask: D(OCT8, 14, 8), resend: D(OCT8, 14, 19), decide: D(OCT8, 14, 21), code: D(OCT8, 14, 24), label: D(OCT8, 14, 26) };
const dayName = (d) => (d === 0 ? 'Sep 24' : `Oct ${d - 6}`);
const clock = (m) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(Math.floor(m) % 60).padStart(2, '0')}`;
const fmt = (T) => { T = Math.floor(T); const d = Math.floor(T / 1440), m = T % 1440; return { date: dayName(d), time: `${clock(m)} ${m < 720 ? 'AM' : 'PM'}` }; };
const when = (T) => `${fmt(T).date} · ${fmt(T).time}`;

// Tape axis: one column per day, then Oct 8 minute by minute. Before v1 is published there is no Oct 8 yet.
function makeAxis(w, mixed) {
  if (!mixed) return [{ k: 'days', days: [...DAYS, OCT8], w }];
  const dw = Math.round(w * 0.36), brk = 14;
  return [{ k: 'days', days: DAYS, w: dw }, { k: 'brk', w: brk }, { k: 'mins', w: w - dw - brk }];
}
// pad: keep marks off the column edges. Playback uses pad 0 so position and time convert both ways.
function xOf(ax, T, pad = 5) {
  let off = 0; const d = Math.floor(T / 1440), m = T % 1440;
  for (const s of ax) {
    if (s.k === 'days') {
      const cw = s.w / s.days.length; let i = s.days.indexOf(d);
      if (i < 0 && d < s.days[s.days.length - 1]) { i = s.days.filter((x) => x <= d).length - 1; return off + i * cw + cw - 3; }
      if (i >= 0) return off + i * cw + Math.max(pad, Math.min(cw - pad, (m / 1440) * cw));
    }
    if (s.k === 'mins' && d === OCT8) return off + Math.max(0, Math.min(1, (m - ZFROM) / (ZTO - ZFROM))) * s.w;
    off += s.w;
  }
  return off;
}
function tOf(ax, x, live) {
  let off = 0;
  for (const s of ax) {
    if (x < off + s.w || s === ax[ax.length - 1]) {
      const lx = Math.max(0, x - off);
      let T;
      if (s.k === 'days') { const cw = s.w / s.days.length, i = Math.min(s.days.length - 1, Math.floor(lx / cw)); T = s.days[i] * 1440 + ((lx - i * cw) / cw) * 1439; }
      else if (s.k === 'brk') T = D(OCT8, 13, 30);
      else T = D(OCT8, 0, 0) + ZFROM + (lx / s.w) * (ZTO - ZFROM);
      return Math.min(live, T);
    }
    off += s.w;
  }
  return live;
}

// ---------- records ----------
const EPICS = [['E1', 'LAB-E1', 'Live labor visibility'], ['E2', 'LAB-E2', 'Filtering and drill-down'], ['E3', 'LAB-E3', 'Alerts and history']];
const SOURCES = {
  kickoff: ['Kickoff call', 'Sep 24', D(0, 10, 0), 'Kickoff transcript · Kim Alvarez, Dana Ortiz, Sam Reed'],
  leadnotes: ['Lead notes', 'Oct 1', D(7, 9, 0), 'Crew lead notes, p.3'],
  leadsync: ['Lead sync call', 'Oct 3', D(9, 7, 15), 'Crew lead sync call · 2nd shift lead'],
  smesync: ['SME sync', 'Oct 4', D(10, 12, 5), 'SME sync on weekly labor reviews · Sam Reed'],
};
const REQ_SOURCES = { R1: ['kickoff'], R2: ['kickoff', 'leadnotes', 'smesync'], R3: ['kickoff'], R4: ['kickoff', 'ev-spec', 'ev-api', 'ev-log'], R5: ['leadnotes'], R6: ['leadsync'], R7: ['kickoff'], R8: ['smesync'] };
const LINKS = [
  ['prd', 'E1'], ['prd', 'E2'], ['prd', 'E3'], ['prd', 'goal'], ['prd', '!218'],
  ['E1', 'R1'], ['E1', 'R2'], ['E1', 'R4'], ['E1', 'R6'], ['E2', 'R3'], ['E2', 'R5'], ['E3', 'R7'], ['E3', 'R8'],
  ['R6', 'Overview'], ['R7', 'kim'], ['R8', 'sam'],
  ['!219', 'code-job'], ['!219', 'code-ui'], ['!205', 'code-dept'], ['!212', 'code-filter'],
  ['R1', 'LAB-12'], ['R1', '!205'], ['R1', 'Overview'], ['R2', 'LAB-13'], ['R2', 'Overview'], ['R2', 'goal'],
  ['R4', 'LAB-15'], ['R4', '!219'], ['R4', 'Overview'], ['R4', 'goal'], ['R4', 'dana'],
  ['R3', 'LAB-14'], ['R3', '!212'], ['R3', 'Filters'],
  ['!205', 'marcus'], ['!219', 'marcus'], ['!212', 'marcus'], ['!218', 'marcus'],
  ['Overview', 'priya'], ['Filters', 'priya'], ['LAB-13', 'jordan'], ['goal', 'kim'],
];
const ADJ = {};
for (const [a, b] of LINKS) { (ADJ[a] = ADJ[a] || new Set()).add(b); (ADJ[b] = ADJ[b] || new Set()).add(a); }
const TYPE_ORDER = ['prd', 'epic', 'req', 'jira', 'gitlab', 'code', 'figma', 'evidence', 'goal', 'people', 'cluster', 'untraced'];
const WORK = ['jira', 'gitlab', 'figma', 'goal', 'untraced'];
const ICONS = { prd: FileText, epic: ListTree, req: FileText, jira: Box, gitlab: GitBranch, code: Code, figma: Frame, evidence: FileText, goal: Target, cluster: Link2, untraced: Code, source: Mic, api: Braces };
const Ico = ({ t, size = 14 }) => { const I = ICONS[t] || FileText; return html`<${I} size=${size} strokeWidth=${1.5} aria-hidden="true" />`; };
const epicOf = (r) => ({ R1: 'E1', R2: 'E1', R4: 'E1', R6: 'E1', R3: 'E2', R5: 'E2', R7: 'E3', R8: 'E3' }[r]);
const MAIN_PEOPLE = ['dana', 'marcus', 'priya', 'kim', 'sam', 'jordan'];

// The story as a record: events, lags and who knew what, built from the shared state.
function buildRecord(state) {
  const published = state.stage !== 'unpublished';
  const proposed = published && state.stage !== 'flagged';
  const approved = state.stage === 'approved', denied = state.stage === 'denied';
  const resent = ['resent', 'approved'].includes(state.stage) && state.evidence.includes('changelog');
  const u = state.updates;
  const ev = (req, t, kind, who, text, path, chips = [], reviewer = null) => ({ req, t, kind, who, text, path, chips, reviewer });
  const E = [
    ev('R4', D(0, 10, 18), 'person', 'kim', `Kickoff call: “If leads can see it by lunch, they can move people before it turns into overtime.”`, [['kim', 'kickoff'], ['kickoff', 'R4']], ['Kickoff 18:40']),
    ev('R4', D(0, 16, 0), 'ai', 'astra', 'Drafted R4 “Refresh data every 15 minutes” from the kickoff transcript.', [['kickoff', 'R4'], ['R4', 'dana']], [], 'Dana Ortiz'),
    ev('R4', D(8, 11, 20), 'ai', 'astra', 'Created Jira LAB-15 from R4: refresh labor hours every 15 minutes.', [['R4', 'LAB-15']], ['Jira LAB-15'], 'Dana Ortiz'),
    ev('R4', D(9, 14, 40), 'person', 'priya', 'Added an “Updated every 15 min” label to the Overview frame.', [['R4', 'Overview'], ['Overview', 'priya']], ['Figma · Overview']),
    ev('R4', D(9, 18, 5), 'ai', 'codex', 'Wrote the refresh job on a 15-minute schedule, as R4 says. Opened !219.', [['R4', '!219'], ['!219', 'code-job'], ['!219', 'marcus']], ['GitLab !219'], 'Marcus Lee'),
    ev('R1', D(0, 16, 0), 'ai', 'astra', 'Drafted R1 from the kickoff transcript.', [['kickoff', 'R1']], [], 'Dana Ortiz'),
    ev('R1', D(9, 11, 0), 'person', 'priya', 'Drew the department bars on the Overview frame.', [['R1', 'Overview'], ['Overview', 'priya']], ['Figma · Overview']),
    ev('R1', D(10, 15, 30), 'person', 'marcus', 'Merged !205, the department hours endpoint.', [['marcus', '!205'], ['!205', 'R1'], ['!205', 'code-dept']], ['GitLab !205']),
    ev('R1', D(11, 9, 0), 'done', 'astra', 'Jira LAB-12 moved to Done.', [['R1', 'LAB-12']], ['Jira LAB-12']),
    ev('R2', D(0, 14, 5), 'person', 'kim', 'Kickoff call: “Anything past 85 and we’re already paying overtime by Friday.”', [['kim', 'kickoff'], ['kickoff', 'R2']], ['Kickoff 14:05']),
    ev('R2', D(7, 9, 0), 'open', 'astra', 'Lead notes say 90%, not 85%. R2 now has two sources that disagree.', [['leadnotes', 'R2']], ['Lead notes p.2'], null),
    ev('R2', D(10, 12, 10), 'open', 'sam', 'SME sync: Sam says 80%. Three sources, three thresholds.', [['sam', 'smesync'], ['smesync', 'R2']], ['SME sync']),
    ev('R2', D(11, 10, 0), 'person', 'jordan', 'Started Jira LAB-13, the overtime flag.', [['jordan', 'LAB-13'], ['LAB-13', 'R2']], ['Jira LAB-13']),
    ev('R3', D(0, 22, 10), 'person', 'sam', 'Kickoff call: “Second shift never looks at first shift’s numbers.”', [['sam', 'kickoff'], ['kickoff', 'R3']], ['Kickoff 22:10']),
    ev('R3', D(9, 13, 0), 'person', 'priya', 'Designed the Filters frame.', [['priya', 'Filters'], ['Filters', 'R3']], ['Figma · Filters']),
    ev('R3', D(12, 14, 0), 'person', 'marcus', 'Opened !212, the shift filter UI.', [['marcus', '!212'], ['!212', 'R3']], ['GitLab !212']),
    ev('R5', D(7, 9, 30), 'ai', 'astra', 'Drafted R5 from crew lead notes p.3. Nobody has accepted it.', [['leadnotes', 'R5']], ['Lead notes p.3']),
    ev('R6', D(9, 7, 15), 'person', 'sam', 'Lead sync: “I only care about my guys. Show me my crews before anything else.”', [['leadsync', 'R6']], ['Lead sync 07:15']),
    ev('R6', D(9, 10, 40), 'ai', 'astra', 'Added R6 as assumed from the lead sync call.', [['leadsync', 'R6'], ['R6', 'Overview']], [], 'Dana Ortiz'),
    ev('R7', D(0, 10, 31), 'person', 'kim', 'Kickoff call: “Can it just ping me when somebody’s running hot?”', [['kim', 'kickoff'], ['kickoff', 'R7']], ['Kickoff 31:20']),
    ev('R8', D(10, 12, 5), 'person', 'sam', 'SME sync: “We usually look back about three months, I think.”', [['sam', 'smesync'], ['smesync', 'R8']], ['SME sync 12:05']),
  ];
  if (published) E.push(ev('R4', PUB, 'person', 'dana', 'Published PRD v1 with R4 still assumed. The assumption check flagged it first.', [['dana', 'R4'], ['R4', 'E1'], ['E1', 'prd']], ['Assumption check']));
  if (published) E.push(ev('R4', AT.flag, 'open', 'codex', 'Build test: the timekeeping API returns sync_interval PT1H. R4 is contradicted.', [['code-job', '!219'], ['!219', 'R4'], ['ev-api', 'R4']], ['API response · 1:40 PM'], 'Marcus Lee'));
  if (proposed) E.push(ev('R4', AT.propose, 'open', 'marcus', `Proposed: “${state.proposal.text}”`, [['marcus', '!219'], ['!219', 'R4'], ['ev-spec', 'R4'], ['R4', 'dana'], ['R4', 'Overview'], ['Overview', 'priya']], ['Spec §3.2', 'API response']));
  if (state.priya.stance) E.push(ev('R4', AT.priya, 'person', 'priya', state.priya.stance === 'agreed' ? `Agreed in the Figma plugin${state.priya.note ? `: “${state.priya.note}”` : '.'}` : `Disagreed in the Figma plugin${state.priya.note ? `: “${state.priya.note}”` : '.'}`, [['priya', 'Overview'], ['Overview', 'R4']]));
  if (state.danaAsk) E.push(ev('R4', AT.ask, 'open', 'dana', `Asked for more evidence: “${state.danaAsk}”`, [['dana', 'R4'], ['R4', '!219'], ['!219', 'marcus']]));
  if (resent) E.push(ev('R4', AT.resend, 'open', 'marcus', `Added changelog lines 58–60 and resent${state.marcusReply ? `: “${state.marcusReply}”` : '.'}`, [['marcus', '!219'], ['!219', 'R4'], ['ev-log', 'R4']], ['Changelog L58–60']));
  if (state.kim.stance) E.push(ev('R4', AT.resend, 'person', 'kim', `Agreed in Teams: “${TEXT.kimNote}”`, [['kim', 'goal'], ['goal', 'R4']]));
  if (approved) {
    const path = [['dana', 'R4'], ['R4', 'E1'], ['E1', 'prd']];
    const told = ['PRD v1.1'];
    if (u.jira) { path.push(['R4', 'LAB-15']); told.push('Jira'); }
    if (u.figma) { path.push(['R4', 'Overview'], ['Overview', 'priya']); told.push('Figma'); }
    if (u.metric) { path.push(['R4', 'goal']); told.push('success metric'); }
    if (u.teams) { path.push(['goal', 'kim']); told.push('Teams'); }
    path.push(['R4', 'ev-api'], ['ev-api', 'cl-shift'], ['ev-api', 'cl-comp']);
    E.push(ev('R4', AT.decide, 'done', 'dana', `Approved R4: “${state.approvalReason}” Astra updated ${told.join(', ')} and told the two other PRDs that read this API.`, path, ['Decision record · R4']));
  }
  if (denied) E.push(ev('R4', AT.decide, 'open', 'dana', 'Denied the change. R4 stays as written, still contradicted by the build.', [['dana', 'R4'], ['R4', '!219'], ['!219', 'marcus']]));
  if (state.codeUpdated) E.push(ev('R4', AT.code, 'done', 'marcus', 'Updated the refresh job to hourly (5 * * * *).', [['marcus', '!219'], ['!219', 'code-job']], ['GitLab !219']));
  if (state.labelUpdated) E.push(ev('R4', AT.label, 'done', 'priya', 'Relabeled the Overview to show the real last sync time.', [['priya', 'Overview'], ['Overview', 'code-ui']], ['Figma · Overview']));
  E.sort((a, b) => a.t - b.t);
  const last = E[E.length - 1].t;
  const live = published ? Math.max(last + 1, AT.flag + 1) : PUB - 1;
  const decideAt = approved || denied ? AT.decide : null;
  const lags = {
    prd: [AT.flag, decideAt ?? live, 'The build knew R4 was wrong at 1:40 PM. The PRD still said every 15 minutes.'],
    ...(approved && { 'code-job': [AT.decide, state.codeUpdated ? AT.code : live, 'v1.1 was approved. The refresh job still polls every 15 minutes.'], Overview: [AT.decide, state.labelUpdated ? AT.label : live, 'v1.1 was approved. The label still says “Updated every 15 min”.'] }),
  };
  if (!published) delete lags.prd;
  const knew = {
    marcus: published ? AT.flag : null,
    dana: proposed ? AT.propose : null,
    priya: proposed ? AT.propose : null,
    kim: state.kim.stance ? AT.resend : null,
    sam: null,
  };
  const r4At = (T) => (T < PUB ? 'draft' : T < AT.flag ? 'assumed' : approved && T >= AT.decide ? 'verified' : 'contradicted');
  const knewAt = (id, T) => (!(id in knew) || !published ? null : approved && T >= AT.decide ? 'cur' : knew[id] !== null && T >= knew[id] ? 'knows' : 'v1');
  return { events: E, live, lags, knewAt, r4At, published, approved, mixed: published };
}

const mins = (T, from) => { const m = Math.floor(T - from); return m > 0 ? ` · ${m} min` : ''; };

// Records with their label and status at time T.
function recordsAt(state, rec, T) {
  const reqs = Object.fromEntries(getReqs(state).map((r) => [r.id, r]));
  const r4 = rec.r4At(T), ch = r4 === 'verified';
  const born = (t) => T >= t;
  const lagging = (id) => rec.lags[id] && T >= rec.lags[id][0] && T < rec.lags[id][1];
  const n = {
    prd: { type: 'prd', label: 'Line Labor Dashboard', kind: 'PRD', full: `PRD ${ch ? 'v1.1' : T >= PUB ? 'v1' : 'v1 draft'}`, status: 'Owner Dana Ortiz', born: 0 },
    goal: { type: 'goal', label: 'Mid-shift risk', kind: 'Success metric', full: 'Leaders spot overtime risk by mid-shift.', status: 'Owner Kim Alvarez', born: 0 },
    'LAB-12': { type: 'jira', label: 'LAB-12', kind: 'Jira', full: 'Labor hours by department', status: T >= D(11, 9, 0) ? 'Done' : 'In progress', born: D(8, 11, 0) },
    'LAB-13': { type: 'jira', label: 'LAB-13', kind: 'Jira', full: 'Overtime flag', status: 'In progress · Jordan Kim', born: D(8, 11, 10) },
    'LAB-14': { type: 'jira', label: 'LAB-14', kind: 'Jira', full: 'Shift filter', status: 'In progress', born: D(8, 11, 15) },
    'LAB-15': { type: 'jira', label: 'LAB-15', kind: 'Jira', full: 'Refresh labor hours from the timekeeping API', status: ch && state.updates.jira ? 'In progress · updated for v1.1' : 'In progress · Marcus', born: D(8, 11, 20) },
    '!205': { type: 'gitlab', label: '!205', kind: 'GitLab', full: 'Department hours endpoint', status: 'Merged · Marcus Lee', born: D(10, 15, 30) },
    '!212': { type: 'gitlab', label: '!212', kind: 'GitLab', full: 'Shift filter UI', status: 'Open · Marcus Lee', born: D(12, 14, 0) },
    '!219': { type: 'gitlab', label: '!219 · lab-15-refresh', kind: 'GitLab', full: 'Scheduled refresh job', status: r4 === 'contradicted' ? 'Open · tagged pending-R4' : 'Open · Marcus Lee', born: D(9, 18, 5) },
    '!218': { type: 'untraced', label: '!218', kind: 'Untraced work', full: 'Cache warm-up script', status: 'Not linked to any requirement', born: D(11, 16, 0) },
    'code-job': { type: 'code', label: 'refreshLaborHours.ts', kind: 'Code', full: 'src/jobs/refreshLaborHours.ts', status: lagging('code-job') ? `Needs update${mins(T, rec.lags['code-job'][0])}` : state.codeUpdated && T >= AT.code ? 'Hourly · matches v1.1' : 'Polls every 15 min', born: D(9, 18, 5) },
    'code-ui': { type: 'code', label: 'Overview.tsx', kind: 'Code', full: 'src/ui/Overview.tsx', status: state.labelUpdated && T >= AT.label ? 'Shows last sync time' : 'Label says every 15 min', born: D(9, 18, 5) },
    'code-dept': { type: 'code', label: 'departmentTotals.ts', kind: 'Code', full: 'src/api/departmentTotals.ts', status: 'Merged', born: D(10, 15, 30) },
    'code-filter': { type: 'code', label: 'ShiftFilter.tsx', kind: 'Code', full: 'src/ui/ShiftFilter.tsx', status: 'Open', born: D(12, 14, 0) },
    Overview: { type: 'figma', label: 'Overview', kind: 'Figma frame', full: 'Dashboard / Overview', status: lagging('Overview') ? `Label needs update${mins(T, rec.lags.Overview[0])}` : state.labelUpdated && T >= AT.label ? 'Label shows last sync time' : 'Label: “Updated every 15 min”', born: D(9, 11, 0) },
    Filters: { type: 'figma', label: 'Filters', kind: 'Figma frame', full: 'Dashboard / Filters', status: 'Priya Shah', born: D(9, 13, 0) },
    'ev-spec': { type: 'evidence', label: 'Spec §3.2', kind: 'Evidence', full: EVIDENCE.spec.label, status: EVIDENCE.spec.meta, born: state.stage === 'flagged' || state.stage === 'unpublished' ? Infinity : AT.propose },
    'ev-api': { type: 'evidence', label: 'API response', kind: 'Evidence', full: 'Sandbox GET /v2/labor/hours', status: EVIDENCE.api.meta, born: rec.published ? AT.flag : Infinity, icon: 'api' },
    'ev-log': { type: 'evidence', label: 'Changelog L58–60', kind: 'Evidence', full: EVIDENCE.changelog.label, status: EVIDENCE.changelog.meta, born: state.evidence.includes('changelog') ? AT.resend : Infinity },
    'cl-shift': { type: 'cluster', label: 'Shift Handoff · R2', kind: 'Other PRD · same API', full: 'Show hours worked this shift', status: ch ? 'Owner notified of v1.1' : 'Reads the timekeeping API', born: 0 },
    'cl-comp': { type: 'cluster', label: 'Compliance Tracker · R6', kind: 'Other PRD · same API', full: 'Report hours against labor rules daily', status: ch ? 'Owner notified of v1.1' : 'Reads the timekeeping API', born: 0 },
  };
  if (lagging('prd')) n.prd.status = `Behind the build${mins(T, rec.lags.prd[0])}`;
  for (const [id, , name] of EPICS) { const rs = [...ADJ[id]].filter((k) => /^R\d$/.test(k) && reqs[k]).sort(); n[id] = { type: 'epic', label: name, id: `LAB-${id}`, kind: 'Epic', full: rs.map((r) => `${r} · ${reqs[r].name}`).join('\n'), status: `${rs.length} requirements`, born: PUB }; }
  for (const r of Object.values(reqs)) {
    const assume = r.id === 'R4' ? (r4 === 'draft' ? 'assumed' : r4) : r.assume;
    n[r.id] = { type: 'req', label: r.name, id: r.id, kind: 'Requirement', full: r.id === 'R4' ? (ch ? state.proposal.text : TEXT.r4Old) : r.text, status: r.note, assume, draft: r.status === 'draft' || (r.id === 'R4' && r4 === 'draft'), born: r.id === 'R5' ? D(7, 9, 30) : r.id === 'R6' ? D(9, 10, 40) : r.id === 'R8' ? D(10, 12, 30) : D(0, 16, 0), changedIn: r.id === 'R4' && ch ? 'v1.1' : null, sources: r.sources };
  }
  for (const id of MAIN_PEOPLE) n[id] = { type: 'people', person: id, label: PEOPLE[id].name, kind: 'Person', full: PEOPLE[id].name, status: PEOPLE[id].title, born: 0 };
  for (const id of Object.keys(n)) n[id].alive = born(n[id].born);
  return n;
}

const neighbors = (id, nodes) => [...(ADJ[id] || [])].filter((k) => nodes[k]).sort((a, b) => TYPE_ORDER.indexOf(nodes[a].type) - TYPE_ORDER.indexOf(nodes[b].type));
function peopleFor(id, nodes, events) {
  const s = new Set(neighbors(id, nodes).filter((k) => nodes[k].type === 'people'));
  for (const e of events) if (e.req === id && nodes[e.who]) s.add(e.who);
  if (id === 'R4') ['dana', 'marcus', 'priya', 'kim', 'sam'].forEach((p) => s.add(p));
  return MAIN_PEOPLE.filter((p) => s.has(p));
}

// ---------- the view ----------
// Playback: tape pixels per second at 1×, and how long the playhead rests on each event so its change can land.
const SPEED = 60, DWELL = 900;
const SPEEDS = [[0.5, '0.5×'], [1, '1×'], [2, '2×']];

export function RecorderMap({ selected, setSelected }) {
  const { state } = useStore();
  const rec = useMemo(() => buildRecord(state), [state]);
  const [focus, setFocus] = useState(() => (selected && /^R\d$/.test(selected) ? selected : 'R4'));
  const [track, setTrack] = useState(() => (selected && /^R\d$/.test(selected) ? selected : 'R4'));
  const [scope, setScope] = useState(() => epicOf(selected && /^R\d$/.test(selected) ? selected : 'R4'));
  const [T, setT] = useState(rec.live);
  const [playing, setPlaying] = useState(false);
  const [follow, setFollow] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [menu, setMenu] = useState(false);
  const [showNow, setShowNow] = useState(false);
  const [tip, setTip] = useState(null);
  const tapeRef = useRef(null);
  const [tapeW, setTapeW] = useState(800);
  const live = rec.live;
  const isLive = T >= live;

  // A new story step (from another tool) moves the map to the new present.
  useEffect(() => { setT(rec.live); }, [rec.live]);
  useEffect(() => {
    if (!tapeRef.current) return;
    const ro = new ResizeObserver(([e]) => setTapeW(e.contentRect.width));
    ro.observe(tapeRef.current);
    return () => ro.disconnect();
  }, []);

  const scopeReqs = scope === 'all' ? EPICS.flatMap(([id]) => [...ADJ[id]].filter((k) => /^R\d$/.test(k))) : [...ADJ[scope]].filter((k) => /^R\d$/.test(k)).sort();
  const events = rec.events.filter((e) => scopeReqs.includes(e.req) && (!track || e.req === track));
  const ax = makeAxis(tapeW, rec.mixed && (!track || track === 'R4') && scopeReqs.includes('R4'));
  const nodes = recordsAt(state, rec, T);
  const passed = events.filter((e) => e.t <= T);
  const cur = isLive || !passed.length ? [] : passed.filter((e) => e.t === passed[passed.length - 1].t);
  const touched = new Set(cur.flatMap((e) => e.path.flat()));

  // Smooth playback: the playhead glides along the tape; events take effect as it passes them.
  const tRef = useRef(T); tRef.current = T;
  useEffect(() => {
    if (!playing) return;
    let raf, last = performance.now(), restUntil = 0;
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      if (now < restUntil) { raf = requestAnimationFrame(tick); return; }
      let nt = Math.max(tRef.current + 0.01, tOf(ax, xOf(ax, tRef.current, 0) + SPEED * speed * dt, live));
      // Stop on each event for a moment so its cards and connectors can change before moving on.
      const next = events.find((e) => e.t > tRef.current && e.t <= nt);
      if (next) { nt = next.t; restUntil = now + DWELL / speed; }
      setT(Math.min(nt, live));
      if (nt >= live) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, ax.length, tapeW, live, track, scope]);

  // Follow mode: center on whoever acted.
  const lastCur = cur[0];
  useEffect(() => {
    if (!follow || !lastCur) return;
    const target = nodes[lastCur.who] ? lastCur.who : lastCur.path.flat().find((id) => nodes[id] && id !== focus);
    if (target && target !== focus) setFocus(target);
  }, [follow, lastCur && lastCur.t]);

  const center = (id) => {
    if (!nodes[id]) return;
    setTip(null);
    setFocus(id);
    if (nodes[id].type === 'req') { setTrack(id); setScope(epicOf(id)); setSelected(id); }
  };
  const pickScope = (s) => { setMenu(false); setScope(s); setTrack(null); setFocus(s === 'all' ? 'prd' : s); };
  const times = [...new Set(events.map((e) => e.t))];
  const step = (dir) => { setPlaying(false); const i = dir > 0 ? times.findIndex((t) => t > T) : times.findLastIndex((t) => t < Math.floor(T)); setT(i >= 0 ? times[i] : dir > 0 ? live : T); };
  const play = () => { if (playing) return setPlaying(false); if (!times.length) return; if (isLive) setT(times[0] - 0.5); setPlaying(true); };

  useEffect(() => {
    const onKey = (e) => { if (e.target.closest('input, textarea')) return; if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const hover = (content) => (e) => { const r = e.currentTarget.getBoundingClientRect(); const left = Math.max(12, Math.min(r.left, window.innerWidth - 292)); setTip({ content, pos: window.innerHeight - r.bottom < 240 ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 } }); };
  const unhover = () => setTip(null);
  const nodeTip = (id) => {
    const n = nodes[id];
    if (!n.alive) return html`<${Fragment}><div className="tiny-label">${n.kind}</div><div className="map-tip-text">${n.full}</div><div className="muted tiny">Not created yet at ${when(T)}.</div><//>`;
    const lastEv = rec.events.filter((e) => e.t <= T && e.path.some((l) => l.includes(id))).pop();
    const k = rec.knewAt(id, T);
    return html`<${Fragment}><div className="tiny-label">${n.kind}${n.id ? ` · ${n.id}` : ''}</div>
      <div className="map-tip-text">${n.full}</div>
      ${n.status && html`<div className="muted tiny">${n.status}</div>`}
      ${k && html`<div className="tiny">${k === 'cur' ? 'On v1.1' : k === 'knows' ? 'Knew R4 was wrong' : 'Working from v1, not told yet'}</div>`}
      ${lastEv && html`<div className="muted tiny">Last · ${fmt(lastEv.t).date} ${fmt(lastEv.t).time}: ${lastEv.text}</div>`}<//>`;
  };
  const evTip = (e) => html`<${Fragment}><div className="rec-tip-head"><${Who} id=${e.who} /><span><strong>${whoName(e.who)}</strong><span className="muted tiny"> · ${e.req} · ${when(e.t)}</span></span></div>
    <div className="map-tip-text">${e.text}</div>
    ${(e.reviewer || e.kind === 'ai' || e.chips.length > 0) && html`<div className="chips">${e.reviewer ? html`<${Tag} tone="blue">AI · reviewed by ${e.reviewer}<//>` : e.kind === 'ai' ? html`<${Tag} tone="blue">AI · not reviewed<//>` : null}${e.chips.map((c) => html`<${Tag} key=${c}>${c}<//>`)}</div>`}<//>`;

  const props = { nodes, rec, T, touched, focus, center, hover, unhover, nodeTip, state, showNow, setShowNow, events: rec.events };

  return html`<div className="rec">
    <div className="map-bar">
      <div className="export-wrap">
        <button className="rl-filter" aria-haspopup="menu" aria-expanded=${menu} onClick=${() => setMenu(!menu)}>
          ${scope === 'all' ? 'All epics' : html`<${Fragment}><span className="mono muted">LAB-${scope}</span> ${EPICS.find(([id]) => id === scope)[2]}<//>`}<${ChevronDown} size=${12} strokeWidth=${1.5} aria-hidden="true" />
        </button>
        ${menu && html`<div className="menu rec-menu" role="menu">
          <button role="menuitem" className=${cx('menu-item row', scope === 'all' && 'on')} onClick=${() => pickScope('all')}><strong>All epics</strong><span className="muted tiny">Center the map on the PRD</span></button>
          ${EPICS.map(([id, code, name]) => html`<button key=${id} role="menuitem" className=${cx('menu-item row', scope === id && 'on')} onClick=${() => pickScope(id)}><strong><span className="mono muted">${code}</span>${name}</strong><span className="muted tiny">${[...ADJ[id]].filter((k) => /^R\d$/.test(k)).sort().join(', ')}</span></button>`)}
        </div>`}
      </div>
      <div className="seg sm" role="group" aria-label="Requirement">
        <button className=${cx('seg-btn', !track && 'active')} onClick=${() => { setTrack(null); setFocus(scope === 'all' ? 'prd' : scope); }}>${scope === 'all' ? 'PRD' : 'Epic'}</button>
        ${scopeReqs.map((r) => { const s = rec.r4At(T); const d = r === 'R4' && (s === 'contradicted' ? 'amber' : s === 'verified' ? 'green' : null); return html`<button key=${r} className=${cx('seg-btn', track === r && 'active')} onClick=${() => center(r)}>${d && html`<span className=${cx('dot', d)} />`}${r}</button>`; })}
      </div>
      ${focus !== track && focus !== (scope === 'all' ? 'prd' : scope) && html`<span className="rec-trail"><${ChevronRight} size=${12} strokeWidth=${1.5} aria-hidden="true" />${nodes[focus].label}</span>`}
      <span className="grow" />
    </div>

    <div className="rec-stage">
      <${Columns} key=${focus} ...${props} />
    </div>

    <div className="rec-tape">
      <div className="rec-strip" ref=${tapeRef} onMouseDown=${(e) => {
        if (e.target.closest('.rec-tick')) return;
        setPlaying(false);
        const r = tapeRef.current.getBoundingClientRect();
        const move = (ev) => setT(tOf(ax, ev.clientX - r.left, live));
        move(e);
        const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
        window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      }}>
        <${Axis} ax=${ax} T=${T} />
        ${spread(events.map((e) => xOf(ax, e.t))).map((x, i) => { const e = events[i]; return html`<button key=${i} className=${cx('rec-tick', e.kind, cur.includes(e) && 'cur', e.t > T && 'future')} style=${{ left: x }}
          onClick=${() => { setPlaying(false); setT(e.t); }} onMouseEnter=${hover(evTip(e))} onMouseLeave=${unhover} aria-label=${`${when(e.t)}: ${e.text}`} />`; })}
        <span className="rec-head" style=${{ transform: `translateX(${xOf(ax, Math.min(T, live))}px)` }}>
          <span className="rec-htime">${isLive ? 'Live' : T >= D(OCT8, 0, 0) && ax.length > 1 ? fmt(T).time : when(T)}</span>
        </span>
      </div>
      <div className="rec-trans">
        <button className="icon-btn" onClick=${() => step(-1)} aria-label="Previous event"><${SkipBack} size=${14} strokeWidth=${1.5} /></button>
        <button className="icon-btn rec-play" onClick=${play} aria-label=${playing ? 'Pause' : 'Play'}>${playing ? html`<${Pause} size=${14} strokeWidth=${1.5} />` : html`<${Play} size=${14} strokeWidth=${1.5} />`}</button>
        <button className="icon-btn" onClick=${() => step(1)} aria-label="Next event"><${SkipForward} size=${14} strokeWidth=${1.5} /></button>
        <span className="rec-clock mono">${isLive ? `Now · ${when(live)}` : when(T)}</span>
        <span className="rec-callout"><${Callout} rec=${rec} T=${T} cur=${cur} isLive=${isLive} track=${track} /></span>
        <div className="seg sm rec-speed" role="group" aria-label="Playback speed">${SPEEDS.map(([v, l]) => html`<button key=${v} className=${cx('seg-btn', speed === v && 'active')} aria-pressed=${speed === v} onClick=${() => setSpeed(v)}>${l}</button>`)}</div>
        <label className="rec-follow"><input type="checkbox" checked=${follow} onChange=${(e) => setFollow(e.target.checked)} /><span className="rec-switch" aria-hidden="true" />Follow events</label>
        ${!isLive && html`<button className="btn sm" onClick=${() => { setPlaying(false); setT(live); }}>Back to now</button>`}
      </div>
    </div>
    ${tip && html`<div className="map-tip rec-tip" role="tooltip" style=${tip.pos}>${tip.content}</div>`}
  </div>`;
}

// Circles closer than 13px would overlap: step each one right of the one before (events are in time order).
const spread = (xs) => { const out = []; for (const x of xs) out.push(out.length && x - out[out.length - 1] < 13 ? out[out.length - 1] + 13 : x); return out; };
const whoName = (id) => (id === 'astra' ? 'Astra' : id === 'codex' ? 'Codex' : PEOPLE[id].name);
const Who = ({ id }) => (PEOPLE[id] ? html`<${Avatar} id=${id} size=${20} />` : html`<span className=${cx('rec-bot', id)}>${id === 'codex' ? '>_' : 'A'}</span>`);

function Callout({ rec, T, cur, isLive, track }) {
  const names = (s) => ['marcus', 'dana', 'priya', 'kim', 'sam'].filter((p) => rec.knewAt(p, T) === s).map((p) => PEOPLE[p].name.split(' ')[0]);
  if (isLive) return rec.approved ? 'You are at the present. Everyone is on v1.1. Press play to replay how it got here.' : 'You are at the present. Press play to replay how R4 got here.';
  if (cur[0] && cur[0].t === AT.decide && rec.approved) return html`<${Fragment}><strong className="green">v1.1 goes out from R4</strong> to the PRD, Jira, Figma, Teams and the two other PRDs that read this API.<//>`;
  if (rec.r4At(T) === 'contradicted' && (!track || track === 'R4')) {
    const k = names('knows'), v = names('v1');
    return html`<${Fragment}><strong className="amber">${k.length === 1 ? `Only ${k[0]} knew` : `${k.join(', ')} knew`} R4 was wrong.</strong> ${v.length ? `${v.join(', ')} ${v.length > 1 ? 'were' : 'was'} still working from v1.` : 'The PRD still said every 15 minutes.'}<//>`;
  }
  return cur[0] ? cur[0].text : 'Nothing has happened yet at this point.';
}

function Axis({ ax, T }) {
  let off = 0;
  const out = [];
  for (const s of ax) {
    if (s.k === 'days') { const cw = s.w / s.days.length; s.days.forEach((d, i) => out.push(html`<span key=${'d' + d} className="rec-t" style=${{ left: off + i * cw + cw / 2 }}>${d === 0 ? 'Sep 24' : d === 7 || cw > 60 ? dayName(d) : d - 6}</span>`)); }
    else if (s.k === 'brk') out.push(html`<span key="brk" className="rec-brk" style=${{ left: off + 3, width: s.w - 6 }} title="Sep 24 to Oct 7 are one column per day. Oct 8 is minute by minute." />`);
    else { out.push(html`<span key="o8" className="rec-t start" style=${{ left: off }}>Oct 8</span>`); for (let m = ZFROM + 15; m <= ZTO; m += 15) out.push(html`<span key=${m} className="rec-t" style=${{ left: off + ((m - ZFROM) / (ZTO - ZFROM)) * s.w - (m === ZTO ? 10 : 0) }}>${clock(m)}</span>`); }
    off += s.w;
  }
  return html`<${Fragment}><span className="rec-base" />${out}<span className="rec-past" style=${{ width: xOf(ax, T) }} /><//>`;
}

// ---------- columns ----------
function Columns(p) {
  const { nodes, focus, events } = p;
  const n = nodes[focus];
  const stageRef = useRef(null);
  const [paths, setPaths] = useState([]);
  let L = [], R = [], ppl = [], crumbs = ['prd'];
  if (n.type === 'req') {
    crumbs = ['prd', epicOf(focus)];
    L.push(html`<${SourcesCard} key="src" ids=${REQ_SOURCES[focus]} ...${p} />`);
    if (focus === 'R4') L.push(html`<${Card} key="cl" title="Also reads this API" icon="cluster" anchor="loop" from="ev-api" rows=${['cl-shift', 'cl-comp']} ...${p} />`);
    for (const k of neighbors(focus, nodes).filter((k) => WORK.includes(nodes[k].type))) R.push(html`<${Card} key=${k} id=${k} anchor="right" rows=${neighbors(k, nodes).filter((c) => nodes[c].type === 'code')} ...${p} />`);
    ppl = peopleFor(focus, nodes, events);
  } else if (n.type === 'epic') {
    const reqs = neighbors(focus, nodes).filter((k) => nodes[k].type === 'req');
    L.push(html`<${SourcesCard} key="src" ids=${[...new Set(reqs.flatMap((r) => REQ_SOURCES[r]).filter((s) => SOURCES[s]))]} ...${p} />`);
    for (const r of reqs) R.push(html`<${ReqCard} key=${r} id=${r} ...${p} />`);
    ppl = [...new Set(reqs.flatMap((r) => peopleFor(r, nodes, events)))];
  } else if (n.type === 'prd') {
    L.push(html`<${SourcesCard} key="src" ids=${Object.keys(SOURCES)} ...${p} />`);
    for (const [id] of EPICS) R.push(html`<${Card} key=${id} id=${id} anchor="right" rows=${neighbors(id, nodes).filter((k) => nodes[k].type === 'req')} ...${p} />`);
    ppl = MAIN_PEOPLE;
  } else {
    crumbs = ['prd'];
    const nb = neighbors(focus, nodes);
    for (const k of nb.filter((k) => nodes[k].type === 'req')) L.push(html`<${ReqCard} key=${k} id=${k} side="left" ...${p} />`);
    for (const k of nb.filter((k) => !['req', 'people'].includes(nodes[k].type))) R.push(html`<${Card} key=${k} id=${k} anchor="right" rows=${neighbors(k, nodes).filter((c) => nodes[c].type === 'code')} ...${p} />`);
    if (n.type !== 'people') ppl = nb.filter((k) => nodes[k].type === 'people');
  }

  // Connectors are measured from the laid-out cards, so they follow whatever the columns hold.
  useLayoutEffect(() => {
    const st = stageRef.current; if (!st) return;
    const sr = st.getBoundingClientRect();
    const box = (el) => { const r = el.getBoundingClientRect(); return { l: r.left - sr.left, r: r.right - sr.left, t: r.top - sr.top, b: r.bottom - sr.top, cy: r.top + r.height / 2 - sr.top, cx: r.left + r.width / 2 - sr.left }; };
    const cEl = st.querySelector('.rec-center'); if (!cEl) return;
    const c = box(cEl), out = [];
    const ids = (el) => [el.dataset.id, ...[...el.querySelectorAll('[data-id]')].map((x) => x.dataset.id)].filter(Boolean);
    st.querySelectorAll('[data-anchor]').forEach((el) => {
      const a = el.dataset.anchor, b = box(el);
      if (a === 'rows') { const rows = [...el.querySelectorAll('.rec-row')]; rows.forEach((r, i) => { const rb = box(r); const y2 = c.t + 52 + (c.b - c.t - 70) * (rows.length < 2 ? 0.5 : i / (rows.length - 1)); out.push({ key: 'src' + i, d: hz(b.r, rb.cy, c.l, y2), ids: [r.dataset.id, focus] }); }); }
      if (a === 'left') out.push({ key: 'l' + el.dataset.id, d: hz(b.r, b.cy, c.l, c.cy), ids: [...ids(el), focus] });
      if (a === 'right') out.push({ key: 'r' + el.dataset.id, d: hz(c.r, c.cy, b.l, b.t + 21), ids: [focus, ...ids(el)] });
      if (a === 'bottom') out.push({ key: 'ppl', d: vt(c.cx, c.b, b.cx, b.t), ids: [focus, ...ids(el)], people: true });
      if (a === 'loop') { const f = st.querySelector(`.rec-row[data-id="${el.dataset.from}"]`); if (f) { const fb = box(f); out.push({ key: 'loop', d: `M ${fb.l} ${fb.cy} C ${fb.l - 28} ${fb.cy}, ${b.l - 28} ${b.t + 21}, ${b.l} ${b.t + 21}`, ids: [el.dataset.from, ...ids(el)] }); } }
    });
    const sig = JSON.stringify(out);
    setPaths((prev) => (JSON.stringify(prev) === sig ? prev : out));
  });
  useEffect(() => {
    const on = () => setPaths((p) => [...p]);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  const lit = (path) => path.ids.filter((i) => p.touched.has(i)).length >= 2;
  return html`<div className="rec-cols" ref=${stageRef}>
    <svg className="rec-svg" aria-hidden="true">
      ${paths.map((path) => html`<path key=${path.key} className=${cx('rec-conn', p.touched.size > 0 && !lit(path) && 'quiet')} d=${path.d} />`)}
      ${paths.filter(lit).map((path) => html`<path key=${path.key + ':' + [...p.touched].join()} className="rec-trace" d=${path.d} pathLength="1" />`)}
    </svg>
    <div className="rec-col">${L}</div>
    <div className="rec-col mid">
      <nav className="rec-crumbs" aria-label="Map path">${crumbs.filter((c) => c && c !== focus).map((c, i) => html`<${Fragment} key=${c}>${i > 0 && html`<${ChevronRight} size=${12} strokeWidth=${1.5} className="muted" aria-hidden="true" />`}<button className="crumb" onClick=${() => p.center(c)}>${nodes[c].type === 'epic' ? nodes[c].id + ' · ' : ''}${nodes[c].label}</button><//>`)}</nav>
      <${CenterCard} ...${p} />
      ${ppl.length > 0 && html`<${PeopleCard} ids=${ppl} ...${p} />`}
    </div>
    <div className="rec-col">${R}</div>
  </div>`;
}
const hz = (x1, y1, x2, y2) => { const dx = Math.max(24, (x2 - x1) / 2); return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`; };
const vt = (x1, y1, x2, y2) => { const dy = Math.max(12, (y2 - y1) / 2); return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`; };

const cls = (p, id) => cx(!p.nodes[id].alive && 'ghost', p.touched.has(id) && p.nodes[id].alive && 'touched');

function Row({ id, p }) {
  const n = p.nodes[id];
  const meta = n.type === 'req' ? html`<${StatusChip} status=${n.assume} sources=${n.sources} changedIn=${n.changedIn} />` : n.type === 'evidence' ? html`<span className="rec-meta">${n.alive ? (p.T - n.born < 30 && p.T < p.rec.live ? html`<span className="blue">new</span>` : n.status.split(',')[0]) : ''}</span>` : null;
  return html`<button className=${cx('rec-row', cls(p, id))} data-id=${id} onClick=${(e) => { e.stopPropagation(); p.center(id); }} onMouseEnter=${p.hover(p.nodeTip(id))} onMouseLeave=${p.unhover}>
    <${Ico} t=${n.icon || n.type} />
    <span className="rec-row-main"><span className="rec-row-label">${n.type === 'req' && html`<span className="mono muted">${id} </span>`}${n.label}</span>${!['req', 'evidence', 'epic'].includes(n.type) && html`<span className=${cx('rec-row-sub', /needs update|behind/i.test(n.status) && 'amber')}>${n.status}</span>`}</span>
    ${meta}
  </button>`;
}

function SourcesCard({ ids, ...p }) {
  return html`<div className="rec-card" data-anchor="rows">
    <div className="rec-card-head"><${Ico} t="evidence" /><span className="rec-card-title">Sources</span><span className="muted tiny">${ids.length}</span></div>
    ${ids.map((id) => (SOURCES[id]
      ? html`<div key=${id} className=${cx('rec-row', p.T < SOURCES[id][2] && 'ghost', p.touched.has(id) && 'touched')} data-id=${id}
          onMouseEnter=${p.hover(html`<${Fragment}><div className="tiny-label">Source · ${SOURCES[id][1]}</div><div className="map-tip-text">${SOURCES[id][0]}</div><div className="muted tiny">${SOURCES[id][3]}</div><//>`)} onMouseLeave=${p.unhover}>
          <${Ico} t="source" /><span className="rec-row-main"><span className="rec-row-label">${SOURCES[id][0]}</span></span><span className="rec-meta">${SOURCES[id][1]}</span></div>`
      : html`<${Row} key=${id} id=${id} p=${p} />`))}
  </div>`;
}

function Card({ id, title, icon, anchor, rows = [], from, ...p }) {
  const n = id && p.nodes[id];
  const lag = n && /needs update|behind/i.test(n.status);
  return html`<div className=${cx('rec-card', id && cls(p, id), id && 'clickable')} data-anchor=${anchor} data-id=${id} data-from=${from}
      onClick=${id ? () => p.center(id) : undefined} onMouseEnter=${id ? p.hover(p.nodeTip(id)) : undefined} onMouseLeave=${id ? p.unhover : undefined}>
    <div className="rec-card-head"><${Ico} t=${n ? n.type : icon} /><span className="rec-card-title">${n ? html`<${Fragment}>${n.id && html`<span className="mono muted">${n.id} </span>`}${n.label}<//>` : title}</span></div>
    ${n && n.type !== 'epic' && html`<div className=${cx('rec-card-status', lag && 'amber')}>${n.alive ? n.status : 'Not created yet'}</div>`}
    ${rows.map((r) => html`<${Row} key=${r} id=${r} p=${p} />`)}
  </div>`;
}

function ReqCard({ id, side = 'right', ...p }) {
  const n = p.nodes[id];
  return html`<div className=${cx('rec-card clickable', cls(p, id))} data-anchor=${side} data-id=${id} onClick=${() => p.center(id)} onMouseEnter=${p.hover(p.nodeTip(id))} onMouseLeave=${p.unhover}>
    <div className="rec-card-head"><${Ico} t="req" /><span className="rec-card-title"><span className="mono muted">${id} </span>${n.label}</span></div>
    <div className="rec-card-status"><span className="clamp">${n.full}</span>${n.assume !== 'verified' || n.changedIn ? html`<div className="rec-chip-line"><${StatusChip} status=${n.assume} sources=${n.sources} changedIn=${n.changedIn} /></div>` : null}</div>
  </div>`;
}

function CenterCard(p) {
  const { nodes, focus, T, rec, state, showNow, setShowNow } = p;
  const n = nodes[focus];
  const reviewing = focus === 'R4' && T >= AT.propose && !(rec.approved && T >= AT.decide) && rec.events.some((e) => e.t === AT.propose);
  const evs = rec.events.filter((e) => e.req === focus && e.t <= T);
  let meta = n.status;
  if (focus === 'R4') {
    const s = rec.r4At(T);
    meta = s === 'verified' ? `Approved by Dana Ortiz · was every 15 minutes` : s === 'contradicted' ? (reviewing ? `Suggested by Marcus Lee · ${fmt(AT.propose).time}` : `The build contradicted this at ${fmt(AT.flag).time}`) : s === 'assumed' ? 'Assumed · from the kickoff call, never checked' : 'AI draft from the kickoff transcript';
  }
  return html`<div className=${cx('rec-card rec-center', p.touched.has(focus) && 'touched')} data-id=${focus}>
    <div className="rec-card-head">
      <${Ico} t=${n.type} />
      <span className="rec-card-title">${n.id && html`<span className="mono muted">${n.id} </span>`}${n.label}</span>
      ${n.type === 'req' && html`<${StatusChip} status=${n.assume} sources=${n.sources} changedIn=${n.changedIn} />`}
      ${n.type === 'prd' && html`<${Tag} tone=${rec.r4At(T) === 'verified' ? 'green' : 'neutral'}>${n.full.replace('PRD ', '')}<//>`}
    </div>
    <div className="rec-center-body">
      ${n.type !== 'req' && html`<div className="tiny-label">${n.kind}</div>`}
      ${reviewing
        ? html`<${Fragment}>
            <div className="seg sm rec-seg" role="group"><button className=${cx('seg-btn', showNow && 'active')} onClick=${() => setShowNow(true)}>Current</button><button className=${cx('seg-btn', !showNow && 'active')} onClick=${() => setShowNow(false)}>Suggested</button></div>
            ${showNow ? html`<p className="rec-center-text">${TEXT.r4Old}</p>` : html`<${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />`}
          <//>`
        : html`<p className=${cx('rec-center-text', n.type === 'epic' && 'pre')}>${n.alive ? n.full : 'Not written yet.'}</p>`}
      <div className=${cx('muted tiny', focus === 'R4' && rec.r4At(T) === 'contradicted' && !reviewing && 'amber')}>${meta}</div>
    </div>
    ${n.type === 'req' && html`<div className="rec-center-foot muted tiny"><span>${evs.length} event${evs.length === 1 ? '' : 's'}</span><span>${REQ_SOURCES[focus].length} source${REQ_SOURCES[focus].length === 1 ? '' : 's'}</span><span>${neighbors(focus, nodes).filter((k) => WORK.includes(nodes[k].type)).length} linked</span></div>`}
  </div>`;
}

function PeopleCard({ ids, ...p }) {
  const word = { v1: 'On v1', knows: 'Knew R4 was wrong', cur: 'On v1.1' };
  return html`<div className="rec-card rec-people" data-anchor="bottom" data-id="people">
    <div className="rec-card-head"><${Users} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span className="rec-card-title">People</span><span className="muted tiny">${ids.length}</span></div>
    <div className="rec-people-grid">
      ${ids.map((id) => { const k = p.rec.knewAt(id, p.T); return html`<button key=${id} className=${cx('rec-person', p.touched.has(id) && 'touched')} data-id=${id} onClick=${() => p.center(id)} onMouseEnter=${p.hover(p.nodeTip(id))} onMouseLeave=${p.unhover}>
        <span className=${cx('rec-ring', k)}><${Avatar} id=${id} size=${22} /></span>
        <span className="rec-person-text"><span>${PEOPLE[id].name}</span><span className="muted tiny">${k ? word[k] : PEOPLE[id].title}</span></span>
      </button>`; })}
    </div>
  </div>`;
}
