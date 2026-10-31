import { html, useState } from './lib.js';
import { useStore, PEOPLE } from './store.js';
import { RotateCcw, History } from 'lucide-react';

// Top strip. The role is chosen once on the start screen; here the facilitator can only
// read the story log or reset to the start screen between participants.
export function TesterBar() {
  const { state, dispatch } = useStore();
  const [showLog, setShowLog] = useState(false);

  return html`<header className="tester-bar">
    <button className="tb-brand" onClick=${() => dispatch({ type: 'SET_ROLE', role: null })}>
      <span className="tb-logo">R</span> Relay
    </button>
    <span className="grow" />
    <div className="tb-actions">
      <div className="tb-log-wrap">
        <button className="icon-btn" onClick=${() => setShowLog(!showLog)} title="Story log"><${History} size=${15} /></button>
        ${showLog &&
        html`<div className="tb-log">
          <div className="section-label"><span>Story so far</span></div>
          ${state.log.length === 0 && html`<div className="muted small">Nothing yet.</div>`}
          ${state.log.map(
            (e, i) => html`<div key=${i} className="tb-log-row"><span className="muted mono">${e.time}</span> <strong>${PEOPLE[e.who].name}</strong> ${e.text}</div>`
          )}
        </div>`}
      </div>
      <button className="icon-btn" onClick=${() => { dispatch({ type: 'RESET' }); setShowLog(false); }} title="Reset the story"><${RotateCcw} size=${15} /></button>
    </div>
  </header>`;
}
