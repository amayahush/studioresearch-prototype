import { html, useState, useEffect, useRef, cx, Fragment } from './lib.js';
import { useStore, TEXT, EVIDENCE, TIMES, prdVersion } from './store.js';
import { Avatar, Tag, SectionLabel, Diff, EvidenceChip, Toast } from './ui.js';
import { TimeSkip, EndCard } from './Interstitials.js';
import {
  FileText, FileCode, Code as Code2, GitBranch, X, PanelLeft, GitPullRequestArrow, CheckCircle2, MessageSquare, Paperclip,
  AlertTriangle, Plus, Check, Clock, Layers, FolderClosed, House, Box, BookOpen, AtSign, Ellipsis, Bell, Search,
  SquarePen, Mic, ArrowUp, Copy, Link2, Scan,
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
  const [threadsOpen, setThreadsOpen] = useState(true);
  const [file, setFile] = useState(null); // null = agent transcript, 'spec' = timekeeping-api.md
  const [toast, setToast] = useState('');
  const [streamDone, setStreamDone] = useState(state.codexStreamed || state.stage !== 'flagged');
  const [skip, setSkip] = useState(null); // time skip shown over the shell
  const [endCard, setEndCard] = useState(false);

  const openNote = () => streamDone && setPanel(PANEL_FOR_STAGE[state.stage]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'p' || e.key === 'π')) { e.preventDefault(); openNote(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.stage, streamDone]);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const pendingBranch = ['proposed', 'moreEvidence', 'resent'].includes(state.stage);
  const status = {
    flagged: '1 note',
    proposed: 'proposal sent',
    moreEvidence: 'Dana replied',
    resent: 'resent to Dana',
    approved: state.codeUpdated ? 'in sync with v1.1' : 'R4 changed',
    denied: 'R4 unchanged',
  }[state.stage];
  const endSteps = [
    { time: TIMES.flagged, who: 'Codex', text: 'flagged that R4 may not match the API' },
    { time: TIMES.proposed, who: 'You', text: 'proposed hourly refresh, with evidence' },
    { time: TIMES.priya, who: 'Priya', text: state.priya.stance === 'disagreed' ? 'disagreed' : 'agreed and will relabel the Overview' },
    { time: TIMES.moreEvidence, who: 'Dana', text: 'asked for more evidence' },
    { time: TIMES.resent, who: 'You', text: 'added changelog lines 58–60 and resent' },
    { time: TIMES.approved, who: 'Dana', text: 'approved R4 · PRD v1.1 updated Jira, Figma and Teams' },
    state.codeUpdated
      ? { time: '2:24 PM', who: 'You', text: 'updated the refresh job to match v1.1' }
      : { time: 'Next', who: 'You', text: 'still need to update the refresh job to match v1.1', pending: true },
  ];

  const needsYou = streamDone && (state.stage === 'flagged' || state.stage === 'moreEvidence' || (state.stage === 'approved' && !state.codeUpdated));
  const notSimulated = () => setToast('Not simulated in this prototype.');

  return html`<div className="codex">
    <header className="cx-titlebar">
      <span className="cx-lights" aria-hidden="true"><span /><span /><span /></span>
      <button className="cx-icon" aria-label=${threadsOpen ? 'Hide sidebar' : 'Show sidebar'} aria-expanded=${threadsOpen} title=${threadsOpen ? 'Hide sidebar' : 'Show sidebar'} onClick=${() => setThreadsOpen(!threadsOpen)}><${PanelLeft} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>
      <span className=${cx('cx-title-gap', threadsOpen && 'open')} />
      <span className="cx-thread-title"><${FolderClosed} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span>Implement LAB-15 refresh job</span></span>
      <span className="cx-branch"><${GitBranch} size=${13} strokeWidth=${1.5} aria-hidden="true" />lab-15-refresh${pendingBranch ? ' · pending-R4' : ''}</span>
      <button className=${cx('cx-relay-pill', needsYou && 'attn')} onClick=${openNote} disabled=${!streamDone}><${Layers} size=${13} strokeWidth=${1.5} aria-hidden="true" />Relay · ${streamDone ? status : 'checking PRD'}</button>
    </header>

    <div className="cx-body">
      <nav className="cx-rail" aria-label="Codex">
        ${[[House, 'Home', true], [Box, 'Projects'], [Clock, 'History'], [BookOpen, 'Docs'], [AtSign, 'Mentions'], [Ellipsis, 'More'], [GitBranch, 'Branches']].map(([Icon, label, on]) =>
          html`<button key=${label} className=${cx('cx-rail-btn', on && 'on')} aria-label=${label} title=${label} onClick=${on ? undefined : notSimulated}><${Icon} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>`)}
        <span className="grow" />
        <${Avatar} id="marcus" size=${24} />
      </nav>

      ${threadsOpen && html`<nav className="cx-threads" aria-label="Threads">
        <div className="cx-threads-head">
          <span>Codex</span>
          <button className="cx-icon" aria-label="Notifications" onClick=${notSimulated}><${Bell} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
          <button className="cx-icon" aria-label="Search threads" onClick=${notSimulated}><${Search} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>
        <button className="cx-thread" onClick=${notSimulated}><${SquarePen} size=${14} strokeWidth=${1.5} aria-hidden="true" />New chat</button>
        <div className="cx-threads-label">Projects</div>
        <button className="cx-thread" onClick=${notSimulated}><${FolderClosed} size=${14} strokeWidth=${1.5} className="cx-folder" aria-hidden="true" />labor-dashboard</button>
        <button className="cx-thread sub active" aria-current="page" onClick=${() => setFile(null)}><span>Implement LAB-15 refresh job</span></button>
        <button className="cx-thread sub" onClick=${notSimulated}><span>Fix shift filter query</span></button>
        <div className="cx-threads-label">Recents</div>
        <button className="cx-thread" onClick=${notSimulated}><span>Review !205 department totals</span></button>
        <button className="cx-thread" onClick=${notSimulated}><span>Explain timekeeping client</span></button>
        <button className="cx-thread" onClick=${notSimulated}><span>Write tests for LAB-13</span><span className="cx-unread" aria-label="Unread" /></button>
      </nav>`}

      <main className="cx-main">
        ${file === 'spec' && html`<div className="cx-filebar">
          <${FileText} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span>timekeeping-api.md</span>
          <span className="grow" />
          <button className="cx-icon" aria-label="Close file, back to thread" title="Back to thread" onClick=${() => setFile(null)}><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>`}
        <div className="cx-scroll">
          ${file === 'spec'
            ? html`<${SpecFile} onToast=${setToast} openNote=${openNote} />`
            : html`<${Transcript} panel=${panel} openNote=${openNote} openFile=${() => setFile('spec')} streamDone=${streamDone} onStreamDone=${() => { setStreamDone(true); dispatch({ type: 'CODEX_STREAMED' }); }} />`}
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

      ${panel &&
      html`<aside className=${cx('side-panel', panel === 'check' && 'rl')} aria-label="Relay">
        <${CodexPanel} panel=${panel} setPanel=${setPanel} setToast=${setToast} openFile=${() => setFile('spec')} onSentClose=${afterSent} onResend=${resend} onFinish=${finish} />
      </aside>`}
    </div>
    ${skip && html`<${TimeSkip} ...${skip} onDone=${() => { skip.onDone(); setSkip(null); }} />`}
    ${endCard && html`<${EndCard}
      role="Engineer"
      title=${state.codeUpdated ? 'Your code and the PRD agree again.' : 'R4 changed. Your code is next.'}
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

