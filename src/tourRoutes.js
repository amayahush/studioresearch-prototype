import { TEXT, TIMES } from './store.js';

// How the guide's arrows reach each step, so people can step through without clicking the prototype.
// A route is a story stage to start from, plus the clicks a person would make to get there.
// Clicking in the prototype still works too: the guide follows whatever is on screen.
//
// Each route:
//   stage    the story stage the step lives in (the screen restarts at this point when the stage differs)
//   actions  clicks to make, in order: { click: selector, text?: button text, skipIf?: selector } or { key: 'alt+p' }
//            skipIf skips a click when that selector is already on screen (for buttons that toggle).
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
const openFlag = { click: '[data-tour="notice-flag"] .cx-notice-open' };
const openPlugin = { click: '.fg-toolbar .tool.astra', skipIf: '.plugin' };
const openR4 = { click: '[data-req="R4"]', skipIf: '.record' };

export const ROUTES = {
  marcus: {
    prompt: { stage: 'flagged' },
    flag: { stage: 'flagged' },
    compare: { stage: 'flagged', actions: [openFlag] },
    assumed: { stage: 'flagged', actions: [openFlag] },
    why: { stage: 'flagged', actions: [openFlag] },
    propose: { stage: 'flagged', actions: [openFlag, { click: '.side-panel button', text: 'Propose change' }] },
    pending: { stage: 'proposed', actions: [altP] },
    'time-skip': { stage: 'proposed', actions: [altP, { click: '.side-panel button', text: 'Back to code' }] },
    ask: { stage: 'moreEvidence' },
    evidence: { stage: 'moreEvidence', actions: [altP, { click: '.ev-card.dashed' }] },
    changed: { stage: 'approved', actions: [altP] },
    end: { stage: 'approved', actions: [altP, { click: '.side-panel button', text: 'Update the code to match' }] },
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
    deny: { stage: 'proposed' },
    record: { stage: 'approved', actions: [openR4] },
    end: { stage: 'approved', actions: [openR4, { click: 'button.btn-primary', text: 'Approve', exact: true }] },
  },
};
