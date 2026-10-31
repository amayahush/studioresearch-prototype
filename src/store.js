import { createContext, useContext } from './lib.js';

// Story copy, shared so every tool shows the same words for the same record.
export const TEXT = {
  r4Old: 'Refresh data every 15 minutes.',
  r4New: 'Refresh data hourly, 5 minutes after the timekeeping system syncs.',
  reason:
    "The timekeeping API batch-loads badge punches once an hour, at the top of the hour. Polling every 15 minutes returns the same data 3 out of 4 times, so the dashboard would look live when it isn't.",
  danaAsk:
    "The spec section you linked (§3.2) is from 2023. Can you confirm it's still hourly today? If a faster feed exists I'd rather keep 15 minutes.",
  marcusReply: 'Data owner confirmed hourly in Sept. Changelog attached.',
  priyaNote: 'I\'ll relabel "Updated every 15 min" to show the actual last sync time.',
  kimNote: 'Fine if leaders still see risk before mid-shift.',
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
      [44, 'Clients should not poll more often than hourly.'],
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

export const PEOPLE = {
  marcus: { name: 'Marcus Lee', initials: 'ML', role: 'Engineer', title: 'Senior engineer', color: '#3D5AFE', legacy: '#4f6bed' },
  priya: { name: 'Priya Shah', initials: 'PS', role: 'Designer', title: 'Designer', color: '#9F0064', legacy: '#c2418a' },
  dana: { name: 'Dana Ortiz', initials: 'DO', role: 'Product manager', title: 'Product manager', color: '#2F8A6B', legacy: '#1f8a5c' },
  kim: { name: 'Kim Alvarez', initials: 'KA', role: 'Business lead', title: 'Business lead', color: '#C76A00', legacy: '#c17a1b' },
  jordan: { name: 'Jordan Kim', initials: 'JK', title: 'Ops analyst', color: '#4100E2', legacy: '#7a5af5' },
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
  relayView: 'doc',
  // flagged → proposed → moreEvidence → resent → approved | denied
  stage: 'flagged',
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
  // Cue for scripted interstitials (Dana time skip after asking for evidence)
  storyCue: null,
  log: [],
  // Facilitator usability-test event log (separate from story log)
  events: [],
  taskCard: false,
};

const log = (state, who, text, time) => [...state.log, { who, text, time }];

function track(state, type, detail = {}) {
  const event = {
    t: new Date().toISOString(),
    type,
    role: state.role,
    stage: state.stage,
    view: state.relayView,
    ...detail,
  };
  return [...(state.events || []), event];
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role, events: track(state, 'set_role', { role: action.role }) };
    case 'START_ROLE': {
      // Each role path starts fresh at its own point in the story (brief §8).
      const fresh = { ...initialState, role: action.role, events: state.events || [], taskCard: state.taskCard };
      const proposed = { who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed };
      const started = { ...fresh, events: track({ ...fresh, role: action.role }, 'start_role', { role: action.role }) };
      if (action.role === 'priya') return { ...started, stage: 'proposed', codexStreamed: true, log: [proposed] };
      if (action.role === 'dana') {
        return {
          ...started, stage: 'proposed', codexStreamed: true, priya: { stance: 'agreed', note: TEXT.priyaNote },
          log: [proposed, { who: 'priya', text: 'Agreed with the R4 change', time: TIMES.priya }],
        };
      }
      return started;
    }
    case 'SET_VIEW':
      return { ...state, relayView: action.view, events: track(state, 'set_view', { view: action.view }) };
    case 'PROPOSE':
      return {
        ...state,
        stage: 'proposed',
        proposal: { text: action.text, reason: action.reason },
        log: log(state, 'marcus', 'Proposed a change to R4', TIMES.proposed),
        events: track(state, 'propose'),
      };
    case 'PRIYA_STANCE':
      return {
        ...state,
        priya: { stance: action.stance, note: action.note },
        // Changing a stance replaces the earlier entry instead of logging twice.
        log: log({ ...state, log: state.log.filter((e) => e.who !== 'priya') }, 'priya', action.stance === 'agreed' ? 'Agreed with the R4 change' : 'Disagreed with the R4 change', TIMES.priya),
        events: track(state, 'priya_stance', { stance: action.stance }),
      };
    case 'REQUEST_EVIDENCE':
      return {
        ...state,
        stage: 'moreEvidence',
        danaAsk: action.ask,
        // Dana path: cue a time skip so Marcus's evidence arrives (brief §8).
        storyCue: state.role === 'dana' ? 'marcus-evidence' : null,
        log: log(state, 'dana', 'Requested more evidence on R4', TIMES.moreEvidence),
        events: track(state, 'request_evidence'),
      };
    case 'ADD_EVIDENCE':
      if (state.evidence.includes(action.id)) return state;
      return { ...state, evidence: [action.id, ...state.evidence], events: track(state, 'add_evidence', { id: action.id }) };
    case 'RESEND':
      // Kim's reply is simulated: it arrives while Dana is waiting.
      return {
        ...state,
        stage: 'resent',
        marcusReply: action.reply,
        kim: { stance: 'agreed' },
        storyCue: null,
        log: [
          ...log(state, 'marcus', 'Added changelog evidence and resent', TIMES.resent),
          { who: 'kim', text: 'Agreed with the R4 change', time: TIMES.resent },
        ],
        events: track(state, 'resend'),
      };
    case 'APPROVE':
      return {
        ...state,
        stage: 'approved',
        updates: action.updates,
        storyCue: null,
        log: log(state, 'dana', 'Approved R4 and published PRD v1.1', TIMES.approved),
        events: track(state, 'approve'),
      };
    case 'DENY':
      return {
        ...state,
        stage: 'denied',
        storyCue: null,
        log: log(state, 'dana', 'Denied the R4 change. R4 stays as written', TIMES.denied),
        events: track(state, 'deny'),
      };
    case 'UPDATE_CODE':
      return { ...state, codeUpdated: true, log: log(state, 'marcus', 'Updated the refresh job to match v1.1', '2:24 PM'), events: track(state, 'update_code') };
    case 'UPDATE_LABEL':
      return { ...state, labelUpdated: true, log: log(state, 'priya', 'Relabeled the Overview to show last sync time', '2:26 PM'), events: track(state, 'update_label') };
    case 'CODEX_STREAMED':
      return { ...state, codexStreamed: true };
    case 'ACCEPT_DRAFT':
      return { ...state, r5: 'accepted', log: log(state, 'dana', 'Accepted the AI draft of R5', 'Now'), events: track(state, 'accept_draft') };
    case 'DISCARD_DRAFT':
      return { ...state, r5: 'discarded', log: log(state, 'dana', 'Discarded the AI draft of R5', 'Now'), events: track(state, 'discard_draft') };
    case 'CLEAR_CUE':
      return { ...state, storyCue: null };
    case 'LOG_EVENT':
      return { ...state, events: track(state, action.eventType || 'click', action.detail || {}) };
    case 'TOGGLE_TASK_CARD':
      return { ...state, taskCard: !state.taskCard };
    case 'JUMP': {
      // Facilitator: load a prepared story state for a screen/role.
      const next = { ...initialState, ...(action.patch || {}), events: state.events || [], taskCard: state.taskCard };
      return { ...next, events: track(next, 'jump', { label: action.label || 'jump' }) };
    }
    case 'RESET':
      return { ...initialState, events: track(state, 'reset') };
    case 'CLEAR_EVENTS':
      return { ...state, events: [] };
    default:
      return state;
  }
}

