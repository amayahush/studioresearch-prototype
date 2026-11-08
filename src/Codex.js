import { html, useState, useEffect, useRef, cx, Fragment, useMedia, PHONE, TABLET, touchCopy } from './lib.js';
import { useStore, TEXT, EVIDENCE, TIMES, R4_INTENT, PEOPLE, prdVersion } from './store.js';
import { SpecCard } from './Spec.js';
import { Avatar, Tag, SectionLabel, Diff, EvidenceChip, Toast, StatusChip, ResizeHandle, useColumnWidth } from './ui.js';
import { TimeSkip, EndCard } from './Interstitials.js';
import {
  FileText, FileCode, Code as Code2, GitBranch, X, PanelLeft, GitPullRequestArrow, CheckCircle2, MessageSquare, Paperclip,
  AlertTriangle, Plus, Check, Clock, Layers, FolderClosed, House, Box, BookOpen, AtSign, Ellipsis, Bell, Search,
  SquarePen, Mic, ArrowUp, Copy, Link2, Scan, ChevronDown, MoreHorizontal, Bookmark, Pause,
} from 'lucide-react';

const PANEL_FOR_STAGE = {
  flagged: 'check',
  proposed: 'sent',
  moreEvidence: 'evidence',
  resent: 'sent',
  approved: 'changed',
  denied: 'denied',
};

const SPEC_LINES = [
  [41, '### 3.2 Sync schedule', 'h'],
  [42, 'Badge punches are batch-loaded at the top of each hour.'],
  [43, 'Clients should not poll more often than hourly.'],
  [44, ''],
  [56, '## Changelog', 'h'],
  [57, '| Date       | Change'],
  [58, '| 2026-09-12 | Reviewed by Ravi Patel (data owner):'],
  [59, '|            | sync stays hourly (PT1H). No faster feed'],
  [60, '|            | before the 2027 platform update.'],
  [61, '| 2023-03-02 | Initial spec.'],
];

