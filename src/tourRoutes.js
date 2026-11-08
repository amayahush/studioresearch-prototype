import { TEXT, TIMES } from './store.js';

// How the guide's arrows reach each step, so people can step through without clicking the prototype.
// A route is a story stage to start from, plus the clicks a person would make to get there.
// Clicking in the prototype still works too: the guide follows whatever is on screen.
//
// Each route:
//   stage    the story stage the step lives in (the screen restarts at this point when the stage differs)
//   view     Explore only: the Astra view to switch to
//   actions  clicks to make, in order: { click: selector, text?: button text, skipIf?: selector } or { key: 'alt+p' }
//            skipIf skips a click when that selector is already on screen (for buttons that toggle).
//            optional clicks only happen if the element is there (no waiting).
//            Actions stop early once the step's target is on screen.

const L = {
  published: { who: 'dana', text: 'Published PRD v1 with R4 still assumed', time: 'Oct 1' },
  proposed: { who: 'marcus', text: 'Proposed a change to R4', time: TIMES.proposed },
  priya: { who: 'priya', text: 'Agreed with the R4 change', time: TIMES.priya },
  ask: { who: 'dana', text: 'Requested more evidence on R4', time: TIMES.moreEvidence },
  resent: { who: 'marcus', text: 'Added changelog evidence and resent', time: TIMES.resent },
  kim: { who: 'kim', text: 'Agreed with the R4 change', time: TIMES.resent },
  approved: { who: 'dana', text: 'Approved R4 and published PRD v1.1', time: TIMES.approved },
  code: { who: 'marcus', text: 'Updated the refresh job to match v1.1', time: '2:24 PM' },
  label: { who: 'priya', text: 'Relabeled the Overview to show last sync time', time: '2:26 PM' },
};
const agreed = { stance: 'agreed', note: TEXT.priyaNote };

// The story as it stands at each stage, for each role's own path.
export const STAGE_STATE = {
  marcus: {
    flagged: { stage: 'flagged' },
    plan: { stage: 'flagged', specPhase: 'plan' },
    held: { stage: 'flagged', specPhase: 'held' },
    proposed: { stage: 'proposed', log: [L.proposed] },
    moreEvidence: { stage: 'moreEvidence', priya: agreed, danaAsk: TEXT.danaAsk, log: [L.proposed, L.priya, L.ask] },
    approved: {
      stage: 'approved', priya: agreed, kim: { stance: 'agreed' }, danaAsk: TEXT.danaAsk, marcusReply: TEXT.marcusReply,
      evidence: ['changelog', 'spec', 'api'], approvalReason: TEXT.approvalReason, log: [L.proposed, L.priya, L.ask, L.resent, L.kim, L.approved],
    },
  },
  priya: {
    proposed: { stage: 'proposed', log: [L.proposed] },
    approved: {
      stage: 'approved', priya: agreed, kim: { stance: 'agreed' }, danaAsk: TEXT.danaAsk, marcusReply: TEXT.marcusReply,
      evidence: ['changelog', 'spec', 'api'], approvalReason: TEXT.approvalReason, log: [L.proposed, L.priya, L.ask, L.resent, L.kim, L.approved],
    },
  },
  dana: {
    unpublished: { stage: 'unpublished' },
    proposed: { stage: 'proposed', priya: agreed, log: [L.published, L.proposed, L.priya] },
    approved: {
      stage: 'approved', priya: agreed, kim: { stance: 'agreed' }, approvalReason: TEXT.approvalReason, codeUpdated: true, labelUpdated: true,
      log: [L.published, L.proposed, L.priya, L.approved, L.code, L.label],
    },
  },
};

const altP = { key: 'alt+p' };
// Codex's opening output ignores clicks until it finishes streaming, so skip the stream first.
const openFlag = { click: '[data-tour="spec-decide"] .v3-btn.blue' };
const acceptSpec = { click: '.v3-btn', text: 'Accept and rerun', skipIf: '[data-tour="task-review"]' };
const openPlugin = { click: '.fg-toolbar .tool.astra', skipIf: '.plugin' };
const openR4 = { click: '[data-req="R4"]', skipIf: '.record' };

export const ROUTES = {
  marcus: {
    prompt: { stage: 'plan' },
    spec: { stage: 'plan' },
    breakdown: { stage: 'plan' },
    triage: { stage: 'held' },
    'task-code': { stage: 'held', actions: [{ click: '[data-tour="spec-run"] .v3-task-row', skipIf: '[data-tour="spec-run"] .v3-code' }] },
    flag: { stage: 'held' },
    compare: { stage: 'held', actions: [openFlag] },
    assumed: { stage: 'held', actions: [openFlag] },
    why: { stage: 'held', actions: [openFlag] },
    propose: { stage: 'held', actions: [openFlag, { click: '.side-panel button', text: 'Propose change' }] },
    pending: { stage: 'proposed', actions: [altP] },
    'time-skip': { stage: 'proposed', actions: [altP, { click: '.side-panel button', text: 'Close' }] },
    ask: { stage: 'moreEvidence' },
    evidence: { stage: 'moreEvidence', actions: [altP, { click: '.ev-card.dashed' }] },
    changed: { stage: 'approved', actions: [altP] },
    'spec-updated': { stage: 'approved' },
    'task-review': { stage: 'approved', actions: [acceptSpec] },
    end: { stage: 'approved', actions: [acceptSpec, { click: '.v3-btn', text: 'Commit T3' }, { click: '.v3-btn', text: 'Commit T4' }] },
  },
  priya: {
    tag: { stage: 'proposed' },
    plugin: { stage: 'proposed' },
    reason: { stage: 'proposed', actions: [openPlugin] },
    stance: { stage: 'proposed', actions: [openPlugin] },
    'time-skip': { stage: 'proposed', actions: [openPlugin, { click: '.plugin button', text: 'Agree' }, { click: '.plugin button', text: 'Keep designing' }] },
    comment: { stage: 'approved' },
    end: { stage: 'approved', actions: [{ click: '.fg-comment-pin', skipIf: '.fg-comment-pop' }, { click: '.fg-comment-pop button', text: 'Relabel' }] },
  },
  dana: {
    check: { stage: 'unpublished' },
    slices: { stage: 'unpublished' },
    'time-skip': { stage: 'unpublished', actions: [{ click: '[data-tour="assume-check"] button', text: 'Publish anyway' }] },
    r4: { stage: 'proposed' },
    reason: { stage: 'proposed' },
    'agent-work': { stage: 'proposed' },
    deny: { stage: 'proposed' },
    record: { stage: 'approved', actions: [openR4] },
    end: { stage: 'approved', actions: [openR4, { click: 'button.btn-primary', text: 'Approve', exact: true }] },
  },
  explore: {
    'map-reach': { view: 'map' },
    'map-tape': { view: 'map' },
    'map-replay': { view: 'map' },
    'present-audience': { view: 'present' },
    'present-slide': { view: 'present' },
  },
};
