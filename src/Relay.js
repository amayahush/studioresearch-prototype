import { html, useState, useEffect, cx, Fragment } from './lib.js';
import { useStore, TEXT, TIMES, isPending, r4Text, prdVersion } from './store.js';
import { Avatar, Tag, Diff, EvidenceChip, Toast, CollapsibleSection } from './ui.js';
import { MapView, ScreensView, PresentView } from './RelayViews.js';
import { TimeSkip, EndCard, ApprovalAnim } from './Interstitials.js';
import {
  ChevronDown, Search, Inbox, CircleUser, FileText, Settings, HelpCircle, Network, Frame, Presentation, X, History, Check, Clock,
  PanelLeftClose, PanelLeftOpen, Download,
} from 'lucide-react';

export const TOOLS = [['Jira', '2m'], ['GitLab', '5m'], ['Figma', '1m'], ['Teams', 'live'], ['SharePoint', '10m'], ['Codex', 'live']];

export function getReqs(state) {
  const pending = isPending(state);
  const reqs = [
    { id: 'R1', epic: 'E1', text: 'Show labor hours per department for the current shift.', links: ['Jira LAB-12 · Done', 'GitLab !205 · Merged'], status: 'approved', slices: ['dev', 'design', 'sme'] },
    { id: 'R2', epic: 'E1', text: 'Flag any department above 85% of planned hours.', links: ['Jira LAB-13 · In progress'], status: 'approved', slices: ['dev', 'business'] },
    {
      id: 'R4', epic: 'E1', text: r4Text(state), links: ['Jira LAB-15 · In progress', 'Figma · Overview'],
      status: pending ? 'pending' : 'approved', changed: state.stage === 'approved', slices: ['dev', 'design', 'sme', 'business'],
    },
    { id: 'R3', epic: 'E2', text: 'Let leaders filter by shift (1st, 2nd, 3rd).', links: ['Jira LAB-14 · In progress', 'Figma · Filters'], status: 'approved', slices: ['dev', 'design'] },
    {
      id: 'R5', epic: 'E2', text: 'Show a department detail view with an hourly breakdown.',
      links: state.r5 === 'accepted' ? ['Jira LAB-16 · To do'] : [], status: state.r5 === 'accepted' ? 'approved' : 'draft', slices: ['design', 'business'],
    },
  ];
  return state.r5 === 'discarded' ? reqs.filter((r) => r.id !== 'R5') : reqs;
}

const VIEWS = [
  ['doc', 'Doc'],
  ['map', 'Map'],
  ['screens', 'Screens'],
  ['present', 'Present'],
];

const NAV_KEY = 'relay-sidebar-open';

function loadNavOpen() {
  try {
    return localStorage.getItem(NAV_KEY) !== 'closed';
  } catch {
    return true;
  }
}