export function Codex() {
  const { state, dispatch } = useStore();
  const [panel, setPanel] = useState(null);
  const phone = useMedia(PHONE);
  // Phones and tablets start on the thread itself; on phones the thread list slides in as a drawer.
  const [threadsOpen, setThreadsOpen] = useState(() => !window.matchMedia(TABLET).matches);
  const [threadsW, setThreadsW] = useColumnWidth('threads', 228);
  const [panelW, setPanelW] = useColumnWidth('codex-panel', 360);
  const [file, setFile] = useState(null); // null = agent transcript, 'spec' = timekeeping-api.md
  const [toast, setToast] = useState('');
  const [streamDone, setStreamDone] = useState(state.codexStreamed || state.stage !== 'flagged');
  const [skip, setSkip] = useState(null); // time skip shown over the shell
  const [endCard, setEndCard] = useState(false);

  // Phones: opening the spec file from the Astra sheet lowers the sheet (kept mounted, so nothing
  // typed is lost) so the lines can be selected; the Astra pill or adding evidence brings it back.
  const [sheetDown, setSheetDown] = useState(false);
  // Astra has nothing to say until the spec has run into a conflict.
  const noteReady = streamDone && !(state.stage === 'flagged' && state.specPhase !== 'held');
  const openNote = () => { if (!noteReady) return; setSheetDown(false); setPanel(PANEL_FOR_STAGE[state.stage]); };
  const [running, setRunning] = useState(false); // a reopened task is rerunning

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'π')) { e.preventDefault(); openNote(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.stage, state.specPhase, streamDone]);

  // Marcus's path plays the other roles off screen (brief §8): 04 → skip → 08a.
  const afterSent = () => {
    setPanel(null);
    if (state.stage !== 'proposed') return;
    setSkip({
      from: TIMES.proposed, to: TIMES.moreEvidence, title: 'Your proposal is with the team',
      events: [
        { time: TIMES.priya, who: 'priya', text: state.priya.stance === 'disagreed' ? 'Priya disagreed with the change' : 'Priya agreed: she\'ll relabel the Overview to show the last sync time' },
        { time: TIMES.moreEvidence, who: 'dana', text: 'Dana asked you for more evidence: §3.2 is from 2023' },
      ],
      onDone: () => {
        if (!state.priya.stance) dispatch({ type: 'PRIYA_STANCE', stance: 'agreed', note: TEXT.priyaNote });
        dispatch({ type: 'REQUEST_EVIDENCE', ask: TEXT.danaAsk });
      },
    });
  };

  // 08b → skip → 09.
  const resend = (reply) => {
    dispatch({ type: 'RESEND', reply });
    setPanel(null);
    setFile(null);
    setSkip({
      from: TIMES.resent, to: TIMES.approved, title: 'Dana is reviewing your new evidence',
      events: [
        { time: TIMES.resent, who: 'kim', text: 'Kim agreed: leaders still see risk before mid-shift' },
        { time: TIMES.approved, who: 'dana', text: 'Dana approved R4 and published PRD v1.1' },
      ],
      onDone: () => dispatch({ type: 'APPROVE', updates: state.updates }),
    });
  };

  // 09 → end card. After "Update the code", let the diff land in the pane first.
  const finish = (updated) => {
    setPanel(null);
    if (updated) dispatch({ type: 'UPDATE_CODE' });
    setTimeout(() => setEndCard(true), updated ? 1200 : 0);
  };

  // Accepting Dana's change reruns only the reopened tasks, one at a time.
  const rerunStep = (type) => {
    setPanel(null);
    dispatch({ type });
    setRunning(true);
    setTimeout(() => setRunning(false), 900);
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const pendingBranch = ['proposed', 'moreEvidence', 'resent'].includes(state.stage);
  const status = {
    flagged: { plan: 'linked to PRD v1', run: 'watching the run', held: 'R4 needs a decision' }[state.specPhase],
    proposed: 'proposal sent',
    moreEvidence: 'Dana replied',
    resent: 'resent to Dana',
    approved: state.codeUpdated ? 'in sync with v1.1' : 'spec updated to v1.1',
    denied: 'R4 unchanged',
  }[state.stage];
  const endSteps = [
    { time: TIMES.flagged, who: 'Codex', text: 'ran the spec. T3 failed verify against the API' },
    { time: TIMES.proposed, who: 'You', text: 'proposed hourly refresh, with evidence' },
    { time: TIMES.priya, who: 'Priya', text: state.priya.stance === 'disagreed' ? 'disagreed' : 'agreed and will relabel the Overview' },
    { time: TIMES.moreEvidence, who: 'Dana', text: 'asked for more evidence' },
    { time: TIMES.resent, who: 'You', text: 'added changelog lines 58–60 and resent' },
    { time: TIMES.approved, who: 'Dana', text: 'approved R4 · PRD v1.1 updated your spec, Jira, Figma and Teams' },
    state.codeUpdated
      ? { time: '2:24 PM', who: 'You', text: 'accepted the spec update and committed T3 and T4' }
      : { time: 'Next', who: 'You', text: 'still need to accept the spec update and rerun T3, T4', pending: true },
  ];

  const needsYou = noteReady && (state.stage === 'flagged' || state.stage === 'moreEvidence' || (state.stage === 'approved' && !state.codeUpdated));
  const notSimulated = () => setToast('Not simulated in this prototype.');

  return html`<div className="codex" style=${{ '--cx-threads-w': `${threadsW}px` }}>
    <header className="cx-titlebar">
      <span className="cx-lights" aria-hidden="true"><span /><span /><span /></span>
      <button className="cx-icon" aria-label=${threadsOpen ? 'Hide sidebar' : 'Show sidebar'} aria-expanded=${threadsOpen} title=${threadsOpen ? 'Hide sidebar' : 'Show sidebar'} onClick=${() => setThreadsOpen(!threadsOpen)}><${PanelLeft} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>
      <span className=${cx('cx-title-gap', threadsOpen && 'open')} />
      <span className="cx-thread-title"><${FolderClosed} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span>Implement LAB-15 refresh job</span></span>
      <span className="cx-branch"><${GitBranch} size=${13} strokeWidth=${1.5} aria-hidden="true" />lab-15-refresh${pendingBranch ? ' · T3, T4 held' : ''}</span>
      <button className=${cx('cx-astra-pill', needsYou && 'attn')} onClick=${openNote} disabled=${!noteReady}><${Layers} size=${13} strokeWidth=${1.5} aria-hidden="true" />Astra · ${streamDone ? status : 'checking PRD'}</button>
    </header>

    <div className="cx-body">
      <nav className="cx-rail" aria-label="Codex">
        ${[[House, 'Home', true], [Box, 'Projects'], [Clock, 'History'], [BookOpen, 'Docs'], [AtSign, 'Mentions'], [Ellipsis, 'More'], [GitBranch, 'Branches']].map(([Icon, label, on]) =>
          html`<button key=${label} className=${cx('cx-rail-btn', on && 'on')} aria-label=${label} title=${label} onClick=${on ? undefined : notSimulated}><${Icon} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>`)}
        <span className="grow" />
        <${Avatar} id="marcus" size=${24} />
      </nav>

      ${phone && threadsOpen && html`<div className="m-scrim" onClick=${() => setThreadsOpen(false)} aria-hidden="true" />`}
      ${threadsOpen && html`<nav className=${cx('cx-threads', phone && 'm-drawer open')} style=${phone ? undefined : { flexBasis: threadsW, width: threadsW }} aria-label="Threads">
        <div className="cx-threads-head">
          <span>Codex</span>
          <button className="cx-icon" aria-label="Notifications" onClick=${notSimulated}><${Bell} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
          <button className="cx-icon" aria-label="Search threads" onClick=${notSimulated}><${Search} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>
        <button className="cx-thread" onClick=${notSimulated}><${SquarePen} size=${14} strokeWidth=${1.5} aria-hidden="true" />New chat</button>
        <div className="cx-threads-label">Projects</div>
        <button className="cx-thread" onClick=${notSimulated}><${FolderClosed} size=${14} strokeWidth=${1.5} className="cx-folder" aria-hidden="true" />labor-dashboard</button>
        <button className="cx-thread sub active" aria-current="page" onClick=${() => { setFile(null); if (phone) setThreadsOpen(false); }}><span>Implement LAB-15 refresh job</span></button>
        <button className="cx-thread sub" onClick=${notSimulated}><span>Fix shift filter query</span></button>
        <div className="cx-threads-label">Recents</div>
        <button className="cx-thread" onClick=${notSimulated}><span>Review !205 department totals</span></button>
        <button className="cx-thread" onClick=${notSimulated}><span>Explain timekeeping client</span></button>
        <button className="cx-thread" onClick=${notSimulated}><span>Write tests for LAB-13</span><span className="cx-unread" aria-label="Unread" /></button>
      </nav>`}

      ${!phone && threadsOpen && html`<${ResizeHandle} side="start" width=${threadsW} setWidth=${setThreadsW} def=${228} min=${170} max=${400} collapseAt=${110} onCollapse=${() => setThreadsOpen(false)} label="Resize threads sidebar" />`}
      <main className="cx-main">
        ${file === 'spec' && html`<div className="cx-filebar">
          <${FileText} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span>timekeeping-api.md</span>
          <span className="grow" />
          <button className="cx-icon" aria-label="Close file, back to thread" title="Back to thread" onClick=${() => setFile(null)}><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>`}
        <div className="cx-scroll">
          ${file === 'spec'
            ? html`<${SpecFile} onToast=${setToast} openNote=${openNote} />`
            : html`<${Transcript} panel=${panel} openNote=${openNote} openFile=${() => setFile('spec')} streamDone=${streamDone} onStreamDone=${() => { setStreamDone(true); dispatch({ type: 'CODEX_STREAMED' }); }} running=${running} onAccept=${() => rerunStep('ACCEPT_SPEC')} onCommitT3=${() => rerunStep('COMMIT_T3')} onCommitT4=${() => finish(true)} onLater=${() => finish(false)} />`}
          <div className="cx-input">
            <div className="cx-input-box">
              <input aria-label="Message Codex" placeholder="Work with Codex" onKeyDown=${(e) => e.key === 'Enter' && setToast('Codex chat is not simulated in this prototype.')} />
              <div className="cx-input-row">
                <button className="cx-icon" aria-label="Attach" onClick=${notSimulated}><${Plus} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>
                <button className="cx-input-opt" onClick=${notSimulated}><${Check} size=${13} strokeWidth=${1.5} aria-hidden="true" />Approve for me</button>
                <span className="grow" />
                <span className="cx-model"><span>Codex</span> Medium</span>
                <button className="cx-icon" aria-label="Dictate" onClick=${notSimulated}><${Mic} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
                <button className="cx-send" aria-label="Send" onClick=${() => setToast('Codex chat is not simulated in this prototype.')}><${ArrowUp} size=${13} strokeWidth=${1.8} aria-hidden="true" /></button>
              </div>
            </div>
          </div>
        </div>
      </main>

      ${!phone && panel && html`<${ResizeHandle} side="end" width=${panelW} setWidth=${setPanelW} def=${360} min=${300} max=${640} label="Resize Astra panel" />`}
      ${panel &&
      html`${phone && !sheetDown && html`<div className="m-scrim sheet" onClick=${() => setPanel(null)} aria-hidden="true" />`}<aside style=${phone ? undefined : { flexBasis: panelW, width: panelW }} className=${cx('side-panel rl astra-embed', phone && 'm-sheet', phone && sheetDown && 'm-down')} aria-hidden=${phone && sheetDown ? 'true' : undefined} role=${phone ? 'dialog' : undefined} aria-modal=${phone ? 'true' : undefined} data-theme=${state.theme === 'light' ? 'light' : 'dark'} aria-label="Astra">
        <${CodexPanel} panel=${panel} setPanel=${setPanel} setToast=${setToast} openFile=${() => { setFile('spec'); if (phone) setSheetDown(true); }} onSentClose=${afterSent} onResend=${resend} onFinish=${finish} onAccept=${() => rerunStep('ACCEPT_SPEC')} />
      </aside>`}
    </div>
    ${skip && html`<${TimeSkip} ...${skip} onDone=${() => { skip.onDone(); setSkip(null); }} />`}
    ${endCard && html`<${EndCard}
      role="Engineer"
      title=${state.codeUpdated ? 'Your spec, code and PRD agree again.' : 'R4 changed. Your spec is waiting.'}
      steps=${endSteps}
      onClose=${() => setEndCard(false)}
      onStart=${() => dispatch({ type: 'SET_ROLE', role: null })}
      onExplore=${() => { dispatch({ type: 'SET_VIEW', view: 'map' }); dispatch({ type: 'SET_ROLE', role: 'dana' }); }}
    />`}
    <${Toast} text=${toast} />
  </div>`;
}

