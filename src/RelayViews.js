import { html, useState, useEffect, useRef, cx, Fragment } from './lib.js';
import { useStore, TEXT, TIMES, EVIDENCE, isPending, r4Text, prdVersion } from './store.js';
import { Avatar, Tag, SectionLabel } from './ui.js';
import { DEPARTMENTS, dashboardLabel } from './Figma.js';
import { X, FileText, Link2, ChevronDown, ChevronLeft, ChevronRight, Network, Frame } from 'lucide-react';

/* ---------- Map (frame 10) · sample-aligned column layout ---------- */

export function MapView({ selected, setSelected }) {
  const { state } = useStore();
  const [scope, setScope] = useState('r4'); // 'r4' | 'all'
  const pending = isPending(state);
  const changed = state.stage === 'approved';
  const hasLog = state.evidence.includes('changelog');
  const figmaNeeds = changed && !state.labelUpdated;
  const sel = selected || 'R4';

  useEffect(() => {
    if (!selected) setSelected('R4');
  }, []);

  const work = [
    { id: 'jira', icon: Network, title: 'Jira LAB-15', body: 'Refresh job · Marcus', tone: '' },
    { id: 'gitlab', icon: Link2, title: 'GitLab !219', body: 'lab-15-refresh · Marcus', tone: '' },
    { id: 'figma', icon: Frame, title: 'Figma · Overview', body: figmaNeeds ? '"Last updated" label · Priya' : (state.labelUpdated ? 'Label shows last sync · Priya' : '"Last updated" label · Priya'), tone: figmaNeeds || pending ? 'pending' : '' },
    { id: 'metric', icon: FileText, title: 'Success metric', body: 'Mid-shift risk · Kim', tone: '' },
  ];

  return html`<div className="rl-split">
    <div className="rmap-wrap">
      <div className="rmap-bar">
        <div className="seg sm" role="group" aria-label="Map scope">
          <button className=${cx('seg-btn', scope === 'r4' && 'active')} onClick=${() => setScope('r4')}>What R4 touches</button>
          <button className=${cx('seg-btn', scope === 'all' && 'active')} onClick=${() => setScope('all')}>Everything</button>
        </div>
        <span className="grow" />
        <span className="muted small rmap-note">Same records as the Doc view. Nothing is edited here.</span>
      </div>
      <div className="rmap-canvas">
        <svg className="rmap-svg" viewBox="0 0 740 560" aria-hidden="true">
          <path d="M220 159 C 234 159, 234 146, 248 146" className="rmap-edge evidence" />
          <path d="M220 189 C 234 189, 234 166, 248 166" className="rmap-edge evidence" />
          ${hasLog ? html`<path d="M220 219 C 234 219, 234 186, 248 186" className="rmap-edge evidence" />` : null}
          <path d="M484 130 C 500 130, 500 76, 518 76" className=${cx('rmap-edge', changed ? 'changed' : pending ? 'pending' : '')} />
          <path d="M484 150 C 500 150, 500 164, 518 164" className=${cx('rmap-edge', changed ? 'changed' : pending ? 'pending' : '')} />
          <path d="M484 170 C 500 170, 500 252, 518 252" className=${cx('rmap-edge', changed ? 'changed' : pending ? 'pending' : '')} />
          <path d="M484 190 C 500 190, 500 340, 518 340" className=${cx('rmap-edge', changed ? 'changed' : pending ? 'pending' : '')} />
          <path d="M120 265 C 120 360, 190 456, 248 456" className="rmap-edge other" />
        </svg>

        <section className="rmap-node evidence-node" style=${{ left: '20px', top: '104px', width: '200px' }}>
          <div className="rmap-node-head"><${FileText} size=${14} /><span>Evidence</span></div>
          <div className="rmap-node-body">
            <div className="rmap-row on"><${FileText} size=${13} /><span>Spec §3.2</span><span className="muted tiny">Mar 2023</span></div>
            <div className="rmap-row on"><${Link2} size=${13} /><span>API response</span><span className="muted tiny">PT1H</span></div>
            <div className=${cx('rmap-row', hasLog && 'on')}><${FileText} size=${13} /><span>Changelog</span><span className="muted tiny">Sep 2026</span></div>
            <div className="rmap-row"><${FileText} size=${13} /><span>Kickoff call</span><span className="muted tiny">Oct 1</span></div>
          </div>
        </section>

        <button className=${cx('rmap-node r4-node', changed && 'changed', pending && 'pending', sel === 'R4' && 'selected')} style=${{ left: '248px', top: '88px', width: '236px' }} onClick=${() => setSelected('R4')}>
          <div className="rmap-node-head">
            <span className="mono">R4</span><span>Refresh rate</span>
            ${changed ? html`<${Tag} tone="green">Changed in v1.1<//>` : pending ? html`<${Tag} tone="amber">Pending<//>` : null}
          </div>
          <div className="rmap-node-body pad">
            <div className="tiny-label">${changed ? 'NOW' : pending ? 'PROPOSED' : 'NOW'}</div>
            <div className="small">${changed || pending ? state.proposal.text : TEXT.r4Old}</div>
            <div className="muted tiny" style=${{ marginTop: '8px' }}>${changed ? 'Was every 15 minutes · approved by Dana' : pending ? 'Now: every 15 minutes · waiting on Dana' : 'Approved · Oct 1'}</div>
          </div>
          <div className="rmap-tabs"><span>Reason</span><span>Evidence</span><span className="on">Traced to</span></div>
        </button>

        ${work.map((w, i) => html`<section key=${w.id} className=${cx('rmap-node', w.tone)} style=${{ left: '518px', top: `${40 + i * 88}px`, width: '190px' }}>
          <div className="rmap-node-head"><${w.icon} size=${14} /><span>${w.title}</span></div>
          <div className="rmap-node-body pad"><div className=${cx('small', w.tone === 'pending' && 'amber')}>${w.body}</div></div>
        </section>`)}

        <section className="rmap-node other-node" style=${{ left: '248px', top: '400px', width: '236px' }}>
          <div className="rmap-node-head"><${Link2} size=${14} className="blue" /><span>Other PRDs, same source</span></div>
          <div className="rmap-node-body">
            <div className="rmap-row"><${FileText} size=${13} /><span>Shift Handoff · R2</span><span className="muted tiny">${changed ? 'notified' : 'shared'}</span></div>
            <div className="rmap-row"><${FileText} size=${13} /><span>Compliance Tracker · R6</span><span className="muted tiny">${changed ? 'notified' : 'shared'}</span></div>
          </div>
        </section>

        ${scope === 'all' && html`<div className="rmap-all muted small">Full PRD map (R1–R5 and untraced work) is summarized here for the symposium. Focus stays on R4 for this test.</div>`}

        <div className="rmap-legend">
          <span><i className="lg changed"></i> Changed in v1.1</span>
          <span><i className="lg evidence"></i> Evidence</span>
          <span><i className="lg other"></i> Other PRDs</span>
          <span className="grow" />
          <span>− 100% +</span>
          <span>Fit</span>
        </div>
      </div>
    </div>
    <aside className="rl-panel">
      <${TracePanel} sel=${sel === 'R4' ? 'R4' : sel} onClear=${() => setSelected('R4')} />
    </aside>
  </div>`;
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
    { name: 'Evidence', kicker: 'Evidence', title: 'Where the facts come from', body: 'Every claim in this deck links back to a source record in Rea.', evidence: ev },
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
