import { html, useState, cx, TOUCH } from './lib.js';
import { SPEC_TASKS, TEXT, useStore, taskCode } from './store.js';
import { Diff, popPosition } from './ui.js';
import { Check, Pause, RotateCcw, ChevronDown, Layers, Code as Code2, FileCode } from 'lucide-react';

// The agent spec. It stays a file in Marcus's repo; Astra only adds the requirement tags.
export const SPEC_FILE = 'specs/lab-15-refresh.md';

export const Glyph = ({ s }) => s === 'done' ? html`<${Check} size=${15} strokeWidth=${2.2} className="v3-g done" aria-hidden="true" />`
  : s === 'held' ? html`<${Pause} size=${15} strokeWidth=${0} fill="currentColor" className="v3-g held" aria-hidden="true" />`
  : s === 'reopen' ? html`<${RotateCcw} size=${14} strokeWidth=${2} className="v3-g" aria-hidden="true" />`
  : s === 'run' ? html`<span className="spinner v3-g-spin" aria-hidden="true" />`
  : s === 'review' ? html`<span className="v3-g-circle review" aria-hidden="true" />`
  : html`<span className="v3-g-circle" aria-hidden="true" />`;

const RTag = ({ s, children }) => html`<span className=${cx('v3-tag', s)}><${Layers} size=${11} strokeWidth=${1.75} aria-hidden="true" />${children}</span>`;
const Why = ({ k, children }) => html`<div className="v3-why"><span className="v3-k">${k}</span><span>${children}</span></div>`;

// Marks the words of the requirement that created the open task.
function marked(text, words) {
  if (!words || !text.includes(words)) return text;
  const [a, b] = text.split(words);
  return html`${a}<mark className="v3-mark">${words}</mark>${b}`;
}

// After a task has run, its dropdown shows what it actually wrote, and you can change it by hand.
function TaskCode({ code }) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState(null);
  const edited = code.key in state.codeEdits;
  const text = edited ? state.codeEdits[code.key] : code.code;
  const save = () => { dispatch({ type: 'EDIT_CODE', key: code.key, code: draft }); setDraft(null); };
  return html`<div className="v3-code">
    <div className="v3-code-head">
      <span className="mono">${code.file}</span>
      ${edited && html`<span className="v3-code-tag">Edited by you</span>`}
      <span className="grow" />
      ${draft === null
        ? html`<button className="v3-code-btn" onClick=${() => setDraft(text)}>Edit</button>`
        : html`<button className="v3-code-btn" onClick=${() => setDraft(null)}>Cancel</button><button className="v3-code-btn save" onClick=${save}>Save</button>`}
    </div>
    ${draft === null
      ? html`<pre className="v3-code-body mono">${text}</pre>`
      : html`<textarea className="v3-code-body v3-code-edit mono" aria-label=${`Edit ${code.file}`} spellCheck=${false} rows=${Math.max(4, draft.split('\n').length + 1)} value=${draft} onInput=${(e) => setDraft(e.currentTarget.value)} />`}
  </div>`;
}

function Task({ task, st, open, onToggle, t2Fixed, explainTour }) {
  const [s, status] = st;
  const done = task.id === 'T2' && t2Fixed ? task.doneFixed : task.done;
  const code = taskCode(task.id, s);
  return html`<div className=${cx('v3-task', open && 'open', s)}>
    <button className="v3-task-row" aria-expanded=${open} onClick=${onToggle}>
      <${Glyph} s=${s} /><span className="v3-tid mono">${task.id}</span><span className="v3-ttitle">${task.title}</span>
      ${status && html`<span className=${cx('v3-tstatus', s)}>${status}</span>`}
      <${ChevronDown} size=${14} strokeWidth=${1.5} className=${cx('v3-chev', open && 'open')} aria-hidden="true" />
    </button>
    ${open && code && html`<${TaskCode} code=${code} />`}
    ${open && !code && html`<div className="v3-explain" data-tour=${explainTour}>
      <${Why} k="Why">${task.why}<//>
      <${Why} k="Done when">${done}<//>
      <${Why} k="Touches"><span className="mono">${task.touches}</span><//>
      <${Why} k="Needs">${task.needs}<//>
    </div>`}
  </div>`;
}

const R1_TEXT = 'Show labor hours per department for the current shift.';