export const isPending = (s) => ['proposed', 'moreEvidence', 'resent'].includes(s.stage);
export const r4Text = (s) => (s.stage === 'approved' ? s.proposal.text : TEXT.r4Old);
export const prdVersion = (s) => (s.stage === 'approved' ? 'v1.1' : 'v1');

/** Prepared story patches for facilitator jump menu / deep links. */
export function jumpPatch(id) {
  const base = { codexStreamed: true };
  const proposed = {
    ...base,
    stage: 'proposed',
    priya: { stance: 'agreed', note: TEXT.priyaNote },
    log: [
      { who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed },
      { who: 'priya', text: 'Agreed with the R4 change', time: TIMES.priya },
    ],
  };
  const moreEvidence = {
    ...proposed,
    stage: 'moreEvidence',
    danaAsk: TEXT.danaAsk,
    log: [
      ...proposed.log,
      { who: 'dana', text: 'Requested more evidence on R4', time: TIMES.moreEvidence },
    ],
  };
  const resent = {
    ...moreEvidence,
    stage: 'resent',
    evidence: ['changelog', 'spec', 'api'],
    marcusReply: TEXT.marcusReply,
    kim: { stance: 'agreed' },
    log: [
      ...moreEvidence.log,
      { who: 'marcus', text: 'Added changelog evidence and resent', time: TIMES.resent },
      { who: 'kim', text: 'Agreed with the R4 change', time: TIMES.resent },
    ],
  };
  const approved = {
    ...resent,
    stage: 'approved',
    updates: { jira: true, figma: true, teams: true, metric: true },
    log: [...resent.log, { who: 'dana', text: 'Approved R4 and published PRD v1.1', time: TIMES.approved }],
  };

  const map = {
    '00': { role: null },
    '01': { role: 'marcus', stage: 'flagged', codexStreamed: false },
    '02': { role: 'marcus', stage: 'flagged', ...base },
    '03': { role: 'marcus', stage: 'flagged', ...base },
    '04': { role: 'marcus', ...proposed, priya: { stance: null, note: '' }, log: [{ who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed }] },
    '05': { role: 'priya', ...proposed, priya: { stance: null, note: '' }, log: [{ who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed }] },
    '06': { role: 'dana', ...proposed, relayView: 'doc' },
    '07': { role: 'dana', ...moreEvidence, relayView: 'doc' },
    '07b': { role: 'dana', ...resent, relayView: 'doc' },
    '08a': { role: 'marcus', ...moreEvidence, priya: { stance: 'agreed', note: TEXT.priyaNote } },
    '08b': { role: 'marcus', ...resent },
    '09': { role: 'marcus', ...approved },
    '10': { role: 'dana', ...approved, relayView: 'map' },
    '11': { role: 'dana', ...approved, labelUpdated: true, relayView: 'screens' },
    '12': { role: 'dana', ...approved, labelUpdated: true, codeUpdated: true, relayView: 'present' },
  };
  return map[id] || null;
}

export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
