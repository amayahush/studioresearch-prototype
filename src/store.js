import { createContext, useContext } from './lib.js';

// Story copy, shared so every tool shows the same words for the same record.
export const TEXT = {
  r4Old: 'Refresh data every 15 minutes.',
  r4New: 'Refresh data hourly, 5 minutes after the timekeeping system syncs. Show the real last-sync time.',
  reason:
    "The timekeeping API batch-loads badge punches once an hour, at the top of the hour. Polling every 15 minutes returns the same data 3 out of 4 times, so the dashboard would look live when it isn't.",
  danaAsk:
    "The doc section you linked (§3.2) is from 2023. Can you confirm it's still hourly today? If a faster feed exists I'd rather keep 15 minutes.",
  marcusReply: 'Data owner confirmed hourly in Sept. Changelog attached.',
  priyaNote: 'I\'ll relabel "Updated every 15 min" to show the actual last sync time.',
  kimNote: 'Hourly still gets us there by lunch.',
  approvalReason: 'Hourly still meets the mid-shift goal. Label shows the real sync time so it never looks more live than it is.',
};

export const EVIDENCE = {
  spec: {
    label: 'timekeeping-api.md §3.2',
    short: 'API doc §3.2 · 2023',
    meta: 'Edited Mar 2023',
    file: 'timekeeping-api.md · §3.2',
    range: 'lines 41–44',
    lines: [
      [41, '### 3.2 Sync schedule'],
      [42, 'Badge punches are batch-loaded', true],
      [43, 'at the top of each hour (PT1H).', true],
      [44, 'Clients should not poll faster.'],
    ],
  },
  api: {
    label: 'API response 1:40 PM',
    short: 'API response · Oct 8',
    meta: 'Oct 8, 1:40 PM · sync_interval: PT1H',
    file: 'Sandbox GET /v2/labor/hours',
    range: '1:40 PM',
    lines: [
      [1, '"last_sync": "2026-10-08T13:00:00",', true],
      [2, '"sync_interval": "PT1H",', true],
      [3, '"next_sync": "2026-10-08T14:00:00"'],
    ],
  },
  changelog: {
    label: 'timekeeping-api.md · Changelog L58–60',
    short: 'Changelog · Sep 2026 · data owner',
    meta: 'Sep 12, 2026 · reviewed by Ravi Patel, data owner',
    file: 'timekeeping-api.md · Changelog',
    range: 'lines 58–60',
    lines: [
      [58, '2026-09-12 | Reviewed by Ravi Patel (data owner):', true],
      [59, '           | sync stays hourly (PT1H). No faster feed', true],
      [60, '           | before the 2027 platform update.', true],
    ],
  },
};

// Why R4 exists: the line from the kickoff call it was written from.
export const R4_INTENT = {
  quote: 'If leads can see it by lunch, they can move people before it turns into overtime.',
  speaker: 'Kim Alvarez · Business lead',
  source: 'Kickoff transcript 18:40',
  goal: 'Spot overtime risk by mid-shift (success metric)',
};

export const PEOPLE = {
  marcus: { name: 'Marcus Lee', initials: 'ML', role: 'Engineer', title: 'Senior engineer', color: '#3D5AFE', legacy: '#4f6bed' },
  priya: { name: 'Priya Shah', initials: 'PS', role: 'Designer', title: 'Designer', color: '#9F0064', legacy: '#c2418a' },
  dana: { name: 'Dana Ortiz', initials: 'DO', role: 'Product manager', title: 'Product manager', color: '#2F8A6B', legacy: '#1f8a5c' },
  kim: { name: 'Kim Alvarez', initials: 'KA', role: 'Business lead', title: 'Business lead', color: '#C76A00', legacy: '#c17a1b' },
  jordan: { name: 'Jordan Kim', initials: 'JK', title: 'Ops analyst', color: '#4100E2', legacy: '#7a5af5' },
  sam: { name: 'Sam Reed', initials: 'SR', title: 'SME', color: '#5C6370', legacy: '#5C6370' },
};

// Story clock: each step happens at a fixed time so screens agree with each other.
export const TIMES = {
  flagged: '1:40 PM',
  proposed: '1:52 PM',
  priya: '1:58 PM',
  moreEvidence: '2:08 PM',
  resent: '2:19 PM',
  approved: '2:21 PM',
  denied: '2:21 PM',
};

