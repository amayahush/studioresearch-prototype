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
    toolTone: 'gray',
    task: 'Your coding agent flagged something while building the refresh job. Check it and decide what to do.',
  },
  {
    id: 'priya',
    sees: 'The dashboard label says "Updated every 15 min."',
    tool: 'Starts in Figma',
    toolTone: 'purple',
    task: 'A requirement linked to one of your frames may change. Review it and respond.',
  },
  {
    id: 'dana',
    sees: 'The PRD says "Refresh data every 15 minutes."',
    tool: 'Starts in Rea',
    toolTone: 'neutral',
    task: 'A teammate proposed a change to your PRD. Review it and decide.',
  },
];

export function RolePicker() {
  const { dispatch } = useStore();

  return html`<div className="picker">
    <div className="picker-inner">
      <div className="eyebrow">Rea</div>
      <h1>The PRD says the dashboard refreshes every 15 minutes. The data only updates once an hour.</h1>
      <p className="picker-lede">
        You're on the Line Labor Dashboard team. Three people each hold one piece of the truth, in a different tool, and none of
        them can see the others. Pick a role to live the story from that seat.
      </p>

      <div className="perspectives">
        ${PERSPECTIVES.map((p) => {
          const person = PEOPLE[p.id];
          return html`<article key=${p.id} className="persp-card">
            <div className="persp-role">${person.role}</div>
            <div><span className=${`tag tag-${p.toolTone}`}>${p.tool}</span></div>
            <blockquote className="persp-sees">${p.sees}</blockquote>
            <p className="persp-task">${p.task}</p>
            <button className="btn btn-block persp-cta" onClick=${() => dispatch({ type: 'START_ROLE', role: p.id })}>
              Play the ${person.role.toLowerCase()} <${ArrowRight} size=${14} strokeWidth=${1.5} aria-hidden="true" />
            </button>
            <div className="persp-meta">
              <${Avatar} id=${p.id} size=${20} />
              <span>You're ${person.name}</span>
            </div>
          </article>`;
        })}
      </div>

      <p className="picker-foot muted">Each role plays its own part of the story. What happens elsewhere is shown as it happens.</p>
    </div>
  </div>`;
}
