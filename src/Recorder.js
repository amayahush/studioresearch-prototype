import { html, useState, useEffect, useRef, cx } from './lib.js';
import { useStore, TEXT, TIMES, EVIDENCE, R4_INTENT, PEOPLE } from './store.js';
import { Avatar, Tag, EvidenceChip } from './ui.js';
import { getReqs } from './Astra.js';
import { dashboardLabel } from './Figma.js';
import { Play, Pause, SkipBack, SkipForward, Download, FileText, Layers } from 'lucide-react';

/* ---------- Recorder (frame 10 alt) ----------
   A flight data recorder for requirements. Every requirement keeps a record of what happened to it,
   in whichever tool it happened, as it happened. Scrub the playhead to see exactly what was known,
   by whom, at any moment. The overview above is every requirement, every day: above the line is
   settled, below the line is still moving. Built to learn from, not to blame (FOQA's non-punitive rule). */

const LANES = [
  ['talk', 'Conversation'],
  ['prd', 'PRD'],
  ['code', 'Code + AI'],
  ['design', 'Design'],
  ['decide', 'Decisions'],
];

const TEAM = ['marcus', 'priya', 'dana', 'kim', 'sam'];
const ALL = TEAM;

// Actors that aren't people: Astra and Codex act, a person reviews.
const AGENTS = { astra: 'Astra', codex: 'Codex' };

const ev = (o) => ({ informs: [], evidence: [], ...o });