export const initialState = {
  role: null,
  astraView: 'doc',
  // unpublished (Dana, before v1) → flagged → proposed → moreEvidence → resent → approved | denied
  stage: 'flagged',
  // Which role this story was started as; exploring another tool later doesn't change it.
  startedAs: null,
  approvalReason: '',
  proposal: { text: TEXT.r4New, reason: TEXT.reason },
  evidence: ['spec', 'api'],
  priya: { stance: null, note: '' },
  kim: { stance: null },
  danaAsk: '',
  marcusReply: '',
  codeUpdated: false,
  labelUpdated: false,
  // Codex's opening output streams in once per story (brief §9.1)
  codexStreamed: false,
  // R5 is an AI draft: 'draft' → 'accepted' | 'discarded'
  r5: 'draft',
  // The agent spec: 'plan' (Marcus reviews) -> 'run' (tasks execute) -> 'held' (T3 failed verify).
  // 'ready' is Explore's starting point: R1's tasks are in, R4's haven't run.
  specPhase: 'plan',
  // After approval: 0 spec update waiting, 1 reviewing T3, 2 reviewing T4.
  rerun: 0,
  docSlice: 'main',
  docLayout: 'list', // Doc › List or Board (PM)
  // Hand edits to task code. Free play: nothing in the story depends on them.
  codeEdits: {},
  updates: { jira: true, figma: true, teams: true, metric: true, spec: true },
  log: [],
  // Guided mode (design rationale tour). Kept across resets so it stays on during a demo.
  guided: false,
  // Astra's light/dark theme. Kept across resets and role switches. Codex and Figma keep their own look.
  theme: 'dark',
};

const log = (state, who, text, time) => [...state.log, { who, text, time }];

// The theme is a viewer setting, not part of the story, so no story action resets it.
export function reducer(state, action) {
  if (action.type === 'SET_THEME') return { ...state, theme: action.theme };
  const next = storyReducer(state, action);
  return next.theme === state.theme ? next : { ...next, theme: state.theme };
}

function storyReducer(state, action) {
  switch (action.type) {
    case 'SET_GUIDED':
      return { ...state, guided: action.on };
    case 'TOUR_GO':
      // Guided mode's arrows: restart this role's screen at a stage (tourRun remounts it, clearing open panels).
      return { ...initialState, codexStreamed: true, ...action.patch, role: state.role, startedAs: state.role, guided: true, tourRun: (state.tourRun || 0) + 1 };
    case 'SET_ROLE':
      return { ...state, role: action.role };
    case 'EXPLORE_ASTRA':
      return { ...initialState, role: 'explore', specPhase: 'ready', guided: state.guided };
    case 'START_ROLE': {
      // Each role path starts fresh at its own point in the story (brief §8).
      const fresh = { ...initialState, role: action.role, startedAs: action.role, guided: state.guided };
      const proposed = { who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed };
      if (action.role === 'priya') return { ...fresh, stage: 'proposed', codexStreamed: true, log: [proposed] };
      // Dana starts a week earlier, about to publish v1 (screen 00).
      if (action.role === 'dana') return { ...fresh, stage: 'unpublished', codexStreamed: true };
      return fresh;
    }
    case 'PUBLISH_V1':
      return { ...state, stage: 'flagged', log: log(state, 'dana', 'Published PRD v1 with R4 still assumed', 'Oct 1') };
    case 'PROPOSAL_ARRIVES':
      // Off screen for Dana: Marcus's build tests R4, he proposes, Priya agrees.
      return {
        ...state, stage: 'proposed', priya: { stance: 'agreed', note: TEXT.priyaNote },
        log: [
          ...state.log,
          { who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed },
          { who: 'priya', text: 'Agreed with the R4 change', time: TIMES.priya },
        ],
      };
    case 'APPROVE_SPEC':
      return { ...state, specPhase: 'run' };
    case 'SPEC_HELD':
      return { ...state, specPhase: 'held' };
    case 'ACCEPT_SPEC':
      return { ...state, rerun: 1 };
    case 'COMMIT_T3':
      return { ...state, rerun: 2 };
    case 'EDIT_CODE':
      return { ...state, codeEdits: { ...state.codeEdits, [action.key]: action.code } };
    case 'SET_SLICE':
      return { ...state, docSlice: action.slice };
    case 'SET_DOC_LAYOUT':
      return { ...state, docLayout: action.layout };
    case 'SET_VIEW':
      return { ...state, astraView: action.view };
    case 'PROPOSE':
      return {
        ...state,
        stage: 'proposed',
        proposal: { text: action.text, reason: action.reason },
        log: log(state, 'marcus', 'Proposed a change to R4', TIMES.proposed),
      };
    case 'PRIYA_STANCE':
      return {
        ...state,
        priya: { stance: action.stance, note: action.note },
        // Changing a stance replaces the earlier entry instead of logging twice.
        log: log({ ...state, log: state.log.filter((e) => e.who !== 'priya') }, 'priya', action.stance === 'agreed' ? 'Agreed with the R4 change' : 'Disagreed with the R4 change', TIMES.priya),
      };
    case 'REQUEST_EVIDENCE':
      return {
        ...state,
        stage: 'moreEvidence',
        danaAsk: action.ask,
        log: log(state, 'dana', 'Requested more evidence on R4', TIMES.moreEvidence),
      };
    case 'ADD_EVIDENCE':
      if (state.evidence.includes(action.id)) return state;
      return { ...state, evidence: [action.id, ...state.evidence] };
    case 'RESEND':
      // Kim's reply is simulated: it arrives while Dana is waiting.
      return {
        ...state,
        stage: 'resent',
        marcusReply: action.reply,
        kim: { stance: 'agreed' },
        log: [
          ...log(state, 'marcus', 'Added changelog evidence and resent', TIMES.resent),
          { who: 'kim', text: 'Agreed with the R4 change', time: TIMES.resent },
        ],
      };
    case 'APPROVE':
      return {
        ...state,
        stage: 'approved',
        updates: action.updates,
        approvalReason: action.reason || TEXT.approvalReason,
        log: log(state, 'dana', 'Approved R4 and published PRD v1.1', TIMES.approved),
      };
    case 'DENY':
      return { ...state, stage: 'denied', log: log(state, 'dana', 'Denied the R4 change. R4 stays as written', TIMES.denied) };
    case 'UPDATE_CODE':
      return { ...state, codeUpdated: true, log: log(state, 'marcus', 'Updated the refresh job to match v1.1', '2:24 PM') };
    case 'UPDATE_LABEL':
      return { ...state, labelUpdated: true, log: log(state, 'priya', 'Relabeled the Overview to show last sync time', '2:26 PM') };
    case 'CODEX_STREAMED':
      return { ...state, codexStreamed: true };
    case 'ACCEPT_DRAFT':
      return { ...state, r5: 'accepted', log: log(state, 'dana', 'Accepted the AI draft of R5', 'Now') };
    case 'DISCARD_DRAFT':
      return { ...state, r5: 'discarded', log: log(state, 'dana', 'Discarded the AI draft of R5', 'Now') };
    case 'RESET':
      return { ...initialState, guided: state.guided };
    case 'RESTART': {
      // Top bar reset: start the current scenario over from its first step, without leaving it.
      // After an end card sends someone exploring, this restarts the path they played.
      if (!state.role) return state;
      const fresh = state.startedAs
        ? storyReducer(state, { type: 'START_ROLE', role: state.startedAs })
        : state.role === 'explore'
          ? storyReducer(state, { type: 'EXPLORE_ASTRA' })
          : { ...initialState, role: state.role, guided: state.guided };
      // `run` remounts the screen so open panels, files and overlays close too.
      return { ...fresh, run: (state.run || 0) + 1 };
    }
    default:
      return state;
  }
}

