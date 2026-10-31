import { html, useState, useEffect, useRef, cx, Fragment } from './lib.js';
import { TimeSkip, EndCard } from './Interstitials.js';
import { useStore, TEXT, TIMES, isPending } from './store.js';
import { Avatar, Tag, SectionLabel, Diff, EvidenceChip } from './ui.js';
import {
  Link2, Layers, X, Minus, ChevronRight, ChevronDown, Hash, MousePointer2, Square, PenTool, Type, MessageCircle, Code2, Play, Search, Plus, Check,
} from 'lucide-react';

export const DEPARTMENTS = [
  ['Final assembly', 92, 'hot'],
  ['Systems install', 88, 'hot'],
  ['Wing join', 78],
  ['Paint & finish', 64],
  ['Interiors', 71],
];

export function dashboardLabel(state) {
  return state.labelUpdated ? 'Last synced 1:00 PM · next 2:05 PM' : 'Updated every 15 min';
}

export function Figma() {
  const { state, dispatch } = useStore();
  // Brief §8 (05): no banner. The plugin starts closed; the toolbar button pulses until it's opened.
  const [pluginOpen, setPluginOpen] = useState(false);
  const [selected, setSelected] = useState('frame'); // 'frame' | 'label'
  const [commentOpen, setCommentOpen] = useState(false);
  const [skip, setSkip] = useState(null);
  const [endCard, setEndCard] = useState(false);
  const [seenStage, setSeenStage] = useState(null); // pulse again whenever something new arrives
  const pending = isPending(state);
  const needsLabel = state.stage === 'approved' && !state.labelUpdated;
  const tagged = pending || needsLabel;
  const attention = (pending && !state.priya.stance) || needsLabel;
  const pulse = attention && seenStage !== state.stage;
  const showComment = state.stage === 'approved';
  const disagreed = state.priya.stance === 'disagreed';

  const openPlugin = () => { setPluginOpen(!pluginOpen); setSeenStage(state.stage); };
  const { canvasRef, view, resetView, startPan, panning, spaceDown } = useCanvasNav(() => { setSelected('frame'); setCommentOpen(false); });

  // 05 → skip → 05b. The other roles act off screen (brief §8, extension approved for the designer path).
  const afterStance = () => {
    setPluginOpen(false);
    if (!pending || !state.priya.stance) return;
    setSkip({
      from: TIMES.priya, to: TIMES.approved, title: disagreed ? 'Dana is weighing your note' : 'Dana is reviewing the change',
      events: [
        { time: TIMES.moreEvidence, who: 'dana', text: 'Dana asked Marcus for more evidence' },
        { time: TIMES.resent, who: 'marcus', text: 'Marcus added the changelog: the data owner confirmed hourly sync' },
        { time: TIMES.resent, who: 'kim', text: 'Kim agreed' },
        { time: TIMES.approved, who: 'dana', text: disagreed ? 'Dana approved v1.1 and replied to your note' : 'Dana approved R4 · PRD v1.1' },
      ],
      onDone: () => {
        if (state.stage === 'proposed') dispatch({ type: 'REQUEST_EVIDENCE', ask: TEXT.danaAsk });
        dispatch({ type: 'ADD_EVIDENCE', id: 'changelog' });
        dispatch({ type: 'RESEND', reply: TEXT.marcusReply });
        dispatch({ type: 'APPROVE', updates: state.updates });
        setSeenStage(null);
      },
    });
  };

  const relabel = () => {
    dispatch({ type: 'UPDATE_LABEL' });
    setSelected('label');
    setTimeout(() => setEndCard(true), 1400);
  };

  const endSteps = [
    { time: TIMES.proposed, who: 'Marcus', text: 'proposed refreshing hourly instead of every 15 minutes' },
    { time: TIMES.priya, who: 'You', text: disagreed ? 'disagreed, with a note for Dana' : 'agreed and offered to relabel the Overview' },
    { time: TIMES.moreEvidence, who: 'Dana', text: 'asked Marcus for more evidence' },
    { time: TIMES.resent, who: 'Marcus', text: 'added the changelog; Kim agreed' },
    { time: TIMES.approved, who: 'Dana', text: 'approved R4 · PRD v1.1 and commented on your frame' },
    state.labelUpdated
      ? { time: '2:26 PM', who: 'You', text: 'relabeled the Overview to show the real sync time' }
      : { time: 'Next', who: 'You', text: 'still need to relabel the Overview', pending: true },
  ];

  return html`<div className="figma">
    <aside className="fg-left">
      <div className="fg-file">
        <div className="fg-file-name"><span className="fg-logo">F</span> Line Labor Dashboard <${ChevronDown} size=${12} /></div>
        <div className="muted tiny">Manufacturing Systems · Design</div>
      </div>
      <div className="fg-tabs"><strong>File</strong><span className="muted">Assets</span><span className="grow" /><${Search} size=${13} className="muted" /></div>
      <div className="fg-section">
        <div className="fg-section-head">Pages <${Plus} size=${12} /></div>
        <div className="fg-row active">Dashboard</div>
        <div className="fg-row">Explorations</div>
        <div className="fg-row">Archive</div>
      </div>
      <div className="fg-section">
        <div className="fg-section-head">Layers</div>
        <button className=${cx('fg-row layer', selected === 'frame' && 'selected')} onClick=${() => setSelected('frame')}><${Hash} size=${12} /> Dashboard / Overview</button>
        <button className=${cx('fg-row layer child', selected === 'label' && 'selected')} onClick=${() => setSelected('label')}>
          Last updated label ${tagged && html`<${Tag} tone=${needsLabel ? 'green' : 'amber'} className="grow-left">R4<//>`}
        </button>
        <div className="fg-row layer child">Department bars</div>
        <div className="fg-row layer child">Header</div>
        <div className="fg-row layer"><${Hash} size=${12} /> Dashboard / Filters</div>
        <div className="fg-row layer"><${Hash} size=${12} /> Dashboard / Department detail</div>
      </div>
    </aside>

    <section className=${cx('fg-canvas', (panning || spaceDown) && 'grab', panning && 'grabbing')} ref=${canvasRef} onMouseDown=${startPan}>
      <div className="fg-world" style=${{ transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.z})` }}>
      <div className="fg-frame-wrap">
        <div className="fg-frame-meta"><span>Dashboard / Overview</span><span>1280 × 832</span></div>
        ${tagged && html`<button className=${cx('fg-pending-tag', needsLabel && 'changed')} onClick=${() => { setPluginOpen(true); setSeenStage(state.stage); }} aria-label="Open the Astra plugin for R4">${needsLabel ? 'R4 · changed in v1.1' : 'R4 · pending · was assumed'}</button>`}
        <div className=${cx('dash-frame', selected === 'frame' && 'selected')}>
          <div className="dash-title">Line labor · 2nd shift</div>
          <div className="dash-sub">
            <span>Bldg 40-22 · 14 departments</span>
            <button className=${cx('dash-label', tagged && 'flag', selected === 'label' && 'selected', state.labelUpdated && 'just-updated')} onClick=${() => setSelected('label')}>${dashboardLabel(state)}</button>
          </div>
          ${DEPARTMENTS.map(([name, pct, hot]) => html`<div key=${name} className="dash-row">
            <span>${name}</span>
            <div className="bar"><div className=${cx('bar-fill', hot)} style=${{ width: pct + '%' }} /></div>
            <span className="pct">${pct}%</span>
          </div>`)}
        </div>
        <div className="fg-size">1280 × 832</div>

        ${showComment && html`<div className="fg-comment">
          <button className=${cx('fg-comment-pin', !state.labelUpdated && !commentOpen && 'unread')} onClick=${() => setCommentOpen(!commentOpen)} aria-label="Comment from Dana Ortiz" aria-expanded=${commentOpen}>
            <${Avatar} legacy id="dana" size=${24} />
          </button>
          ${commentOpen && html`<div className="fg-comment-pop" role="dialog" aria-label="Comment thread">
            <div className="fg-comment-head"><${Avatar} legacy id="dana" size=${20} /><strong>Dana Ortiz</strong><span className="muted tiny">via Astra · ${TIMES.approved}</span>${state.labelUpdated && html`<span className="grow" /><${Tag} tone="green"><${Check} size=${11} /> Resolved<//>`}</div>
            ${disagreed && html`<p className="small muted">Thanks for flagging this. The data owner confirmed hourly sync, and the label fix covers your concern.</p>`}
            <p className="small">R4 is hourly now (PRD v1.1). Can the label show the last sync time instead of "Updated every 15 min"?</p>
            ${!state.labelUpdated && html`<div className="plg-actions"><button className="btn btn-primary sm" onClick=${relabel}>Relabel to "Last synced · next"</button></div>`}
          </div>`}
        </div>`}
      </div>
      </div>

      <button className="fg-zoom" onClick=${resetView} title="Reset view (drag or scroll to move, Cmd/Ctrl + scroll to zoom)">${Math.round(view.z * 100)}%</button>
      <div className="fg-toolbar">
        <button className="tool active"><${MousePointer2} size=${15} /></button>
        <button className="tool"><${Hash} size=${15} /></button>
        <button className="tool"><${Square} size=${15} /></button>
        <button className="tool"><${PenTool} size=${15} /></button>
        <button className="tool"><${Type} size=${15} /></button>
        <button className="tool"><${MessageCircle} size=${15} /></button>
        <span className="tool-sep" />
        <button className=${cx('tool astra', pluginOpen && 'on')} onClick=${openPlugin} aria-label="Astra plugin" aria-expanded=${pluginOpen}>
          <${Link2} size=${14} /> Astra ${attention && html`<span className=${cx('dot amber', pulse && 'pulse')} />`}
        </button>
        <button className="tool"><${Code2} size=${15} /></button>
      </div>
    </section>

    <aside className="fg-right">
      <div className="fg-right-head"><${Avatar} legacy id="priya" size=${24} /><span className="grow" /><${Play} size=${14} /><button className="btn btn-figma sm">Share</button></div>
      <div className="fg-props">
        <div className="fg-prop-label">${selected === 'label' ? 'Text' : 'Frame'}</div>
        <div className="fg-prop-grid"><span>X 0</span><span>Y 0</span><span>W ${selected === 'label' ? (state.labelUpdated ? 236 : 134) : 1280}</span><span>H ${selected === 'label' ? 24 : 832}</span></div>
        <div className="fg-prop-label">Fill</div>
        <div className="fg-prop-grid"><span><span className="swatch" /> F5F6F8</span><span>100%</span></div>
      </div>
    </aside>

    ${pluginOpen && html`<${AstraPlugin} onClose=${() => (pending && state.priya.stance ? afterStance() : setPluginOpen(false))} onSelectLayer=${() => setSelected('label')} onKeepDesigning=${afterStance} onRelabel=${relabel} />`}
    ${skip && html`<${TimeSkip} ...${skip} onDone=${() => { skip.onDone(); setSkip(null); }} />`}
    ${endCard && html`<${EndCard}
      role="Designer"
      title=${state.labelUpdated ? 'Your frame matches the new requirement.' : 'R4 changed. Your label is next.'}
      steps=${endSteps}
      onClose=${() => setEndCard(false)}
      onStart=${() => dispatch({ type: 'SET_ROLE', role: null })}
      onExplore=${() => { dispatch({ type: 'SET_VIEW', view: 'screens' }); dispatch({ type: 'SET_ROLE', role: 'dana' }); }}
    />`}
  </div>`;
}

// Figma-style canvas navigation: drag empty space (or hold Space and drag anywhere) to pan,
// scroll to pan, Cmd/Ctrl + scroll or pinch to zoom toward the cursor.
function useCanvasNav(onBackgroundClick) {
  const canvasRef = useRef(null);
  const [view, setView] = useState({ x: 0, y: 0, z: 1 });
  const [panning, setPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    const el = canvasRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect();
        const px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2;
        setView((v) => {
          const z = Math.min(3, Math.max(0.25, v.z * Math.exp(-e.deltaY * 0.01)));
          const k = z / v.z;
          return { z, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
        });
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      }
    };
    const typing = (e) => /INPUT|TEXTAREA/.test(e.target.tagName);
    const down = (e) => { if (e.code === 'Space' && !typing(e) && !e.repeat) { e.preventDefault(); setSpaceDown(true); } };
    const up = (e) => { if (e.code === 'Space') setSpaceDown(false); };
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
    };
    const release = () => {
      const d = drag.current;
      if (!d) return;
      drag.current = null;
      setPanning(false);
      if (!d.moved && d.background) onBackgroundClick();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', release);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', release);
    };
  }, []);

  const startPan = (e) => {
    const onContent = e.target.closest('button, .dash-frame, .fg-comment-pop, .fg-toolbar, .plugin');
    if (e.button === 1 || spaceDown || !onContent) {
      e.preventDefault();
      setView((v) => { drag.current = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y, moved: false, background: !onContent }; return v; });
      setPanning(true);
    }
  };

  return { canvasRef, view, resetView: () => setView({ x: 0, y: 0, z: 1 }), startPan, panning, spaceDown };
}

function AstraPlugin({ onClose, onSelectLayer, onKeepDesigning, onRelabel }) {
  const { state, dispatch } = useStore();
  const [note, setNote] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [changing, setChanging] = useState(false);
  const pending = isPending(state);
  const stance = state.priya.stance;

  let body;
  if (state.stage === 'flagged') {
    body = html`<div className="plg-empty">
      <${Check} size=${18} strokeWidth=${1.5} className="muted" />
      <div className="strong-500">Nothing pending on your frames</div>
      <div className="muted small">Astra tags layers here when a linked requirement may change.</div>
      <div className="plg-linked muted tiny">Linked: R1 → Department bars · R3 → Filters · R4 → Last updated label</div>
    </div>`;
  } else if (state.stage === 'denied') {
    body = html`<div className="plg-sec">
      <div className="plg-title-row"><span className="plg-title"><span className="mono muted">R4</span> Data refresh rate</span><${Tag}>Unchanged<//></div>
      <div className="small">${TEXT.r4Old}</div>
      <div className="muted small">Dana kept R4 as written. Your label stays.</div>
    </div>`;
  } else {
    const approved = state.stage === 'approved';
    body = html`<${Fragment}>
      <div className="plg-sec">
        <div className="plg-title-row"><span className="plg-title"><span className="mono muted">R4</span> Data refresh rate</span>${approved ? html`<${Tag} tone="green">Changed in v1.1<//>` : html`<${Tag} tone="amber">Pending<//>`}</div>
        <div className="plg-by"><${Avatar} id="marcus" size=${22} /><span><span className="strong-500">Marcus Lee</span> <span className="muted">via Codex · ${TIMES.proposed}${approved ? ' · approved by Dana' : ''}</span></span></div>
        <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} labels=${approved ? ['Was', 'Now'] : ['Now', 'Proposed']} />
        ${!approved && html`<div className="small muted">This requirement was approved as an assumption. Marcus's build tested it.</div>`}
        <button className="plg-reason" aria-expanded=${showReason} onClick=${() => setShowReason(!showReason)}>
          <span className="tiny-label">Reason and evidence</span><span className="grow" /><span className="muted small">${state.evidence.length} sources</span>
          ${showReason ? html`<${ChevronDown} size=${14} strokeWidth=${1.5} />` : html`<${ChevronRight} size=${14} strokeWidth=${1.5} />`}
        </button>
        ${showReason && html`<div className="plg-reason-body">
          <p className="small">${state.proposal.reason}</p>
          <div className="chips">${state.evidence.map((id) => html`<${EvidenceChip} key=${id} id=${id} variant="short" />`)}</div>
        </div>`}
      </div>
      <div className="plg-sec">
        <div className="tiny-label">In this frame</div>
        <div className="plg-layer"><span className="ring" /> "${dashboardLabel(state)}" label <span className="grow" /><button className="link small" onClick=${onSelectLayer}>Select</button></div>
        ${pending && html`<div className="muted tiny">Keep designing. Edits to this layer are tagged pending R4.</div>`}
      </div>
      ${pending && (!stance || changing
        ? html`<div className="plg-stance">
            <div className="plg-title-row"><span className="tiny-label">Your stance is requested</span><span className="muted small">You own this frame</span></div>
            <input className="field" placeholder="Note for Dana (optional)" value=${note} onInput=${(e) => setNote(e.target.value)} />
            <button className=${cx('link tiny', note && 'hidden')} onClick=${() => setNote(TEXT.priyaNote)}>Use suggested note</button>
            <div className="plg-actions">
              <button className="btn" onClick=${() => { dispatch({ type: 'PRIYA_STANCE', stance: 'disagreed', note }); setChanging(false); }}>Disagree</button>
              <button className="btn btn-primary" onClick=${() => { dispatch({ type: 'PRIYA_STANCE', stance: 'agreed', note }); setChanging(false); }}>Agree</button>
            </div>
          </div>`
        : html`<div className="plg-stance done">
            <div className="plg-title-row"><span className="plg-you"><${Tag} tone=${stance === 'agreed' ? 'green' : 'neutral'}>You ${stance}<//><span className="muted small">${TIMES.priya}</span></span><button className="link small" onClick=${() => setChanging(true)}>Change</button></div>
            ${state.priya.note && html`<div className="muted small">"${state.priya.note}"</div>`}
            <div className="muted tiny">Dana decides. You'll see the result here.</div>
            <div className="plg-actions"><button className="btn btn-primary" onClick=${onKeepDesigning}>Keep designing</button></div>
          </div>`)}
      ${approved && html`<div className="plg-stance ${state.labelUpdated ? 'done' : ''}">
        ${state.labelUpdated
          ? html`<div className="plg-you"><${Tag} tone="green">Label updated<//><span className="muted small">Shows the real sync time. Matches the code.</span></div>`
          : html`<${Fragment}>
              <div className="plg-title-row"><span className="tiny-label">Dana commented on Overview</span><span className="muted small">${TIMES.approved}</span></div>
              <div className="small">"R4 is hourly now. Can the label show the last sync time instead of '15 min'?"</div>
              <div className="plg-actions"><button className="btn btn-primary" onClick=${onRelabel}>Relabel to "Last synced · next"</button></div>
            <//>`}
      </div>`}
    <//>`;
  }

  return html`<div className="plugin">
    <div className="plg-head"><${Layers} size=${16} strokeWidth=${1.5} aria-hidden="true" /><span className="plg-name">Astra</span><span className="muted small">plugin</span><span className="grow" /><button className="icon-btn sm" aria-label="Minimize plugin" onClick=${onClose}><${Minus} size=${14} strokeWidth=${1.5} /></button><button className="icon-btn sm" aria-label="Close plugin" onClick=${onClose}><${X} size=${14} strokeWidth=${1.5} /></button></div>
    ${body}
  </div>`;
}