/* R4's record, built from the live story state so it grows as the participant acts. */
function r4Events(state) {
  const s = state.stage;
  const published = s !== 'unpublished';
  const flagged = published && (s !== 'flagged' || state.startedAs !== 'dana');
  const proposed = ['proposed', 'moreEvidence', 'resent', 'approved', 'denied'].includes(s);
  const resent = ['resent', 'approved'].includes(s) || (s === 'denied' && !!state.marcusReply);
  const out = [
    ev({ day: 'Sep 24', time: '10:18 AM', lane: 'talk', who: 'kim', short: 'Kickoff call',
      text: `"${R4_INTENT.quote}"`, detail: `${R4_INTENT.source}. The goal R4 serves: ${R4_INTENT.goal.toLowerCase()}.`, informs: ALL }),
    ev({ day: 'Sep 26', time: '9:05 AM', lane: 'prd', who: 'astra', ai: true, reviewer: 'dana', short: 'AI drafted R4',
      text: `Drafted R4 from the kickoff call: "${TEXT.r4Old}"`, detail: 'Nobody checked 15 minutes against the timekeeping API.', status: 'assumed', informs: ['dana'] }),
  ];
  if (published) out.push(
    ev({ day: 'Oct 1', time: '4:00 PM', lane: 'decide', who: 'dana', short: 'Published v1', text: 'Published PRD v1. R4 approved while still assumed.', informs: ALL, status: 'assumed' }),
    ev({ day: 'Oct 2', time: '11:20 AM', lane: 'code', who: 'astra', ai: true, reviewer: 'dana', short: 'Jira LAB-15', text: 'Created Jira LAB-15 from R4: refresh labor hours every 15 minutes.', informs: ['marcus'] }),
    ev({ day: 'Oct 3', time: '2:40 PM', lane: 'design', who: 'priya', short: 'Overview label', text: 'Labeled the Overview frame "Updated every 15 min".', informs: ['priya'] }),
    ev({ day: 'Oct 6', time: '3:15 PM', lane: 'code', who: 'codex', ai: true, reviewer: 'marcus', short: 'Refresh job', text: "Wrote the refresh job on a 15 minute schedule ('*/15 * * * *'). GitLab !219, 2 commits.", informs: ['marcus'] }),
  );
  if (flagged) out.push(ev({ day: 'Oct 8', time: TIMES.flagged, lane: 'code', who: 'codex', ai: true, reviewer: 'marcus', short: 'Build test',
    text: 'Build test: the timekeeping API returns sync_interval PT1H. R4 is contradicted.', evidence: ['api', 'spec'], informs: ['marcus'], status: 'contradicted', tone: 'amber', flag: true }));
  if (proposed) out.push(ev({ day: 'Oct 8', time: TIMES.proposed, lane: 'decide', who: 'marcus', short: 'Proposed change',
    text: `Proposed: "${state.proposal.text}"`, detail: 'Reason drafted by Codex, edited and sent by Marcus.', evidence: ['spec', 'api'], informs: ['dana', 'priya', 'kim'], tone: 'amber', status: 'contradicted' }));
  if (proposed && state.priya.stance) out.push(ev({ day: 'Oct 8', time: TIMES.priya, lane: 'design', who: 'priya', short: state.priya.stance === 'agreed' ? 'Priya agreed' : 'Priya disagreed',
    text: state.priya.stance === 'agreed' ? 'Agreed with the change.' : 'Disagreed with the change.', detail: state.priya.note || '', informs: ['dana', 'marcus'] }));
  if (state.danaAsk) out.push(ev({ day: 'Oct 8', time: TIMES.moreEvidence, lane: 'decide', who: 'dana', short: 'Asked for evidence', text: `Asked for more evidence: "${state.danaAsk}"`, informs: ['marcus'], tone: 'amber' }));
  if (resent) out.push(
    ev({ day: 'Oct 8', time: TIMES.resent, lane: 'decide', who: 'marcus', short: 'Resent with changelog', text: `Added changelog lines 58–60 and resent: "${state.marcusReply || TEXT.marcusReply}"`, evidence: ['changelog'], informs: ['dana'], tone: 'amber' }),
    ev({ day: 'Oct 8', time: TIMES.resent, lane: 'talk', who: 'kim', short: 'Kim agreed', text: `Agreed: "${TEXT.kimNote}"`, informs: ['dana'] }),
  );
  if (s === 'approved') {
    out.push(
      ev({ day: 'Oct 8', time: TIMES.approved, lane: 'decide', who: 'dana', short: 'Approved v1.1', text: 'Approved the change and published PRD v1.1.', detail: `Reason: ${state.approvalReason || TEXT.approvalReason}`, informs: ALL, tone: 'green', status: 'verified', resolves: true }),
      ev({ day: 'Oct 8', time: TIMES.approved, lane: 'prd', who: 'astra', ai: true, reviewer: 'dana', short: 'PRD v1.1', text: `R4 now reads: "${state.proposal.text}"`, informs: ALL, tone: 'green' }),
    );
    if (state.updates.jira) out.push(ev({ day: 'Oct 8', time: TIMES.approved, lane: 'code', who: 'astra', ai: true, reviewer: 'dana', short: 'LAB-15 updated', text: 'Updated the Jira LAB-15 description for v1.1.', informs: ['marcus'], tone: 'green' }));
    if (state.updates.teams) out.push(ev({ day: 'Oct 8', time: TIMES.approved, lane: 'talk', who: 'astra', ai: true, reviewer: 'dana', short: 'Posted in Teams', text: 'Posted the change in Teams #line-labor.', informs: ['sam', 'kim'], tone: 'green' }));
    if (state.updates.figma) out.push(ev({ day: 'Oct 8', time: TIMES.approved, lane: 'design', who: 'astra', ai: true, reviewer: 'dana', short: 'Figma comment', text: 'Commented on the Overview frame for Priya.', informs: ['priya'], tone: 'green' }));
  }
  if (s === 'denied') out.push(ev({ day: 'Oct 8', time: TIMES.denied, lane: 'decide', who: 'dana', short: 'Denied', text: 'Denied the change. R4 stays at 15 minutes, still contradicted by the build.', informs: ALL, tone: 'amber' }));
  if (state.codeUpdated) out.push(ev({ day: 'Oct 8', time: '2:24 PM', lane: 'code', who: 'codex', ai: true, reviewer: 'marcus', short: 'Job updated', text: "Changed the refresh job to '5 * * * *' to match R4 v1.1.", informs: ['marcus', 'dana'], tone: 'green', catchup: 'code' }));
  if (state.labelUpdated) out.push(ev({ day: 'Oct 8', time: '2:26 PM', lane: 'design', who: 'priya', short: 'Relabeled', text: `Relabeled the Overview: "${dashboardLabel(state)}"`, informs: ['dana', 'marcus'], tone: 'green', catchup: 'design' }));
  return out;
}