export const isPending = (s) => ['proposed', 'moreEvidence', 'resent'].includes(s.stage);

// Assumption status is separate from approval: it says whether anyone has checked the requirement.
// R4 is assumed until Marcus's build tests it, contradicted while the change is open, verified once approved.
export const r4Status = (s) => {
  if (s.stage === 'approved') return 'verified';
  if (isPending(s) || s.stage === 'denied') return 'contradicted';
  return 'assumed';
};
export const r4Text = (s) => (s.stage === 'approved' ? s.proposal.text : TEXT.r4Old);
export const prdVersion = (s) => (s.stage === 'approved' ? 'v1.1' : s.stage === 'unpublished' ? 'v1 draft' : 'v1');

// The agent spec for LAB-15. Each task names the requirement that created it.
export const SPEC_TASKS = [
  { id: 'T1', req: 'R1', title: 'Fetch labor hours and store totals', mark: 'labor hours per department', why: 'R1 needs each department\'s hours in one place before anything can show them.', done: 'All 14 departments have a total for the shift', touches: 'laborHours.ts', needs: 'Nothing. This goes first' },
  { id: 'T2', req: 'R1', title: 'Retry failed pulls once, then log them', mark: 'per department', why: 'One bad pull shouldn\'t leave a department blank.', done: 'A failed pull retries once, then shows in the log', doneFixed: 'A failed pull waits for Retry-After, retries once, then shows in the log', touches: 'laborHours.ts', needs: 'T1, so there\'s a pull to retry' },
  { id: 'T3', req: 'R4', title: 'Schedule the refresh job', mark: 'every 15 minutes', why: 'R4 needs something that pulls data on a timer. Nothing does yet.', done: 'The schedule fits the API\'s sync interval', touches: 'refreshLaborHours.ts', needs: 'T1, so there\'s a pull to schedule' },
  { id: 'T4', req: 'R4', title: 'Show refresh timing on the Overview', mark: 'Refresh data', why: 'Leaders need to see how fresh the numbers are.', done: 'The Overview says when data last refreshed', touches: 'Overview.tsx', needs: 'T3, so there\'s a refresh to report' },
];

