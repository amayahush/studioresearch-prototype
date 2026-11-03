import { html } from './lib.js';
import { useStore } from './store.js';
import { TOUR_STEPS, tourKey } from './tourSteps.js';
import { RotateCcw, Lightbulb, Sun, Moon } from 'lucide-react';

function AstraMark() {
  return html`<svg className="astra-mark" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5 10 6 13.5 8 10 10 8 13.5 6 10 2.5 8 6 6 8 2.5Z" fill="#C4A7FF" />
    <circle cx="1.5" cy="3" r="1" fill="#C4A7FF" />
    <circle cx="14.5" cy="13" r="1" fill="#C4A7FF" />
  </svg>`;
}

// Top strip. The role is chosen once on the start screen; here the facilitator can restart a
// scenario, switch light/dark for every screen, and turn on guided mode.
export function TesterBar() {
  const { state, dispatch } = useStore();

  return html`<header className=${state.guided ? 'tester-bar guided' : 'tester-bar'}>
    <button className="tb-brand" onClick=${() => dispatch({ type: 'SET_ROLE', role: null })} title="Back to scenarios">
      <span className="tb-logo"><${AstraMark} /></span> Astra
    </button>
    <span className="grow" />
    <div className="tb-actions">
      <button className="icon-btn" onClick=${() => dispatch({ type: 'SET_THEME', theme: state.theme === 'light' ? 'dark' : 'light' })} title=${state.theme === 'light' ? 'Dark mode' : 'Light mode'} aria-label=${state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
        ${state.theme === 'light' ? html`<${Moon} size=${15} strokeWidth=${1.5} aria-hidden="true" />` : html`<${Sun} size=${15} strokeWidth=${1.5} aria-hidden="true" />`}
      </button>
      <button className="icon-btn" onClick=${() => { dispatch({ type: 'RESTART' }); }} disabled=${!state.role} title="Restart this scenario" aria-label="Restart this scenario"><${RotateCcw} size=${15} strokeWidth=${1.5} aria-hidden="true" /></button>
    </div>
    ${state.role && TOUR_STEPS[tourKey(state)] && html`<span className="tb-sep" aria-hidden="true" />
    <button
      className=${state.guided ? 'tb-guided on' : 'tb-guided'}
      onClick=${() => dispatch({ type: 'SET_GUIDED', on: !state.guided })}
      aria-pressed=${state.guided}
      title="Guided mode: why each part is designed this way"
    >
      <${Lightbulb} size=${14} strokeWidth=${1.5} aria-hidden="true" />
      Guided
      <span className="tb-switch" aria-hidden="true"><span /></span>
    </button>`}
  </header>`;
}
