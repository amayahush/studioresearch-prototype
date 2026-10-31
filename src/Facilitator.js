import { html, useState, useEffect, cx, Fragment } from './lib.js';
import { useStore, jumpPatch, PEOPLE } from './store.js';
import { X, Download, RotateCcw, ClipboardList } from 'lucide-react';

const SCREENS = [
  ['00', 'Start · choose a role'],
  ['01', 'Marcus · Codex spots a gap'],
  ['02', 'Marcus · PRD check'],
  ['03', 'Marcus · Propose change'],
  ['04', 'Marcus · Proposal sent'],
  ['05', 'Priya · Pending in Figma'],
  ['06', 'Dana · Reviews proposal'],
  ['07', 'Dana · Requests evidence'],
  ['07b', 'Dana · Evidence updated'],
  ['08a', 'Marcus · Select changelog'],
  ['08b', 'Marcus · Evidence resent'],
  ['09', 'Marcus · R4 changed'],
  ['10', 'Rea · Map view'],
  ['11', 'Rea · Screens view'],
  ['12', 'Rea · Present view'],
];

const TASKS = {
  marcus: 'Your coding agent flagged something while building the refresh job. Check it and decide what to do.',
  priya: 'A requirement linked to one of your frames may change. Review it and respond.',
  dana: 'A teammate proposed a change to your PRD. Review it and decide.',
};

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function eventsToCsv(events) {
  const cols = ['t', 'type', 'role', 'stage', 'view', 'label', 'stance', 'id'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = events.map((e) => cols.map((c) => esc(e[c])).join(','));
  return [cols.join(','), ...rows].join('\n');
}

function applyDeepLink(dispatch) {
  try {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get('screen');
    const role = params.get('role');
    const stage = params.get('stage');
    const view = params.get('view');
    const facilitator = params.get('facilitator');

    if (screen) {
      const patch = jumpPatch(screen);
      if (patch) dispatch({ type: 'JUMP', patch, label: `deep link screen=${screen}` });
      return facilitator === '1';
    }
    if (role || stage || view) {
      const patch = {};
      if (role) patch.role = role === 'null' ? null : role;
      if (stage) patch.stage = stage;
      if (view) patch.relayView = view;
      if (role && role !== 'null') {
        const base = jumpPatch(role === 'marcus' ? '01' : role === 'priya' ? '05' : '06') || {};
        dispatch({ type: 'JUMP', patch: { ...base, ...patch }, label: 'deep link' });
      } else {
        dispatch({ type: 'JUMP', patch, label: 'deep link' });
      }
    }
    return facilitator === '1';
  } catch {
    return false;
  }
}

export function Facilitator() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    if (bootstrapped) return;
    setBootstrapped(true);
    const forceOpen = applyDeepLink(dispatch);
    if (forceOpen) setOpen(true);
  }, [bootstrapped]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const jump = (id) => {
    const patch = jumpPatch(id);
    if (!patch) return;
    dispatch({ type: 'JUMP', patch, label: id });
    setOpen(false);
  };

  const exportJson = () => {
    download(
      `relay-events-${Date.now()}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), state: { role: state.role, stage: state.stage, view: state.relayView }, events: state.events || [] }, null, 2),
      'application/json'
    );
  };
  const exportCsv = () => {
    download(`relay-events-${Date.now()}.csv`, eventsToCsv(state.events || []), 'text/csv');
  };

  return html`<${Fragment}>
    ${state.taskCard && state.role && html`<div className="task-card" role="status">
      <div className="tiny-label">Your task · ${PEOPLE[state.role]?.role}</div>
      <p>${TASKS[state.role]}</p>
    </div>`}
    ${open && html`<div className="fac-backdrop" role="dialog" aria-modal="true" aria-label="Facilitator menu">
      <div className="fac-panel">
        <div className="fac-head">
          <strong>Facilitator</strong>
          <span className="muted tiny">Shift+D · ?facilitator=1</span>
          <span className="grow" />
          <button className="icon-btn sm" onClick=${() => setOpen(false)} aria-label="Close"><${X} size=${14} /></button>
        </div>
        <div className="fac-body">
          <div className="tiny-label">Jump to screen</div>
          <div className="fac-screens">
            ${SCREENS.map(([id, label]) => html`<button key=${id} className="fac-screen" onClick=${() => jump(id)}>
              <span className="mono">${id}</span><span>${label}</span>
            </button>`)}
          </div>
          <div className="tiny-label">Session</div>
          <div className="fac-row">
            <button className=${cx('btn sm', state.taskCard && 'btn-primary')} onClick=${() => dispatch({ type: 'TOGGLE_TASK_CARD' })}>
              <${ClipboardList} size=${13} /> Task card ${state.taskCard ? 'on' : 'off'}
            </button>
            <button className="btn sm" onClick=${exportJson}><${Download} size=${13} /> Export JSON</button>
            <button className="btn sm" onClick=${exportCsv}><${Download} size=${13} /> Export CSV</button>
            <button className="btn sm" onClick=${() => dispatch({ type: 'CLEAR_EVENTS' })}>Clear events</button>
            <button className="btn sm" onClick=${() => { dispatch({ type: 'RESET' }); setOpen(false); }}><${RotateCcw} size=${13} /> Reset</button>
          </div>
          <div className="muted tiny">${(state.events || []).length} events logged · deep links: ?screen=07b · ?role=marcus&stage=proposed</div>
        </div>
      </div>
    </div>`}
  <//>`;
}