// The code each task wrote. T3 and T4 have a second version once R4 changes.
const TASK_CODE = {
  T1: { file: 'src/api/laborHours.ts', code: `export async function fetchLaborHours(plant: string, shift: number) {
  const res = await timekeeping.get('/v2/labor/hours', { plant, shift })
  await store.upsertDepartmentTotals(res.departments)
  return res
}` },
  T2: { file: 'src/api/laborHours.ts', code: `export async function pullWithRetry(plant: string, shift: number) {
  try {
    return await fetchLaborHours(plant, shift)
  } catch (err) {
    if (err.status === 429) await wait(err.retryAfter)
    try {
      return await fetchLaborHours(plant, shift)
    } catch (retryErr) {
      log.error('labor pull failed', { plant, shift, retryErr })
    }
  }
}` },
  T3: { file: 'src/jobs/refreshLaborHours.ts', code: `export const schedule = '*/15 * * * *'  // PRD R4 as written

export async function refreshLaborHours() {
  await pullWithRetry(plant, shift)
}`, codeNew: `export const schedule = '5 * * * *'  // R4 v1.1

export async function refreshLaborHours() {
  await pullWithRetry(plant, shift)
}` },
  T4: { file: 'src/ui/Overview.tsx', codeNew: `export function RefreshLabel({ lastSync, nextSync }) {
  return <span>Last synced {lastSync} · next {nextSync}</span>
}` },
};

// Code only exists once a task has run. Returns null before that, so the row keeps its explanation.
export function taskCode(id, status) {
  const t = TASK_CODE[id];
  const finished = status === 'done';
  const drafted = id === 'T3' && (status === 'held' || status === 'reopen');
  if (!finished && !drafted) return null;
  const latest = finished && t.codeNew;
  const code = latest ? t.codeNew : t.code;
  if (!code) return null;
  return { key: latest ? `${id}:new` : id, file: t.file, code };
}

// Where each task stands, from the story alone. Every screen reads this, so they can't disagree.
export function specTasks(state) {
  const { stage, specPhase, codeUpdated, rerun } = state;
  const done = ['done', 'Committed'];
  if (stage === 'flagged' && specPhase === 'ready') return { T1: done, T2: done, T3: ['todo', 'Not run'], T4: ['todo', 'Not run'] };
  if (stage === 'flagged' && specPhase !== 'held') return { T1: ['todo', ''], T2: ['todo', ''], T3: ['todo', ''], T4: ['todo', ''] };
  let T3 = ['held', 'Failed verify'];
  let T4 = ['held', 'Waiting on T3'];
  if (stage === 'denied') { T3 = ['reopen', 'Run as written']; T4 = ['reopen', 'Run as written']; }
  if (stage === 'approved') {
    if (codeUpdated) { T3 = done; T4 = done; }
    else if (rerun === 2) { T3 = done; T4 = ['review', 'Review']; }
    else if (rerun === 1) { T3 = ['review', 'Review']; T4 = ['todo', 'Next']; }
    else { T3 = ['reopen', 'Reopened']; T4 = ['reopen', 'Reopened']; }
  }
  return { T1: done, T2: done, T3, T4 };
}

export const specVisible = (s) => s.stage !== 'unpublished' && !(s.stage === 'flagged' && !['held', 'ready'].includes(s.specPhase));
export const specPips = (tasks, req) => SPEC_TASKS.filter((t) => t.req === req).map((t) => ({ done: 'g', todo: 'n' }[tasks[t.id][0]] || 'a'));

// One plain sentence on what the agent's work means for this requirement. Written for someone who never opens the spec.
export function specSummary(state, req) {
  if (req === 'R1') return 'Both tasks are committed. Nothing is waiting on this requirement.';
  const { stage, specPhase, codeUpdated } = state;
  if (stage === 'flagged') return specPhase === 'ready' ? 'Not run yet, so nothing has tested R4 against the API.' : 'Held. T3 failed its check against the API.';
  if (stage === 'moreEvidence') return 'Held while Marcus finds more evidence.';
  if (isPending(state)) return 'Held until you decide. T3 can\'t meet R4 as written.';
  if (stage === 'denied') return 'R4 stays as written, so both tasks can run as written.';
  if (stage === 'approved') return codeUpdated ? 'Committed. The build matches v1.1.' : 'Reopened. The build is behind v1.1 until Marcus reruns them.';
  return '';
}

export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