function Notice({ isNew, handled, children, onView }) {
  return html`<div className=${cx('cx-notice', isNew && !handled && 'new', handled && 'handled')}>
    <${Layers} size=${14} strokeWidth=${1.5} aria-hidden="true" />
    <span className="cx-notice-text"><strong>Relay</strong> <span>${children}</span></span>
    ${handled ? html`<span className="cx-notice-done">Handled</span>` : html`<button className="cx-notice-open" onClick=${onView}>Open in panel</button>`}
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

// Pause before each opening block appears; the sandbox call waits longer, like a network request.
const STREAM_DELAYS = [300, 450, 350, 350, 900, 550, 650, 450, 550, 500, 450];

function Transcript({ panel, openNote, openFile, streamDone, onStreamDone }) {
  const { state } = useStore();
  const s = state.stage;
  const [shown, setShown] = useState(streamDone ? STREAM_DELAYS.length : 0);
  const endRef = useRef(null);
  const streaming = shown < STREAM_DELAYS.length;
  const highlightJson = panel === 'check' || panel === 'propose' || s !== 'flagged';
  const past = (stage) => ['flagged', 'proposed', 'moreEvidence', 'resent', 'approved', 'denied'].indexOf(s) >= ['flagged', 'proposed', 'moreEvidence', 'resent', 'approved', 'denied'].indexOf(stage);
  const afterEvidence = ['resent', 'approved'].includes(s) || (s === 'denied' && state.marcusReply);
  const skipStream = () => streaming && setShown(STREAM_DELAYS.length);

  useEffect(() => {
    if (!streaming) { if (!streamDone) onStreamDone(); return; }
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setShown(reduce ? STREAM_DELAYS.length : shown + 1), STREAM_DELAYS[shown]);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => {
    if (!streaming) return;
    const onKey = (e) => {
      if (e.key === ' ' && !/INPUT|TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); skipStream(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [streaming]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [shown, s, state.codeUpdated]);

  const blocks = [
    html`<div className="cx-prompt"><div>Implement LAB-15: refresh labor hours from the timekeeping API every 15 minutes. Follow PRD R4.</div></div>`,
    html`<${Step}>Reading PRD context · Line Labor Dashboard v1 · R4, Data and constraints<//>`,
    html`<${Step}>Read <button className="cx-file-link" onClick=${(e) => { e.stopPropagation(); openFile(); }}>docs/integrations/timekeeping-api.md</button><//>`,
    html`<${Step}>Read src/jobs/index.ts<//>`,
    html`<${Step}>Called sandbox GET /v2/labor/hours?plant=EVR&shift=2<//>`,
    html`<${Code} title="JSON · sandbox response" lines=${[
      ['{'],
      ['  "plant": "EVR", "shift": 2,'],
      ['  "departments": 14,'],
      ['  "last_sync": "2026-10-08T13:00:00",'],
      ['  "sync_interval": "PT1H",', highlightJson && 'hl'],
      ['  "next_sync": "2026-10-08T14:00:00"'],
      ['}'],
    ]} />`,
    html`<${Notice} handled=${s !== 'flagged'} onView=${openNote}>R4 may not match the API.<//>`,
    html`<${Step}>Writing src/jobs/refreshLaborHours.ts<//>`,
    html`<${Code} title="src/jobs/refreshLaborHours.ts" meta=${html`<span className="green">+5</span>`} lines=${[
      [html`+ export const schedule = <span className="tk-str">'*/15 * * * *'</span>  <span className="muted">// PRD R4 as written</span>`, 'green'],
      ['+ export async function refreshLaborHours() {', 'green'],
      ["+   const res = await timekeeping.get('/v2/labor/hours', { plant, shift })", 'green'],
      ['+   await store.upsertDepartmentTotals(res.departments)', 'green'],
      ['+ }', 'green'],
    ]} />`,
    html`<${Step}>Writing tests (3)<//>`,
    html`<div className="cx-done"><${Check} size=${14} strokeWidth=${2} aria-hidden="true" />Draft ready · 2 files changed · not committed</div>`,
  ];

  return html`<div className="transcript" onClick=${skipStream}>
    ${blocks.slice(0, shown).map((b, i) => html`<div key=${i} className=${cx('stream-block', !streamDone && 'enter')}>${b}</div>`)}
    ${streaming && html`<div className="cx-working"><span className="spinner" /> Working… <span className="cx-hint">click or press Space to skip</span></div>`}

    ${!streaming && past('proposed') && html`<${Step}>Relay · proposal sent to Dana · branch tagged pending-R4<//>`}

    ${past('moreEvidence') && (s === 'moreEvidence' || state.danaAsk) &&
    html`<${Fragment}>
      <${Divider}>${TIMES.moreEvidence}<//>
      <${Notice} isNew handled=${s !== 'moreEvidence'} onView=${openNote}>Dana asked for more evidence on R4<//>
    <//>`}

    ${afterEvidence && html`<${Step}>Relay · changelog L58–60 added as evidence · resent to Dana<//>`}

    ${s === 'approved' &&
    html`<${Fragment}>
      <${Divider}>${TIMES.approved}<//>
      <${Notice} isNew handled=${state.codeUpdated} onView=${openNote}>R4 changed in PRD v1.1. Your draft doesn't match<//>
    <//>`}

    ${s === 'denied' &&
    html`<${Fragment}>
      <${Divider}>${TIMES.denied}<//>
      <${Notice} isNew onView=${openNote}>Dana kept R4 as written. Your draft follows the PRD<//>
    <//>`}

    ${state.codeUpdated &&
    html`<${Fragment}>
      <${Step}>Updating 2 files to match PRD v1.1<//>
      <${Code} title="2 files · PRD v1.1" meta=${html`<span className="green">+2</span> <span className="red">−2</span>`} lines=${[
        ['src/jobs/refreshLaborHours.ts', 'muted'],
        ["- export const schedule = '*/15 * * * *'", 'red'],
        [html`+ export const schedule = '5 * * * *'  <span className="muted">// R4 v1.1</span>`, 'green'],
        ['src/ui/Overview.tsx', 'muted'],
        ['- Updated every 15 min', 'red'],
        ['+ Last synced {lastSync} · next {nextSync}', 'green'],
      ]} />
      <div className="cx-done"><${Check} size=${14} strokeWidth=${2} aria-hidden="true" />Draft matches PRD v1.1 · 2 files changed · not committed</div>
    <//>`}
    <div ref=${endRef} />
  </div>`;
}

// timekeeping-api.md with drag-to-select lines and an "Add to R4 evidence" action (frame 08a).
function SpecFile({ onToast, openNote }) {
  const { state, dispatch } = useStore();
  const [sel, setSel] = useState(null); // [start, end]
  const [dragging, setDragging] = useState(false);
  const canAdd = state.stage === 'moreEvidence';
  const added = state.evidence.includes('changelog');

  const inSel = (n) => sel && n >= Math.min(...sel) && n <= Math.max(...sel);
  const lastSel = sel ? Math.max(...sel) : null;

  const addEvidence = () => {
    const [a, b] = [Math.min(...sel), Math.max(...sel)];
    if (b >= 58 && a <= 60) {
      dispatch({ type: 'ADD_EVIDENCE', id: 'changelog' });
      onToast('Changelog L58–60 added to R4 evidence.');
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
      setSel((cur) => (cur && Math.max(...cur) >= 58 && Math.min(...cur) <= 60 ? [Math.min(...cur, 58), Math.max(...cur, 60)] : cur));
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
              ? html`<button className="btn btn-primary sm" onClick=${addEvidence}><${Paperclip} size=${12} /> Add to R4 evidence <kbd>⌘⇧E</kbd></button>`
              : html`<span className="muted small">${added ? 'Already on R4 evidence' : 'No open Relay request'}</span>`}
            <button className="btn btn-ghost sm" onClick=${() => onToast('Codex chat is not simulated in this prototype.')}><${MessageSquare} size=${12} /> Ask Codex</button>
          </div>`}
        <//>`)}
      </div>
    </div>
    ${canAdd && !added && html`<div className="hint">Drag across line numbers to select lines, then add them to R4's evidence.</div>`}
    <div className="section-label"><span>Codex</span></div>
    <${Step}>Relay · proposal sent to Dana · branch tagged pending-R4<//>
    ${state.danaAsk && html`<${Divider}>${TIMES.moreEvidence}<//>
      <${Notice} isNew handled=${state.stage !== 'moreEvidence'} onView=${openNote}>Dana asked for more evidence on R4<//>`}
  </div>`;
}

// The conflict, facts only (frame 02): what R4 says next to what the API does.
function StatusCard({ title, tag, rows, children }) {
  return html`<div className="rl-status">
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

