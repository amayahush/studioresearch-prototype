import { html, useState, useEffect, cx, Fragment } from './lib.js';
import { useStore, TEXT, TIMES, R4_INTENT, isPending, r4Text, r4Status, prdVersion } from './store.js';
import { Avatar, Tag, Diff, EvidenceChip, Toast, CollapsibleSection, StatusChip } from './ui.js';
import { TimeSkip, EndCard } from './Interstitials.js';
import { MapView, ScreensView, PresentView } from './AstraViews.js';
import { dashboardLabel } from './Figma.js';
import {
  ChevronDown, Search, Inbox, CircleUser, FileText, Settings, HelpCircle, X, History, Check, Clock, PanelLeft,
  Box, GitBranch, Frame, MessageSquare, Folder, Code, Upload,
} from 'lucide-react';

export const TOOLS = [['Jira', '2m', Box], ['GitLab', '5m', GitBranch], ['Figma', '1m', Frame], ['Teams', 'live', MessageSquare], ['SharePoint', '10m', Folder], ['Codex', 'live', Code]];

// Requirements carry two separate signals: approval (who signed off) and assumption status
// (whether anyone checked it). "Approved + Assumed" is the state this story is about.
export function getReqs(state) {
  const pending = isPending(state);
  const r4 = r4Status(state);
  const reqs = [
    {
      id: 'R1', epic: 'E1', name: 'Hours by department', text: 'Show labor hours per department for the current shift.', links: ['Jira LAB-12 · Done', 'GitLab !205 · Merged'], status: 'approved', slices: ['dev', 'design', 'sme'],
      assume: 'verified', note: 'LAB-12 merged and tested on the sandbox API.', evidence: ['GitLab !205', 'Sandbox test · Sep 30'],
    },
    {
      id: 'R2', epic: 'E1', name: 'Overtime flag', text: 'Flag any department above 85% of planned hours.', links: ['Jira LAB-13 · In progress'], status: 'approved', slices: ['dev', 'business'],
      assume: 'conflicting', sources: 3, note: 'Kickoff says 85%, lead notes say 90%, the SME sync says 80%.', decision: true,
      intent: { quote: 'Anything past 85 and we\'re already paying overtime by Friday.', speaker: 'Kim Alvarez · Business lead', source: 'Kickoff transcript 14:05', goal: 'Spot overtime risk by mid-shift (success metric)' },
    },
    {
      id: 'R4', epic: 'E1', name: 'Data refresh rate', text: r4Text(state), links: ['Jira LAB-15 · In progress', 'Figma · Overview'],
      status: pending ? 'pending' : 'approved', changed: state.stage === 'approved', slices: ['dev', 'design', 'sme', 'business'],
      assume: r4, canVerify: 'Ravi Patel · Timekeeping data owner',
      note: r4 === 'verified' ? 'Tested against the timekeeping API and approved in v1.1.' : r4 === 'contradicted' ? 'Marcus\'s build found the API syncs hourly (PT1H).' : 'Set at kickoff Oct 1. Never checked against the API.',
      intent: R4_INTENT,
    },
    {
      id: 'R6', epic: 'E1', name: 'Crews by lead', text: 'Show each crew lead their own departments first.', links: [], status: 'approved', slices: ['design', 'business'],
      assume: 'assumed', canVerify: 'Kim Alvarez · Business lead', note: 'Heard once on a lead sync call. Not in the kickoff notes.',
      intent: { quote: 'I only care about my guys. Show me my crews before anything else.', speaker: '2nd shift lead', source: 'Lead sync call · Oct 3, 07:15', goal: 'Leads act on their own crews by mid-shift' },
    },
    {
      id: 'R3', epic: 'E2', name: 'Shift filter', text: 'Let leaders filter by shift (1st, 2nd, 3rd).', links: ['Jira LAB-14 · In progress', 'Figma · Filters'], status: 'approved', slices: ['dev', 'design'],
      assume: 'assumed', canVerify: 'Sam Reed · SME', note: 'From kickoff 22:10. Never confirmed.',
      intent: { quote: 'Second shift never looks at first shift\'s numbers.', speaker: 'Sam Reed · SME', source: 'Kickoff transcript 22:10', goal: 'Each lead sees only their shift' },
    },
    {
      id: 'R5', epic: 'E2', name: 'Department detail view', text: 'Show a department detail view with an hourly breakdown.',
      links: state.r5 === 'accepted' ? ['Jira LAB-16 · To do'] : [], status: state.r5 === 'accepted' ? 'approved' : 'draft', slices: ['design', 'business'],
      assume: 'assumed', canVerify: 'Kim Alvarez · Business lead', note: 'AI draft from lead notes p.3. Not discussed on a call.',
    },
    {
      id: 'R7', epic: 'E3', name: 'Overtime alerts', text: 'Send the shift lead a Teams alert when a department crosses the overtime threshold.', links: [], status: 'approved', slices: ['dev', 'business'],
      assume: 'assumed', canVerify: 'Jordan Kim · Ops analyst', note: 'Raised at kickoff 31:20. Nobody agreed who gets the alert.',
      intent: { quote: 'Can it just ping me when somebody\'s running hot?', speaker: 'Kim Alvarez · Business lead', source: 'Kickoff transcript 31:20', goal: 'Spot overtime risk by mid-shift (success metric)' },
    },
    {
      id: 'R8', epic: 'E3', name: 'Shift history', text: 'Keep 90 days of shift history for weekly labor reviews.', links: [], status: 'approved', slices: ['dev', 'sme'],
      assume: 'assumed', canVerify: 'Sam Reed · SME', note: 'Sam estimated 90 days on the SME call. Retention policy not checked.',
      intent: { quote: 'We usually look back about three months, I think.', speaker: 'Sam Reed · SME', source: 'SME sync · Oct 4, 12:05', goal: 'Weekly labor reviews' },
    },
  ];
  return state.r5 === 'discarded' ? reqs.filter((r) => r.id !== 'R5') : reqs;
}