// One card, tasks grouped under the requirement they came from.
export function SpecCard({ tasks, r4Tag, r4Tone, r4New, r4Text, foot, defaultOpen, t2Fixed, tour, explainTour }) {
  const [open, setOpen] = useState(defaultOpen || null);
  const openTask = SPEC_TASKS.find((t) => t.id === open);
  const toggle = (id) => () => setOpen(open === id ? null : id);
  const row = (t) => html`<${Task} key=${t.id} task=${t} st=${tasks[t.id]} open=${open === t.id} onToggle=${toggle(t.id)} t2Fixed=${t2Fixed} explainTour=${explainTour} />`;
  const mark = openTask && openTask.mark;
  return html`<section className="v3-card" data-tour=${tour}>
    <div className="v3-file"><${Code2} size=${14} strokeWidth=${1.5} aria-hidden="true" /><span className="mono">${SPEC_FILE}</span></div>
    <div className="v3-group">
      <div className="v3-group-head"><${RTag} s="ok">R1<//><span className="v3-req">${openTask && openTask.req === 'R1' ? marked(R1_TEXT, mark) : R1_TEXT}</span></div>
      <div className="v3-tasks">${SPEC_TASKS.filter((t) => t.req === 'R1').map(row)}</div>
    </div>
    <div className="v3-group">
      <div className="v3-group-head"><${RTag} s=${r4Tone}>${r4Tag}<//>
        ${r4New
          ? html`<div className="v3-req-diff"><${Diff} from=${TEXT.r4Old} to=${r4New} labels=${['Was', 'Now']} /></div>`
          : html`<span className="v3-req">${openTask && openTask.req === 'R4' ? marked(r4Text || TEXT.r4Old, mark) : r4Text || TEXT.r4Old}</span>`}
      </div>
      <div className="v3-tasks">${SPEC_TASKS.filter((t) => t.req === 'R4').map(row)}</div>
    </div>
    ${foot && html`<div className="v3-foot">${foot}</div>`}
  </section>`;
}

const Pip = ({ c }) => html`<i className=${cx('v3-pip', c)} />`;

// What a PM sees of the spec: one chip, one square per task. Hover says what those squares mean.
export function SpecChip({ pips, tone, req, tasks, summary }) {
  const [pos, setPos] = useState(null);
  const ids = SPEC_TASKS.filter((t) => t.req === req).map((t) => t.id);
  const done = ids.filter((id) => tasks[id][0] === 'done').length;
  return html`<span className=${cx('v3-chip', tone)} aria-label=${`Agent spec for ${req}: ${done} of ${ids.length} tasks committed. ${summary}`}
    onMouseEnter=${(e) => !TOUCH && setPos(popPosition(e.currentTarget, 240))} onMouseLeave=${() => setPos(null)}>
    Spec ${pips.map((c, i) => html`<${Pip} key=${i} c=${c} />`)}
    ${pos && html`<div className="ev-pop v3-chip-pop" role="tooltip" style=${pos}>
      <div className="ev-pop-head"><strong>Agent work on ${req}</strong><span className="muted">${done} of ${ids.length} committed</span></div>
      <div className="v3-chip-sum">${summary}</div>
      <div className="v3-dev flat"><${TaskRows} ids=${ids} tasks=${tasks} /></div>
      <div className="ev-pop-foot muted"><span className="mono">${SPEC_FILE}</span> · read from Codex</div>
    </div>`}
  </span>`;
}

export function TaskRows({ ids, tasks }) {
  return SPEC_TASKS.filter((t) => ids.includes(t.id)).map((t) => {
    const [s, status] = tasks[t.id];
    return html`<div key=${t.id} className="v3-dev-row"><${Glyph} s=${s} /><span className="mono v3-tid">${t.id}</span><span className="grow">${t.title}</span><span className=${cx('v3-tstatus', s)}>${status}</span></div>`;
  });
}

// The PM's view of agent work: grouped by what it means, one line per task, no engineering statuses.
const GROUP_LABEL = { held: 'Held', reopen: 'Reopened', review: 'In review', todo: 'Not run', done: 'Committed' };
const GROUP_ORDER = ['held', 'reopen', 'review', 'todo', 'done'];
export function TaskGroups({ ids, tasks }) {
  const list = SPEC_TASKS.filter((t) => ids.includes(t.id));
  return html`<div className="v3-groups">
    ${GROUP_ORDER.filter((s) => list.some((t) => tasks[t.id][0] === s)).map((s) => html`<div key=${s} className="v3-grp">
      <div className=${cx('v3-grp-label', s)}>${GROUP_LABEL[s]}</div>
      ${list.filter((t) => tasks[t.id][0] === s).map((t) => html`<div key=${t.id} className="v3-grp-row"><${Glyph} s=${s} /><span className="mono v3-tid">${t.id}</span><span className="v3-grp-title">${t.title}</span></div>`)}
    </div>`)}
  </div>`;
}

// Developer slice: the same requirement list, with tasks nested under each requirement.
export function DevTasks({ id, tasks }) {
  const ids = SPEC_TASKS.filter((t) => t.req === id).map((t) => t.id);
  if (!ids.length) return null;
  return html`<div className="v3-dev">
    <${TaskRows} ids=${ids} tasks=${tasks} />
    <div className="v3-dev-src"><${FileCode} size=${13} strokeWidth=${1.5} aria-hidden="true" /><span className="mono">${SPEC_FILE}</span><span>· read from Codex</span></div>
  </div>`;
}