export function Relay() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(isPending(state) ? 'R4' : null);
  const [toast, setToast] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(loadNavOpen);
  const [approval, setApproval] = useState(null); // pending updates while ApprovalAnim plays
  const [endCard, setEndCard] = useState(false);
  const pending = isPending(state);
  const inbox = ['proposed', 'resent'].includes(state.stage) ? 1 : 0;
  const view = state.relayView;
  const showEvidenceSkip = state.storyCue === 'marcus-evidence';

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(NAV_KEY, navOpen ? 'open' : 'closed');
    } catch {}
  }, [navOpen]);

  const openInbox = () => { dispatch({ type: 'SET_VIEW', view: 'doc' }); if (pending) setSelected('R4'); };
  const openProject = () => { dispatch({ type: 'SET_VIEW', view: 'doc' }); setSelected(null); };
  const Body = { doc: DocView, map: MapView, screens: ScreensView, present: PresentView }[view];

  const versionLabel = state.stage === 'approved'
    ? 'v1.1'
    : pending
      ? `${prdVersion(state)} · 1 pending`
      : prdVersion(state);

  const endSteps = [
    { time: TIMES.proposed, who: 'Marcus', text: 'proposed hourly refresh with evidence' },
    { time: TIMES.priya, who: 'Priya', text: 'agreed and will relabel the Overview' },
    { time: TIMES.moreEvidence, who: 'You', text: 'asked Marcus for more evidence' },
    { time: TIMES.resent, who: 'Marcus', text: 'added the changelog; Kim agreed' },
    { time: TIMES.approved, who: 'You', text: 'approved R4 · published PRD v1.1' },
    { time: 'Next', who: 'Marcus · Priya', text: 'still need to update the refresh job and Overview label', pending: true },
  ];

  return html`<div className="relay">
    <nav className=${cx('rl-side', !navOpen && 'collapsed')} aria-label="Workspace">
      ${navOpen
        ? html`<${Fragment}>
            <div className="rl-org-row">
              <button className="rl-org"><span className="rl-org-name">Manufacturing Systems</span><${ChevronDown} size=${13} /></button>
              <button className="rl-nav-toggle" onClick=${() => setNavOpen(false)} aria-label="Collapse sidebar" aria-expanded="true" title="Collapse sidebar">
                <${PanelLeftClose} size=${18} aria-hidden="true" />
              </button>
            </div>
            <div className="rl-search"><${Search} size=${14} /> Search <span className="grow" /><kbd>⌘K</kbd></div>
            <button className="rl-nav" onClick=${openInbox}>
              <${Inbox} size=${15} /> Inbox <span className="grow" /><span className=${cx('count', inbox && 'hot')}>${inbox}</span>
            </button>
            <div className="rl-nav"><${CircleUser} size=${15} /> My work</div>
            <div className="rl-group">Projects</div>
            <button className="rl-nav active" onClick=${openProject}><${FileText} size=${15} /> Line Labor Dashboard</button>
            <div className="rl-nav"><${FileText} size=${15} /> Compliance Tracker</div>
            <div className="rl-nav"><${FileText} size=${15} /> Shift Handoff</div>
            <div className="rl-group">Connected tools</div>
            ${TOOLS.map(([t, ago]) => html`<div key=${t} className="rl-tool"><span className="dot green" /> ${t}<span className="grow" /><span className="mono muted tiny">${ago}</span></div>`)}
            <span className="grow" />
            <div className="rl-nav"><${Settings} size=${15} /> Settings</div>
            <div className="rl-nav"><${HelpCircle} size=${15} /> Help</div>
          <//>`
        : html`<div className="rl-rail">
            <button className="rail-btn" onClick=${() => setNavOpen(true)} aria-label="Expand sidebar" aria-expanded="false" data-tip="Expand sidebar">
              <${PanelLeftOpen} size=${18} aria-hidden="true" />
            </button>
            <span className="rail-divider" />
            <button className="rail-btn" onClick=${() => setNavOpen(true)} aria-label="Search" data-tip="Search"><${Search} size=${17} aria-hidden="true" /></button>
            <button className="rail-btn" onClick=${openInbox} aria-label=${inbox ? `Inbox, ${inbox} waiting` : 'Inbox'} data-tip=${inbox ? `Inbox · ${inbox} waiting` : 'Inbox'}>
              <${Inbox} size=${17} aria-hidden="true" />${inbox > 0 && html`<span className="rail-badge" />`}
            </button>
            <button className="rail-btn" aria-label="My work" data-tip="My work"><${CircleUser} size=${17} aria-hidden="true" /></button>
            <button className="rail-btn active" onClick=${openProject} aria-label="Line Labor Dashboard (current project)" aria-current="page" data-tip="Line Labor Dashboard">
              <${FileText} size=${17} aria-hidden="true" />
            </button>
          </div>`}
    </nav>

    <section className="rl-main">
      <header className="rl-top">
        <strong className="rl-title">Line Labor Dashboard</strong>
        <${Tag} tone=${pending ? 'amber' : state.stage === 'approved' ? 'green' : 'neutral'}>${versionLabel}<//>
        <span className="grow" />
        <div className="seg" role="group" aria-label="View">
          ${VIEWS.map(([id, label]) => html`<button key=${id} className=${cx('seg-btn', view === id && 'active')} onClick=${() => dispatch({ type: 'SET_VIEW', view: id })}>${label}</button>`)}
        </div>
        <div className="export-wrap">
          <button className="icon-btn round-pill" aria-label="Export" title="Export" onClick=${() => setExportOpen(!exportOpen)}>
            <${Download} size=${16} aria-hidden="true" />
          </button>
          ${exportOpen && html`<div className="menu">
            ${[['PDF', 'Full PRD with evidence'], ['PowerPoint (.pptx)', 'From the Present view'], ['Image (PNG)', 'Current view'], ['Copy link', 'Opens this view']].map(
              ([t, d]) => html`<button key=${t} className="menu-item" onClick=${() => { setExportOpen(false); setToast(`${t}: export is not simulated in this prototype.`); }}><strong>${t}</strong><span className="muted tiny">${d}</span></button>`
            )}
          </div>`}
        </div>
        <button className="btn btn-pill" onClick=${() => setToast('Sharing is not simulated in this prototype.')}>Share</button>
        <${Avatar} id="dana" size=${28} />
      </header>
      <${Body} selected=${selected} setSelected=${setSelected} toast=${setToast} onApprove=${(updates) => setApproval(updates)} />
    </section>
    ${showEvidenceSkip && html`<${TimeSkip}
      from=${TIMES.moreEvidence}
      to=${TIMES.resent}
      title="Marcus is gathering more evidence"
      events=${[
        { time: TIMES.resent, who: 'marcus', text: 'Marcus added the changelog: data owner confirmed hourly' },
        { time: TIMES.resent, who: 'kim', text: 'Kim agreed: leaders still see risk before mid-shift' },
      ]}
      onDone=${() => {
        dispatch({ type: 'ADD_EVIDENCE', id: 'changelog' });
        dispatch({ type: 'RESEND', reply: TEXT.marcusReply });
        setSelected('R4');
      }}
    />`}
    ${approval && html`<${ApprovalAnim}
      updates=${approval}
      onDone=${() => {
        dispatch({ type: 'APPROVE', updates: approval });
        setApproval(null);
        setEndCard(true);
      }}
    />`}
    ${endCard && html`<${EndCard}
      role="Product manager"
      title="R4 is decided. The PRD is at v1.1."
      steps=${endSteps}
      onClose=${() => setEndCard(false)}
      onStart=${() => dispatch({ type: 'SET_ROLE', role: null })}
      onExplore=${() => { setEndCard(false); dispatch({ type: 'SET_VIEW', view: 'map' }); }}
    />`}
    <${Toast} text=${toast} />
  </div>`;
}

const SLICES = [['main', 'Main PRD'], ['dev', 'Developer'], ['design', 'Design'], ['sme', 'SME'], ['business', 'Business']];
const FILTERS = [
  ['all', 'All requirements'],
  ['approved', 'Approved'],
  ['pending', 'Pending'],
  ['draft', 'Draft'],
];

function DocView({ selected, setSelected, onApprove }) {
  const { state } = useStore();
  const [slice, setSlice] = useState('main');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  // Open/closed choices by section key, kept across selections that share a section.
  const [openMap, setOpenMap] = useState({});
  const reqs = getReqs(state);
  const pending = isPending(state);
  const count = (st) => (st === 'all' ? reqs.length : reqs.filter((r) => r.status === st).length);
  const visible = reqs.filter((r) => (slice === 'main' || r.slices.includes(slice)) && (filter === 'all' || r.status === filter));
  const epics = [
    ['E1', 'LAB-E1', 'Live labor visibility'],
    ['E2', 'LAB-E2', 'Filtering and drill-down'],
  ];
  const filterLabel = FILTERS.find(([id]) => id === filter)?.[1] || 'All requirements';

  useEffect(() => {
    if (selected === 'R5' && state.r5 === 'discarded') setSelected(null);
  }, [state.r5]);

  return html`<div className="rl-doc-wrap">
    <div className="rl-subbar">
      ${SLICES.map(([id, label]) => html`<button key=${id} className=${cx('slice', slice === id && 'active')} onClick=${() => setSlice(id)}>
        ${label}${pending && id !== 'sme' && html`<span className="dot amber" />`}
      </button>`)}
      <span className="grow" />
      <div className="filter-wrap">
        <button className="filter-pill" aria-haspopup="listbox" aria-expanded=${filterOpen} onClick=${() => setFilterOpen(!filterOpen)}>
          ${filterLabel} <span className="muted">${count(filter)}</span> <${ChevronDown} size=${12} aria-hidden="true" />
        </button>
        ${filterOpen && html`<div className="menu filter-menu" role="listbox">
          ${FILTERS.map(([id, label]) => html`<button key=${id} className=${cx('menu-item', filter === id && 'active')} role="option" aria-selected=${filter === id} onClick=${() => { setFilter(id); setFilterOpen(false); }}>
            <strong>${label}</strong><span className="muted tiny">${count(id)}</span>
          </button>`)}
        </div>`}
      </div>
    </div>

    <div className="rl-split">
      <div className="rl-doc" onClick=${(e) => e.target === e.currentTarget && setSelected(null)}>
        <button className=${cx('doc-title', (!selected || selected === 'overview') && 'selected')} onClick=${() => setSelected('overview')}>
          <h1>Line Labor Dashboard</h1>
          <div className="doc-meta">Owner <strong>Dana Ortiz (PM)</strong> · ${prdVersion(state)} · ${state.stage === 'approved' ? `published Oct 8, ${TIMES.approved}` : 'published Oct 1'} · Sources: kickoff call, lead notes, labor spreadsheet</div>
        </button>

        ${(slice === 'main' || slice === 'business') && filter === 'all' && html`<${Fragment}>
          <div className=${cx('doc-card', selected === 'problem' && 'selected')} onClick=${() => setSelected('problem')}>
            <div className="doc-card-head"><strong>Problem</strong><span className="grow" /><${Tag} tone="green">Approved<//></div>
            <p>First-line leaders track labor hours across three spreadsheets. They can't see overtime risk until the end of the week, when it's too late to rebalance crews.</p>
          </div>
          <div className=${cx('doc-card', selected === 'goal' && 'selected')} onClick=${() => setSelected('goal')}>
            <div className="doc-card-head"><strong>Success metric</strong><span className="muted small">Owner: Kim Alvarez</span><span className="grow" /><${Tag} tone="green">Approved<//></div>
            <p>Leaders spot overtime risk by mid-shift.</p>
          </div>
        <//>`}

        <div className="doc-card">
          <div className="doc-card-head"><strong>Requirements</strong><span className="muted small">Grouped by Jira epic</span><span className="grow" />${pending && html`<${Tag} tone="amber">1 pending<//>`}</div>
          ${epics.map(([eid, key, name]) => {
            const items = visible.filter((r) => r.epic === eid);
            if (!items.length) return null;
            const total = reqs.filter((r) => r.epic === eid).length;
            const done = eid === 'E1' ? `1 of ${total} done` : `0 of ${total} done`;
            return html`<div key=${eid} className="epic">
              <div className="epic-head"><${ChevronDown} size=${13} /> <span className="epic-tag">Epic</span> <span className="mono muted">${key}</span> <strong>${name}</strong><span className="grow" /><span className="muted tiny">${done}</span></div>
              ${items.map((r) => html`<${ReqRow} key=${r.id} req=${r} selected=${selected === r.id} onSelect=${() => setSelected(selected === r.id ? null : r.id)} />`)}
            </div>`;
          })}
          ${visible.length === 0 && html`<div className="muted small">No requirements match this slice and filter.</div>`}
        </div>
      </div>

      <aside className="rl-panel" aria-label="Details">
        <${DetailPanel}
          selected=${selected}
          setSelected=${setSelected}
          reqs=${reqs}
          openMap=${openMap}
          setOpen=${(key, open) => setOpenMap((m) => ({ ...m, [key]: open }))}
          onApprove=${onApprove}
        />
      </aside>
    </div>
  </div>`;
}

function ReqRow({ req, selected, onSelect }) {
  const pending = req.status === 'pending';
  return html`<div className=${cx('req', selected && 'selected', pending && 'pending')} onClick=${onSelect}>
    <span className="req-id">${req.id}</span>
    <div className="grow">
      <div className="req-text">${req.text}</div>
      <div className="req-links">
        ${req.links.map((l) => html`<span key=${l} className="chip static">${l}</span>`)}
        ${pending && html`<span className="amber small">Pending · Dana</span><span className="link small">Review</span>`}
        ${req.changed && html`<${Tag} tone="green">Changed in v1.1<//>`}
        ${req.status === 'draft' && html`<span className="chip chip-blue static">Draft · AI from lead notes</span>`}
      </div>
    </div>
  </div>`;
}

/* ---------- Inspector ---------- */

// Shared shell: header on top, collapsible sections scroll, actions pinned at the bottom.
function Inspector({ tag, extraTag, title, from, onClose, top, sections, bottom, foot, openMap, setOpen }) {
  return html`<div className="sp">
    <div className="insp-head">
      <div className="insp-title-row">
        ${tag}${extraTag}<strong className="insp-title">${title}</strong><span className="grow" />
        ${onClose && html`<button className="icon-btn sm" onClick=${onClose} aria-label="Close details"><${X} size=${14} /></button>`}
      </div>
      ${from && html`<div className="insp-from">${from}</div>`}
    </div>
    <div className="sp-body insp-body">
      ${top}
      ${sections.map((s) => {
        const open = s.key in openMap ? openMap[s.key] : s.open;
        return html`<${CollapsibleSection} key=${s.key} label=${s.label} preview=${s.preview} tone=${s.tone} open=${open} onToggle=${() => setOpen(s.key, !open)}>${s.body}<//>`;
      })}
      ${bottom}
    </div>
    ${foot && html`<div className="sp-foot">${foot}</div>`}
  </div>`;
}

const sec = (key, label, open, preview, tone, body) => ({ key, label, open, preview, tone, body });

const SOURCES = html`<div className="chips"><span className="chip static">Kickoff call · Sep 24</span><span className="chip static">Lead notes</span><span className="chip static">Labor spreadsheet</span></div>`;

function DetailPanel({ selected, setSelected, reqs, openMap, setOpen, onApprove }) {
  const { state, dispatch } = useStore();
  const shell = { openMap, setOpen, onClose: () => setSelected(null) };

  if (!selected || selected === 'overview') {
    const r5Draft = state.r5 === 'draft';
    const pending = isPending(state);
    const statusParts = [pending && '1 pending', r5Draft && '1 draft'].filter(Boolean);
    return html`<${Inspector}
      ...${shell}
      onClose=${null}
      tag=${html`<${Tag}>PRD<//>`}
      title="Line Labor Dashboard"
      from=${`Owner Dana Ortiz (PM) · ${prdVersion(state)} · ${state.stage === 'approved' ? 'published Oct 8' : 'published Oct 1'}`}
      sections=${[
        sec('status', 'Status', true, statusParts.length ? statusParts.join(' · ') : 'Up to date', statusParts.length ? 'amber' : 'green', html`
          ${pending && html`<button className="insp-line link-row" onClick=${() => setSelected('R4')}><span className="dot amber" /> R4 · change proposed by Marcus, ${state.stage === 'moreEvidence' ? 'waiting on Marcus' : 'waiting on you'}</button>`}
          ${state.stage === 'approved' && html`<div className="insp-line"><span className="dot green" /> R4 · changed in v1.1 at ${TIMES.approved}</div>`}
          ${r5Draft && html`<button className="insp-line link-row" onClick=${() => setSelected('R5')}><span className="dot blue" /> R5 · drafted by AI from lead notes, not reviewed yet</button>`}
          ${!statusParts.length && html`<div className="insp-line muted">All requirements are reviewed.</div>`}
          <div className="muted tiny">${reqs.filter((r) => r.status === 'approved').length} of ${reqs.length} requirements approved.</div>`),
        sec('sources', 'Sources', false, '3 sources', null, SOURCES),
        sec('linked', 'Linked work', false, '6 tools', null, html`
          <div className="insp-line">Jira · ${state.r5 === 'accepted' ? 5 : 4} tickets</div>
          <div className="insp-line">GitLab · 2 merge requests</div>
          <div className="insp-line">Figma · 2 frames</div>
          <div className="insp-line">Teams · #line-labor</div>
          <div className="insp-line">SharePoint · Labor spreadsheet</div>
          <div className="insp-line">Codex · lab-15-refresh</div>`),
      ]}
    />`;
  }

  if (selected === 'R4') return html`<${R4Panel} ...${shell} onApprove=${onApprove} />`;
  if (selected === 'R5') return html`<${R5Panel} ...${shell} />`;

  if (selected === 'problem') {
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag} tone="green">Approved<//>`}
      title="Problem"
      sections=${[
        sec('statement', 'Statement', true, '', null, html`<p className="small">First-line leaders track labor hours across three spreadsheets. They can't see overtime risk until the end of the week, when it's too late to rebalance crews.</p>`),
        sec('sources', 'Sources', false, '3 sources', null, SOURCES),
        sec('history', 'History', false, 'v1 · Oct 1', null, html`<div className="insp-line">Approved and published by Dana Ortiz · Oct 1</div>`),
      ]}
    />`;
  }

  if (selected === 'goal') {
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag} tone="green">Approved<//>`}
      title="Success metric"
      sections=${[
        sec('statement', 'Statement', true, '', null, html`<p className="small">Leaders spot overtime risk by mid-shift.</p>`),
        sec('owner', 'Owner', false, 'Kim Alvarez', null, html`<div className="activity"><${Avatar} id="kim" size=${20} /><span className="small">Kim Alvarez · Business lead</span></div>`),
        sec('dependsOn', 'Depends on', false, 'R2 · R4', null, html`<p className="small">R2 (85% flag) and R4 (refresh rate). Leaders need at least 3 readings before mid-shift.</p>`),
        sec('history', 'History', false, state.stage === 'approved' && state.updates.metric ? 'Note added Oct 8' : 'v1 · Oct 1', null, html`
          <div className="insp-line">Approved by Dana Ortiz · Oct 1</div>
          ${state.stage === 'approved' && state.updates.metric && html`<div className="insp-line">Note added when R4 changed to hourly · ${TIMES.approved}</div>`}`),
      ]}
    />`;
  }

  const r = reqs.find((x) => x.id === selected);
  if (!r) return null;
  const meta = {
    R1: { tag: ['green', 'Done'], title: 'Labor hours per department', pv: ['Done · Merged', 'green'] },
    R2: { tag: ['neutral', 'In progress'], title: 'Overtime flag', pv: ['In progress', null] },
    R3: { tag: ['neutral', 'In progress'], title: 'Filter by shift', pv: ['Jira · Figma', null] },
  }[r.id];
  return html`<${Inspector}
    ...${shell}
    tag=${html`<${Tag} tone=${meta.tag[0]}>${meta.tag[1]}<//>`}
    title=${`${r.id} · ${meta.title}`}
    sections=${[
      sec('requirement', 'Requirement', true, '', null, html`<p className="small">${r.text}</p>`),
      sec('linked', 'Linked work', false, meta.pv[0], meta.pv[1], html`<div className="chips">${r.links.map((l) => html`<span key=${l} className="chip static">${l}</span>`)}</div>`),
      sec('history', 'History', false, 'v1 · Oct 1', null, html`<div className="insp-line">Approved by Dana Ortiz · Oct 1</div>`),
    ]}
  />`;
}

function OwnerRow({ id, stance, quote }) {
  const p = id === 'priya' ? ['Priya Shah', 'Designer'] : ['Kim Alvarez', 'Business lead'];
  return html`<div className="owner-row">
    <${Avatar} id=${id} size=${22} />
    <div className="grow"><div className="small"><strong>${p[0]}</strong> <span className="muted">${p[1]}</span></div>${stance && quote && html`<div className="small muted">"${quote}"</div>`}</div>
    ${stance ? html`<${Tag} tone=${stance === 'agreed' ? 'green' : 'red'}>${stance === 'agreed' ? 'Agreed' : 'Disagreed'}<//>` : html`<${Tag} tone="amber">No reply yet<//>`}
  </div>`;
}

// Collapsed previews must surface blockers: a missing reply shows in amber, a disagreement in red.
function ownersPreview(stances) {
  const agreed = stances.filter((s) => s === 'agreed').length;
  const disagreed = stances.filter((s) => s === 'disagreed').length;
  const waiting = stances.filter((s) => !s).length;
  const parts = [agreed && `${agreed} agreed`, disagreed && `${disagreed} disagreed`, waiting && `${waiting} waiting`].filter(Boolean);
  return [parts.join(' · '), disagreed ? 'red' : waiting ? 'amber' : 'green'];
}

const fromMarcus = (time, note) => html`<${Avatar} id="marcus" size=${18} /> From Marcus Lee · Developer · via Codex · ${time}${note ? ` · ${note}` : ''}`;

// R4 follows the story stage (frames 06, 07, 07b). Only the layout changed; the flow is the same.
function R4Panel({ onClose, openMap, setOpen, onApprove }) {
  const { state, dispatch } = useStore();
  const [mode, setMode] = useState(null); // null | 'request' | 'confirmDeny'
  const [menu, setMenu] = useState(false);
  const [ask, setAsk] = useState(TEXT.danaAsk);
  const [updates, setUpdates] = useState(state.updates);
  const s = state.stage;
  const priya = state.priya;
  const priyaQuote = priya.note || (priya.stance === 'agreed' ? TEXT.priyaNote : '');
  const shell = { onClose, openMap, setOpen, title: 'R4 · Data refresh rate' };
  const ownersBody = html`
    <${OwnerRow} id="priya" stance=${priya.stance} quote=${priyaQuote} />
    <${OwnerRow} id="kim" stance=${state.kim.stance} quote=${TEXT.kimNote} />
    <div className="muted tiny">Informed, no action needed: Jordan Kim, Sam Reed</div>`;
  const history = html`
    <div className="insp-line">v1 · approved by Dana Ortiz · Oct 1</div>
    ${s !== 'flagged' && html`<div className="insp-line">${TIMES.proposed} · Marcus proposed hourly refresh</div>`}
    ${state.danaAsk && html`<div className="insp-line">${TIMES.moreEvidence} · you asked for more evidence</div>`}
    ${state.marcusReply !== '' || state.evidence.includes('changelog') ? html`<div className="insp-line">${TIMES.resent} · Marcus added the changelog and resent</div>` : null}
    ${s === 'approved' && html`<div className="insp-line">${TIMES.approved} · you approved v1.1</div>`}
    ${s === 'denied' && html`<div className="insp-line">${TIMES.denied} · you denied the change. R4 stays as written</div>`}`;

  if (s === 'flagged' || s === 'denied') {
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag}>In progress<//>`}
      sections=${[
        sec('requirement', 'Requirement', true, '', null, html`<p className="small">${TEXT.r4Old}</p>`),
        sec('linked', 'Linked work', false, 'Jira · Figma', null, html`
          <div className="chips"><span className="chip static">Jira LAB-15 · In progress</span><span className="chip static">Figma · Overview</span></div>
          <div className="muted tiny">Owners: Priya Shah (Figma Overview), Kim Alvarez (success metric)</div>`),
        sec('history', 'History', false, s === 'denied' ? `Change denied ${TIMES.denied}` : 'v1 · Oct 1', null, history),
      ]}
    />`;
  }

  if (s === 'approved') {
    const u = state.updates;
    const followWaiting = [!state.codeUpdated, !state.labelUpdated].filter(Boolean).length;
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag} tone="green">Changed in v1.1<//>`}
      from=${html`<${Avatar} id="dana" size=${18} /> Approved by you · ${TIMES.approved} · proposed by Marcus Lee`}
      sections=${[
        sec('requirement', 'Requirement', true, '', null, html`<${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />`),
        sec('linked', 'Linked work', false, followWaiting ? `${followWaiting} waiting` : 'All updated', followWaiting ? 'amber' : 'green', html`
          ${[[u.jira, 'Jira LAB-15 description'], [u.figma, 'Comment on Figma · Overview for Priya'], [u.teams, 'Post in Teams #line-labor'], [u.metric, 'Note on Success metrics']]
            .filter(([on]) => on).map(([, l]) => html`<div key=${l} className="check-row"><${Check} size=${13} className="green" /> ${l}</div>`)}
          <div className="check-row">${state.codeUpdated ? html`<${Check} size=${13} className="green" />` : html`<${Clock} size=${13} className="amber" />`} Marcus: refresh job ${state.codeUpdated ? 'matches v1.1' : 'not updated yet'}</div>
          <div className="check-row">${state.labelUpdated ? html`<${Check} size=${13} className="green" />` : html`<${Clock} size=${13} className="amber" />`} Priya: Overview label ${state.labelUpdated ? 'shows last sync time' : 'not updated yet'}</div>`),
        sec('history', 'History', false, 'v1.1 · Oct 8', null, html`${history}
          <div className="chips">${state.evidence.map((id) => html`<${EvidenceChip} key=${id} id=${id} variant="short" />`)}</div>`),
      ]}
    />`;
  }

  const resent = s === 'resent';
  const waiting = s === 'moreEvidence';
  const hasNew = state.evidence.includes('changelog');
  const [ownersPv, ownersTone] = ownersPreview([priya.stance, state.kim.stance]);
  const checked = Object.values(updates).filter(Boolean).length;

  const sections = [
    sec('change', 'Change', true, '15 min → hourly', 'amber', html`<${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />`),
    sec('reason', 'Reason', true, 'API batch-loads hourly', null, html`<p className="small">${state.proposal.reason}</p>`),
    sec('evidence', 'Evidence', false, `${state.evidence.length + 1} items${hasNew ? ' · 1 new' : ''}`, hasNew ? 'green' : null, html`
      <div className="chips">
        ${state.evidence.filter((id) => id !== 'changelog').map((id) => html`<${EvidenceChip} key=${id} id=${id} variant="short" tone=${mode === 'request' && id === 'spec' ? 'amber' : null} />`)}
        <span className="chip static">Screen capture</span>
      </div>
      ${hasNew && html`<div className="chips"><${EvidenceChip} id="changelog" variant="short" tone="green" /> <${Tag} tone="green">New<//></div>`}
      ${resent && state.marcusReply && html`<div className="quote-card"><div className="muted tiny">Marcus · ${TIMES.resent}</div><div className="small">${state.marcusReply}</div></div>`}`),
    sec('owners', 'Owners of linked work', false, ownersPv, ownersTone, ownersBody),
    sec('affects', 'Also affects', false, 'Success metric · likely holds', null, html`
      <p className="small">"Leaders spot overtime risk by mid-shift." Hourly data still gives 3 to 4 readings before mid-shift, so the metric likely holds. Check with Kim if unsure.</p>`),
  ];
  if (resent && mode !== 'request') {
    sections.push(sec('updates', 'One approval also updates', true, `${checked} of 4 tools`, null, html`
      ${[['jira', 'Jira', 'Update Jira LAB-15 description'], ['figma', 'Figma', 'Comment on Figma · Overview for Priya'], ['teams', 'Teams', 'Post the change in Teams #line-labor'], ['metric', 'Rea', 'Add a note to Success metrics']].map(
        ([k, tool, label]) => html`<label key=${k} className="update-row">
          <input type="checkbox" checked=${updates[k]} onChange=${() => setUpdates({ ...updates, [k]: !updates[k] })} />
          <span className="chip static">${tool}</span><span className="small">${label}</span>
        </label>`
      )}`));
  }

  const head = {
    ...shell,
    tag: html`<${Tag} tone="amber">Pending<//>`,
    extraTag: resent && html`<${Tag} tone="blue">Updated<//>`,
    from: resent ? fromMarcus(TIMES.resent, 'resent with new evidence') : fromMarcus(TIMES.proposed),
    sections,
  };

  if (mode === 'request') {
    return html`<${Inspector}
      ...${head}
      top=${html`<div className="decision-card">
        <div className="tiny-label">Your decision <span className="grow" /><button className="link tiny" onClick=${() => setMode(null)}>Change</button></div>
        <div className="link-strong"><${History} size=${14} /> Request more evidence</div>
      </div>`}
      bottom=${html`<div className="insp-field">
        <label className="tiny-label" htmlFor="ask-marcus">What do you need from Marcus?</label>
        <textarea id="ask-marcus" className="field focus" rows="4" value=${ask} onInput=${(e) => setAsk(e.target.value)} />
        <div className="muted small">R4 stays pending. Nothing in the PRD changes until you approve.</div>
      </div>`}
      foot=${html`
        <button className="btn btn-ghost" onClick=${() => setMode(null)}>Cancel</button>
        <button className="btn btn-primary" disabled=${!ask.trim()} onClick=${() => { dispatch({ type: 'REQUEST_EVIDENCE', ask: ask.trim() }); setMode(null); }}>Send to Marcus</button>`}
    />`;
  }

  return html`<${Inspector}
    ...${head}
    top=${waiting && html`<div className="waiting-card"><${Clock} size=${14} /><div><strong className="small">Waiting on Marcus</strong><div className="muted small">You asked for more evidence at ${TIMES.moreEvidence}: "${state.danaAsk}"</div></div></div>`}
    bottom=${mode === 'confirmDeny' && html`<div className="confirm-card">
      <strong className="small">Deny this change?</strong>
      <div className="muted small">Closes the proposal. R4 stays as written and Marcus is notified.</div>
      <div className="plg-actions"><button className="btn btn-ghost sm" onClick=${() => setMode(null)}>Cancel</button><button className="btn btn-danger sm" onClick=${() => dispatch({ type: 'DENY' })}>Deny</button></div>
    </div>`}
    foot=${html`
      <div className="split-btn">
        <button className="btn" onClick=${() => setMode('confirmDeny')}>Deny</button>
        <button className="btn split-caret" onClick=${() => setMenu(!menu)} aria-label="More decisions"><${ChevronDown} size=${14} /></button>
        ${menu && html`<div className="menu up">
          <button className="menu-item" disabled=${waiting} onClick=${() => { setMenu(false); setMode('request'); }}><strong><${History} size=${13} /> Request more evidence</strong><span className="muted tiny">Keeps R4 pending and asks Marcus for more.</span></button>
          <button className="menu-item" onClick=${() => { setMenu(false); setMode('confirmDeny'); }}><strong><${X} size=${13} /> Deny</strong><span className="muted tiny">Closes the proposal. R4 stays as written.</span></button>
        </div>`}
      </div>
      <button className="btn btn-primary" onClick=${() => (onApprove ? onApprove(updates) : dispatch({ type: 'APPROVE', updates }))}>${resent ? 'Approve and publish v1.1' : 'Approve & publish'}</button>`}
  />`;
}

