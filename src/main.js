import { createRoot } from 'react-dom/client';
import { html, useReducer, useEffect, useState, useRef } from './lib.js';
import { reducer, initialState, StoreContext } from './store.js';
import { TesterBar } from './TesterBar.js';
import { RolePicker } from './RolePicker.js';
import { Codex } from './Codex.js';
import { Figma } from './Figma.js';
import { Relay } from './Relay.js';
import { Guide } from './Guide.js';
import { Facilitator } from './Facilitator.js';

const STORAGE_KEY = 'relay-prototype-state-v1';
const FRAME_W = 1280;
const FRAME_H = 832;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function StageFrame({ children }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      setScale(Math.min(width / FRAME_W, height / FRAME_H, 1));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, []);

  return html`<div className="stage-letterbox" ref=${wrapRef}>
    <div className="stage-scaler" style=${{ width: FRAME_W * scale, height: FRAME_H * scale }}>
      <div className="stage-frame" style=${{ transform: `scale(${scale})` }}>${children}</div>
    </div>
  </div>`;
}

function App() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < 980);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const screens = { marcus: Codex, priya: Figma, dana: Relay };
  const Screen = screens[state.role];

  return html`<${StoreContext.Provider} value=${{ state, dispatch }}>
    <div className="app">
      <${TesterBar} />
      ${narrow
        ? html`<div className="desktop-only">
            <strong>Best viewed on a desktop</strong>
            <p>This Relay prototype is a fixed 1280×832 walkthrough for a usability test and symposium display. Open it on a larger screen.</p>
          </div>`
        : html`<main className="stage">
            <${StageFrame}>
              ${Screen ? html`<${Screen} key=${state.role} />` : html`<${RolePicker} />`}
              ${Screen && html`<${Guide} />`}
            <//>
          </main>`}
      <${Facilitator} />
    </div>
  <//>`;
}

createRoot(document.getElementById('root')).render(html`<${App} />`);
