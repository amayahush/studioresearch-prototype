import { html, useState, useEffect, useLayoutEffect, useRef, cx } from './lib.js';
import { useStore } from './store.js';
import { TOUR_STEPS } from './tourSteps.js';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Guided mode: spotlights one part of the screen at a time and explains why it's designed that way.
// Steps come from tourSteps.js. A step is available when the story is at one of its stages and its
// target is on screen, so the guide follows the scenario: turn it on at any point and it shows the
// step for where you are; open a panel and it moves to the step about that panel.

const CARD_W = 360;
const GAP = 14;
const EDGE = 12;
const PAD = 6; // spotlight padding around the target

const MODALS = '.timeskip, .endcard-backdrop';

function visible(el) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// Which steps can show right now, in story order.
function availableSteps(steps, stage) {
  const modal = document.querySelector(MODALS);
  return steps.filter((s) => {
    if (s.stage !== '*' && !s.stage.includes(stage)) return false;
    const el = document.querySelector(s.target);
    if (!el || !visible(el)) return false;
    // While a time skip or end card is up, only steps about it can show.
    return modal ? modal.contains(el) : true;
  }).map((s) => s.id);
}

function rectOf(sel) {
  const el = sel && document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

const sameRect = (a, b) => a === b || (a && b && Math.abs(a.top - b.top) < 1 && Math.abs(a.left - b.left) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1);
const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Put the card beside the target where there's room: right, left, below, above, else bottom-right.
function placeCard(r, h) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const clampTop = (t) => Math.max(56, Math.min(t, vh - h - EDGE));
  const clampLeft = (l) => Math.max(EDGE, Math.min(l, vw - CARD_W - EDGE));
  if (!r) return { left: (vw - CARD_W) / 2, top: clampTop(vh / 2 - h / 2) };
  if (vw - (r.left + r.width) >= CARD_W + GAP + EDGE) return { left: r.left + r.width + GAP, top: clampTop(r.top) };
  if (r.left >= CARD_W + GAP + EDGE) return { left: r.left - GAP - CARD_W, top: clampTop(r.top) };
  if (vh - (r.top + r.height) >= h + GAP + EDGE) return { left: clampLeft(r.left), top: r.top + r.height + GAP };
  if (r.top >= h + GAP + 56) return { left: clampLeft(r.left), top: r.top - GAP - h };
  return { left: vw - CARD_W - EDGE, top: vh - h - EDGE };
}

export function Tour() {
  const { state, dispatch } = useStore();
  const steps = TOUR_STEPS[state.role] || [];
  const [avail, setAvail] = useState([]);
  const [cur, setCur] = useState(null);
  const [rect, setRect] = useState(null);
  const [cardH, setCardH] = useState(300);
  const prevAvail = useRef(null);
  const curRef = useRef(null);
  const cardRef = useRef(null);
  curRef.current = cur;

  const step = steps.find((s) => s.id === cur);

  // Follow the scenario: poll what's on screen (panels and time skips open and close without telling us).
  useEffect(() => {
    const tick = () => {
      const now = availableSteps(steps, state.stage);
      const prev = prevAvail.current;
      let next = curRef.current;
      if (prev === null) {
        // Just turned on: start at the first step for where the story is now, so it can be read in order.
        const forStage = now.filter((id) => {
          const s = steps.find((x) => x.id === id);
          return s.stage !== '*' && s.stage.includes(state.stage);
        });
        next = forStage[0] || now[now.length - 1] || null;
      } else {
        const fresh = now.filter((id) => !prev.includes(id));
        if (fresh.length) next = fresh[0];
        else if (!now.includes(next)) next = now[now.length - 1] || null;
      }
      prevAvail.current = now;
      setAvail((a) => (sameList(a, now) ? a : now));
      if (next !== curRef.current) setCur(next);
      const s = steps.find((x) => x.id === next);
      const r = s ? rectOf(s.target) : null;
      setRect((old) => (sameRect(old, r) ? old : r));
    };
    tick();
    const t = setInterval(tick, 200);
    window.addEventListener('resize', tick);
    return () => { clearInterval(t); window.removeEventListener('resize', tick); };
  }, [state.role, state.stage]);

  // Bring the highlighted element into view when the step changes.
  useEffect(() => {
    const el = step && document.querySelector(step.target);
    if (el) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [cur]);

  useLayoutEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (Math.abs(h - cardH) > 2) setCardH(h);
    }
  });

  const exit = () => dispatch({ type: 'SET_GUIDED', on: false });

  if (!step) {
    return html`<div className="tour-wait" role="status">
      <span>Keep going. The next design decision shows up as the story moves.</span>
      <button className="tour-exit" onClick=${exit}>Exit guide</button>
    </div>`;
  }

  const i = avail.indexOf(cur);
  const prevId = i > 0 ? avail[i - 1] : null;
  const nextId = i >= 0 && i < avail.length - 1 ? avail[i + 1] : null;
  const num = steps.findIndex((s) => s.id === cur) + 1;
  const moreLater = !nextId && num < steps.length;
  const pos = placeCard(rect, cardH);

  return html`<div className="tour" aria-live="polite">
    ${rect && html`<div className="tour-spot" style=${{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />`}
    <div ref=${cardRef} className="tour-card" role="dialog" aria-label="Why I designed this" style=${{ left: pos.left, top: pos.top, width: CARD_W }}>
      <div className="tour-scene">
        <div className="tour-label">What's happening</div>
        <p>${step.scenario}</p>
      </div>
      <div className="tour-body">
        <h3>${step.title}</h3>
        <div className="tour-sec">
          <div className="tour-label accent">Decision</div>
          <p>${step.decision}</p>
        </div>
        <div className="tour-sec">
          <div className="tour-label-row">
            <span className="tour-label accent">Research</span>
            ${step.tags.map((t) => html`<span key=${t} className="tour-tag">${t}</span>`)}
          </div>
          <p className="muted">${step.evidence}</p>
        </div>
        ${moreLater && html`<p className="tour-hint">Keep going in the scenario to reach the next decision.</p>`}
      </div>
      <div className="tour-foot">
        <div className="tour-progress">
          <span>Step ${num} of ${steps.length}</span>
          <span className="tour-dots" aria-hidden="true">
            ${steps.map((s, k) => html`<span key=${s.id} className=${cx('tour-dot', k + 1 === num && 'on', k + 1 < num && 'done')} />`)}
          </span>
        </div>
        <span className="grow" />
        <button className="tour-exit" onClick=${exit}>Exit guide</button>
        <button className="tour-arrow" onClick=${() => setCur(prevId)} disabled=${!prevId} aria-label="Previous step"><${ChevronLeft} size=${16} aria-hidden="true" /></button>
        <button className="tour-arrow primary" onClick=${() => setCur(nextId)} disabled=${!nextId} aria-label="Next step"><${ChevronRight} size=${16} aria-hidden="true" /></button>
      </div>
    </div>
  </div>`;
}