function Step({ children }) {
  return html`<div className="cx-step">${children}</div>`;
}

function Notice({ isNew, handled, children, onView, tour }) {
  return html`<div className=${cx('cx-notice', isNew && !handled && 'new', handled && 'handled')} data-tour=${tour}>
    <${Layers} size=${14} strokeWidth=${1.5} aria-hidden="true" />
    <span className="cx-notice-text"><strong>Astra</strong> <span>${children}</span></span>
    ${handled ? html`<span className="cx-notice-done">Handled</span>` : html`<button className="cx-notice-open" onClick=${onView}>Open</button>`}
  </div>`;
}

// Light syntax color for JSON and TS lines: strings and bare numbers.
function tint(line) {
  if (typeof line !== 'string') return line;
  const parts = line.split(/("[^"]*"|'[^']*'|\b\d+\b)/);
  return parts.map((t, i) => i % 2 ? html`<span key=${i} className=${/^["']/.test(t) ? 'tk-str' : 'tk-num'}>${t}</span>` : t);
}

function Code({ title, meta, lines }) {
  return html`<div className="code-card">
    <div className="code-card-head">
      <${Code2} size=${14} strokeWidth=${1.5} aria-hidden="true" />
      <span className="grow">${title}</span>
      ${meta && html`<span className="code-card-meta">${meta}</span>`}
      <button className="cx-icon sm" aria-label="Copy" title="Copy"><${Copy} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
    </div>
    <div className="code-card-body mono">
      ${lines.map(([content, tone], i) => html`<div key=${i} className=${cx('code-row', tone)}>${tone === 'green' || tone === 'red' || tone === 'muted' ? content : tint(content)}</div>`)}
    </div>
  </div>`;
}

function Divider({ children }) {
  return html`<div className="cx-divider"><span>${children}</span></div>`;
}

// Pause before each opening block appears.
const STREAM_DELAYS = [300, 500, 500, 400];
// The run, step by step. T1 passes, T2 needs a spec fix, T3 fails against the API.
const RUN_DELAYS = [800, 1000, 1400, 1000, 700, 400];

function runTasks(step) {
  const done = ['done', 'Committed'];
  return {
    T1: step < 1 ? ['run', 'Running'] : done,
    T2: step < 1 ? ['todo', ''] : step === 1 ? ['run', 'Running'] : step === 2 ? ['run', 'Fixing spec'] : done,
    T3: step < 3 ? ['todo', ''] : step === 3 ? ['run', 'Running'] : ['held', 'Failed verify'],
    T4: step < 4 ? ['todo', ''] : ['held', 'Waiting on T3'],
  };
}

function Transcript({ panel, openNote, openFile, streamDone, onStreamDone, running, onAccept, onCommitT3, onCommitT4, onLater }) {
  const { state, dispatch } = useStore();
  const s = state.stage;
  const [shown, setShown] = useState(streamDone ? STREAM_DELAYS.length : 0);
  const [runStep, setRunStep] = useState(0);
  const [guard, setGuard] = useState(false);
  const endRef = useRef(null);
  const streaming = shown < STREAM_DELAYS.length;
  const planning = s === 'flagged' && state.specPhase === 'plan';
  const runningSpec = s === 'flagged' && state.specPhase === 'run';
  const heldNow = s === 'flagged' && state.specPhase === 'held';
  const past = s !== 'flagged';
  const past2 = (stage) => ['flagged', 'proposed', 'moreEvidence', 'resent', 'approved', 'denied'].indexOf(s) >= ['flagged', 'proposed', 'moreEvidence', 'resent', 'approved', 'denied'].indexOf(stage);
  const afterEvidence = ['resent', 'approved'].includes(s) || (s === 'denied' && state.marcusReply);
  const log = heldNow || past ? RUN_DELAYS.length : runStep; // from the story, so history survives leaving the thread
  const skipAll = () => {
    if (streaming) setShown(STREAM_DELAYS.length);
    else if (runningSpec) setRunStep(RUN_DELAYS.length);
  };

  useEffect(() => {
    if (!streaming) { if (!streamDone) onStreamDone(); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setShown(reduce ? STREAM_DELAYS.length : shown + 1), STREAM_DELAYS[shown]);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (!runningSpec) return;
    if (runStep >= RUN_DELAYS.length) { dispatch({ type: 'SPEC_HELD' }); return; }
    const t = setTimeout(() => setRunStep(runStep + 1), RUN_DELAYS[runStep]);
    return () => clearTimeout(t);
  }, [runningSpec, runStep]);

  useEffect(() => {
    if (!streaming && !runningSpec) return;
    const onKey = (e) => {
      if (e.key === ' ' && !/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) { e.preventDefault(); skipAll(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [streaming, runningSpec]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [shown, runStep, s, state.specPhase, state.rerun, running, state.codeUpdated, guard]);

  const liveRun = runTasks(runStep);
  const DONE = ['done', 'Committed'];
  const PLAN = { T1: ['todo', ''], T2: ['todo', ''], T3: ['todo', ''], T4: ['todo', ''] };
  const HELD = { T1: DONE, T2: DONE, T3: ['held', 'Failed verify'], T4: ['held', 'Waiting on T3'] };
  const REOPENED = { T1: DONE, T2: DONE, T3: ['reopen', 'Reopened'], T4: ['reopen', 'Reopened'] };
  const ALL_DONE = { T1: DONE, T2: DONE, T3: DONE, T4: DONE };

  const approved = s === 'approved';
  const accepted = approved && (state.rerun > 0 || state.codeUpdated);
  const started = !planning;
  const t3Done = approved && (state.rerun >= 2 || state.codeUpdated);

  // Every card is a snapshot of its moment in the chat. New work adds below; nothing rewrites what's above.
  const planCard = html`<${SpecCard}
    key="plan"
    tasks=${PLAN}
    r4Tag="R4"
    r4Tone="assumed"
    defaultOpen="T3"
    tour=${planning ? 'spec-card' : undefined}
    explainTour=${planning ? 'spec-explain' : undefined}
    foot=${planning ? html`<span className="grow" /><button className="v3-btn primary" onClick=${() => dispatch({ type: 'APPROVE_SPEC' })}>Approve and run</button>` : null}
  />`;

  const review = (id, file, lines, verify, active, label, onCommit) => html`<div className="v3-review" data-tour=${active ? 'task-review' : undefined}>
    <${Code} title=${`${id} · ${file}`} meta=${html`<span className="green">+1</span> <span className="red">−1</span>`} lines=${lines} />
    <${Step}>Verify passed · ${verify}<//>
    ${active
      ? html`<div className="v3-foot bare"><span className="grow" /><button className="v3-btn primary" onClick=${onCommit}>${label}</button></div>`
      : html`<${Step}>${id} committed<//>`}
  </div>`;
  const reviewT3 = (active) => review('T3', 'src/jobs/refreshLaborHours.ts', [
    ["- export const schedule = '*/15 * * * *'", 'red'],
    [html`+ export const schedule = '5 * * * *'  <span className="muted">// R4 v1.1</span>`, 'green'],
  ], "the schedule fits the API's hourly sync", active, 'Commit T3', onCommitT3);
  const reviewT4 = (active) => review('T4', 'src/ui/Overview.tsx', [
    ['- Updated every 15 min', 'red'],
    ['+ Last synced {lastSync} · next {nextSync}', 'green'],
  ], 'the Overview shows the real last-sync time', active, 'Commit T4', onCommitT4);

  const blocks = [
    html`<div className="cx-prompt"><div>Implement LAB-15: refresh labor hours from the timekeeping API every 15 minutes. Follow PRD R4.</div></div>`,
    html`<${Step}>Reading PRD context · Line Labor Dashboard v1 · R1, R4<//>`,
    html`<div className="v3-say">Here's the plan. Nothing runs until you approve it.</div>`,
    planCard,
  ];

  return html`<div className="transcript" onClick=${skipAll}>
    ${blocks.slice(0, shown).map((b, i) => html`<div key=${i} className=${cx('stream-block', !streamDone && 'enter')}>${b}</div>`)}
    ${streaming && html`<div className="cx-working"><span className="spinner" /> Working… <span className="cx-hint">${touchCopy('click or press Space to skip')}</span></div>`}

    ${started && html`<${Fragment}>
      <div className="cx-prompt v3-gap"><div>Spec looks right. Run it.</div></div>
      <${SpecCard}
        key="run"
        tour=${heldNow ? 'spec-run' : undefined}
        tasks=${runningSpec ? liveRun : HELD}
        r4Tag="R4"
        r4Tone=${runningSpec && runStep < 4 ? 'assumed' : 'held'}
        t2Fixed=${past || log >= 2}
      />
      ${log >= 1 && html`<div className="cx-step v3-gap">T1 · verify passed</div>`}
      ${log >= 2 && html`<div className="v3-fix" data-tour="spec-fix"><${Code2} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span><strong>T2 failed verify:</strong> the API returned 429. Spec updated: wait for Retry-After before retrying. <span className="muted">R1 didn't change, so no one else is pulled in.</span></span></div>`}
      ${log >= 3 && html`<${Step}>T2 · verify passed<//>`}
      ${log >= 4 && html`<${Fragment}>
        <${Step}>Read <button className="cx-file-link" onClick=${(e) => { e.stopPropagation(); openFile(); }}>docs/integrations/timekeeping-api.md</button><//>
        <${Step}>Called sandbox GET /v2/labor/hours?plant=EVR&shift=2<//>
      <//>`}
      ${log >= 5 && html`<div className="v3-say">T3 can't meet R4: the API only syncs hourly. I stopped there. T1 and T2 aren't affected.</div>`}
    <//>`}

    ${(heldNow || past) && html`<section className=${cx('v3-decide', past && 'resolved')} data-tour=${heldNow ? 'spec-decide' : undefined}>
      <div className="v3-decide-head"><${Layers} size=${15} strokeWidth=${1.5} aria-hidden="true" /><strong>Astra</strong><span>This changes what R4 promised leaders.</span></div>
      <div className="v3-cmp"><div><span>PRD says</span><b>Every 15 minutes</b></div><div><span>API does</span><b>Every 60 minutes</b></div></div>
      ${heldNow && guard && html`<p className="v3-guard">The spec would run hourly while the PRD still promises leaders every 15 minutes. Nobody who agreed to R4 would know.</p>`}
      ${heldNow && html`<div className="v3-foot">
        <span className="grow" />
        ${guard
          ? html`<button className="v3-btn" onClick=${() => setGuard(false)}>Back</button>`
          : html`<button className="v3-btn" onClick=${() => setGuard(true)}>Only fix the spec</button>`}
        <button className="v3-btn blue" onClick=${openNote}>Review R4</button>
      </div>`}
    </section>`}
    ${runningSpec && html`<div className="cx-working"><span className="spinner" /> Running the spec… <span className="cx-hint">click or press Space to skip</span></div>`}

    ${past && html`<${Step}>Astra · proposal sent to Dana · T3 and T4 held<//>`}

    ${past2('moreEvidence') && (s === 'moreEvidence' || state.danaAsk) &&
    html`<${Fragment}>
      <${Divider}>${TIMES.moreEvidence}<//>
      <${Notice} tour="notice-ask" isNew handled=${s !== 'moreEvidence'} onView=${openNote}>Dana asked for more evidence on R4<//>
    <//>`}

    ${afterEvidence && html`<${Step}>Astra · changelog L58–60 added as evidence · resent to Dana<//>`}

    ${approved && html`<${Fragment}>
      <${Divider}>${TIMES.approved}<//>
      <${Notice} isNew handled=${accepted} onView=${openNote}>Dana approved R4 in PRD v1.1. Your spec is updated to match.<//>
      <${SpecCard}
        key="reopened"
        tasks=${REOPENED}
        r4Tag="R4 v1.1"
        r4Tone="ok"
        r4New=${state.proposal.text}
        t2Fixed=${true}
        tour=${accepted ? undefined : 'spec-reopened'}
        foot=${accepted ? null : html`<span className="grow" /><button className="v3-btn" onClick=${onLater}>Not now</button><button className="v3-btn primary" onClick=${onAccept}>Accept and rerun T3, T4</button>`}
      />
    <//>`}

    ${s === 'denied' && html`<${Fragment}>
      <${Divider}>${TIMES.denied}<//>
      <${Notice} isNew onView=${openNote}>Dana kept R4 as written. T3 and T4 can run as written.<//>
    <//>`}

    ${accepted && html`<div className="cx-prompt v3-gap"><div>Accept and rerun T3, T4.</div></div>`}
    ${approved && running && state.rerun === 1 && html`<div className="cx-working"><span className="spinner" /> Running T3…</div>`}
    ${approved && ((state.rerun === 1 && !running) || t3Done) && reviewT3(!t3Done)}
    ${approved && running && state.rerun === 2 && html`<div className="cx-working"><span className="spinner" /> Running T4…</div>`}
    ${approved && ((state.rerun === 2 && !running) || state.codeUpdated) && reviewT4(!state.codeUpdated)}
    ${state.codeUpdated && html`<${Fragment}>
      <${SpecCard} key="final" tasks=${ALL_DONE} r4Tag="R4 v1.1" r4Tone="ok" r4Text=${state.proposal.text} t2Fixed=${true} />
      <div className="cx-done"><${Check} size=${14} strokeWidth=${2} aria-hidden="true" />In sync with PRD v1.1 · T3 and T4 committed</div>
    <//>`}
    <div ref=${endRef} />
  </div>`;
}

// timekeeping-api.md with drag-to-select lines and an "Add to R4 evidence" action (frame 08a).
function SpecFile({ onToast, openNote }) {
  const { state, dispatch } = useStore();
  const phone = useMedia(PHONE);
  const [sel, setSel] = useState(null); // [start, end]
  const [dragging, setDragging] = useState(false);
  const canAdd = state.stage === 'moreEvidence';
  const added = state.evidence.includes('changelog');

  const inSel = (n) => sel && n >= Math.min(...sel) && n <= Math.max(...sel);
  const lastSel = sel ? Math.max(...sel) : null;

  const addEvidence = () => {
    const [a, b] = [Math.min(...sel), Math.max(...sel)];
    if (b >= 56 && a <= 61) { // any part of the changelog is enough
      dispatch({ type: 'ADD_EVIDENCE', id: 'changelog' });
      onToast('Changelog L58–60 added to R4 evidence.');
      if (phone) setTimeout(openNote, 900); // bring the Astra sheet back up to resend
    } else if (b >= 41 && a <= 44) {
      onToast('§3.2 is already on this proposal.');
    } else {
      onToast('Select the changelog lines that answer Dana.');
    }
    setSel(null);
  };

  useEffect(() => {
    const up = () => {
      setDragging(false);
      setSel((cur) => (cur && Math.max(...cur) >= 56 && Math.min(...cur) <= 61 ? [Math.min(...cur, 58), Math.max(...cur, 60)] : cur));
    };
    const key = (e) => {
      if (sel && canAdd && (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); addEvidence(); }
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('keydown', key); };
  }, [sel, canAdd]);

  return html`<div className="transcript">
    <div className="file-card">
      <div className="file-card-head">
        <span><${FileText} size=${13} /> docs / integrations / timekeeping-api.md</span>
        <span className="muted">Owner: Timekeeping · Ravi Patel</span>
      </div>
      <div className="file-lines mono">
        ${SPEC_LINES.map(([n, text, kind]) => html`<${Fragment} key=${n}>
          <div
            className=${cx('file-line', inSel(n) && 'selected', kind === 'h' && 'heading', n === 56 && 'gap')}
            onMouseDown=${(e) => { e.preventDefault(); setSel([n, n]); setDragging(true); }}
            onMouseEnter=${() => dragging && setSel(([a]) => [a, n])}
          >
            <span className="ln">${n}</span><span>${text || ' '}</span>
          </div>
          ${n === lastSel && !dragging &&
          html`<div className="sel-toolbar">
            ${canAdd
              ? html`<button className="btn btn-primary sm" onClick=${addEvidence}><${Paperclip} size=${12} /> Add to R4 evidence ${!phone && html`<kbd>⌘⇧E</kbd>`}</button>`
              : html`<span className="muted small">${added ? 'Already on R4 evidence' : 'No open Astra request'}</span>`}
            <button className="btn btn-ghost sm" onClick=${() => onToast('Codex chat is not simulated in this prototype.')}><${MessageSquare} size=${12} /> Ask Codex</button>
          </div>`}
        <//>`)}
      </div>
    </div>
    ${canAdd && !added && html`<div className="hint">${phone ? 'Tap a changelog line to select lines 58–60, then add them to R4\'s evidence.' : 'Drag across line numbers to select lines, then add them to R4\'s evidence.'}</div>`}
    <div className="section-label"><span>Codex</span></div>
    <${Step}>Astra · proposal sent to Dana · T3 and T4 held<//>
    ${state.danaAsk && html`<${Divider}>${TIMES.moreEvidence}<//>
      <${Notice} isNew handled=${state.stage !== 'moreEvidence'} onView=${openNote}>Dana asked for more evidence on R4<//>`}
  </div>`;
}

// The conflict, facts only (frame 02): what R4 says next to what the API does.
function StatusCard({ title, tag, rows, children, tour }) {
  return html`<div className="rl-status pending" data-tour=${tour}>
    <div className="rl-status-top"><${Clock} size=${16} strokeWidth=${1.5} aria-hidden="true" /><span className="grow">${title}</span><${Tag} tone="amber">${tag}<//></div>
    <div className="rl-compare">
      ${rows.map(([label, value, meta, mono]) => html`<div key=${label} className="rl-compare-row">
        <span className="rl-compare-label">${label}</span>
        <span className="rl-compare-value">${value}</span>
        ${meta && html`<span className=${cx('rl-compare-meta', mono && 'mono')}>${meta}</span>`}
      </div>`)}
    </div>
    ${children && html`<p className="rl-status-note">${children}</p>`}
  </div>`;
}

// Every Astra panel in Codex opens with the Astra layers glyph; status lives in the body, not the icon.
function PanelHead({ title, right, onClose }) {
  return html`<div className="rl-head">
    <${Layers} size=${16} strokeWidth=${1.5} aria-hidden="true" />
    <span className="rl-head-title">${title}</span>
    ${right}
    <button className="rl-icon" aria-label="Close Astra" onClick=${onClose}><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
  </div>`;
}

function CodexPanel({ panel, setPanel, setToast, openFile, onSentClose, onResend, onFinish, onAccept }) {
  const { state, dispatch } = useStore();
  const close = () => setPanel(null);
  const [text, setText] = useState(state.proposal.text);
  const [reason, setReason] = useState(state.proposal.reason);
  const [reply, setReply] = useState('');
  const [people, setPeople] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [linkedPeople, setLinkedPeople] = useState(['dana', 'priya', 'kim', 'jordan']);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [more, setMore] = useState(false);
  const peopleMatches = Object.entries(PEOPLE).filter(([, person]) => person.name.toLowerCase().includes(peopleQuery.toLowerCase()));

  if (panel === 'check') {
    return html`<div className="sp">
      <div className="rl-head">
        <${Layers} size=${16} strokeWidth=${1.5} aria-hidden="true" />
        <span className="rl-head-title">R4 may not match the API</span>
        <span className="rl-chip-blue"><${Link2} size=${13} strokeWidth=${1.5} aria-hidden="true" />via MCP</span>
        <button className="rl-icon" aria-label="Close Astra" onClick=${close}><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
      </div>
      <div className="rl-body">
        <${StatusCard} tour="check-compare" title="Refresh interval" tag="Unresolved" rows=${[
          ['PRD says', html`Every <b>15</b> minutes`, 'R4, v1'],
          ['API does', html`Every <b>60</b> minutes`, 'PT1H', true],
        ]}>Polling every 15 minutes returns the same data 3 out of 4 times.<//>
        <section className="rl-card" data-tour="check-status"><div className="rl-label-row"><span className="rl-label">Status of R4</span><${StatusChip} status="assumed" /></div>
        <p className="rl-text">Set at kickoff on Oct 1. Approved in v1 without anyone checking it against the timekeeping API.</p></section>
        <section className="rl-card">
        <div className="rl-label">Why R4 exists</div>
        <div className="why-card">
          <p className="why-quote">“${R4_INTENT.quote}”</p>
          <div className="muted">${R4_INTENT.speaker} · ${R4_INTENT.source}</div>
          <div className="why-goal">Intent: ${R4_INTENT.goal}</div>
        </div>
        </section>
        <section className="rl-card">
        <div className="rl-label-row"><span className="rl-label">Linked to R4</span>
          <span className="rl-avatars" title=${linkedPeople.map((id) => PEOPLE[id].name).join(', ')}>
            ${linkedPeople.map((id) => html`<${Avatar} key=${id} id=${id} size=${22} />`)}
          </span>
          <button className="rl-icon round" aria-label="Add or suggest people" aria-expanded=${people} onClick=${() => setPeople(!people)}><${Plus} size=${12} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>
        <div className=${cx('rl-linked-work', people && 'with-search')}>
          ${people && html`<div className="rl-people-search">
            <input
              className="field"
              type="search"
              placeholder="Enter Name"
              aria-label="Search people to link"
              value=${peopleQuery}
              onInput=${(e) => setPeopleQuery(e.currentTarget.value)}
            />
            ${peopleQuery && html`<div className="rl-people-results">
              ${peopleMatches.length
                ? peopleMatches.map(([id, person]) => html`<button key=${id} className="rl-person-result" disabled=${linkedPeople.includes(id)} onClick=${() => {
                    setLinkedPeople((current) => current.includes(id) ? current : [...current, id]);
                    setPeopleQuery('');
                  }}>
                    <${Avatar} id=${id} size=${22} /><span>${person.name}</span><span className="muted tiny">${linkedPeople.includes(id) ? 'Linked' : person.role || person.title}</span>
                  </button>`)
                : html`<div className="rl-note">No people found.</div>`}
            </div>`}
          </div>`}
          <div className="chips"><span className="chip static">Jira LAB-15</span><span className="chip static">Figma · Overview</span><span className="chip static">Success metric</span></div>
        </div>
        </section>
        <section className="rl-card">
        <div className="rl-label">Evidence · where this comes from</div>
        <div className="chips"><${EvidenceChip} id="api" /><${EvidenceChip} id="spec" /></div>
        <div className="rl-hint"><${Scan} size=${15} strokeWidth=${1.5} aria-hidden="true" />Select code or text to add more evidence</div>
        </section>
      </div>
      <div className="rl-foot">
        <p className="rl-disclaimer">AI can make mistakes. Check the evidence.</p>
        <div className="rl-actions">
          <div className="export-wrap rl-more">
            <button className="btn btn-soft" onClick=${() => { close(); setToast('Note dismissed. R4 stays as written; reopen it from the Astra pill.'); }}>Deny</button>
            <button className="icon-btn btn-square" aria-haspopup="menu" aria-expanded=${more} aria-label="More actions" title="More actions" onClick=${() => setMore(!more)}><${MoreHorizontal} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
            ${more && html`<div className="menu up" role="menu">
              <button role="menuitem" className="menu-item" onClick=${close}><strong><${Bookmark} size=${14} strokeWidth=${1.5} aria-hidden="true" /> Save for later</strong><span className="muted tiny">Closes the note. Reopen it from the Astra pill.</span></button>
            </div>`}
          </div>
          <span className="grow" />
          <button className="btn btn-primary" onClick=${() => setPanel('propose')}>Propose change</button>
        </div>
      </div>
    </div>`;
  }

  if (panel === 'propose') {
    return html`<div className="sp" data-tour="propose">
      <${PanelHead} title="Propose a change to R4" onClose=${close} />
      <div className="sp-body">
        <${SectionLabel}>Proposed text<//>
        <textarea className="field" rows="3" value=${text} onInput=${(e) => setText(e.target.value)} />
        <${SectionLabel}>Reason · required<//>
        <textarea className="field" rows="4" value=${reason} onInput=${(e) => setReason(e.target.value)} />
        <div className="muted small">Drafted by Codex. Review before sending.</div>
        <${SectionLabel}>Evidence<//>
        <div className="chips"><${EvidenceChip} id="spec" /><${EvidenceChip} id="api" /></div>
        <div className="muted small">Hover a chip to preview its source lines.</div>
        <button className="submit-summary" aria-expanded=${submitOpen} onClick=${() => setSubmitOpen(!submitOpen)}>
          <span className="section-label">When you submit</span>
          <span className="submit-line muted small">${submitOpen ? 'Hide details' : 'Dana decides · asks Priya and Kim · PRD unchanged until approved'}</span>
          <${ChevronDown} size=${14} strokeWidth=${1.5} className=${cx('submit-chev', submitOpen && 'open')} aria-hidden="true" />
        </button>
        ${submitOpen && html`
          <div className="kv"><span className="muted">Decides</span><span>Dana Ortiz · Product manager</span></div>
          <div className="kv"><span className="muted">Stance from</span><span>Priya · Kim</span></div>
          <div className="kv"><span className="muted">Slices notified</span><span>Developer · Design · Business</span></div>
          <div className="kv"><span className="muted">PRD</span><span>Unchanged until approved</span></div>`}
      </div>
      <div className="sp-foot">
        <button className="btn btn-ghost" onClick=${() => setPanel('check')}>Back</button>
        <span className="grow" />
        <button className="btn btn-primary" disabled=${!reason.trim() || !text.trim()} onClick=${() => { dispatch({ type: 'PROPOSE', text: text.trim(), reason: reason.trim() }); setPanel('sent'); }}>Submit to Dana</button>
      </div>
    </div>`;
  }

  if (panel === 'sent') {
    const stances = [state.priya.stance, state.kim.stance].filter(Boolean).length;
    const resent = state.stage === 'resent';
    return html`<div className="sp">
      <${PanelHead} title=${resent ? 'Evidence resent to Dana' : 'Proposal sent to Dana'} onClose=${onSentClose} />
      <div className="sp-body">
        <div className="rl-status pending" data-tour="sent-status">
          <div className="rl-status-top"><${Clock} size=${16} strokeWidth=${1.5} aria-hidden="true" /><span className="grow">Waiting on Dana</span><${Tag} tone="amber">Pending<//></div>
          <div className="steps">
            <span className="step"><${Check} size=${13} strokeWidth=${2} aria-hidden="true" />Sent ${resent ? TIMES.resent : TIMES.proposed}</span><span className="step-line" />
            <span className="step">Stances ${stances}/2</span><span className="step-line" />
            <span className="step muted">Dana decides</span>
          </div>
        </div>
        <${SectionLabel}>Proposed<//>
        <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />
        <${SectionLabel}>Slices notified<//>
        <div className="chips"><span className="chip static">Developer</span><span className="chip static">Design</span><span className="chip static">Business</span></div>
        <div className="muted small">R4 shows as Pending in these slices.</div>
        <${SectionLabel}>Stance requested<//>
        <${StanceRow} id="priya" what="owns Figma Overview" stance=${state.priya.stance} />
        <${StanceRow} id="kim" what="owns the success metric" stance=${state.kim.stance} />
        <div className="info-row"><${Pause} size=${14} strokeWidth=${0} fill="currentColor" aria-hidden="true" /> T3 and T4 are held until Dana decides. T1 and T2 are committed.</div>
      </div>
      <div className="sp-foot"><span className="grow" /><button className="btn" onClick=${onSentClose}>Close</button></div>
    </div>`;
  }

  if (panel === 'evidence') {
    const added = state.evidence.includes('changelog');
    const canSend = state.stage === 'moreEvidence' && (added || reply.trim());
    return html`<div className="sp">
      <${PanelHead} title="More evidence for R4" onClose=${close} />
      <div className="sp-body">
        <div className=${cx('rl-status', !added && 'pending')}>
          <div className="person-row"><${Avatar} id="dana" size=${26} /><div className="grow"><div className="strong-500">Dana Ortiz asked for more evidence</div><div className="small muted">Product manager · ${TIMES.moreEvidence}</div></div>${!added && html`<${Tag} tone="amber">Open<//>`}</div>
          <p className="rl-status-note">${state.danaAsk}</p>
        </div>
        <${SectionLabel}>Evidence on this proposal<//>
        ${added
          ? html`<div className="ev-card added">
              <${FileText} size=${16} strokeWidth=${1.5} aria-hidden="true" />
              <div className="grow"><div className="small">${EVIDENCE.changelog.label}</div><div className="muted tiny">${EVIDENCE.changelog.meta}</div></div>
              <span className="added-note small"><${Check} size=${13} strokeWidth=${2} aria-hidden="true" /> Added</span>
            </div>`
          : html`<button className="ev-card dashed" onClick=${openFile}>
              <${Paperclip} size=${16} strokeWidth=${1.5} aria-hidden="true" />
              <div><div className="small">Open timekeeping-api.md</div><div className="muted tiny">Select lines in any file, then "Add to R4 evidence"</div></div>
            </button>`}
        <div className="ev-card"><${FileText} size=${16} strokeWidth=${1.5} aria-hidden="true" /><div><div className="small">${EVIDENCE.spec.label}</div><div className="muted tiny">${EVIDENCE.spec.meta}</div></div></div>
        <div className="ev-card"><${FileText} size=${16} strokeWidth=${1.5} aria-hidden="true" /><div><div className="small">Sandbox API response</div><div className="muted tiny">${EVIDENCE.api.meta}</div></div></div>
        <${SectionLabel}>Reply to Dana (optional)<//>
        <textarea className="field" rows="3" placeholder="Add a note for Dana…" value=${reply} onInput=${(e) => setReply(e.target.value)} />
        ${added && html`<button className=${cx('link small', reply && 'hidden')} onClick=${() => setReply(TEXT.marcusReply)}>Use suggested reply</button>`}
      </div>
      <div className="sp-foot">
        <button className="btn btn-ghost" onClick=${close}>Back</button>
        <span className="grow" />
        <button className="btn btn-primary" disabled=${!canSend} onClick=${() => onResend(reply.trim())}>Resend to Dana</button>
      </div>
    </div>`;
  }

  if (panel === 'changed') {
    const u = state.updates;
    return html`<div className="sp" data-tour="changed">
      <${PanelHead} title="R4 changed · PRD v1.1" right=${html`<${Tag} tone="green">Approved<//>`} onClose=${close} />
      <div className="sp-body">
        <div className="person-row"><${Avatar} id="dana" size=${26} /><div className="grow"><div className="strong-500">Dana approved your proposal</div><div className="small muted">Product manager · ${TIMES.approved}</div></div></div>
        <${SectionLabel}>R4 now says<//>
        <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} labels=${['Was', 'Now']} />
        <${SectionLabel}>Also updated on approval<//>
        <div className="check-row"><${Check} size=${14} strokeWidth=${2} className="green" aria-hidden="true" /> Your agent spec · T3 and T4 reopened</div>
        ${[
          [u.jira, 'Jira LAB-15 description'],
          [u.figma, 'Comment on Figma · Overview (Priya)'],
          [u.teams, 'Post in Teams #line-labor'],
          [u.metric, 'Note on Success metrics'],
        ].filter(([on]) => on).map(([, label]) => html`<div key=${label} className="check-row"><${Check} size=${14} strokeWidth=${2} className="green" aria-hidden="true" /> ${label}</div>`)}
      </div>
      <div className="sp-foot">
        ${state.codeUpdated
          ? html`<span className="green small grow"><${Check} size=${14} strokeWidth=${2} aria-hidden="true" /> In sync with v1.1</span><button className="btn" onClick=${close}>Close</button>`
          : state.rerun > 0
            ? html`<span className="grow" /><button className="btn" onClick=${close}>Close</button>`
            : html`<button className="btn btn-ghost" onClick=${() => onFinish(false)}>Not now</button>
              <span className="grow" />
              <button className="btn btn-primary" onClick=${onAccept}>Accept and rerun T3, T4</button>`}
      </div>
    </div>`;
  }

  if (panel === 'denied') {
    return html`<div className="sp">
      <${PanelHead} title="R4 unchanged" onClose=${close} />
      <div className="sp-body">
        <div className="person-row"><${Avatar} id="dana" size=${26} /><div className="grow"><div className="strong-500">Dana kept R4 as written</div><div className="small muted">Product manager · ${TIMES.denied}</div></div></div>
        <${SectionLabel}>R4 says<//>
        <div className="small">${TEXT.r4Old}</div>
        <div className="muted small">T3 and T4 can run as written. Polling every 15 minutes will return repeat data 3 out of 4 times.</div>
      </div>
      <div className="sp-foot"><span className="grow" /><button className="btn" onClick=${close}>Close</button></div>
    </div>`;
  }
  return null;
}

function StanceRow({ id, what, stance }) {
  return html`<div className="stance-row">
    <${Avatar} id=${id} size=${24} />
    <span className="small"><span className="strong-500">${id === 'priya' ? 'Priya Shah' : 'Kim Alvarez'}</span> <span className="muted">${what}</span></span>
    <span className="grow" />
    ${stance ? html`<${Tag} tone=${stance === 'agreed' ? 'green' : 'neutral'}>${stance === 'agreed' ? 'Agreed' : 'Disagreed'}<//>` : html`<${Tag}>No reply yet<//>`}
  </div>`;
}
