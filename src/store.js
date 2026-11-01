import { createContext, useContext } from './lib.js';

// Story copy, shared so every tool shows the same words for the same record.
export const TEXT = {
  r4Old: 'Refresh data every 15 minutes.',
  r4New: 'Refresh data hourly, 5 minutes after the timekeeping system syncs. Show the real last-sync time.',
  reason:
    "The timekeeping API batch-loads badge punches once an hour, at the top of the hour. Polling every 15 minutes returns the same data 3 out of 4 times, so the dashboard would look live when it isn't.",
  danaAsk:
    "The spec section you linked (§3.2) is from 2023. Can you confirm it's still hourly today? If a faster feed exists I'd rather keep 15 minutes.",
  marcusReply: 'Data owner confirmed hourly in Sept. Changelog attached.',
  priyaNote: 'I\'ll relabel "Updated every 15 min" to show the actual last sync time.',
  kimNote: 'Hourly still gets us there by lunch.',
  approvalReason: 'Hourly still meets the mid-shift goal. Label shows the real sync time so it never looks more live than it is.',
};

export const EVIDENCE = {
  spec: {
    label: 'timekeeping-api.md §3.2',
    short: 'Spec §3.2 · 2023',
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
  updates: { jira: true, figma: true, teams: true, metric: true },
  log: [],
};

const log = (state, who, text, time) => [...state.log, { who, text, time }];

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role };
    case 'EXPLORE_ASTRA':
      return { ...initialState, role: 'explore' };
    case 'START_ROLE': {
      // Each role path starts fresh at its own point in the story (brief §8).
      const fresh = { ...initialState, role: action.role, startedAs: action.role };
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
      return { ...initialState };
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

export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
