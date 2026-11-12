import { html, useState, useRef, useEffect, cx, Fragment } from './lib.js';
import { useStore, isPending, specTasks, specVisible, SPEC_TASKS } from './store.js';
import { Glyph } from './Spec.js';
import { Tag } from './ui.js';
import { MousePointer2, RectangleHorizontal, Diamond, MoveUpRight, StickyNote, Plus, Minus } from 'lucide-react';

// The PRD as a board (PM only, Doc › Board). Same records as the list: epics are swimlanes,
// requirements are cards, agent spec tasks hang off them, open questions are diamonds.
// Moving cards is layout only and never changes the PRD; anything that changes what the PRD
// says goes through the same details panel and approval as the list.

const W = 1072; // board size at 100%
const H = 724;
const CARD = [196, 72];
const TASK = [208, 34];
const Q = [76, 76];

const LANES = [
  ['E1', 'LAB-E1 · Live labor visibility', 16, 236],
  ['E2', 'LAB-E2 · Filtering', 236, 436],
  ['E3', 'LAB-E3 · Alerts, history', 436, 636],
];

// Where each node sits until someone drags it. Tidy up puts everything back here.
const HOME = {
  R1: [64, 36], R4: [64, 140], R2: [640, 36], R6: [860, 140],
  R3: [64, 284], R5: [340, 284],
  R7: [640, 456], R8: [64, 506],
  T1: [300, 36], T2: [300, 78], T3: [420, 144], T4: [420, 188],
  Q4: [302, 142], Q8: [302, 504],
};

// Open questions. R4's only exists while the change is waiting on Dana.
const questions = (state) => [
  isPending(state) && { id: 'Q4', req: 'R4', text: '15 min or hourly?', tone: 'pending', note: 'after Dana decides' },
  { id: 'Q8', req: 'R8', text: 'Is 90 days enough?', tone: 'open', note: "Sam's estimate · retention policy not checked" },
].filter(Boolean);

const size = (id) => (id[0] === 'T' ? TASK : id[0] === 'Q' ? Q : CARD);

// Elbow connectors between two nodes. 'right' runs side to side, 'down' top to bottom,
// 'over' arcs above both cards (used where the side is taken by tasks).
function route(kind, a, b, pos) {
  const [ax, ay] = pos[a]; const [aw, ah] = size(a);
  const [bx, by] = pos[b]; const [bw, bh] = size(b);
  if (kind === 'down') {
    const x1 = ax + aw / 2, y1 = ay + ah, x2 = bx + bw / 2, y2 = by;
    const my = (y1 + y2) / 2;
    return { d: x1 === x2 ? `M${x1} ${y1}V${y2 - 2}` : `M${x1} ${y1}V${my}H${x2}V${y2 - 2}`, lx: x2 + 8, ly: my - 8 };
  }
  if (kind === 'over') {
    const x1 = ax + aw / 2, x2 = bx + bw / 2, top = Math.min(ay, by) - 10;
    return { d: `M${x1} ${ay}V${top}H${x2}V${by - 2}`, lx: (x1 + x2) / 2 - 40, ly: top - 8 };
  }
  const x1 = ax + aw, y1 = ay + ah / 2, x2 = bx, y2 = by + bh / 2;
  const mx = x1 + Math.max(16, Math.min(40, (x2 - x1) / 2));
  return { d: y1 === y2 ? `M${x1} ${y1}H${x2 - 2}` : `M${x1} ${y1}H${mx}V${y2}H${x2 - 2}`, lx: (x1 + x2) / 2 - 24, ly: y1 - 20 };
}

function statusTag(r) {
  if (r.status === 'pending') return html`<${Tag} tone="amber">Pending<//>`;
  if (r.status === 'draft') return html`<${Tag} tone="blue">Draft<//>`;
  return html`<${Tag} tone="green">${r.changed ? 'Changed' : 'Approved'}<//>`;
}

function cardMeta(r, tasks, showSpec) {
  const ticket = (r.links.find((l) => l.startsWith('Jira')) || '').replace('Jira ', '').split(' ·')[0];
  const own = SPEC_TASKS.filter((t) => t.req === r.id);
  const held = own.filter((t) => tasks[t.id][0] === 'held').length;
  const parts = [ticket || (r.status === 'draft' ? 'Not in Jira' : 'No ticket yet')];
  if (showSpec && own.length) parts.push(held ? `${held} tasks held` : `${own.length} tasks`);
  return parts.join(' · ');
}

