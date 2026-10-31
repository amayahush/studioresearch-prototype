import { html, useState } from './lib.js';
import { useStore, PEOPLE } from './store.js';
import { RotateCcw, History } from 'lucide-react';

function AstraMark() {
  return html`<svg className="astra-mark" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5 10 6 13.5 8 10 10 8 13.5 6 10 2.5 8 6 6 8 2.5Z" fill="#C4A7FF" />
    <circle cx="1.5" cy="3" r="1" fill="#C4A7FF" />
    <circle cx="14.5" cy="13" r="1" fill="#C4A7FF" />
  </svg>`;
}

// Top strip. The role is chosen once on the start screen; here the facilitator can only
// read the story log or reset to the start screen between participants.
export function TesterBar() {
  const { state, dispatch } = useStore();
  const [showLog, setShowLog] = useState(false);

  return html`<header className="tester-bar">
    <button className="tb-brand" onClick=${() => dispatch({ type: 'SET_ROLE', role: null })}>
      <span className="tb-logo"><${AstraMark} /></span> Astra
    </button>
    <span className="grow" />
    <div className="tb-actions">
      <div className="tb-log-wrap">
        <button className="icon-btn" onClick=${() => setShowLog(!showLog)} title="Story log" aria-label="Story log" aria-expanded=${showLog}><${History} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
        ${showLog &&
        html`<div className="tb-log">
          <div className="section-label"><span>Story so far</span></div>
          ${state.log.length === 0 && html`<div className="muted small">Nothing yet.</div>`}
          ${state.log.map(
            (e, i) => html`<div key=${i} className="tb-log-row"><span className="muted mono">${e.time}</span> <strong>${PEOPLE[e.who].name}</strong> ${e.text}</div>`
          )}
        </div>`}
      </div>
      <button className="icon-btn" onClick=${() => { dispatch({ type: 'RESET' }); setShowLog(false); }} title="Reset the story" aria-label="Reset the story"><${RotateCcw} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
    </div>
  </header>`;
}