function PanelHead({ icon: Icon, title, right, onClose }) {
  return html`<div className="sp-head">
    <${Icon} size=${15} />
    <strong>${title}</strong>
    <span className="grow" />
    ${right}
    <button className="icon-btn sm" onClick=${onClose} title="Close"><${X} size=${14} /></button>
  </div>`;
}

function CodexPanel({ panel, setPanel, setToast, openFile, onSentClose, onResend, onFinish }) {
  const { state, dispatch } = useStore();
  const close = () => setPanel(null);
  const [text, setText] = useState(state.proposal.text);
  const [reason, setReason] = useState(state.proposal.reason);
  const [reply, setReply] = useState('');
  const [people, setPeople] = useState(false);

  if (panel === 'check') {
    return html`<div className="sp">
      <div className="rl-head">
        <${Layers} size=${16} strokeWidth=${1.5} aria-hidden="true" />
        <span className="rl-head-title">R4 may not match the API</span>
        <span className="rl-chip-blue"><${Link2} size=${13} strokeWidth=${1.5} aria-hidden="true" />via MCP</span>
        <button className="rl-icon" aria-label="Close Relay" onClick=${close}><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
      </div>
      <div className="rl-body">
        <${StatusCard} title="Refresh interval" tag="Unresolved" rows=${[
          ['PRD says', html`Every <b>15</b> minutes`, 'R4, v1'],
          ['API does', html`Every <b>60</b> minutes`, 'PT1H', true],
        ]}>Polling every 15 minutes returns the same data 3 out of 4 times. The dashboard would look live when it isn’t.<//>
        <div className="rl-divider" />
        <div className="rl-label">Where this comes from</div>
        <div className="rl-stack">
          <div className="rl-source"><${FileText} size=${16} strokeWidth=${1.5} aria-hidden="true" /><div><div className="rl-source-meta">Sandbox API response · 1:40 PM</div><div className="rl-source-quote mono">"sync_interval": "PT1H"</div></div></div>
          <div className="rl-source"><${FileText} size=${16} strokeWidth=${1.5} aria-hidden="true" /><div><div className="rl-source-meta">timekeeping-api.md §3.2 · edited Mar 2023</div><div className="rl-source-quote mono">Badge punches are batch-loaded at the top of each hour.</div></div></div>
        </div>
        <div className="rl-divider" />
        <div className="rl-label">Linked to R4</div>
        <div className="chips"><span className="chip static">Jira LAB-15</span><span className="chip static">Figma · Overview</span><span className="chip static">Success metric</span></div>
        <div className="rl-people">
          <span className="rl-avatars"><${Avatar} id="priya" size=${22} /><${Avatar} id="kim" size=${22} /><${Avatar} id="jordan" size=${22} /></span>
          <span className="grow">Priya, Kim, Jordan</span>
          <button className="rl-icon round" aria-label="Add or suggest people" aria-expanded=${people} onClick=${() => setPeople(!people)}><${Plus} size=${12} strokeWidth=${1.5} aria-hidden="true" /></button>
        </div>
        ${people && html`<div className="rl-note">Suggested: Ravi Patel (owns timekeeping-api.md). Adding people is not simulated.</div>`}
        <div className="rl-divider" />
        <div className="rl-label">Evidence · attached automatically</div>
        <div className="chips"><${EvidenceChip} id="spec" /><${EvidenceChip} id="api" /></div>
        <div className="rl-hint"><${Scan} size=${15} strokeWidth=${1.5} aria-hidden="true" />Select code or text to add more evidence</div>
      </div>
      <div className="rl-foot">
        <p className="rl-disclaimer">AI can make mistakes. Check the evidence.</p>
        <div className="rl-actions">
          <button className="pill pill-text" onClick=${close}>Save for later</button>
          <span className="grow" />
          <button className="pill pill-outline" onClick=${() => { close(); setToast('Note dismissed. R4 stays as written; reopen it from the Relay pill.'); }}>Dismiss</button>
          <button className="pill pill-primary" onClick=${() => setPanel('propose')}>Propose change</button>
        </div>
      </div>
    </div>`;
  }

  if (panel === 'propose') {
    return html`<div className="sp">
      <${PanelHead} icon=${GitPullRequestArrow} title="Relay · Propose a change to R4" onClose=${close} />
      <div className="sp-body">
        <${SectionLabel}>Proposed text<//>
        <textarea className="field" rows="3" value=${text} onInput=${(e) => setText(e.target.value)} />
        <${SectionLabel}>Reason · required<//>
        <textarea className="field" rows="5" value=${reason} onInput=${(e) => setReason(e.target.value)} />
        <div className="muted small">Drafted by Codex. Review before sending.</div>
        <${SectionLabel}>Evidence<//>
        <div className="chips"><${EvidenceChip} id="spec" /><${EvidenceChip} id="api" /></div>
        <div className="muted small">Hover a chip to preview its source lines.</div>
        <${SectionLabel}>When you submit<//>
        <div className="kv"><span className="muted">Slices notified</span><span><${Tag} tone="amber">Developer<//> <${Tag} tone="amber">Design<//> <${Tag} tone="amber">Business<//></span></div>
        <div className="kv"><span className="muted">Stance from</span><span>Priya · Kim</span></div>
        <div className="kv"><span className="muted">PRD</span><span className="amber">Unchanged until approved</span></div>
      </div>
      <div className="sp-foot">
        <button className="btn" onClick=${() => setPanel('check')}>Back</button>
        <button className="btn btn-primary" disabled=${!reason.trim() || !text.trim()} onClick=${() => { dispatch({ type: 'PROPOSE', text: text.trim(), reason: reason.trim() }); setPanel('sent'); }}>Submit to Dana</button>
      </div>
    </div>`;
  }

  if (panel === 'sent') {
    const stances = [state.priya.stance, state.kim.stance].filter(Boolean).length;
    const resent = state.stage === 'resent';
    return html`<div className="sp">
      <${PanelHead} icon=${CheckCircle2} title="Relay · Sent" onClose=${onSentClose} />
      <div className="sp-body">
        <div className="success-card">
          <div className="success-title"><${CheckCircle2} size=${16} /> ${resent ? 'Evidence resent to Dana' : 'Proposal sent to Dana'} <span className="grow" /><span className="muted small">${resent ? TIMES.resent : TIMES.proposed}</span></div>
          <div className="steps">
            <${Tag} tone="green"><${Check} size=${11} /> Sent<//><span className="step-line" />
            <${Tag} tone=${stances === 2 ? 'green' : 'amber'}>Stances ${stances}/2<//><span className="step-line" />
            <span className="muted small">Dana decides</span>
          </div>
        </div>
        <${SectionLabel}>Proposed<//>
        <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />
        <${SectionLabel}>Slices notified<//>
        <div className="chips"><${Tag} tone="amber">Developer<//><${Tag} tone="amber">Design<//><${Tag} tone="amber">Business<//></div>
        <div className="muted small">R4 shows as Pending in these slices.</div>
        <${SectionLabel}>Stance requested<//>
        <${StanceRow} id="priya" what="owns Figma Overview" stance=${state.priya.stance} />
        <${StanceRow} id="kim" what="owns the success metric" stance=${state.kim.stance} />
        <div className="info-row"><${GitBranch} size=${13} /> Branch tagged pending-R4. Keep working.</div>
      </div>
      <div className="sp-foot"><button className="btn" onClick=${onSentClose}>Back to code</button></div>
    </div>`;
  }

  if (panel === 'evidence') {
    const added = state.evidence.includes('changelog');
    const canSend = state.stage === 'moreEvidence' && (added || reply.trim());
    return html`<div className="sp">
      <${PanelHead} icon=${MessageSquare} title="Relay · More evidence for R4" onClose=${close} />
      <div className="sp-body">
        <div className="ask-card">
          <div className="ask-head"><${Avatar} id="dana" size=${20} /><strong>Dana Ortiz · ${TIMES.moreEvidence} · requested more evidence</strong></div>
          <p>${state.danaAsk}</p>
        </div>
        <${SectionLabel}>Evidence on this proposal<//>
        ${added
          ? html`<div className="ev-card added">
              <div><div className="green small strong">${EVIDENCE.changelog.label}</div><div className="muted tiny">${EVIDENCE.changelog.meta}</div></div>
              <span className="green small">Added</span>
            </div>`
          : html`<button className="ev-card dashed" onClick=${openFile}>
              <${Paperclip} size=${14} />
              <div><div className="small">Open timekeeping-api.md</div><div className="muted tiny">Select lines in any file, then "Add to R4 evidence"</div></div>
            </button>`}
        <div className="ev-card"><${FileText} size=${14} /><div><div className="small">${EVIDENCE.spec.label}</div><div className="muted tiny">${EVIDENCE.spec.meta}</div></div></div>
        <div className="ev-card"><${FileText} size=${14} /><div><div className="small">Sandbox API response</div><div className="muted tiny">${EVIDENCE.api.meta}</div></div></div>
        <${SectionLabel}>Reply to Dana (optional)<//>
        <textarea className="field" rows="3" placeholder="Add a note for Dana…" value=${reply} onInput=${(e) => setReply(e.target.value)} />
        ${added && html`<button className=${cx('link small', reply && 'hidden')} onClick=${() => setReply(TEXT.marcusReply)}>Use suggested reply</button>`}
      </div>
      <div className="sp-foot">
        <button className="btn" onClick=${close}>Back</button>
        <button className="btn btn-primary" disabled=${!canSend} onClick=${() => onResend(reply.trim())}>Resend to Dana</button>
      </div>
    </div>`;
  }

  if (panel === 'changed') {
    const u = state.updates;
    return html`<div className="sp">
      <${PanelHead} icon=${CheckCircle2} title="Relay · R4 changed · PRD v1.1" onClose=${close} />
      <div className="sp-body">
        <div className="ask-head"><${Avatar} id="dana" size=${20} /><strong>Dana approved your proposal</strong> <span className="muted small">${TIMES.approved}</span></div>
        <${SectionLabel}>R4 now says<//>
        <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />
        <${SectionLabel}>Also updated on approval<//>
        ${[
          [u.jira, 'Jira LAB-15 description'],
          [u.figma, 'Comment on Figma · Overview (Priya)'],
          [u.teams, 'Post in Teams #line-labor'],
          [u.metric, 'Note on Success metrics'],
        ].filter(([on]) => on).map(([, label]) => html`<div key=${label} className="check-row"><${Check} size=${13} className="green" /> ${label}</div>`)}
        <${SectionLabel}>Preview · what "Update the code" changes<//>
        <div className="diff-file">
          <div className="diff-file-head mono"><${FileCode} size=${12} /> src/jobs/refreshLaborHours.ts</div>
          <div className="mono diff-del">- schedule = '*/15 * * * *'</div>
          <div className="mono diff-add">+ schedule = '5 * * * *' // R4 v1.1</div>
        </div>
        <div className="diff-file">
          <div className="diff-file-head mono"><${FileCode} size=${12} /> src/ui/Overview.tsx</div>
          <div className="mono diff-del">- Updated every 15 min</div>
          <div className="mono diff-add">+ Last synced {lastSync} · next {nextSync}</div>
        </div>
        <div className="muted small">Matches Priya's new label. Nothing is committed until you review the diff.</div>
      </div>
      <div className="sp-foot">
        ${state.codeUpdated
          ? html`<span className="green small grow"><${Check} size=${13} /> Code matches v1.1</span><button className="btn" onClick=${close}>Back to code</button>`
          : html`<button className="btn" onClick=${() => onFinish(false)}>Not now</button>
              <button className="btn btn-primary" onClick=${() => onFinish(true)}>Update the code to match</button>`}
      </div>
    </div>`;
  }

  if (panel === 'denied') {
    return html`<div className="sp">
      <${PanelHead} icon=${X} title="Relay · R4 unchanged" onClose=${close} />
      <div className="sp-body">
        <div className="ask-head"><${Avatar} id="dana" size=${20} /><strong>Dana kept R4 as written</strong> <span className="muted small">${TIMES.denied}</span></div>
        <${SectionLabel}>R4 says<//>
        <div className="small">${TEXT.r4Old}</div>
        <div className="muted small">Your draft polls every 15 minutes, as written. The branch is no longer tagged pending-R4.</div>
      </div>
      <div className="sp-foot"><button className="btn" onClick=${close}>Back to code</button></div>
    </div>`;
  }
  return null;
}

function StanceRow({ id, what, stance }) {
  return html`<div className="stance-row">
    <${Avatar} id=${id} size=${20} />
    <span className="small">${id === 'priya' ? 'Priya Shah' : 'Kim Alvarez'} · <span className="muted">${what}</span></span>
    <span className="grow" />
    ${stance ? html`<${Tag} tone=${stance === 'agreed' ? 'green' : 'red'}>${stance === 'agreed' ? 'Agreed' : 'Disagreed'}<//>` : html`<span className="muted tiny"><${Clock} size=${11} /> Waiting</span>`}
  </div>`;
}