export const unverified = (reqs) => reqs.filter((r) => r.assume !== 'verified').length;

const VIEWS = [['doc', 'Doc'], ['map', 'Map'], ['screens', 'Screens'], ['present', 'Present']];
const ICON = { size: 15, strokeWidth: 1.5, 'aria-hidden': 'true' };

const NAV_KEY = 'astra-sidebar-open';

function loadNavOpen() {
  try {
    return localStorage.getItem(NAV_KEY) !== 'closed';
  } catch {
    return true;
  }
}

export function Astra() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(isPending(state) ? 'R4' : null);
  const [skip, setSkip] = useState(null);
  const [endCard, setEndCard] = useState(false);
  const [toast, setToast] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(loadNavOpen);
  const pending = isPending(state);
  const inbox = ['proposed', 'resent'].includes(state.stage) ? 1 : 0;
  const view = state.astraView;

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
  const ownPath = state.startedAs === 'dana';

  // Dana's path (brief §8): 00 publish v1 → skip a week → 06 review → skip → 07 decision record → end card.
  const story = {
    publish: () => {
      dispatch({ type: 'PUBLISH_V1' });
      setSelected(null);
      setSkip({
        day: 'Oct 8', from: '9:00 AM', to: TIMES.priya, title: 'A week later, R4 gets tested',
        events: [
          { time: TIMES.flagged, who: 'marcus', text: 'Marcus\'s Codex build tested R4: the API syncs hourly (PT1H)' },
          { time: TIMES.proposed, who: 'marcus', text: 'Marcus proposed refreshing hourly, with evidence' },
          { time: TIMES.priya, who: 'priya', text: 'Priya agreed: she\'ll relabel the Overview to show the last sync time' },
        ],
        onDone: () => { dispatch({ type: 'PROPOSAL_ARRIVES' }); setSelected('R4'); },
      });
    },
    approved: () => {
      if (!ownPath) return;
      setSkip({
        from: TIMES.approved, to: '2:26 PM', title: 'v1.1 is out',
        events: [
          { time: '2:24 PM', who: 'marcus', text: 'Marcus updated the refresh job to match v1.1' },
          { time: '2:26 PM', who: 'priya', text: `Priya relabeled the Overview: "${dashboardLabel({ ...state, stage: 'approved', labelUpdated: true })}"` },
        ],
        onDone: () => { dispatch({ type: 'UPDATE_CODE' }); dispatch({ type: 'UPDATE_LABEL' }); setSelected('R4'); },
      });
    },
    done: () => (ownPath ? setEndCard(true) : setSelected(null)),
  };
  const endSteps = [
    { time: 'Oct 1', who: 'You', text: 'published v1 with R4 still assumed' },
    { time: TIMES.flagged, who: 'Marcus\'s build', text: 'contradicted R4: the API syncs hourly' },
    { time: TIMES.proposed, who: 'Marcus', text: 'proposed hourly refresh, with evidence' },
    { time: TIMES.priya, who: 'Priya', text: 'agreed and offered to relabel the Overview' },
    ...(state.danaAsk ? [{ time: TIMES.moreEvidence, who: 'You', text: 'asked for more evidence' }, { time: TIMES.resent, who: 'Marcus', text: 'added the data owner\'s changelog' }] : []),
    { time: TIMES.approved, who: 'You', text: 'approved v1.1 with a reason. R4 is verified' },
    { time: '2:26 PM', who: 'Marcus and Priya', text: 'updated the code and the label' },
  ];

  const notSimulated = (what) => () => setToast(`${what} is not simulated in this prototype.`);

  return html`<div className="astra">
    <nav className=${cx('rl-side', !navOpen && 'collapsed')} aria-label="Workspace">
      ${navOpen
        ? html`<${Fragment}>
            <div className="rl-org-row">
              <button className="rl-org" onClick=${notSimulated('Switching workspaces')}><span className="rl-org-name">Manufacturing Systems</span><${ChevronDown} size=${12} strokeWidth=${1.5} aria-hidden="true" /></button>
              <span className="grow" />
              <button className="rl-nav-toggle" onClick=${() => setNavOpen(false)} aria-label="Collapse sidebar" aria-expanded="true" title="Collapse sidebar">
                <${PanelLeft} size=${16} strokeWidth=${1.5} aria-hidden="true" />
              </button>
            </div>
            <button className="rl-search" onClick=${notSimulated('Search')}><${Search} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span className="grow">Search</span><span className="rl-kbd">⌘K</span></button>
            <button className="rl-nav" onClick=${openInbox}>
              <${Inbox} ...${ICON} /><span className="rl-nav-label">Inbox</span><span className=${cx('rl-count', inbox && 'hot')}>${inbox || ''}</span>
            </button>
            <button className="rl-nav" onClick=${notSimulated('My work')}><${CircleUser} ...${ICON} /><span className="rl-nav-label">My work</span></button>
            <div className="rl-group">Projects</div>
            <button className="rl-nav active" aria-current="page" onClick=${openProject}><${FileText} ...${ICON} /><span className="rl-nav-label">Line Labor Dashboard</span></button>
            <button className="rl-nav" onClick=${notSimulated('Other projects')}><${FileText} ...${ICON} /><span className="rl-nav-label">Compliance Tracker</span></button>
            <button className="rl-nav" onClick=${notSimulated('Other projects')}><${FileText} ...${ICON} /><span className="rl-nav-label">Shift Handoff</span></button>
            <div className="rl-group">Connected tools</div>
            ${TOOLS.map(([t, ago, Icon]) => html`<div key=${t} className="rl-nav static"><${Icon} ...${ICON} /><span className="rl-nav-label">${t}</span><span className="rl-meta mono">${ago}</span></div>`)}
            <span className="grow" />
            <button className="rl-nav" onClick=${notSimulated('Settings')}><${Settings} ...${ICON} /><span className="rl-nav-label">Settings</span></button>
            <button className="rl-nav" onClick=${notSimulated('Help')}><${HelpCircle} ...${ICON} /><span className="rl-nav-label">Help</span></button>
          <//>`
        : html`<div className="rl-rail">
            <button className="rail-btn" onClick=${() => setNavOpen(true)} aria-label="Expand sidebar" aria-expanded="false" data-tip="Expand sidebar">
              <${PanelLeft} size=${16} strokeWidth=${1.5} aria-hidden="true" />
            </button>
            <span className="rail-divider" />
            <button className="rail-btn" onClick=${() => setNavOpen(true)} aria-label="Search" data-tip="Search"><${Search} ...${ICON} /></button>
            <button className="rail-btn" onClick=${openInbox} aria-label=${inbox ? `Inbox, ${inbox} waiting` : 'Inbox'} data-tip=${inbox ? `Inbox · ${inbox} waiting` : 'Inbox'}>
              <${Inbox} ...${ICON} />${inbox > 0 && html`<span className="rail-badge" />`}
            </button>
            <button className="rail-btn" aria-label="My work" data-tip="My work"><${CircleUser} ...${ICON} /></button>
            <button className="rail-btn active" onClick=${openProject} aria-label="Line Labor Dashboard (current project)" aria-current="page" data-tip="Line Labor Dashboard">
              <${FileText} ...${ICON} />
            </button>
          </div>`}
    </nav>

    <section className="rl-main">
      <header className="rl-top">
        <span className="rl-top-title">Line Labor Dashboard</span>
        <${Tag} tone=${pending ? 'amber' : state.stage === 'approved' ? 'green' : 'neutral'}>${prdVersion(state)}${pending ? ' · 1 pending' : ''}<//>
        <span className="tag tag-outline" title="Requirements nobody has confirmed yet">${unverified(getReqs(state))} unverified</span>
        <span className="grow" />
        <div className="seg" role="group" aria-label="View">
          ${VIEWS.map(([id, label]) => html`<button key=${id} className=${cx('seg-btn', view === id && 'active')} aria-pressed=${view === id} onClick=${() => dispatch({ type: 'SET_VIEW', view: id })}>${label}</button>`)}
        </div>
        <div className="export-wrap">
          <button className="icon-btn rl-export" onClick=${() => setExportOpen(!exportOpen)} aria-label="Export" aria-haspopup="menu" aria-expanded=${exportOpen} title="Export"><${Upload} size=${16} strokeWidth=${1.5} aria-hidden="true" /></button>
          ${exportOpen && html`<div className="menu" role="menu">
            ${[['PDF', 'Full PRD with evidence'], ['PowerPoint (.pptx)', 'From the Present view'], ['Image (PNG)', 'Current view'], ['Copy link', 'Opens this view']].map(
              ([t, d]) => html`<button key=${t} role="menuitem" className="menu-item" onClick=${() => { setExportOpen(false); setToast(`${t}: export is not simulated in this prototype.`); }}><strong>${t}</strong><span className="muted tiny">${d}</span></button>`
            )}
          </div>`}
        </div>
        <button className="btn" onClick=${() => setToast('Sharing is not simulated in this prototype.')}>Share</button>
        <span className="rl-me"><${Avatar} id="dana" size=${28} /></span>
      </header>
      <${Body} selected=${selected} setSelected=${setSelected} toast=${setToast} story=${story} />
    </section>
    ${skip && html`<${TimeSkip} ...${skip} onDone=${() => { skip.onDone(); setSkip(null); }} />`}
    ${endCard && html`<${EndCard}
      role="Product manager"
      title="R4 is verified, and the decision is on record."
      steps=${endSteps}
      exploreLabel="Explore the Map"
      onClose=${() => setEndCard(false)}
      onStart=${() => dispatch({ type: 'SET_ROLE', role: null })}
      onExplore=${() => { setEndCard(false); dispatch({ type: 'SET_VIEW', view: 'map' }); }}
    />`}
    <${Toast} text=${toast} />
  </div>`;
}

const SLICES = [['main', 'Main PRD'], ['dev', 'Developer'], ['design', 'Design'], ['sme', 'SME'], ['business', 'Business']];

const FILTERS = [['all', 'All requirements'], ['approved', 'Approved'], ['pending', 'Pending'], ['draft', 'Draft']];

function DocView({ selected, setSelected, story }) {
  const { state } = useStore();
  const [slice, setSlice] = useState('main');
  const [filter, setFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [closedEpics, setClosedEpics] = useState({});
  // Open/closed choices by section key, kept across selections that share a section.
  const [openMap, setOpenMap] = useState({});
  const reqs = getReqs(state);
  const pending = isPending(state);
  const count = (st) => (st === 'all' ? reqs.length : reqs.filter((r) => r.status === st).length);
  const visible = reqs.filter((r) => (slice === 'main' || r.slices.includes(slice)) && (filter === 'all' || r.status === filter));
  const epics = [
    ['E1', 'LAB-E1', 'Live labor visibility'],
    ['E2', 'LAB-E2', 'Filtering and drill-down'],
    ['E3', 'LAB-E3', 'Alerts and history'],
  ];
  const filterLabel = FILTERS.find(([id]) => id === filter)[1];

  useEffect(() => {
    if (selected === 'R5' && state.r5 === 'discarded') setSelected(null);
  }, [state.r5]);

  return html`<div className="rl-doc-wrap">
    <div className="rl-subbar">
      <nav className="slices" aria-label="Slices">
        ${SLICES.map(([id, label]) => html`<button key=${id} className=${cx('slice', slice === id && 'active')} aria-current=${slice === id ? 'true' : undefined} onClick=${() => setSlice(id)}>
          ${label}${pending && id !== 'sme' && html`<span className="dot amber" aria-label="has a pending change" />`}
        </button>`)}
      </nav>
      <span className="grow" />
      <div className="export-wrap">
        <button className="rl-filter" aria-haspopup="menu" aria-expanded=${filterOpen} onClick=${() => setFilterOpen(!filterOpen)}>
          ${filterLabel} <span className="muted">${count(filter)}</span><${ChevronDown} size=${12} strokeWidth=${1.5} aria-hidden="true" />
        </button>
        ${filterOpen && html`<div className="menu" role="menu">
          ${FILTERS.map(([id, label]) => html`<button key=${id} role="menuitemradio" aria-checked=${filter === id} className=${cx('menu-item row', filter === id && 'on')} onClick=${() => { setFilter(id); setFilterOpen(false); }}>
            <strong>${id === 'pending' && html`<span className="dot amber" />`}${id === 'draft' && html`<span className="dot blue" />`}${label}<span className="grow" /><span className="muted">${count(id)}</span></strong>
          </button>`)}
        </div>`}
      </div>
    </div>

    <div className="rl-split">
      <div className="rl-doc" onClick=${(e) => e.target === e.currentTarget && setSelected(null)}>
        <div className="rl-doc-inner">
          <button className="doc-title" aria-pressed=${!selected || selected === 'overview'} onClick=${() => setSelected('overview')}>
            <h1>Line Labor Dashboard</h1>
            <div className="doc-meta">Owner Dana Ortiz (PM) · ${prdVersion(state)} · ${state.stage === 'approved' ? `published Oct 8, ${TIMES.approved}` : state.stage === 'unpublished' ? 'not published yet' : 'published Oct 1'} · Sources: kickoff call, lead notes, labor spreadsheet</div>
          </button>

          ${(slice === 'main' || slice === 'business') && filter === 'all' && html`<${Fragment}>
            <div className="doc-divider" />
            <button className=${cx('doc-sec', selected === 'problem' && 'selected')} onClick=${() => setSelected('problem')}>
              <div className="doc-sec-head"><span className="section-label">Problem</span><span className="grow" /><${Tag} tone="green">Approved<//></div>
              <p>First-line leaders track labor hours across three spreadsheets. They can't see overtime risk until the end of the week, when it's too late to rebalance crews.</p>
            </button>
            <div className="doc-divider" />
            <button className=${cx('doc-sec', selected === 'goal' && 'selected')} onClick=${() => setSelected('goal')}>
              <div className="doc-sec-head"><span className="section-label">Success metric</span><span className="doc-sec-note">· owner Kim Alvarez</span><span className="grow" /><${Tag} tone="green">Approved<//></div>
              <p>Leaders spot overtime risk by mid-shift.</p>
            </button>
          <//>`}

          <div className="doc-divider" />
          <div className="doc-sec-head"><span className="section-label">Requirements</span><span className="doc-sec-note">· grouped by Jira epic</span><span className="grow" />${pending && html`<${Tag} tone="amber">1 pending<//>`}</div>
          ${epics.map(([eid, key, name]) => {
            const items = visible.filter((r) => r.epic === eid);
            if (!items.length) return null;
            const total = reqs.filter((r) => r.epic === eid).length;
            const done = eid === 'E1' ? `1 of ${total} done` : `0 of ${total} done`;
            const open = !closedEpics[eid];
            return html`<div key=${eid} className=${cx('epic', !open && 'closed')}>
              <button className="epic-head" aria-expanded=${open} onClick=${() => setClosedEpics({ ...closedEpics, [eid]: open })}><${ChevronDown} size=${12} strokeWidth=${1.5} className="epic-chev" aria-hidden="true" /><span className="mono epic-key">${key}</span><span className="epic-name">${name}</span><span className="epic-done">${done}</span></button>
              ${open && items.map((r) => html`<${ReqRow} key=${r.id} req=${r} selected=${selected === r.id} onSelect=${() => setSelected(selected === r.id ? null : r.id)} />`)}
            </div>`;
          })}
          ${visible.length === 0 && html`<div className="muted small">No requirements match this slice and filter.</div>`}
          ${state.stage === 'approved' && (state.codeUpdated || state.labelUpdated) && html`<div className="doc-info">
            ${state.codeUpdated && html`<span>LAB-15 updated to hourly.</span>`}
            ${state.labelUpdated && html`<span>Priya's Figma label now reads “${dashboardLabel(state)}”.</span>`}
          </div>`}
        </div>
      </div>

      <aside className="rl-panel" aria-label="Details">
        <${DetailPanel}
          selected=${selected}
          setSelected=${setSelected}
          reqs=${reqs}
          story=${story}
          openMap=${openMap}
          setOpen=${(key, open) => setOpenMap((m) => ({ ...m, [key]: open }))}
        />
      </aside>
    </div>
  </div>`;
}

