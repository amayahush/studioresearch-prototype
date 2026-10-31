import { html, useState, cx } from './lib.js';
import { PEOPLE, EVIDENCE } from './store.js';
import { ChevronRight } from 'lucide-react';

// `legacy` keeps the pre-spec colors on the Figma screens, which aren't restyled yet.
export function Avatar({ id, size = 22, legacy }) {
  const p = PEOPLE[id];
  return html`<span className="avatar" style=${{ background: legacy ? p.legacy : p.color, width: size, height: size, fontSize: legacy ? size * 0.4 : size > 24 ? 12 : 10, fontWeight: legacy ? 700 : 600 }} title=${p.name}>${p.initials}</span>`;
}

export function Tag({ tone = 'neutral', children, className }) {
  return html`<span className=${cx('tag', `tag-${tone}`, className)}>${children}</span>`;
}

export function SectionLabel({ children, right }) {
  return html`<div className="section-label"><span>${children}</span>${right}</div>`;
}

// A change shown as two labeled rows, never as strikethrough (spec §5).
export function Diff({ from, to, labels = ['Now', 'Proposed'], legacy }) {
  if (legacy) return html`<div className="diff-text"><div className="del">${from}</div><div className="ins">${to}</div></div>`;
  return html`<div className="cmp">
    <div className="cmp-row was"><span className="cmp-label">${labels[0]}</span><span className="cmp-value">${from}</span></div>
    <div className="cmp-row"><span className="cmp-label">${labels[1]}</span><span className="cmp-value">${to}</span></div>
  </div>`;
}

// Evidence chip that previews its source lines on hover (frame 03).
const POP_W = 290, POP_H = 170, GAP = 6, EDGE = 12;

// Fixed to the window, not the panel, so it never adds a scrollbar; flips above when there's no room below.
function popPosition(el) {
  const r = el.getBoundingClientRect();
  const left = Math.max(EDGE, Math.min(r.left, window.innerWidth - POP_W - EDGE));
  return window.innerHeight - r.bottom < POP_H + GAP + EDGE
    ? { left, bottom: window.innerHeight - r.top + GAP }
    : { left, top: r.bottom + GAP };
}

export function EvidenceChip({ id, variant = 'label', tone, onOpen }) {
  const [pos, setPos] = useState(null);
  const ev = EVIDENCE[id];
  const show = (e) => setPos(popPosition(e.currentTarget));
  return html`<span className="ev-wrap" onMouseEnter=${show} onMouseLeave=${() => setPos(null)}>
    <button className=${cx('chip', tone && `chip-${tone}`)} onClick=${onOpen} onFocus=${(e) => setPos(popPosition(e.currentTarget.parentElement))} onBlur=${() => setPos(null)}>${ev[variant]}</button>
    ${pos &&
    html`<div className="ev-pop" role="tooltip" style=${pos}>
      <div className="ev-pop-head"><span>${ev.file}</span><span className="muted">${ev.range}</span></div>
      <pre className="ev-pop-code">${ev.lines.map(
        ([n, t, hl]) => html`<div key=${n} className=${cx('code-line', hl && 'hl')}><span className="ln">${n}</span>${t}</div>`
      )}</pre>
      <div className="ev-pop-foot muted">${ev.meta}</div>
    </div>`}
  </span>`;
}

// Inspector section: the preview stays visible when collapsed, so blockers are never hidden.
export function CollapsibleSection({ label, preview, tone, open, onToggle, children }) {
  return html`<section className=${cx('csec', open && 'open')}>
    <button type="button" className="csec-head" aria-expanded=${open} onClick=${onToggle}>
      <${ChevronRight} size=${13} className="csec-chev" aria-hidden="true" />
      <span className="csec-label">${label}</span>
      ${preview && html`<span className=${cx('csec-pv', tone)}>${preview}</span>`}
    </button>
    ${open && html`<div className="csec-body">${children}</div>`}
  </section>`;
}

export function Toast({ text }) {
  if (!text) return null;
  return html`<div className="toast">${text}</div>`;
}
