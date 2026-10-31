import { html, useState, useEffect, useRef, cx } from './lib.js';
import { Avatar } from './ui.js';
import { TEXT } from './store.js';
import { Clock, Check, ArrowRight } from 'lucide-react';

const toMin = (t) => {
  const [, h, m, ap] = t.match(/(\d+):(\d+)\s*(AM|PM)/);
  return ((+h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + +m;
};
const fmt = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const reducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

// Time skip (brief §9.7): dims the current shell, ticks the clock forward and lists what happened
// off screen. It stays until the participant continues: a first click (or Space) shows every event
// at once, then Continue, Space or Enter closes it.
export function TimeSkip({ from, to, title, events, onDone }) {
  const start = toMin(from), end = toMin(to);
  const [now, setNow] = useState(reducedMotion() ? end : start);
  const doneRef = useRef(false);
  const continueRef = useRef(null);
  const landed = now >= end;
  const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };
  const advance = () => (landed ? finish() : setNow(end));

  useEffect(() => {
    if (landed) { continueRef.current && continueRef.current.focus(); return; }
    const t = setTimeout(() => setNow((n) => n + 1), 1100 / Math.max(1, end - start));
    return () => clearTimeout(t);
  }, [now]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); advance(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [landed]);

  return html`<div className="timeskip" onClick=${advance} role="dialog" aria-modal="true" aria-live="polite" aria-label=${`Time skip to ${to}`}>
    <div className="ts-card">
      <div className="ts-clock"><${Clock} size=${18} /><span className="mono">${fmt(now)}</span></div>
      <div className="ts-title">${title}</div>
      <div className="ts-events">
        ${events.map((e) => {
          const visible = toMin(e.time) <= now;
          return html`<div key=${e.time + e.text} className=${cx('ts-event', visible && 'in')}>
            <span className="mono muted">${e.time}</span>
            <${Avatar} id=${e.who} size=${20} />
            <span>${e.text}</span>
          </div>`;
        })}
      </div>
      <div className="ts-foot">
        <span className="ts-hint muted">${landed ? 'Meanwhile, off screen' : 'Meanwhile, off screen · click to show everything'}</span>
        ${landed && html`<button ref=${continueRef} className="btn btn-primary" onClick=${(e) => { e.stopPropagation(); finish(); }}>Continue <${ArrowRight} size=${14} /></button>`}
      </div>
    </div>
  </div>`;
}

// Signature approval moment (brief §9.10): strikethrough → new text → chip → cascading tool updates.
export function ApprovalAnim({ updates, onDone }) {
  const steps = [
    'strike',
    'insert',
    'chip',
    ...(updates.jira ? ['jira'] : []),
    ...(updates.figma ? ['figma'] : []),
    ...(updates.teams ? ['teams'] : []),
    ...(updates.metric ? ['metric'] : []),
    'version',
  ];
  const [i, setI] = useState(0);
  const doneRef = useRef(false);
  const finish = () => { if (!doneRef.current) { doneRef.current = true; onDone(); } };
  const advance = () => {
    if (i >= steps.length - 1) finish();
    else setI((n) => n + 1);
  };
  const reduced = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();

  useEffect(() => {
    if (reduced) { finish(); return; }
    if (i >= steps.length - 1) {
      const t = setTimeout(finish, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((n) => n + 1), i < 3 ? 280 : 140);
    return () => clearTimeout(t);
  }, [i]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); advance(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [i]);

  const seen = (name) => steps.indexOf(name) <= i && steps.includes(name);
  const rows = [
    ['jira', 'Jira LAB-15 description'],
    ['figma', 'Comment on Figma Overview for Priya'],
    ['teams', 'Post in Teams #line-labor'],
    ['metric', 'Note on Success metrics'],
  ].filter(([k]) => updates[k]);

  return html`<div className="approval-anim" onClick=${advance} role="dialog" aria-modal="true" aria-label="Approving R4">
    <div className="approval-card">
      <div className="tiny-label">Publishing PRD v1.1</div>
      <div className="approval-diff">
        <div className=${cx('del', seen('strike') && 'drawn')}>${TEXT.r4Old}</div>
        <div className=${cx('ins', seen('insert') && 'in')}>${TEXT.r4New}</div>
      </div>
      <div className="chips">
        <span className=${cx('tag', seen('chip') ? 'tag-green' : 'tag-amber')}>${seen('chip') ? 'Changed in v1.1' : 'Pending'}</span>
        <span className=${cx('tag', seen('version') ? 'tag-green' : 'tag-outline')}>${seen('version') ? 'v1.1' : 'v1 · 1 pending'}</span>
      </div>
      <div className="approval-updates">
        <div className="tiny-label">One approval also updates</div>
        ${rows.map(([k, label]) => html`<div key=${k} className=${cx('check-row', seen(k) && 'done')}>
          <span className="approval-check">${seen(k) ? html`<${Check} size=${13} />` : null}</span>
          ${label}
        </div>`)}
      </div>
      <div className="muted tiny">Click or Space to skip</div>
    </div>
  </div>`;
}

// End of a role path: a recap of what happened, then where to go next.
export function EndCard({ role, title, steps, onExplore, onStart, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return html`<div className="endcard-backdrop" role="dialog" aria-modal="true" aria-labelledby="endcard-title">
    <div className="endcard">
      <div className="eyebrow">${role} path · complete</div>
      <h2 id="endcard-title">${title}</h2>
      <ol className="end-steps">
        ${steps.map((s, i) => html`<li key=${i} className=${cx(s.pending && 'pending')}>
          <span className="mono muted">${s.time}</span>
          <span className="end-icon">${s.pending ? html`<${Clock} size=${12} />` : html`<${Check} size=${12} />`}</span>
          <span><strong>${s.who}</strong> ${s.text}</span>
        </li>`)}
      </ol>
      <div className="end-actions">
        <button className="btn btn-ghost" onClick=${onClose}>Stay here</button>
        <span className="grow" />
        <button className="btn" onClick=${onStart}>Back to start</button>
        <button className="btn btn-primary" onClick=${onExplore}>Explore the Relay web app <${ArrowRight} size=${14} /></button>
      </div>
    </div>
  </div>`;
}
