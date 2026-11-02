import { createRoot } from 'react-dom/client';
import { html, useReducer, useEffect } from './lib.js';
import { reducer, initialState, StoreContext } from './store.js';
import { TesterBar } from './TesterBar.js';
import { RolePicker } from './RolePicker.js';
import { Codex } from './Codex.js';
import { Figma } from './Figma.js';
import { Astra } from './Astra.js';
import { Guide } from './Guide.js';
import { Tour } from './Tour.js';
import { TOUR_STEPS, tourKey } from './tourSteps.js';

const STORAGE_KEY = 'astra-prototype-state-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const screens = { marcus: Codex, priya: Figma, dana: Astra, explore: Astra };
  const Screen = screens[state.role];

  return html`<${StoreContext.Provider} value=${{ state, dispatch }}>
    <div className="app">
      <${TesterBar} />
      <main className="stage">
        ${Screen ? html`<${Screen} key=${`${state.role}:${state.run || 0}:${state.tourRun || 0}`} />` : html`<${RolePicker} />`}
        ${Screen && state.role !== 'explore' && !(state.guided && TOUR_STEPS[tourKey(state)]) && html`<${Guide} />`}
        ${Screen && state.guided && TOUR_STEPS[tourKey(state)] && html`<${Tour} key=${`${tourKey(state)}:${state.run || 0}`} />`}
      </main>
    </div>
  <//>`;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