export function BoardView({ reqs, selected, setSelected, onList, toast }) {
  const { state } = useStore();
  const [moved, setMoved] = useState({});
  const [zoom, setZoom] = useState(1);
  const drag = useRef(null);
  const scroller = useRef(null);
  // Open the board zoomed to fit its width, so nothing starts hidden behind the details panel.
  useEffect(() => {
    const el = scroller.current;
    if (el && el.clientWidth < W) setZoom(Math.max(0.6, Math.floor((el.clientWidth / W) * 10) / 10));
  }, []);
  const pos = { ...HOME, ...moved };
  const showSpec = specVisible(state);
  const tasks = specTasks(state);
  const has = (id) => reqs.some((r) => r.id === id);
  // Slices and filters apply here too: a task or question shows only with its requirement.
  const qs = questions(state).filter((q) => has(q.req));
  const specs = showSpec ? SPEC_TASKS.filter((t) => has(t.req)) : [];
  const present = (id) => (id[0] === 'R' ? has(id) : id[0] === 'T' ? specs.some((t) => t.id === id) : qs.some((q) => q.id === id));
  const notSimulated = (what) => () => toast(`${what} is not simulated in this prototype.`);

  const edges = [
    showSpec && ['right', 'R1', 'T1'], showSpec && ['right', 'R1', 'T2'],
    qs.some((q) => q.id === 'Q4') ? ['right', 'R4', 'Q4', null, 'pending'] : showSpec && ['right', 'R4', 'T3'],
    qs.some((q) => q.id === 'Q4') && showSpec && ['right', 'Q4', 'T3', null, 'pending-dash'],
    qs.some((q) => q.id === 'Q4') ? showSpec && ['right', 'Q4', 'T4', null, 'pending-dash'] : showSpec && ['right', 'R4', 'T4'],
    ['over', 'R1', 'R2', 'uses data from'],
    ['down', 'R2', 'R7', 'triggers'],
    has('R5') && ['right', 'R3', 'R5', 'leads to'],
    ['right', 'R8', 'Q8'],
  ].filter((e) => e && present(e[1]) && present(e[2]));

  // Drag to move a card; a press that doesn't move is a click and opens the details panel.
  const down = (id) => (e) => {
    if (e.button !== 0) return;
    drag.current = { id, x: e.clientX, y: e.clientY, start: pos[id], moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.x) / zoom, dy = (e.clientY - d.y) / zoom;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const [w, h] = size(d.id);
    setMoved((m) => ({ ...m, [d.id]: [Math.round(Math.max(48, Math.min(W - w - 8, d.start[0] + dx))), Math.round(Math.max(20, Math.min(H - h - 8, d.start[1] + dy)))] }));
  };
  // A drag ends with a click event too; swallow that one so dropping a card doesn't select it.
  const dragged = useRef(false);
  const up = () => { dragged.current = !!(drag.current && drag.current.moved); drag.current = null; };
  const handlers = (id, onClick) => ({
    onPointerDown: down(id), onPointerMove: move, onPointerUp: up, onPointerCancel: () => { drag.current = null; },
    onClick: (e) => { e.stopPropagation(); if (dragged.current) { dragged.current = false; return; } if (onClick) onClick(); },
  });

  const sel = selected && pos[selected] && reqs.some((r) => r.id === selected) ? selected : null;
  const tidy = Object.keys(moved).length > 0;

  return html`<div className="bd-wrap">
    <div className="bd-scroll" ref=${scroller} onClick=${(e) => e.target === e.currentTarget && setSelected(null)}>
      <div className="bd-size" style=${{ width: W * zoom, height: H * zoom }}>
        <div className="bd-board" style=${{ width: W, height: H, transform: `scale(${zoom})` }} onClick=${(e) => e.target === e.currentTarget && setSelected(null)}>
          <svg className="bd-wires" width=${W} height=${H} aria-hidden="true">
            <defs>
              <marker id="bd-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8Z" className="bd-head" /></marker>
              <marker id="bd-aa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 8 4 0 8Z" className="bd-head pending" /></marker>
            </defs>
            ${edges.map(([kind, a, b, , tone]) => html`<path key=${a + b} d=${route(kind, a, b, pos).d} className=${cx('bd-wire', tone && tone.startsWith('pending') && 'pending', tone === 'pending-dash' && 'dash')} markerEnd=${tone ? 'url(#bd-aa)' : 'url(#bd-ah)'} />`)}
          </svg>


          ${LANES.map(([id, label, top, bottom]) => html`<${Fragment} key=${id}>
            <div className="bd-rule" style=${{ top }} />
            <div className="bd-lane" style=${{ top: top + 1, height: bottom - top - 1 }}><span>${label}</span></div>
          <//>`)}
          <div className="bd-rule" style=${{ top: LANES[2][3] }} />

          ${edges.filter((e) => e[3]).map(([kind, a, b, label]) => { const r = route(kind, a, b, pos); return html`<span key=${`l${a}${b}`} className="bd-label" style=${{ left: r.lx, top: r.ly }}>${label}</span>`; })}
          ${qs.map((q) => html`<span key=${`n${q.id}`} className=${cx('bd-label', q.tone === 'pending' && 'pending')} style=${q.tone === 'pending' ? { left: pos[q.id][0] + 90, top: pos[q.id][1] - 18 } : { left: pos[q.id][0] + 88, top: pos[q.id][1] + 30 }}>${q.note}</span>`)}

          ${reqs.filter((r) => pos[r.id]).map((r) => html`<button
            key=${r.id}
            className=${cx('bd-card', r.status === 'pending' && 'pending', r.status === 'draft' && 'draft', sel === r.id && 'selected')}
            style=${{ left: pos[r.id][0], top: pos[r.id][1] }}
            aria-pressed=${sel === r.id}
            aria-label=${`${r.id} ${r.name}`}
            ...${handlers(r.id, () => setSelected(sel === r.id ? null : r.id))}
          >
            <span className="bd-card-name"><span className="bd-id mono">${r.id}</span>${r.name}</span>
            <span className="bd-card-meta">${statusTag(r)}${qs.some((q) => q.req === r.id && q.tone === 'open') ? html`<${Tag} tone="outline">Unverified<//>` : html`<span className="bd-meta-text">${cardMeta(r, tasks, showSpec)}</span>`}</span>
          </button>`)}

          ${specs.map((t) => html`<div key=${t.id} className="bd-task" style=${{ left: pos[t.id][0], top: pos[t.id][1] }} ...${handlers(t.id)}>
            <${Glyph} s=${tasks[t.id][0]} /><span className="bd-id mono">${t.id}</span><span className="bd-task-title">${t.title}</span>
          </div>`)}

          ${qs.map((q) => html`<div key=${q.id} className=${cx('bd-q', q.tone)} style=${{ left: pos[q.id][0], top: pos[q.id][1] }} ...${handlers(q.id)}>
            <span className="bd-q-shape" aria-hidden="true" /><span className="bd-q-text">${q.text}</span>
          </div>`)}

          ${sel && html`<div className="bd-actions" role="toolbar" aria-label=${`${sel} actions`} style=${{ left: pos[sel][0] - 6, top: pos[sel][1] + CARD[1] + 10 }}>
            <button className="bd-act" onClick=${notSimulated('Adding a task')}><${Plus} size=${13} strokeWidth=${1.8} aria-hidden="true" />Task</button>
            <button className="bd-act" onClick=${notSimulated('Connecting cards')}><${MoveUpRight} size=${13} strokeWidth=${1.8} aria-hidden="true" />Connect</button>
            <button className="bd-act" onClick=${notSimulated('Turning a requirement into a question')}><${Diamond} size=${13} strokeWidth=${1.8} aria-hidden="true" />Make a question</button>
            <button className="bd-act muted" onClick=${onList}>Open in list</button>
          </div>`}
        </div>
      </div>
    </div>

    <div className="bd-tools" role="toolbar" aria-label="Board tools">
      <button className="bd-tool on" aria-label="Select" aria-pressed="true" title="Select"><${MousePointer2} size=${15} strokeWidth=${1.6} aria-hidden="true" /></button>
      <button className="bd-tool" aria-label="Requirement card" title="Requirement card" onClick=${notSimulated('Adding a card')}><${RectangleHorizontal} size=${15} strokeWidth=${1.6} aria-hidden="true" /></button>
      <button className="bd-tool" aria-label="Question" title="Question" onClick=${notSimulated('Adding a question')}><${Diamond} size=${15} strokeWidth=${1.6} aria-hidden="true" /></button>
      <button className="bd-tool" aria-label="Connector" title="Connector" onClick=${notSimulated('Drawing a connector')}><${MoveUpRight} size=${15} strokeWidth=${1.6} aria-hidden="true" /></button>
      <button className="bd-tool" aria-label="Note" title="Note" onClick=${notSimulated('Adding a note')}><${StickyNote} size=${15} strokeWidth=${1.6} aria-hidden="true" /></button>
      <span className="bd-tools-sep" aria-hidden="true" />
      <button className="bd-act muted" disabled=${!tidy} onClick=${() => setMoved({})}>Tidy up</button>
    </div>

    <div className="bd-zoom">
      <button className="bd-tool sm" aria-label="Zoom out" disabled=${zoom <= 0.6} onClick=${() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))}><${Minus} size=${14} strokeWidth=${1.6} aria-hidden="true" /></button>
      <span className="bd-zoom-val" aria-live="polite">${Math.round(zoom * 100)}%</span>
      <button className="bd-tool sm" aria-label="Zoom in" disabled=${zoom >= 1.5} onClick=${() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}><${Plus} size=${14} strokeWidth=${1.6} aria-hidden="true" /></button>
    </div>
  </div>`;
}
