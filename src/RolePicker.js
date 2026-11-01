import { html } from './lib.js';
import { useStore, PEOPLE } from './store.js';
import { Avatar } from './ui.js';
import { ArrowRight } from 'lucide-react';

// One problem, seen three ways. The story leads; the tool comes second (critique note).
const PERSPECTIVES = [
  {
    id: 'marcus',
    sees: 'The timekeeping API says it syncs every hour.',
    tool: 'Starts in Codex',
    toolTone: 'codex',
    task: 'Your coding agent flagged something while building the refresh job. Check it and decide what to do.',
  },
  {
    id: 'priya',
    sees: 'The dashboard label says "Updated every 15 min."',
    tool: 'Starts in Figma',
    toolTone: 'figma',
    task: 'A requirement linked to one of your frames may change. Review it and respond.',
  },
  {
    id: 'dana',
    sees: 'The PRD says "Refresh data every 15 minutes."',
    tool: 'Starts in Astra',
    toolTone: 'astra',
    task: 'A teammate proposed a change to your PRD. Review it and decide.',
  },
];

function AstraMark() {
  return html`<svg className="tool-logo astra-tool-logo" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2.5 10 6 13.5 8 10 10 8 13.5 6 10 2.5 8 6 6 8 2.5Z" fill="#C4A7FF" />
    <circle cx="1.5" cy="3" r="1" fill="#C4A7FF" />
    <circle cx="14.5" cy="13" r="1" fill="#C4A7FF" />
  </svg>`;
}

function FigmaMark() {
  return html`<svg className="tool-logo figma-tool-logo" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#F24E1E" d="M12 12a4 4 0 1 1 4 4h-4v-4Z" />
    <path fill="#FF7262" d="M8 0h4v8H8a4 4 0 1 1 0-8Z" />
    <path fill="#A259FF" d="M8 8h4v8H8a4 4 0 1 1 0-8Z" />
    <path fill="#1ABCFE" d="M8 16h4v4a4 4 0 1 1-4-4Z" />
    <path fill="#0ACF83" d="M12 0h4a4 4 0 1 1 0 8h-4V0Z" />
  </svg>`;
}

function ToolLogo({ id }) {
  if (id === 'dana') return html`<${AstraMark} />`;
  if (id === 'priya') return html`<${FigmaMark} />`;
  return html`<img className="tool-logo codex-tool-logo" src="https://cdn.jsdelivr.net/npm/simple-icons@v13/icons/openai.svg" alt="" aria-hidden="true" />`;
}

export function RolePicker() {
  const { dispatch } = useStore();

  return html`<div className="picker">
    <div className="picker-inner">
      <div className="eyebrow">Astra</div>
      <h1>The PRD says the dashboard refreshes every 15 minutes. The data only updates once an hour.</h1>
      <p className="picker-lede">
        You're on the Line Labor Dashboard team. Three people each hold one piece of the truth, in a different tool, and none of
        them can see the others. Pick a role to live the story from that seat.
      </p>

      <div className="perspectives">
        ${PERSPECTIVES.map((p) => {
          const person = PEOPLE[p.id];
          return html`<article key=${p.id} className="persp-card">
            <div className="persp-role">${person.role.replace(/\b\w/g, (c) => c.toUpperCase())}</div>
            <div className="persp-tool">
              <span className=${`tag tag-${p.toolTone}`}>
                <${ToolLogo} id=${p.id} />
                ${p.tool}
              </span>
            </div>
            <blockquote className="persp-sees">${p.sees}</blockquote>
            <p className="persp-task">${p.task}</p>
            <button className="btn btn-block persp-cta" onClick=${() => dispatch({ type: 'START_ROLE', role: p.id })}>
              Play the ${person.role.replace(/\b\w/g, (c) => c.toUpperCase())} <${ArrowRight} size=${14} strokeWidth=${1.5} aria-hidden="true" />
            </button>
            <div className="persp-meta">
              <${Avatar} id=${p.id} size=${20} />
              <span>You're ${person.name}</span>
            </div>
          </article>`;
        })}
      </div>

      <p className="picker-foot muted">Each role plays its own part of the story. What happens elsewhere is shown as it happens.</p>
      <button className="btn picker-explore" onClick=${() => dispatch({ type: 'EXPLORE_ASTRA' })}>
        Explore Astra
      </button>
    </div>
  </div>`;
}