function ReqRow({ req, selected, onSelect }) {
  const pending = req.status === 'pending';
  const draft = req.status === 'draft';
  return html`<button className=${cx('req', selected && 'selected', pending && 'pending', req.changed && 'verified', draft && 'draft')} onClick=${onSelect} aria-pressed=${selected}>
    <span className="req-id mono">${req.id}</span>
    <span className="req-main">
      <span className="req-text">${req.text}</span>
      <span className="req-links">
        ${req.links.map((l) => html`<span key=${l} className="doc-chip">${l}</span>`)}
        <${StatusChip} status=${req.assume} sources=${req.sources} changedIn=${req.changed && 'v1.1'} />
        ${req.changed && html`<${Tag} tone="green">Changed in v1.1<//>`}
        ${draft && html`<${Tag} tone="blue">Draft · AI from lead notes<//>`}
        ${pending && html`<span className="req-review">Review</span>`}
      </span>
    </span>
  </button>`;
}

/* ---------- Inspector ---------- */

// Shared shell: 52px header (ID, title, status, close), collapsible sections scroll, actions pinned at the bottom.
function Inspector({ tag, extraTag, title, from, onClose, top, sections, bottom, foot, openMap, setOpen }) {
  const m = /^(R\d) · (.+)$/.exec(title);
  return html`<div className="sp">
    <div className="insp-head">
      ${m && html`<span className="insp-id mono">${m[1]}</span>`}
      <span className="insp-title">${m ? m[2] : title}</span>
      ${extraTag}${tag}
      ${onClose && html`<button className="icon-btn" onClick=${onClose} aria-label="Close details"><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>`}
    </div>
    <div className="sp-body insp-body">
      ${from && html`<div className="insp-from">${from}</div>`}
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

function DetailPanel({ selected, setSelected, reqs, openMap, setOpen, story }) {
  const { state, dispatch } = useStore();
  const shell = { openMap, setOpen, onClose: () => setSelected(null) };

  if (state.stage === 'unpublished' && (!selected || selected === 'overview')) return html`<${AssumptionCheck} reqs=${reqs} onSelect=${setSelected} onPublish=${story.publish} />`;

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

  if (selected === 'R4') return html`<${R4Panel} ...${shell} story=${story} />`;
  if (selected === 'R5') return html`<${R5Panel} ...${shell} req=${reqs.find((x) => x.id === 'R5')} />`;

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
  const work = r.links.length ? r.links.join(' · ').replace(/Jira |GitLab /g, '') : 'None yet';
  return html`<${Inspector}
    ...${shell}
    title=${`${r.id} · ${r.name}`}
    sections=${[
      sec('requirement', 'Requirement', true, '', null, html`<p>${r.text}</p>`),
      statusSection(r),
      ...(r.intent ? [whySection(r.intent)] : []),
      sec('linked', 'Linked work', false, work, null, r.links.length
        ? html`<div className="chips">${r.links.map((l) => html`<span key=${l} className="chip static">${l}</span>`)}</div>`
        : html`<div className="insp-line">No ticket yet. One is created when the work is planned.</div>`),
      sec('history', 'History', false, 'v1 · Oct 1', null, html`<div className="insp-line">Approved by Dana Ortiz in v1 · Oct 1</div>`),
    ]}
  />`;
}

// Status: is the requirement checked? Same section on every slice (spec §5).
const STATUS_WORD = { verified: 'Verified', assumed: 'Assumed', conflicting: 'Conflicting', contradicted: 'Contradicted' };
function statusSection(r) {
  return sec('status', 'Status', true, STATUS_WORD[r.assume], r.assume === 'verified' ? 'green' : r.assume === 'assumed' ? 'amber' : 'red', html`
    <p>${r.note}</p>
    ${r.evidence && html`<div className="chips">${r.evidence.map((e) => html`<span key=${e} className="chip static">${e}</span>`)}</div>`}
    ${r.decision ? html`<div className="insp-line">Needs a decision from you.</div>` : r.canVerify && r.assume !== 'verified' && html`<div className="insp-line">Can confirm: ${r.canVerify}</div>`}`);
}

// "Why this exists": the line from a call the requirement was written from.
function WhyCard({ intent }) {
  return html`<div className="why-card">
    <p className="why-quote">“${intent.quote}”</p>
    <div className="small muted">${intent.speaker} · ${intent.source}</div>
    <div className="why-goal">Intent: ${intent.goal}</div>
  </div>`;
}
const whySection = (intent) => sec('why', 'Why this exists', true, '', null, html`<${WhyCard} intent=${intent} />`);

// Screen 00: before Dana publishes v1, list what nobody has confirmed and who could confirm it.
function AssumptionCheck({ reqs, onSelect, onPublish }) {
  const [asked, setAsked] = useState({});
  const [toast, setToast] = useState('');
  const open = reqs.filter((r) => r.assume !== 'verified');
  return html`<div className="sp">
    <div className="insp-head"><span className="insp-title">Assumption check · before v1</span></div>
    <div className="sp-body">
      <p className="muted">${open.length} requirements rest on something nobody has confirmed. Each one names who could confirm it, so the check happens before anyone builds on it.</p>
      ${open.map((r) => {
        const first = r.canVerify && r.canVerify.split(' ')[0];
        return html`<div key=${r.id} className="check-card">
          <div className="check-card-top">
            <button className="check-card-name" onClick=${() => onSelect(r.id)}><span className="mono muted">${r.id}</span> ${r.name}</button>
            <${StatusChip} status=${r.assume} sources=${r.sources} />
          </div>
          <div className="small muted">${r.note}</div>
          <div className="check-card-foot">
            ${r.decision
              ? html`<span className="small">Needs a decision from you</span>`
              : html`<span className="small grow">Can confirm: ${r.canVerify}</span>
                  <button className="btn sm" disabled=${asked[r.id]} onClick=${() => { setAsked({ ...asked, [r.id]: true }); setToast(`Asking ${first} is not simulated in this prototype.`); }}>${asked[r.id] ? 'Asked' : `Ask ${first}`}</button>`}
          </div>
        </div>`;
      })}
      ${toast && html`<div className="small muted">${toast}</div>`}
    </div>
    <div className="sp-foot check-foot">
      <p className="tiny muted">You can still publish. Unconfirmed items stay marked Assumed in every slice.</p>
      <div className="check-actions">
        <span className="grow" />
        <button className="btn" onClick=${onPublish}>Publish anyway</button>
        <button className="btn btn-primary" onClick=${() => setToast('Sending checks is not simulated. Choose Publish anyway to continue the story.')}>Send checks</button>
      </div>
    </div>
  </div>`;
}

function OwnerRow({ id, stance, quote }) {
  const p = id === 'priya' ? ['Priya Shah', 'Designer'] : ['Kim Alvarez', 'Business lead'];
  return html`<div className="owner-row">
    <${Avatar} id=${id} size=${24} />
    <div className="grow"><div className="owner-line"><span className="grow"><span className="strong-500">${p[0]}</span> <span className="muted">${p[1]}</span></span>${stance ? html`<${Tag} tone=${stance === 'agreed' ? 'green' : 'neutral'}>${stance === 'agreed' ? 'Agreed' : 'Disagreed'}<//>` : html`<${Tag}>No reply yet<//>`}</div>${stance && quote && html`<div className="muted">“${quote}”</div>`}</div>
  </div>`;
}

// Collapsed previews must surface blockers: a missing reply or a disagreement shows in amber.
function ownersPreview(stances) {
  const agreed = stances.filter((s) => s === 'agreed').length;
  const disagreed = stances.filter((s) => s === 'disagreed').length;
  const waiting = stances.filter((s) => !s).length;
  const parts = [agreed && `${agreed} agreed`, disagreed && `${disagreed} disagreed`, waiting && `${waiting} waiting`].filter(Boolean);
  return [parts.join(' · '), disagreed || waiting ? 'amber' : 'green'];
}

const person = (id, line, meta) => html`<${Avatar} id=${id} size=${26} /><div className="grow"><div className="strong-500">${line}</div><div className="small muted">${meta}</div></div>`;
const fromMarcus = (time, note) => person('marcus', note ? `Marcus Lee ${note}` : 'Marcus Lee proposed a change', `Developer · via Codex · ${time}`);

// R4 follows the story stage (frames 06, 07, 07b). Only the layout changed; the flow is the same.
function R4Panel({ onClose, openMap, setOpen, story }) {
  const { state, dispatch } = useStore();
  const req = getReqs(state).find((r) => r.id === 'R4');
  const [reason, setReason] = useState('');
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
  const changeCard = html`<div className="rl-status pending">
    <div className="rl-status-top"><${Clock} size=${16} strokeWidth=${1.5} aria-hidden="true" /><span className="grow">Refresh interval</span><${Tag} tone="amber">Pending<//></div>
    <${Diff} from=${TEXT.r4Old} to=${state.proposal.text} />
    <p className="rl-status-note">${state.proposal.reason}</p>
  </div>`;
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
      tag=${html`<${StatusChip} status=${req.assume} />`}
      sections=${[
        sec('requirement', 'Requirement', true, '', null, html`<p className="small">${TEXT.r4Old}</p>`),
        statusSection(req),
        whySection(R4_INTENT),
        sec('linked', 'Linked work', false, 'Jira · Figma', null, html`
          <div className="chips"><span className="chip static">Jira LAB-15 · In progress</span><span className="chip static">Figma · Overview</span></div>
          <div className="muted tiny">Owners: Priya Shah (Figma Overview), Kim Alvarez (success metric)</div>`),
        sec('history', 'Decision record', false, s === 'denied' ? `Change denied ${TIMES.denied}` : 'v1 · Oct 1', null, history),
      ]}
    />`;
  }

  if (s === 'approved') return html`<${DecisionRecord} onClose=${onClose} onDone=${story.done} />`;

  const resent = s === 'resent';
  const waiting = s === 'moreEvidence';
  const hasNew = state.evidence.includes('changelog');
  const [ownersPv, ownersTone] = ownersPreview([priya.stance, state.kim.stance]);
  const checked = Object.values(updates).filter(Boolean).length;

  const sections = [
    statusSection({ ...req, assume: 'contradicted' }),
    { ...whySection(R4_INTENT), open: false },
    sec('evidence', 'Evidence', true, `${state.evidence.length + 1} items${hasNew ? ' · 1 new' : ''}`, null, html`
      <div className="chips">
        ${state.evidence.filter((id) => id !== 'changelog').map((id) => html`<${EvidenceChip} key=${id} id=${id} variant="short" tone=${mode === 'request' && id === 'spec' ? 'amber' : null} />`)}
        <span className="chip static">Screen capture</span>
      </div>
      ${hasNew && html`<div className="chips"><${EvidenceChip} id="changelog" variant="short" /> <${Tag}>New<//></div>`}
      ${resent && state.marcusReply && html`<div className="quote-card"><div className="muted tiny">Marcus · ${TIMES.resent}</div><div className="small">${state.marcusReply}</div></div>`}`),
    sec('owners', 'Owners of linked work', true, ownersPv, ownersTone, ownersBody),
    sec('affects', 'Also affects', false, 'Success metric · likely holds', null, html`
      <p className="small">"Leaders spot overtime risk by mid-shift." Hourly data still gives 3 to 4 readings before mid-shift, so the metric likely holds. Check with Kim if unsure.</p>`),
  ];
  if (resent && mode !== 'request') {
    sections.push(sec('updates', 'One approval also updates', true, `${checked} of 4 tools`, null, html`
      ${[['jira', 'Jira', 'Update Jira LAB-15 description'], ['figma', 'Figma', 'Comment on Figma · Overview for Priya'], ['teams', 'Teams', 'Post the change in Teams #line-labor'], ['metric', 'Astra', 'Add a note to Success metrics']].map(
        ([k, tool, label]) => html`<label key=${k} className="update-row">
          <input type="checkbox" checked=${updates[k]} onChange=${() => setUpdates({ ...updates, [k]: !updates[k] })} />
          <span className="small grow">${label}</span><span className="muted tiny">${tool}</span>
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
      top=${html`${changeCard}<div className="decision-card">
        <div className="tiny-label">Your decision <span className="grow" /><button className="link tiny" onClick=${() => setMode(null)}>Change</button></div>
        <div className="link-strong"><${History} size=${14} strokeWidth=${1.5} aria-hidden="true" /> Request more evidence</div>
      </div>`}
      bottom=${html`<div className="insp-field">
        <label className="tiny-label" htmlFor="ask-marcus">What do you need from Marcus?</label>
        <textarea id="ask-marcus" className="field focus" rows="4" value=${ask} onInput=${(e) => setAsk(e.target.value)} />
        <div className="muted small">R4 stays pending. Nothing in the PRD changes until you approve.</div>
      </div>`}
      foot=${html`
        <span className="grow" />
        <button className="btn btn-ghost" onClick=${() => setMode(null)}>Cancel</button>
        <button className="btn btn-primary" disabled=${!ask.trim()} onClick=${() => { dispatch({ type: 'REQUEST_EVIDENCE', ask: ask.trim() }); setMode(null); }}>Send to Marcus</button>`}
    />`;
  }

  return html`<${Inspector}
    ...${head}
    top=${html`${waiting && html`<div className="waiting-card"><${Clock} size=${16} strokeWidth=${1.5} aria-hidden="true" /><div><div className="strong-500">Waiting on Marcus</div><div className="muted small">You asked for more evidence at ${TIMES.moreEvidence}: “${state.danaAsk}”</div></div></div>`}${changeCard}`}
    bottom=${mode === 'confirmDeny' ? html`<div className="confirm-card" role="alertdialog" aria-label="Deny this change?">
      <div className="strong-500">Deny this change?</div>
      <div className="muted small">Closes the proposal. R4 stays as written and Marcus is notified.</div>
      <div className="confirm-actions"><button className="btn btn-ghost sm" onClick=${() => setMode(null)}>Cancel</button><button className="btn sm" onClick=${() => dispatch({ type: 'DENY' })}>Deny</button></div>
    </div>` : html`<div className="insp-field approve-field">
      <label className="tiny-label" htmlFor="approve-reason">Reason for approving · required</label>
      <textarea id="approve-reason" className="field" rows="3" placeholder="Why does this change hold up?" value=${reason} onInput=${(e) => setReason(e.target.value)} />
      <button className=${cx('link small', reason && 'hidden')} onClick=${() => setReason(TEXT.approvalReason)}>Use suggested reason</button>
    </div>`}
    foot=${html`
      <span className="grow" />
      <div className="export-wrap">
        <button className="btn deny-btn" aria-haspopup="menu" aria-expanded=${menu} onClick=${() => setMenu(!menu)}>Deny <${ChevronDown} size=${12} strokeWidth=${1.5} aria-hidden="true" /></button>
        ${menu && html`<div className="menu up" role="menu">
          <button role="menuitem" className="menu-item" disabled=${waiting} onClick=${() => { setMenu(false); setMode('request'); }}><strong><${History} size=${14} strokeWidth=${1.5} aria-hidden="true" /> Request more evidence</strong><span className="muted tiny">Keeps R4 pending and asks Marcus for more.</span></button>
          <button role="menuitem" className="menu-item" onClick=${() => { setMenu(false); setMode('confirmDeny'); }}><strong><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /> Deny</strong><span className="muted tiny">Closes the proposal. R4 stays as written.</span></button>
        </div>`}
      </div>
      <button className="btn btn-primary" disabled=${!reason.trim()} title=${reason.trim() ? undefined : 'Add a reason first'} onClick=${() => { dispatch({ type: 'APPROVE', updates, reason: reason.trim() }); story.approved(); }}>${resent ? 'Approve and publish v1.1' : 'Approve & publish'}</button>`}
  />`;
}

function R5Panel({ onClose, openMap, setOpen, req }) {
  const { state, dispatch } = useStore();
  const shell = { onClose, openMap, setOpen, title: 'R5 · Department detail view' };
  const text = 'Show a department detail view with an hourly breakdown.';
  const draftedFrom = html`
    <div className="quote-card"><div className="muted tiny">Lead notes · Oct 1 · 2nd shift leads</div><div className="small">"When a department runs hot I want to click in and see which hours did it."</div></div>
    <div className="muted tiny">Astra drafted R5 from this note. It has not been reviewed.</div>`;

  if (state.r5 === 'accepted') {
    return html`<${Inspector}
      ...${shell}
      tag=${html`<${Tag}>To do<//>`}
      sections=${[
        sec('requirement', 'Requirement', true, '', null, html`<p className="small">${text}</p>`),
        sec('linked', 'Linked work', false, 'Jira LAB-16 · To do', null, html`<div className="chips"><span className="chip static">Jira LAB-16 · To do</span></div><div className="muted tiny">Created when you accepted the draft.</div>`),
        sec('history', 'History', false, 'Accepted today', null, html`<div className="insp-line">Drafted by Astra from lead notes · Oct 1</div><div className="insp-line">Accepted by you · today</div>`),
      ]}
    />`;
  }

  return html`<${Inspector}
    ...${shell}
    tag=${html`<${Tag} tone="blue">Draft · AI<//>`}
    from=${html`<span className="ai-dot" aria-hidden="true" /><span className="muted">Drafted by Astra from lead notes. Not reviewed yet.</span>`}
    sections=${[
      sec('draft', 'Draft', true, '', null, html`<p className="small">${text}</p><div className="muted tiny">Drafts never show as facts in Present.</div>`),
      statusSection(req),
      sec('draftedFrom', 'Drafted from', false, 'Lead notes', null, draftedFrom),
      sec('linked', 'Linked work', false, 'None yet', null, html`<div className="insp-line muted">Gets a Jira ticket once accepted.</div>`),
    ]}
    foot=${html`
      <span className="grow" />
      <button className="btn" onClick=${() => dispatch({ type: 'DISCARD_DRAFT' })}>Discard</button>
      <button className="btn btn-primary" onClick=${() => dispatch({ type: 'ACCEPT_DRAFT' })}>Accept draft</button>`}
  />`;
}

// Screen 07: R4's decision record. It replaces R4's edit history, so there is only one trail.
function DecisionRecord({ onClose, onDone }) {
  const { state } = useStore();
  const [toast, setToast] = useState('');
  const [signed, setSigned] = useState(false);
  const stances = [state.priya.stance && 'Priya Shah', state.kim.stance && 'Kim Alvarez'].filter(Boolean);
  const events = [
    { at: 'Oct 1', actor: 'AI', text: 'Drafted “every 15 min” from kickoff 18:40', chip: 'assumed' },
    { at: 'Oct 1', actor: 'Dana Ortiz', text: 'Approved in v1 as an assumption, not checked' },
    { at: `Oct 8, ${TIMES.flagged}`, actor: 'Marcus\'s Codex build', text: 'Sandbox API returned sync_interval PT1H', chip: 'contradicted', danger: true },
    { at: TIMES.proposed, actor: 'Marcus Lee', text: 'Proposed hourly. Reason drafted by Codex, edited by Marcus' },
    ...(state.danaAsk ? [
      { at: TIMES.moreEvidence, actor: 'Dana Ortiz', text: 'Asked for more evidence: §3.2 is from 2023' },
      { at: TIMES.resent, actor: 'Marcus Lee', text: 'Added the data owner\'s changelog (L58–60)' },
    ] : []),
    {
      at: state.kim.stance ? `${TIMES.priya} · ${TIMES.resent}` : TIMES.priya,
      actor: stances.join(' · ') || 'Owners',
      text: state.kim.stance ? `Both agreed. Kim: “${TEXT.kimNote}”` : state.priya.stance === 'disagreed' ? 'Priya disagreed. Kim did not reply.' : 'Priya agreed. Kim did not reply.',
    },
    { at: TIMES.approved, actor: 'Dana Ortiz', text: 'Approved in v1.1', quote: state.approvalReason || TEXT.approvalReason, final: true },
  ];
  const kept = ['Spec §3.2', 'API response 1:40 PM', ...(state.evidence.includes('changelog') ? ['Changelog L58–60'] : []), 'Kickoff 18:40', `${stances.length} stance${stances.length === 1 ? '' : 's'}`];
  return html`<div className="sp">
    <div className="insp-head">
      <span className="insp-id mono">R4</span>
      <span className="insp-title">Decision record</span>
      <${Tag} tone="green">Verified<//>
      <button className="icon-btn" onClick=${onClose} aria-label="Close details"><${X} size=${14} strokeWidth=${1.5} aria-hidden="true" /></button>
    </div>
    <div className="sp-body">
      <ol className="record">
        ${events.map((e, i) => html`<li key=${i} className=${cx('record-ev', e.danger && 'danger', e.final && 'final')}>
          <span className="record-node" aria-hidden="true" />
          <div className="record-meta">${e.at} · ${e.actor}</div>
          <div className="record-text">${e.text}${e.chip && html` <${StatusChip} status=${e.chip} />`}</div>
          ${e.quote && html`<div className="quote-card"><div className="small">“${e.quote}”</div></div>`}
        </li>`)}
      </ol>
      <div className="section-label">Evidence kept with this decision</div>
      <div className="chips">${kept.map((k) => html`<span key=${k} className="chip static">${k}</span>`)}</div>
      ${toast && html`<div className="small muted">${toast}</div>`}
    </div>
    <div className="sp-foot">
      <span className="grow" />
      <button className="btn" onClick=${() => setToast('Exporting the trail is not simulated in this prototype.')}>Export trail</button>
      ${signed
        ? html`<${Tag} tone="green">Approved<//>`
        : html`<button className="btn btn-primary" onClick=${() => { setSigned(true); onDone(); }}>Approve</button>`}
    </div>
  </div>`;
}
