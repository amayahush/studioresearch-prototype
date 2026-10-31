import { html, useState, useEffect, useRef, cx, Fragment } from './lib.js';
import { useStore, TEXT, TIMES, EVIDENCE, isPending, r4Text, prdVersion } from './store.js';
import { Avatar, Tag, SectionLabel } from './ui.js';
import { DEPARTMENTS, dashboardLabel } from './Figma.js';
import { X, FileText, Link2, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

/* ---------- Map (frame 10) ---------- */

// A focus map you explore by clicking. The focused item sits in the center, its direct links on a
// ring around it, and things one step further out on a faded outer ring. Lines only radiate from
// the center, so they don't tangle. Clicking any card moves the center there.

const TYPE_ORDER = ['prd', 'epic', 'req', 'jira', 'gitlab', 'figma', 'evidence', 'goal', 'people', 'cluster', 'untraced'];

const LINKS = [
  ['prd', 'E1'], ['prd', 'E2'], ['prd', 'goal'], ['prd', '!218'],
  ['E1', 'R1'], ['E1', 'R2'], ['E1', 'R4'], ['E2', 'R3'], ['E2', 'R5'],
  ['R1', 'LAB-12'], ['R1', '!205'], ['R1', 'Overview'],
  ['R2', 'LAB-13'], ['R2', 'Overview'], ['R2', 'goal'],
  ['R4', 'LAB-15'], ['R4', '!219'], ['R4', 'Overview'], ['R4', 'ev-spec'], ['R4', 'ev-api'], ['R4', 'ev-log'], ['R4', 'goal'], ['R4', 'dana'],
  ['R3', 'LAB-14'], ['R3', '!212'], ['R3', 'Filters'],
  ['!205', 'marcus'], ['!219', 'marcus'], ['!212', 'marcus'], ['!218', 'marcus'],
  ['Overview', 'priya'], ['Filters', 'priya'], ['LAB-13', 'jordan'], ['goal', 'kim'],
  ['ev-api', 'cl-shift'], ['ev-api', 'cl-comp'],
];

function graphNodes(state) {
  const pending = isPending(state), changed = state.stage === 'approved';
  const n = {
    prd: { type: 'prd', label: 'Line Labor Dashboard', kind: 'PRD', full: `Line Labor Dashboard PRD ${prdVersion(state)}`, status: 'Owner Dana Ortiz' },
    E1: { type: 'epic', label: 'LAB-E1 · Live labor visibility', kind: 'Epic', full: 'LAB-E1 · Live labor visibility', status: 'R1, R2, R4 · 1 of 3 done' },
    E2: { type: 'epic', label: 'LAB-E2 · Filtering', kind: 'Epic', full: 'LAB-E2 · Filtering and drill-down', status: 'R3, R5 · 0 of 2 done' },
    R1: { type: 'req', label: 'R1 · Hours by dept', kind: 'Requirement', full: 'Show labor hours per department for the current shift.', status: 'Approved' },
    R2: { type: 'req', label: 'R2 · 85% flag', kind: 'Requirement', full: 'Flag any department above 85% of planned hours.', status: 'Approved' },
    R4: { type: 'req', label: 'R4 · Refresh rate', kind: 'Requirement', full: r4Text(state), status: changed ? 'Changed in v1.1' : pending ? 'Pending change · Dana decides' : 'Approved', tone: changed ? 'changed' : pending ? 'pending' : '' },
    R3: { type: 'req', label: 'R3 · Shift filter', kind: 'Requirement', full: 'Let leaders filter by shift (1st, 2nd, 3rd).', status: 'Approved' },
    R5: { type: 'req', label: 'R5 · Dept detail', kind: 'Requirement', full: 'Show a department detail view with an hourly breakdown.', status: state.r5 === 'accepted' ? 'Approved' : 'Draft · AI from lead notes', draft: state.r5 !== 'accepted' },
    goal: { type: 'goal', label: 'Goal · mid-shift risk', kind: 'Success metric', full: 'Leaders spot overtime risk by mid-shift.', status: 'Owner Kim Alvarez · depends on R2 and R4' },
    'LAB-12': { type: 'jira', label: 'LAB-12 · Done', kind: 'Jira ticket', full: 'LAB-12 · Labor hours by department', status: 'Done' },
    'LAB-13': { type: 'jira', label: 'LAB-13', kind: 'Jira ticket', full: 'LAB-13 · Overtime flag at 85% of planned hours', status: 'In progress · Jordan Kim' },
    'LAB-14': { type: 'jira', label: 'LAB-14', kind: 'Jira ticket', full: 'LAB-14 · Shift filter', status: 'In progress' },
    'LAB-15': { type: 'jira', label: 'LAB-15', kind: 'Jira ticket', full: 'LAB-15 · Refresh labor hours from the timekeeping API', status: changed ? 'In progress · description updated for v1.1' : 'In progress' },
    '!205': { type: 'gitlab', label: '!205 · Merged', kind: 'GitLab merge request', full: '!205 · Department hours endpoint', status: 'Merged · Marcus Lee' },
    '!212': { type: 'gitlab', label: '!212 · Open', kind: 'GitLab merge request', full: '!212 · Shift filter UI', status: 'Open · Marcus Lee' },
    '!219': { type: 'gitlab', label: '!219 · lab-15', kind: 'GitLab merge request', full: '!219 · lab-15-refresh: scheduled refresh job', status: `Open · Marcus Lee${pending ? ' · tagged pending-R4' : ''}` },
    '!218': { type: 'untraced', label: '!218 · no requirement', kind: 'Untraced work', full: '!218 · Cache warm-up script', status: 'Open · Marcus Lee · not linked to any requirement' },
    Overview: { type: 'figma', label: 'Overview frame', kind: 'Figma frame', full: 'Dashboard / Overview', status: state.labelUpdated ? 'Priya Shah · label shows last sync time' : 'Priya Shah · used by R1, R2 and R4' },
    Filters: { type: 'figma', label: 'Filters frame', kind: 'Figma frame', full: 'Dashboard / Filters', status: 'Priya Shah' },
    'ev-spec': { type: 'evidence', label: 'Spec §3.2', kind: 'Evidence on R4', full: EVIDENCE.spec.label, status: EVIDENCE.spec.meta },
    'ev-api': { type: 'evidence', label: 'API response', kind: 'Evidence on R4', full: 'Sandbox API response · GET /v2/labor/hours', status: EVIDENCE.api.meta },
    'ev-log': { type: 'evidence', label: 'Changelog L58–60', kind: 'Evidence on R4', full: EVIDENCE.changelog.label, status: EVIDENCE.changelog.meta },
    marcus: { type: 'people', person: 'marcus', label: 'Marcus Lee', kind: 'Person', full: 'Marcus Lee', status: 'Senior engineer' },
    jordan: { type: 'people', person: 'jordan', label: 'Jordan Kim', kind: 'Person', full: 'Jordan Kim', status: 'Developer' },
    priya: { type: 'people', person: 'priya', label: 'Priya Shah', kind: 'Person', full: 'Priya Shah', status: 'Designer · owns Figma Overview' },
    dana: { type: 'people', person: 'dana', label: 'Dana Ortiz', kind: 'Person', full: 'Dana Ortiz', status: 'Product manager · approver' },
    kim: { type: 'people', person: 'kim', label: 'Kim Alvarez', kind: 'Person', full: 'Kim Alvarez', status: 'Business lead · owns the success metric' },
    'cl-shift': { type: 'cluster', label: 'Shift Handoff · R2', kind: 'Other project · same API', full: 'Shift Handoff PRD · R2: Show hours worked this shift', status: changed ? 'Reads the timekeeping API · owner notified of R4 v1.1' : 'Reads the timekeeping API' },
    'cl-comp': { type: 'cluster', label: 'Compliance Tracker · R6', kind: 'Other project · same API', full: 'Compliance Tracker PRD · R6: Report hours against labor rules daily', status: changed ? 'Reads the timekeeping API · owner notified of R4 v1.1' : 'Reads the timekeeping API' },
  };
  if (!state.evidence.includes('changelog')) delete n['ev-log'];
  if (state.r5 === 'discarded') delete n.R5;
  return n;
}

const LAYER_TYPES = { jira: ['jira'], gitlab: ['gitlab'], figma: ['figma'], evidence: ['evidence'], people: ['people'], other: ['cluster'], untraced: ['untraced'], epics: ['epic'] };
const LAYERS = [['epics', 'Epics', '#c2418a'], ['jira', 'Jira', '#8b93a7'], ['gitlab', 'GitLab', '#8b93a7'], ['figma', 'Figma', '#8b93a7'], ['evidence', 'Evidence', '#e5a33a'], ['people', 'People', '#8b93a7'], ['other', 'Other projects', '#7c8cf8'], ['untraced', 'Untraced work', '#e2574c']];

// Adjacency after hiding layers. A hidden epic is "see-through": the PRD links straight to its requirements.
function adjacency(nodes, layers) {
  const hidden = new Set(Object.entries(LAYER_TYPES).filter(([k]) => !layers[k]).flatMap(([, t]) => t));
  const ok = (id) => nodes[id] && !hidden.has(nodes[id].type);
  const adj = {};
  const add = (a, b) => { (adj[a] = adj[a] || new Set()).add(b); (adj[b] = adj[b] || new Set()).add(a); };
  for (const [a, b] of LINKS) {
    if (!nodes[a] || !nodes[b]) continue;
    if (ok(a) && ok(b)) add(a, b);
  }
  if (!layers.epics) for (const [a, b] of LINKS) if (a === 'prd' && nodes[b] && nodes[b].type === 'epic') for (const [c, d] of LINKS) if (c === b && ok(d)) add('prd', d);
  return { adj, ok };
}

const byType = (nodes) => (a, b) => TYPE_ORDER.indexOf(nodes[a].type) - TYPE_ORDER.indexOf(nodes[b].type);

function focusLayout(focus, nodes, adj, w, h) {
  const cx0 = w / 2, cy0 = h / 2;
  const rx2 = w / 2 - 90, ry2 = h / 2 - 30; // outer ring stays inside the stage
  const rx1 = rx2 * 0.58, ry1 = ry2 * 0.58;
  const pos = { [focus]: { x: cx0, y: cy0, ring: 0 } };
  const ring1 = [...(adj[focus] || [])].sort(byType(nodes));
  ring1.forEach((id, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / ring1.length;
    pos[id] = { x: cx0 + rx1 * Math.cos(a), y: cy0 + ry1 * Math.sin(a), ring: 1, angle: a };
  });
  // Second ring: each new neighbor sits just outside the first-ring card that leads to it,
  // spaced by how much room cards need at that point of the ellipse (wide at top, short at the sides).
  const placed = new Set(Object.keys(pos));
  for (const parent of ring1) {
    const kids = [...(adj[parent] || [])].filter((k) => !placed.has(k)).sort(byType(nodes));
    if (!kids.length) continue;
    kids.forEach((k) => placed.add(k));
    const a0 = pos[parent].angle;
    const step = Math.min(0.6, 140 / (rx2 * Math.abs(Math.sin(a0)) + 1), 40 / (ry2 * Math.abs(Math.cos(a0)) + 1));
    kids.forEach((id, i) => {
      const a = a0 + (i - (kids.length - 1) / 2) * step;
      pos[id] = { x: cx0 + rx2 * Math.cos(a), y: cy0 + ry2 * Math.sin(a), ring: 2, angle: a };
    });
  }
  // Keep every card fully inside the stage.
  for (const p of Object.values(pos)) {
    p.x = Math.max(80, Math.min(w - 80, p.x));
    p.y = Math.max(22, Math.min(h - 22, p.y));
  }
  return pos;
}

function useSize(ref) {
  const [size, setSize] = useState({ w: 900, h: 600 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return size;
}

const TIP_W = 280;
function tipPosition(el) {
  const r = el.getBoundingClientRect();
  const left = Math.max(12, Math.min(r.left, window.innerWidth - TIP_W - 12));
  return window.innerHeight - r.bottom < 130 ? { left, bottom: window.innerHeight - r.top + 6 } : { left, top: r.bottom + 6 };
}

const REQ_PANEL = ['R1', 'R2', 'R3', 'R4'];

export function MapView({ selected, setSelected }) {
  const { state } = useStore();
  const stageRef = useRef(null);
  const { w, h } = useSize(stageRef);
  const [layers, setLayers] = useState(Object.fromEntries(LAYERS.map(([k]) => [k, true])));
  const nodes = graphNodes(state);
  const { adj, ok } = adjacency(nodes, layers);
  const [trail, setTrail] = useState(() => (selected && nodes[selected] ? ['prd', selected] : ['prd']));
  const [tip, setTip] = useState(null);
  let focus = trail[trail.length - 1];
  if (!ok(focus)) focus = 'prd';
  const changed = state.stage === 'approved';
  const pending = isPending(state);

  // Keep the Doc/Screens selection in sync when the center is a requirement.
  useEffect(() => { setSelected(REQ_PANEL.includes(focus) || focus === 'R5' ? focus : null); }, [focus]);

  const goTo = (id) => {
    setTip(null);
    if (id === focus) return;
    const at = trail.indexOf(id);
    setTrail(at >= 0 ? trail.slice(0, at + 1) : [...trail, id]);
  };

  const pos = focusLayout(focus, nodes, adj, w, h);
  const visible = Object.keys(pos);
  const edges = [];
  const seen = new Set();
  for (const a of visible) for (const b of adj[a] || []) {
    if (!pos[b]) continue;
    const key = [a, b].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    const ringA = pos[a].ring, ringB = pos[b].ring;
    if (ringA === 2 && ringB === 2) continue; // outer-ring cards only link inward
    if (ringA === 1 && ringB === 1) continue; // keep the first ring readable: spokes only
    const r4 = (a === 'R4' || b === 'R4') && (changed ? 'changed' : pending ? 'pending' : '');
    edges.push({ key, a, b, outer: Math.max(ringA, ringB) === 2, tone: r4 || nodes[a].type === 'evidence' || nodes[b].type === 'evidence' ? r4 || 'evidence' : nodes[a].type === 'cluster' || nodes[b].type === 'cluster' ? 'other' : nodes[a].type === 'untraced' || nodes[b].type === 'untraced' ? 'untraced' : '' });
  }

  const hover = (id) => (e) => setTip({ n: nodes[id], pos: tipPosition(e.currentTarget) });

  return html`<div className="rl-split">
    <div className="fmap-wrap">
      <div className="map-bar">
        <nav className="fmap-trail" aria-label="Map path">
          ${trail.filter((id) => nodes[id]).map((id, i, arr) => html`<${Fragment} key=${id}>
            ${i > 0 && html`<${ChevronRight} size=${12} className="muted" />`}
            <button className=${cx('crumb', i === arr.length - 1 && 'current')} onClick=${() => goTo(id)} aria-current=${i === arr.length - 1 ? 'location' : undefined}>${nodes[id].label}</button>
          <//>`)}
        </nav>
        <span className="grow" />
        ${focus !== 'prd' && html`<button className="btn" onClick=${() => { setTrail(['prd']); }}>Back to PRD</button>`}
      </div>
      <div className="map-layers">
        <span className="tiny-label">Show</span>
        ${LAYERS.map(([k, label, color]) => html`<button key=${k} className=${cx('layer-chip', !layers[k] && 'off')} aria-pressed=${layers[k]} onClick=${() => setLayers({ ...layers, [k]: !layers[k] })}>
          <span className="sq" style=${{ background: color }} />${label}
        </button>`)}
      </div>

      <div className="fmap-stage" ref=${stageRef}>
        <div className="fmap-rings" aria-hidden="true">
          <span style=${{ width: w * 0.58, height: h * 0.6 }} />
          <span style=${{ width: w * 0.9, height: h * 0.9 }} />
        </div>
        <svg className="fmap-svg" width=${w} height=${h} aria-hidden="true">
          ${edges.map((e) => {
            const A = pos[e.a], B = pos[e.b];
            return html`<path key=${e.key} className=${cx('fedge', e.outer && 'outer', e.tone)} style=${{ d: `path('M ${A.x} ${A.y} L ${B.x} ${B.y}')` }} />`;
          })}
        </svg>
        ${visible.map((id) => {
          const n = nodes[id], p = pos[id];
          return html`<button
            key=${id}
            className=${cx('fnode', `t-${n.type}`, `ring${p.ring}`, n.tone, n.draft && 'draft')}
            style=${{ left: p.x, top: p.y }}
            onClick=${() => goTo(id)}
            onMouseEnter=${hover(id)} onMouseLeave=${() => setTip(null)} onFocus=${hover(id)} onBlur=${() => setTip(null)}
            aria-label=${`${n.kind}: ${n.full}. ${n.status}.${p.ring ? ' Click to center the map here.' : ''}`}
          >
            ${p.ring === 0 && html`<span className="fnode-kind">${n.kind}</span>`}
            <span className="fnode-row">
              ${n.person ? html`<${Avatar} id=${n.person} size=${p.ring === 0 ? 22 : 18} />` : n.type === 'evidence' ? html`<${FileText} size=${12} />` : n.type === 'cluster' ? html`<${Link2} size=${12} />` : null}
              <span className="fnode-label">${n.label}</span>
            </span>
            ${p.ring === 0 && n.status && html`<span className="fnode-status">${n.status}</span>`}
          </button>`;
        })}
      </div>

      <div className="map-legend">
        <span><strong>Click any card</strong> to center the map on it.</span>
        <span><i className="lg-line" /> Direct link</span>
        <span><i className="lg-line outer" /> One step further</span>
        <span><i className="lg-line pending" /> Pending change</span>
        <span><i className="lg-line changed" /> Changed in v1.1</span>
        <span><i className="lg-line evidence" /> Evidence</span>
        <span className="muted">Same records as the Doc view. Nothing is edited here.</span>
      </div>
    </div>
    ${tip && html`<div className="map-tip" role="tooltip" style=${tip.pos}>
      <div className="tiny-label">${tip.n.kind}</div>
      <div className="map-tip-text">${tip.n.full}</div>
      <div className="muted tiny">${tip.n.status}</div>
    </div>`}
    <aside className="rl-panel">
      ${REQ_PANEL.includes(focus)
        ? html`<${TracePanel} sel=${focus} onClear=${() => setTrail(['prd'])} />`
        : html`<${FocusPanel} id=${focus} nodes=${nodes} adj=${adj} onGo=${goTo} />`}
    </aside>
  </div>`;
}

// Panel for anything that isn't a requirement: what it is, and everything it connects to.
function FocusPanel({ id, nodes, adj, onGo }) {
  const n = nodes[id];
  const links = [...(adj[id] || [])].sort(byType(nodes));
  const groups = {};
  for (const l of links) (groups[nodes[l].kind] = groups[nodes[l].kind] || []).push(l);
  return html`<div className="sp"><div className="sp-body">
    <div className="tiny-label">${n.kind}</div>
    <strong>${n.full}</strong>
    <div className="small muted">${n.status}</div>
    ${Object.entries(groups).map(([kind, ids]) => html`<${Fragment} key=${kind}>
      <${SectionLabel}>${kind}<//>
      ${ids.map((l) => html`<button key=${l} className="link-row small focus-link" onClick=${() => onGo(l)}>${nodes[l].label} <span className="muted tiny">${nodes[l].status}</span></button>`)}
    <//>`)}
  </div></div>`;
}

function TracePanel({ sel, onClear }) {
  const { state } = useStore();
  if (!sel) return html`<div className="sp"><div className="sp-body">
    <div className="muted small">Select a requirement to see everything traced to it.</div>
    <${SectionLabel}>Untraced work<//>
    <div className="small"><span className="red">GitLab !218</span> · Marcus · has no linked requirement.</div>
  </div></div>`;
  const pending = isPending(state);
  const traces = {
    R1: [['Jira LAB-12 · Done'], ['GitLab !205 · Merged · Marcus'], ['Figma · Overview, department bars · Priya']],
    R2: [['Jira LAB-13 · In progress'], ['Figma · Overview, highlight state · Priya'], ['Ops analyst · Jordan']],
    R3: [['Jira LAB-14 · In progress'], ['GitLab !212 · Open · Marcus'], ['Figma · Filters · Priya']],
    R4: [['Jira LAB-15 · Refresh job · Marcus'], ['GitLab !219 · lab-15-refresh · Marcus'], ['Figma · Overview, "last updated" label · Priya'], ['Success metric · mid-shift risk · Kim'], ['Approver · Dana']],
  }[sel];
  const reqText = sel === 'R4' ? r4Text(state) : { R1: 'Show labor hours per department for the current shift.', R2: 'Flag any department above 85% of planned hours.', R3: 'Let leaders filter by shift (1st, 2nd, 3rd).' }[sel];
  return html`<div className="sp">
    <div className="sp-body">
      <div className="tiny-label">Selected <span className="grow" /><button className="link tiny" onClick=${onClear}>Clear</button></div>
      <strong>${sel}${sel === 'R4' ? ' · Refresh rate' : ''}</strong>
      ${sel === 'R4' && state.stage === 'approved' && html`<${Tag} tone="green">Changed in v1.1<//>`}
      ${sel === 'R4' && pending && html`<${Tag} tone="amber">Pending change<//>`}
      <div className=${cx('small', sel === 'R4' && state.stage === 'approved' && 'green')}>${reqText}</div>
      <${SectionLabel}>Traced to<//>
      ${traces.map(([t]) => html`<div key=${t} className="small trace-row">${t}</div>`)}
      ${sel === 'R4' && html`<${Fragment}>
        <${SectionLabel}>Stances<//>
        <div className="chips">
          ${state.priya.stance ? html`<${Tag} tone=${state.priya.stance === 'agreed' ? 'green' : 'red'}>Priya · ${state.priya.stance === 'agreed' ? 'Agreed' : 'Disagreed'}<//>` : html`<span className="tag tag-outline">Priya · no stance</span>`}
          ${state.kim.stance ? html`<${Tag} tone="green">Kim · Agreed<//>` : html`<span className="tag tag-outline">Kim · no stance</span>`}
        </div>
        <${SectionLabel}>Evidence<//>
        <div className="ev-list">
          <div className="small"><${FileText} size=${12} className="amber" /> Spec §3.2 <span className="muted tiny">Mar 2023</span></div>
          <div className="small"><${FileText} size=${12} className="amber" /> Sandbox API response <span className="muted tiny">Oct 8 · PT1H</span></div>
          ${state.evidence.includes('changelog') && html`<div className="small"><${FileText} size=${12} className="amber" /> Changelog L58–60 <span className="muted tiny">Sep 2026 · reviewed by data owner</span></div>`}
        </div>
        <${SectionLabel}>Also uses this source<//>
        <div className="small muted">Shift Handoff PRD · R2 and Compliance Tracker · R6 read the same timekeeping API. ${state.stage === 'approved' ? 'Their owners were notified of the v1.1 change.' : 'Their owners will be notified if R4 changes.'}</div>
      <//>`}
    </div>
  </div>`;
}

/* ---------- Screens (frame 11) ---------- */

// Frames in the same Figma file with no requirement pin, placed loosely on the canvas like a real file.
const UNLINKED = [
  { id: 'detail', name: 'Dashboard / Department detail', kind: 'chart', x: 720, y: 70, w: 320, h: 210, edited: 'Priya · Oct 3', note: 'May match the R5 AI draft (department detail view), but nobody has linked it yet.' },
  { id: 'alerts', name: 'Settings / Alert thresholds', kind: 'toggles', x: 1100, y: 150, w: 250, h: 170, edited: 'Priya · Sep 28', note: 'Exploration for a later release. Not in this PRD.' },
  { id: 'mobile', name: 'Mobile / Shift summary', kind: 'phone', x: 740, y: 360, w: 140, h: 270, edited: 'Priya · Sep 22', note: 'Out of scope for v1 (desktop only, per the PRD scope section).' },
  { id: 'empty', name: 'Dashboard / Empty state', kind: 'empty', x: 930, y: 430, w: 290, h: 180, edited: 'Priya · Sep 30', note: 'Shown before the first sync of a shift. No requirement covers it yet.' },
  { id: 'v0', name: 'Archive / Overview v0', kind: 'table', x: 1300, y: 470, w: 250, h: 180, edited: 'Priya · Aug 14', note: 'Earlier table layout, replaced by Dashboard / Overview.', archived: true },
];
const CANVAS = { w: 1640, h: 760 };

function MiniFrame({ kind }) {
  if (kind === 'chart') return html`<div className="mini"><i className="mini-title" /><div className="mini-bars">${[40, 65, 52, 80, 92, 70, 58, 45].map((h, i) => html`<span key=${i} style=${{ height: h + '%' }} />`)}</div></div>`;
  if (kind === 'toggles') return html`<div className="mini"><i className="mini-title" />${[1, 2, 3].map((i) => html`<div key=${i} className="mini-toggle"><i /><span className=${i === 2 ? '' : 'on'} /></div>`)}</div>`;
  if (kind === 'phone') return html`<div className="mini mini-phone-screen"><i className="mini-title" /><i className="mini-line" /><i className="mini-line short" /><div className="mini-bars short">${[60, 80, 45].map((h, i) => html`<span key=${i} style=${{ height: h + '%' }} />`)}</div><i className="mini-line" /></div>`;
  if (kind === 'empty') return html`<div className="mini mini-empty"><span className="mini-circle" /><i className="mini-line short" /><i className="mini-line shorter" /></div>`;
  return html`<div className="mini"><i className="mini-title" />${[1, 2, 3, 4].map((i) => html`<div key=${i} className="mini-tr"><i /><i /><i /></div>`)}</div>`;
}

// Drag the empty canvas to pan, like Figma's hand tool.
function usePan(ref) {
  const drag = useRef(null);
  const onMouseDown = (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    drag.current = { x: e.clientX, y: e.clientY, left: ref.current.scrollLeft, top: ref.current.scrollTop };
    ref.current.classList.add('panning');
  };
  useEffect(() => {
    const move = (e) => {
      if (!drag.current) return;
      ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
      ref.current.scrollTop = drag.current.top - (e.clientY - drag.current.y);
    };
    const up = () => { drag.current = null; ref.current && ref.current.classList.remove('panning'); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);
  return onMouseDown;
}

export function ScreensView({ selected, setSelected }) {
  const { state } = useStore();
  const pending = isPending(state);
  const [frame, setFrame] = useState(null); // an unlinked frame, shown in the panel
  const viewRef = useRef(null);
  const onPan = usePan(viewRef);
  const pickFrame = (id) => { setSelected(null); setFrame(frame === id ? null : id); };
  const unlinked = UNLINKED.find((f) => f.id === frame);
  const pin = (id, style) => html`<button
    className=${cx('pin', selected === id && 'active', selected && selected !== id && 'dim', id === 'R4' && pending && 'pending')}
    style=${style}
    onClick=${() => { setFrame(null); setSelected(selected === id ? null : id); }}
  >${selected === id ? `${id} · selected` : id === 'R4' && pending ? 'R4 · pending' : id}</button>`;

  const info = {
    R1: ['Show labor hours per department for the current shift.', 'Department bars show hours against plan for the current shift.'],
    R2: ['Flag any department above 85% of planned hours.', 'Bars above 85% turn red (Final assembly, Systems install).'],
    R3: ['Let leaders filter by shift (1st, 2nd, 3rd).', 'Shift and department dropdowns on the Filters frame.'],
    R4: [
      r4Text(state),
      state.labelUpdated
        ? `The label now reads "${dashboardLabel(state)}" (Priya's change after v1.1), so leaders don't mistake hourly data for live data.`
        : state.stage === 'approved'
          ? 'The label still reads "Updated every 15 min". Priya has a comment to update it.'
          : 'The label reads "Updated every 15 min".',
    ],
  }[selected];

  return html`<div className="rl-split">
    <div className="screens-wrap">
      <div className="screens-hint muted small">Linked Figma frames carry requirement pins; click a pin to see its requirement. Other frames in the file have none. Drag the canvas to look around.</div>
      <div className="fcanvas-view" ref=${viewRef} onMouseDown=${onPan}>
        <div className="fcanvas" style=${{ width: CANVAS.w, height: CANVAS.h }}>
          <div className="fc-section" style=${{ left: 1270, top: 420, width: 310, height: 260 }}><span>Archive</span></div>

          <div className="fc-frame linked" style=${{ left: 80, top: 80, width: 560 }}>
            <div className="fc-name">Dashboard / Overview <span className="fc-linked">R1 · R2 · R4</span></div>
            <div className="scr-frame">
              ${pin('R4', { top: -12, right: 60 })}${pin('R1', { top: 70, left: -16 })}${pin('R2', { top: 110, right: -16 })}
              <div className="dash-frame static">
                <div className="dash-title">Line labor · 2nd shift</div>
                <div className="dash-sub"><span>Bldg 40-22 · 14 departments</span><span className=${cx('dash-label', selected === 'R4' && 'flag')}>${dashboardLabel(state)}</span></div>
                ${DEPARTMENTS.slice(0, 4).map(([name, pct, hot]) => html`<div key=${name} className="dash-row"><span>${name}</span><div className="bar"><div className=${cx('bar-fill', hot)} style=${{ width: pct + '%' }} /></div><span className="pct">${pct}%</span></div>`)}
              </div>
            </div>
          </div>

          <div className="fc-frame linked" style=${{ left: 130, top: 470, width: 480 }}>
            <div className="fc-name">Dashboard / Filters <span className="fc-linked">R3</span></div>
            <div className="scr-frame">
              ${pin('R3', { top: -12, right: 30 })}
              <div className="dash-frame static filters"><span className="dd">Shift: 2nd <${ChevronDown} size=${11} /></span><span className="dd">Department: All <${ChevronDown} size=${11} /></span></div>
            </div>
          </div>

          ${UNLINKED.map((f) => html`<button key=${f.id} className=${cx('fc-frame unlinked', frame === f.id && 'selected')} style=${{ left: f.x, top: f.y, width: f.w }} onClick=${() => pickFrame(f.id)} aria-pressed=${frame === f.id}>
            <span className="fc-name">${f.name}</span>
            <span className="fc-body" style=${{ height: f.h }}><${MiniFrame} kind=${f.kind} /></span>
          </button>`)}
        </div>
      </div>
    </div>
    <aside className="rl-panel"><div className="sp"><div className="sp-body">
      ${unlinked
        ? html`<${Fragment}>
            <div className="tiny-label">Selected frame <span className="grow" /><button className="link tiny" onClick=${() => setFrame(null)}>Clear</button></div>
            <strong>${unlinked.name}</strong>
            <span className="tag tag-outline">${unlinked.archived ? 'Archived · not linked' : 'Not linked to a requirement'}</span>
            <div className="small">${unlinked.note}</div>
            <${SectionLabel}>Last edited<//>
            <div className="small muted">${unlinked.edited}</div>`
        : info
        ? html`<${Fragment}>
            <div className="tiny-label">Selected pin <span className="grow" /><button className="link tiny" onClick=${() => setSelected(null)}>Clear</button></div>
            <strong>${selected}${selected === 'R4' ? ' · Data refresh rate' : ''}</strong>
            ${selected === 'R4' && state.stage === 'approved' && html`<${Tag} tone="green">Changed in v1.1<//>`}
            ${selected === 'R4' && pending && html`<${Tag} tone="amber">Pending change<//>`}
            <div className=${cx('small', selected === 'R4' && state.stage === 'approved' && 'green')}>${info[0]}</div>
            <${SectionLabel}>On this frame<//>
            <div className="small">${info[1]}</div>`
        : html`<div className="muted small">Click a pin to see its requirement, or any other frame to see why it isn't linked.</div>`}
    </div></div></aside>
  </div>`;
}


/* ---------- Present (frame 12) ---------- */

function slidesFor(state, audience) {
  const approved = state.stage === 'approved';
  const pending = isPending(state);
  const ev = state.evidence.map((id) => EVIDENCE[id]);
  const decision = approved
    ? {
        kicker: 'Decided this week',
        title: 'Dashboard data updates hourly, not every 15 minutes',
        body: 'The timekeeping system only syncs once an hour, confirmed by its data owner. Leaders still get 3 to 4 readings before mid-shift, so the goal of spotting overtime risk by mid-shift holds. The screen now shows the last sync time so nobody mistakes it for live data.',
        tags: [['green', 'No schedule impact'], ['neutral', 'Raised by development · approved by Dana']],
      }
    : pending
      ? {
          kicker: 'Pending decision',
          title: 'Should the dashboard refresh hourly instead of every 15 minutes?',
          body: `Development found the timekeeping API syncs hourly. Proposed: "${state.proposal.text}" Dana has not decided yet, so the PRD still says every 15 minutes.`,
          tags: [['amber', 'Decision pending'], ['neutral', 'Raised by development']],
        }
      : state.stage === 'denied'
        ? { kicker: 'Decided this week', title: 'Refresh rate stays at every 15 minutes', body: 'A proposal to move to hourly refresh was reviewed and denied. R4 stays as written.', tags: [['neutral', 'R4 unchanged']] }
        : { kicker: 'This week', title: 'No decisions this week', body: 'All requirements are as published in v1.', tags: [] };

  const slides = [
    { name: 'Problem', kicker: 'Problem', title: 'Leaders can\'t see overtime risk until it\'s too late', body: 'First-line leaders track labor hours across three spreadsheets. They can\'t see overtime risk until the end of the week, when it\'s too late to rebalance crews.' },
    { name: 'Decision', ...decision, evidence: approved || pending ? ev : [] },
    {
      name: 'Status', kicker: 'Status', title: `PRD ${prdVersion(state)} · 1 of 3 live-visibility requirements done`,
      body: audience === 'Engineering' ? 'LAB-12 done (GitLab !205 merged). LAB-13, LAB-14, LAB-15 in progress. !218 has no linked requirement.' : 'Live labor visibility is on track. Filtering is in progress. One department-detail requirement is still a draft and is not shown as a fact.',
    },
    { name: 'Evidence', kicker: 'Evidence', title: 'Where the facts come from', body: 'Every claim in this deck links back to a source record in Relay.', evidence: ev },
    {
      name: 'Next steps', kicker: 'Next steps', title: approved ? 'Ship the hourly refresh and relabel' : 'Waiting on the R4 decision',
      body: approved
        ? `Marcus: refresh job ${state.codeUpdated ? 'updated ✓' : 'to update'}. Priya: label ${state.labelUpdated ? 'updated ✓' : 'to update'}. Kim: confirm mid-shift readings in the first week.`
        : 'Dana to decide on R4. Engineering continues on the pending-R4 branch.',
    },
  ];
  return slides;
}

export function PresentView({ toast }) {
  const { state } = useStore();
  const [audience, setAudience] = useState('Leadership');
  const [idx, setIdx] = useState(1);
  const [presenting, setPresenting] = useState(false);
  const slides = slidesFor(state, audience);
  const slide = slides[idx];

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setPresenting(false);
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(slides.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [presenting]);

  const Slide = () => html`<div className="slide">
    <div className="slide-kicker mono">${slide.kicker}</div>
    <h2>${slide.title}</h2>
    <p>${slide.body}</p>
    ${slide.tags && slide.tags.length > 0 && html`<div className="chips">${slide.tags.map(([tone, t]) => html`<${Tag} key=${t} tone=${tone}>${t}<//>`)}</div>`}
    ${slide.evidence && slide.evidence.length > 0 && html`<${Fragment}>
      <div className="tiny-label">Evidence</div>
      <div className="slide-ev">${slide.evidence.map((e) => html`<div key=${e.label} className="slide-ev-card"><div className="small"><${FileText} size=${12} className="amber" /> ${e.short}</div><div className="muted tiny">${e.meta}</div></div>`)}</div>
    <//>`}
  </div>`;

  return html`<div className="present">
    <div className="present-bar">
      <span className="muted small">Audience</span>
      <select className="select" value=${audience} onChange=${(e) => setAudience(e.target.value)}>
        <option>Leadership</option><option>Engineering</option>
      </select>
      <span className="grow" />
      <button className="btn" onClick=${() => toast('Customizing slides is not simulated in this prototype.')}>Customize slides</button>
      <button className="btn btn-primary" onClick=${() => setPresenting(true)}>Present</button>
    </div>
    <${Slide} />
    <div className="thumbs">
      ${slides.map((s, i) => html`<button key=${s.name} className=${cx('thumb', i === idx && 'active')} onClick=${() => setIdx(i)}>
        <span className="small">${i + 1} · ${s.name}</span><span className="thumb-line" /><span className="thumb-line short" />
      </button>`)}
    </div>
    <div className="muted small center">Generated from the same PRD records. Pending changes show as decisions, never as facts.</div>
    ${presenting && html`<div className="presenting" onClick=${() => setIdx((i) => Math.min(slides.length - 1, i + 1))}>
      <${Slide} />
      <div className="presenting-bar" onClick=${(e) => e.stopPropagation()}>
        <button className="icon-btn" onClick=${() => setIdx(Math.max(0, idx - 1))}><${ChevronLeft} size=${16} /></button>
        <span className="small">${idx + 1} / ${slides.length}</span>
        <button className="icon-btn" onClick=${() => setIdx(Math.min(slides.length - 1, idx + 1))}><${ChevronRight} size=${16} /></button>
        <button className="btn sm" onClick=${() => setPresenting(false)}>Exit (Esc)</button>
      </div>
    </div>`}
  </div>`;
}