function R5Panel({ onClose, openMap, setOpen }) {
  const { state, dispatch } = useStore();
  const shell = { onClose, openMap, setOpen, title: 'R5 · Department detail view' };
  const text = 'Show a department detail view with an hourly breakdown.';
  const draftedFrom = html`
    <div className="quote-card"><div className="muted tiny">Lead notes · Oct 1 · 2nd shift leads</div><div className="small">"When a department runs hot I want to click in and see which hours did it."</div></div>
    <div className="muted tiny">Rea drafted R5 from this note. It has not been reviewed.</div>`;

  if (state.r5 === 'accepted') {
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag}>To do<//>`}
      sections=${[
        sec('requirement', 'Requirement', true, '', null, html`<p className="small">${text}</p>`),
        sec('linked', 'Linked work', false, 'Jira LAB-16 · To do', null, html`<div className="chips"><span className="chip static">Jira LAB-16 · To do</span></div><div className="muted tiny">Created when you accepted the draft.</div>`),
        sec('history', 'History', false, 'Accepted today', null, html`<div className="insp-line">Drafted by Rea from lead notes · Oct 1</div><div className="insp-line">Accepted by you · today</div>`),
      ]}
    />`;
  }

  return html`<${Inspector}
    ...${shell}
    tag=${html`<${Tag} tone="blue">Draft · AI<//>`}
    from=${html`<span className="ai-dot" aria-hidden="true" /> Drafted by Rea from lead notes`}
    sections=${[
      sec('draft', 'Draft', true, '', null, html`<p className="small">${text}</p><div className="muted tiny">Drafts never show as facts in Present.</div>`),
      sec('draftedFrom', 'Drafted from', false, 'Lead notes', null, draftedFrom),
      sec('linked', 'Linked work', false, 'None yet', null, html`<div className="insp-line muted">Gets a Jira ticket once accepted.</div>`),
    ]}
    foot=${html`
      <button className="btn" onClick=${() => dispatch({ type: 'DISCARD_DRAFT' })}>Discard</button>
      <button className="btn btn-primary" onClick=${() => dispatch({ type: 'ACCEPT_DRAFT' })}>Accept draft</button>`}
  />`;
}