/* Shorter records for the other requirements, so every dot in the overview opens something real. */
function otherEvents(req) {
  const base = [];
  if (req.intent) base.push(ev({ day: req.intent.source.includes('Kickoff') ? 'Sep 24' : req.intent.source.includes('Oct 3') ? 'Oct 3' : 'Oct 4', time: '', lane: 'talk', who: null, speaker: req.intent.speaker, short: req.intent.source, text: `"${req.intent.quote}"`, detail: req.intent.source, informs: ALL }));
  const drafted = req.id === 'R6' ? 'Oct 3' : req.id === 'R8' ? 'Oct 4' : req.id === 'R5' ? 'Sep 30' : 'Sep 26';
  base.push(ev({ day: drafted, time: '', lane: 'prd', who: 'astra', ai: true, reviewer: 'dana', short: 'AI drafted', text: `Drafted ${req.id}: "${req.text}"`, status: req.status === 'draft' ? 'draft' : 'assumed', informs: ['dana'] }));
  if (req.id !== 'R6' && req.id !== 'R8' && req.status !== 'draft') base.push(ev({ day: 'Oct 1', time: '4:00 PM', lane: 'decide', who: 'dana', short: 'Published v1', text: `Published PRD v1 with ${req.id} approved.`, informs: ALL }));
  if (req.id === 'R6' || req.id === 'R8') base.push(ev({ day: req.id === 'R6' ? 'Oct 3' : 'Oct 4', time: '', lane: 'decide', who: 'dana', short: 'Added to v1', text: `Added ${req.id} to v1 without a second source.`, informs: ['dana'] }));
  if (req.id === 'R1') base.push(
    ev({ day: 'Sep 30', time: '', lane: 'code', who: 'marcus', short: 'Sandbox test', text: 'Tested department totals against the sandbox API.', status: 'verified', informs: ['dana'], tone: 'green' }),
    ev({ day: 'Oct 2', time: '', lane: 'code', who: 'marcus', short: '!205 merged', text: 'GitLab !205 merged. Jira LAB-12 done.', informs: ['dana'] }),
  );
  if (req.id === 'R2') base.push(
    ev({ day: 'Sep 29', time: '', lane: 'talk', who: null, speaker: 'Lead notes', short: 'Lead notes', text: 'Lead notes say 90%, not 85%.', informs: ['dana'], tone: 'amber' }),
    ev({ day: 'Oct 4', time: '12:05 PM', lane: 'talk', who: 'sam', short: 'SME sync', text: 'SME sync says 80%. Three sources now disagree.', informs: ['dana'], tone: 'amber', status: 'conflicting', flag: true }),
  );
  if (req.id === 'R3' && req.links.length) base.push(ev({ day: 'Oct 5', time: '', lane: 'code', who: 'marcus', short: '!212 opened', text: 'Opened GitLab !212 for the shift filter.', informs: ['dana'] }));
  const order = ['Sep 24', 'Sep 26', 'Sep 29', 'Sep 30', 'Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 8'];
  return base.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}

/* Overview: one dot per requirement per day. Above the line it's settled, below it's still moving. */
const DAYS = ['Oct 1', 'Oct 2', 'Oct 3', 'Oct 4', 'Oct 5', 'Oct 6', 'Oct 7', 'Oct 8'];

function dayStatus(id, d, state, reqs) {
  const has = reqs.some((r) => r.id === id);
  if (!has) return null;
  if (id === 'R6' && d < 2) return null;
  if (id === 'R8' && d < 3) return null;
  if (id === 'R1') return 'verified';
  if (id === 'R2') return d >= 3 ? 'contested' : 'assumed';
  if (id === 'R5') return d === 7 && state.r5 === 'accepted' ? 'assumed' : 'draft';
  if (id === 'R4') {
    if (d < 7) return 'assumed';
    if (state.stage === 'approved') return 'changed';
    if (state.stage === 'unpublished' || (state.stage === 'flagged' && state.startedAs === 'dana')) return 'assumed';
    return 'contested';
  }
  return 'assumed';
}

const ABOVE = ['changed', 'verified', 'assumed'];
const DOT_LABEL = { verified: 'verified', assumed: 'assumed, never checked', contested: 'contested or pending', draft: 'AI draft, not reviewed', changed: 'changed and verified today' };

function DotStack({ state, reqs, selected, onSelect }) {
  const ids = reqs.map((r) => r.id);
  const cols = DAYS.map((day, d) => {
    const items = ids.map((id) => ({ id, st: dayStatus(id, d, state, reqs) })).filter((x) => x.st);
    const rank = (st) => ABOVE.indexOf(st);
    return {
      day,
      up: items.filter((x) => ABOVE.includes(x.st)).sort((a, b) => rank(a.st) - rank(b.st)),
      down: items.filter((x) => !ABOVE.includes(x.st)).sort((a, b) => (a.st === 'contested' ? -1 : 1) - (b.st === 'contested' ? -1 : 1)),
    };
  });
  return html`<div className="rec-over">
    <div className="rec-over-head">
      <span className="section-label">Every requirement, every day</span>
      <span className="grow" />
      <span className="rec-key"><i className="rd verified" />Verified</span>
      <span className="rec-key"><i className="rd assumed" />Assumed</span>
      <span className="rec-key"><i className="rd changed" />Changed</span>
      <span className="rec-key"><i className="rd contested" />Contested</span>
      <span className="rec-key"><i className="rd draft" />AI draft</span>
    </div>
    <div className="rec-over-grid">
      <div className="rec-over-axis" aria-hidden="true"><span>Settled</span><span>Moving</span></div>
      <div className="rec-over-cols">
        ${cols.map((c, i) => html`<div key=${c.day} className=${cx('rec-col', i === DAYS.length - 1 && 'today')}>
          <div className="rec-col-up">${c.up.map((x) => html`<button key=${x.id} className=${cx('rd', x.st, selected === x.id && 'sel')} onClick=${() => onSelect(x.id)} aria-label=${`${x.id} on ${c.day}: ${DOT_LABEL[x.st]}`} title=${`${x.id} · ${c.day} · ${DOT_LABEL[x.st]}`} />`)}</div>
          <div className="rec-col-down">${c.down.map((x) => html`<button key=${x.id} className=${cx('rd', x.st, selected === x.id && 'sel')} onClick=${() => onSelect(x.id)} aria-label=${`${x.id} on ${c.day}: ${DOT_LABEL[x.st]}`} title=${`${x.id} · ${c.day} · ${DOT_LABEL[x.st]}`} />`)}</div>
          <span className="rec-col-day">${i === DAYS.length - 1 ? 'Today' : c.day}</span>
        </div>`)}
      </div>
    </div>
  </div>`;
}

/* Who knew what, at the playhead. Someone who hasn't heard anything since R4 was contradicted
   is still building on the old version, and that's the gap the recorder makes visible. */
function knowledge(events, at, flagIdx, resolvedIdx) {
  return TEAM.map((id) => {
    let last = -1;
    for (let i = 0; i <= at; i++) if (events[i].informs.includes(id) || events[i].who === id || events[i].reviewer === id) last = i;
    const open = flagIdx >= 0 && flagIdx <= at && (resolvedIdx < 0 || resolvedIdx > at);
    const behind = open && last < flagIdx;
    const caughtUp = resolvedIdx >= 0 && resolvedIdx <= at && last >= resolvedIdx;
    return { id, last, behind, caughtUp };
  });
}

function actorName(e) {
  if (e.who && AGENTS[e.who]) return AGENTS[e.who];
  if (e.who) return PEOPLE[e.who].name;
  return e.speaker || 'Source';
}

function ActorMark({ e, size = 22 }) {
  if (e.who && PEOPLE[e.who]) return html`<${Avatar} id=${e.who} size=${size} />`;
  const Icon = e.who === 'astra' ? Layers : FileText;
  return html`<span className=${cx('rec-agent', e.ai && 'ai')} style=${{ width: size, height: size }}><${Icon} size=${12} strokeWidth=${1.5} aria-hidden="true" /></span>`;
}

const at96 = (x) => `calc(96px + (100% - 96px) * ${x / 100})`;
const ROLE_NAME = { marcus: 'Marcus, the engineer', priya: 'Priya, the designer', dana: 'Dana, the product manager' };
const listNames = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`).replace(/^you/, 'You');
const stamp = (e) => `${e.day}${e.time ? ` · ${e.time}` : ''}`;

function exportRecord(reqId, events, at) {
  const lines = [
    `# ${reqId} · decision record`,
    `Line Labor Dashboard PRD · exported from the Astra recorder up to ${stamp(events[at])}`,
    '',
    ...events.slice(0, at + 1).map((e) => {
      const ai = e.ai ? ` (AI action, reviewed by ${PEOPLE[e.reviewer].name})` : '';
      const evd = e.evidence.length ? `\n  Evidence: ${e.evidence.map((k) => EVIDENCE[k].label).join('; ')}` : '';
      return `- **${stamp(e)}** · ${LANES.find(([k]) => k === e.lane)[1]} · ${actorName(e)}${ai}: ${e.text}${e.detail ? `\n  ${e.detail}` : ''}${evd}`;
    }),
    '',
    'Recorded to learn from, not to assign blame.',
  ];
  try {
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reqId}-decision-record.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function RecorderView({ selected, setSelected, toast, story }) {
  const { state, dispatch } = useStore();
  const reqs = getReqs(state);
  const [reqId, setReqId] = useState(selected && reqs.some((r) => r.id === selected) ? selected : 'R4');
  const req = reqs.find((r) => r.id === reqId) || reqs.find((r) => r.id === 'R4');
  const events = req.id === 'R4' ? r4Events(state) : otherEvents(req);
  const last = events.length - 1;
  const [atRaw, setAt] = useState(last);
  const at = Math.min(atRaw, last); // switching to a shorter record never points past its end
  const [follow, setFollow] = useState(true); // live: stays on the newest event as the story moves
  const [playing, setPlaying] = useState(false);
  const tracksRef = useRef(null);

  useEffect(() => { if (follow) setAt(last); }, [last, follow, reqId]);
  useEffect(() => { setSelected(['R1', 'R2', 'R3', 'R4', 'R5'].includes(reqId) ? reqId : null); }, [reqId]);
  // Replay modes: 'signoff' (Dana's decision record) and 'session' (end-card replay) play R4 from the start.
  const mode = state.replay;
  const you = mode === 'signoff' ? 'dana' : mode === 'session' ? state.startedAs : null;
  const [held, setHeld] = useState(false); // paused once at the moment R4 was contradicted
  useEffect(() => {
    if (!mode) return;
    setReqId('R4'); setAt(0); setFollow(false); setHeld(false);
    const t = setTimeout(() => setPlaying(true), 700);
    return () => clearTimeout(t);
  }, [mode]);

  const pick = (id) => { setReqId(id); setFollow(true); setPlaying(false); };
  const seek = (i) => { const n = Math.max(0, Math.min(last, i)); setAt(n); setFollow(n === last); setPlaying(false); };
  const play = () => {
    if (playing) { setPlaying(false); return; }
    if (at >= last) setAt(0);
    setFollow(false);
    setPlaying(true);
  };

  // Even spacing per event keeps quiet days from eating the tape; day breaks mark where time jumps.
  const xs = events.map((_, i) => ((i + 0.5) / events.length) * 100);
  const breaks = events.map((e, i) => (i > 0 && e.day !== events[i - 1].day ? { i, day: e.day } : null)).filter(Boolean);
  // Day labels sit on an axis under the tracks; a label that would collide with the one before it is skipped.
  let lastLabel = xs[0] - 50 / events.length;
  for (const b of breaks) { const x = (xs[b.i] + xs[b.i - 1]) / 2; b.x = x; b.show = x - lastLabel >= 7; if (b.show) lastLabel = x; }
  const flagIdx = events.findIndex((e) => e.flag);
  const resolvedIdx = events.findIndex((e) => e.resolves);
  const head = xs[at];

  useEffect(() => {
    if (!playing) return;
    if (at >= last) { setPlaying(false); setFollow(true); return; }
    // In a replay, stop once on the flag so the "who knew what" gap can be read.
    if (mode && req.id === 'R4' && at === flagIdx && !held) { setPlaying(false); setHeld(true); return; }
    const t = setTimeout(() => setAt((i) => Math.min(last, i + 1)), mode ? 800 : 950);
    return () => clearTimeout(t);
  }, [playing, at, last]);
  const atFlag = mode && req.id === 'R4' && held && at === flagIdx && !playing;

  // Record lag: how long the PRD trailed what the team already knew, and how long the work trailed the PRD.
  const bands = [];
  if (flagIdx >= 0) bands.push({ lane: 'prd', from: flagIdx, to: resolvedIdx >= 0 ? resolvedIdx : null, label: resolvedIdx >= 0 ? (req.id === 'R4' ? 'PRD behind · 41 min' : 'PRD behind') : 'PRD behind' });
  if (resolvedIdx >= 0) {
    const codeDone = events.findIndex((e) => e.catchup === 'code');
    const designDone = events.findIndex((e) => e.catchup === 'design');
    bands.push({ lane: 'code', from: resolvedIdx, to: codeDone >= 0 ? codeDone : null, label: codeDone >= 0 ? 'Code caught up' : 'Code on v1' });
    bands.push({ lane: 'design', from: resolvedIdx, to: designDone >= 0 ? designDone : null, label: designDone >= 0 ? 'Label caught up' : 'Label on v1' });
  }
  const bandStyle = (b) => {
    const left = xs[b.from];
    const right = b.to == null ? 100 : xs[b.to];
    const vis = Math.min(right, Math.max(left, head)) - left;
    return { left: `${left}%`, width: `${Math.max(0, vis)}%` };
  };

  const cur = events[at];
  const status = [...events.slice(0, at + 1)].reverse().find((e) => e.status)?.status || 'assumed';
  const r4Then = req.id === 'R4' ? (resolvedIdx >= 0 && at >= resolvedIdx ? state.proposal.text : TEXT.r4Old) : req.text;
  const know = knowledge(events, at, flagIdx, resolvedIdx);
  const behindCount = know.filter((k) => k.behind).length;
  const behindNames = listNames(know.filter((k) => k.behind).sort((a, b) => (b.id === you) - (a.id === you)).map((k) => (k.id === you ? 'you' : PEOPLE[k.id].name.split(' ')[0])));
  const isLive = at === last;
  const statusTag = { assumed: ['amber', 'Assumed'], contradicted: ['amber', 'Contradicted by build'], conflicting: ['amber', 'Conflicting sources'], verified: ['green', 'Verified'], draft: ['blue', 'AI draft'] }[status];

  const doExport = () => toast(exportRecord(req.id, events, at) ? `${req.id} record downloaded, up to ${stamp(cur)}` : 'Export is not available in this browser.');

  const onKey = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); seek(at - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); seek(at + 1); }
    if (e.key === ' ') { e.preventDefault(); play(); }
  };

  return html`<div className="rl-split">
    <div className="fmap-wrap rec">
      <div className="map-bar">
        <span className="rec-title">Recorder</span>
        <span className=${cx('rec-live', isLive && 'on')}><i aria-hidden="true" />${isLive ? 'Recording' : 'Replaying'}</span>
        <span className="grow" />
        <span className="map-note">Same records as the Doc view. Nothing is edited here.</span>
      </div>

      <div className="rec-body">
        <${DotStack} state=${state} reqs=${reqs} selected=${req.id} onSelect=${pick} />

        <div className="rec-deck">
          <div className="rec-deck-head">
            <div className="rec-req" role="tablist" aria-label="Requirement">
              ${reqs.map((r) => html`<button key=${r.id} role="tab" aria-selected=${r.id === req.id} className=${cx('rec-req-btn mono', r.id === req.id && 'active')} onClick=${() => pick(r.id)}>${r.id}</button>`)}
            </div>
            <span className="rec-req-name">${req.name}</span>
            <span className="grow" />
            <span className="tiny muted">${events.length} events</span>
          </div>

          ${mode && req.id === 'R4' && html`<div className=${cx('rec-callout', atFlag && 'hold')}>
            ${atFlag
              ? html`<span><strong>${stamp(cur)}: the build found R4 was wrong.</strong> Only Marcus knew. ${behindNames} were still working from v1.</span>
                  <button className="btn sm" onClick=${() => { setFollow(false); setPlaying(true); }}>Keep playing</button>`
              : mode === 'signoff'
                ? html`<span>${isLive ? 'This is R4\'s full record. Sign it off to close the change.' : 'Replaying R4 before you sign off its record. Watch who knew what, and when.'}</span>`
                : html`<span>${isLive ? 'That\'s the whole story so far.' : `Replaying what happened while you played ${ROLE_NAME[state.startedAs] || 'your role'}.`} Your own actions are outlined.</span>`}
          </div>`}
          <div className="rec-tracks" ref=${tracksRef} tabIndex="0" onKeyDown=${onKey} aria-label="Recorder tracks. Use the arrow keys to step, space to play.">
            ${breaks.map((b) => html`<div key=${b.i} className="rec-break" style=${{ left: at96(b.x) }}>${b.show && html`<span>${b.day}</span>`}</div>`)}
            <div className="rec-break first" style=${{ left: at96(0) }}><span>${events[0].day}</span></div>
            ${LANES.map(([k, label]) => html`<div key=${k} className="rec-lane">
              <span className="rec-lane-label">${label}</span>
              <div className="rec-lane-track">
                ${bands.filter((b) => b.lane === k).map((b) => html`<div key=${b.label} className=${cx('rec-band', b.to != null && 'closed')} style=${bandStyle(b)}>${parseFloat(bandStyle(b).width) >= 20 && html`<span>${b.label}</span>`}</div>`)}
                ${events.map((e, i) => e.lane === k && html`<button key=${i}
                  className=${cx('rec-mark', e.tone, e.ai && 'ai', i > at && 'future', i === at && 'now', you && (e.who === you || e.reviewer === you) && 'mine')}
                  style=${{ left: `${xs[i]}%` }}
                  onClick=${() => seek(i)}
                  aria-label=${`${stamp(e)}. ${actorName(e)}: ${e.text}`}
                  title=${`${stamp(e)} · ${e.short}`}
                />`)}
              </div>
            </div>`)}
            <div className="rec-head" style=${{ left: at96(head) }} aria-hidden="true"><span>${cur.time || cur.day}</span></div>
          </div>

          <div className="rec-transport">
            <button className="icon-btn" onClick=${() => seek(at - 1)} aria-label="Previous event"><${SkipBack} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
            <button className="icon-btn round rec-play" onClick=${play} aria-label=${playing ? 'Pause replay' : 'Replay from the start'}>${playing ? html`<${Pause} size=${13} strokeWidth=${1.5} aria-hidden="true" />` : html`<${Play} size=${13} strokeWidth=${1.5} aria-hidden="true" />`}</button>
            <button className="icon-btn" onClick=${() => seek(at + 1)} aria-label="Next event"><${SkipForward} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
            <input type="range" className="rec-scrub" min="0" max=${last} step="1" value=${at} onChange=${(e) => seek(+e.target.value)} aria-label="Scrub the record" aria-valuetext=${stamp(cur)} />
            <span className="rec-clock mono">${stamp(cur)}</span>
            ${!isLive && html`<button className="btn btn-ghost sm" onClick=${() => seek(last)}>Go live</button>`}
          </div>

          <div className="rec-legend">
            <span><i className="rm" />Person</span>
            <span><i className="rm ai" />AI action, person reviewed</span>
            <span><i className="rm amber" />Unresolved</span>
            <span><i className="rm green" />Approved or changed</span>
            <span><i className="rb" />Record lag</span>
          </div>
        </div>

        <div className="rec-pattern">
          <div className="rec-pattern-head"><span className="section-label">Pattern across 3 PRDs</span><${Tag} tone="neutral">Early signal · 4 cases<//></div>
          <p>Requirements set from a kickoff quote and never checked against a system changed after the build started in 3 of 4 cases. Check them before publishing.</p>
          ${req.id === 'R4' && state.startedAs === 'dana' && html`<p className="small">This pattern was shown on R4 at the assumption check on Oct 1. v1 was published anyway, and R4 changed a week later.</p>`}
          <p className="tiny muted">Counts requirements and sources, never people.</p>
        </div>
      </div>
    </div>

    <aside className="rl-panel" aria-label="At this moment">
      <div className="sp">
        <div className="insp-head">
          <span className="insp-id mono">${req.id}</span>
          <span className="insp-title">${isLive ? 'Right now' : 'At this moment'}</span>
          <${Tag} tone=${statusTag[0]}>${statusTag[1]}<//>
        </div>
        <div className="sp-body insp-body rec-panel">
          <div className="rec-then">
            <span className="tiny-label">${req.id} said, ${stamp(cur)}</span>
            <p>${r4Then}</p>
          </div>

          <div className="section-label">This event</div>
          <div className="rec-event">
            <div className="rec-event-who">
              <${ActorMark} e=${cur} />
              <div className="rec-event-meta">
                <strong>${actorName(cur)}${cur.who === you ? ' (you)' : ''}</strong>
                <span className="tiny muted">${LANES.find(([k]) => k === cur.lane)[1]} · ${stamp(cur)}</span>
              </div>
            </div>
            <p>${cur.text}</p>
            ${cur.detail && html`<p className="small muted">${cur.detail}</p>`}
            ${cur.ai && html`<div className="rec-ai"><span className="ai-dot" aria-hidden="true" /><span>AI action · reviewed by ${PEOPLE[cur.reviewer].name}</span></div>`}
            ${cur.evidence.length > 0 && html`<div className="chips">${cur.evidence.map((k) => html`<${EvidenceChip} key=${k} id=${k} variant="short" />`)}</div>`}
          </div>

          <div className="section-label">Who knew what${behindCount ? html`<span className="rec-behind">${behindCount} not told yet</span>` : ''}</div>
          ${know.map((k) => {
            const p = PEOPLE[k.id];
            const e = k.last >= 0 ? events[k.last] : null;
            return html`<div key=${k.id} className=${cx('rec-know', k.behind && 'behind')}>
              <${Avatar} id=${k.id} size=${20} />
              <div className="rec-know-text">
                <span className="rec-know-name">${p.name}${k.id === you ? ' (you)' : ''}</span>
                <span className="tiny muted">${e ? `${e.short} · ${stamp(e)}` : 'Not involved yet'}</span>
              </div>
              ${k.behind ? html`<${Tag} tone="neutral">On v1<//>` : k.caughtUp ? html`<${Tag} tone="green">Current<//>` : null}
            </div>`;
          })}
        </div>
        <div className="sp-foot">
          ${mode === 'signoff'
            ? html`<button className="btn" onClick=${doExport}><${Download} size=${14} strokeWidth=${1.5} aria-hidden="true" />Export</button>
                <span className="grow" />
                ${state.recordSigned
                  ? html`<${Tag} tone="green">Record signed<//>`
                  : html`<button className="btn btn-primary" onClick=${() => { dispatch({ type: 'SIGN_RECORD' }); story && story.done(); }}>Sign off record</button>`}`
            : html`<button className="btn" onClick=${() => { dispatch({ type: 'SET_VIEW', view: 'doc' }); }}>Open in Doc</button>
                <span className="grow" />
                <button className="btn btn-primary" onClick=${doExport}><${Download} size=${14} strokeWidth=${1.5} aria-hidden="true" />Export record</button>`}
        </div>
      </div>
    </aside>
  </div>`;
}
