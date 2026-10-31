import { html, useState, useEffect, useRef, cx } from './lib.js';
import { useStore } from './store.js';
import { MessageCircleQuestion, X, ChevronRight } from 'lucide-react';

// Scripted "What's happening?" help. No AI: copy is keyed to the role and story stage.
// Each step: title (what just happened), body (why it matters), next (what you can do).
function stepFor(state) {
  const { role, stage, codeUpdated, labelUpdated, priya } = state;

  if (role === 'marcus') {
    const steps = {
      flagged: {
        title: 'Codex found a mismatch',
        body: 'You asked Codex to build the job that refreshes the dashboard. While working, it compared the PRD with the real timekeeping API. They disagree: the PRD says refresh every 15 minutes, but the API only has new data once an hour.',
        next: 'Click view on the orange Rea note (or press Alt+P). Check the facts, then decide whether to propose a change to the PRD.',
      },
      proposed: {
        title: 'Your proposal is out',
        body: 'You proposed changing R4 to an hourly refresh. Nothing in the PRD changes until Dana, the product manager, approves. Your branch is tagged pending-R4 so the team knows not to rely on it yet.',
        next: 'Go back to your code. Your teammates will respond.',
      },
      moreEvidence: {
        title: 'Dana wants more evidence',
        body: 'Dana is not convinced yet: the spec section you cited is from 2023. She wants proof the API is still hourly today.',
        next: 'Open timekeeping-api.md from the Rea panel (or click it on the "Read docs/…" step in the thread). Select changelog lines 58–60, choose "Add to R4 evidence", then "Resend to Dana" in the Rea panel.',
      },
      resent: {
        title: 'Dana is reviewing your evidence',
        body: 'You attached the changelog where the data owner confirmed the hourly sync. Dana decides next.',
        next: 'Nothing to do right now. Rea will tell you when Dana decides.',
      },
      approved: codeUpdated
        ? { title: 'Your code and the PRD agree', body: 'Dana approved hourly refresh in PRD v1.1, and your refresh job now matches it.', next: 'You are done. Explore the Rea web app to see how the change traveled.' }
        : {
            title: 'R4 changed. Your code doesn\'t match yet',
            body: 'Dana approved your proposal. The PRD now says: refresh hourly, 5 minutes after the timekeeping system syncs. One approval also updated Jira, Figma and Teams.',
            next: 'Click view on the newest Rea note. Review the diff, then choose "Update the code to match".',
          },
      denied: { title: 'Dana kept R4 as written', body: 'The PRD still says every 15 minutes, and your draft already follows it.', next: 'You are done.' },
    };
    return { ...steps[stage], where: 'Codex' };
  }

  if (role === 'priya') {
    const pending = ['proposed', 'moreEvidence', 'resent'].includes(stage);
    if (pending && !priya.stance) {
      return {
        title: 'A requirement on your frame may change',
        body: 'Marcus, an engineer, proposed changing R4: refresh hourly, not every 15 minutes. Your Overview frame has a label that says "Updated every 15 min", so it is linked to R4. Rea tagged that layer as pending.',
        next: 'Click Rea in the toolbar at the bottom (the orange dot) to open the plugin. Read the reason and evidence, then Agree or Disagree. You can add a note for Dana.',
        where: 'Figma',
      };
    }
    if (pending) return { title: 'Your stance is in', body: `You ${priya.stance} with the change. Dana, the product manager, makes the final call.`, next: 'Choose "Keep designing" in the plugin (or close it). The team will respond.', where: 'Figma' };
    if (stage === 'approved' && !labelUpdated) return { title: 'R4 changed', body: 'Dana approved hourly refresh in PRD v1.1. Rea posted her comment on your Overview frame: the label should show the last sync time.', next: 'Open Dana\'s comment on the frame (her avatar next to the label) or the Rea plugin, then choose "Relabel to Last synced · next".', where: 'Figma' };
    return { title: 'Your frame is up to date', body: 'The label now shows the real sync time, so leaders won\'t mistake hourly data for live data.', next: 'You are done.', where: 'Figma' };
  }

  if (role === 'dana') {
    const steps = {
      unpublished: {
        title: 'You are about to publish v1',
        body: 'It is Oct 1. Rea checked the PRD: several requirements rest on something nobody has confirmed, like R4\'s "every 15 minutes", which came from a kickoff call. Approving a requirement and checking it are two different things.',
        next: 'Read the assumption check on the right. You could ask people to confirm, but for this story choose "Publish anyway".',
      },
      flagged: { title: 'Nothing is waiting on you', body: 'The PRD is as published.', next: 'Explore the PRD. Click any section to see its details on the right.' },
      proposed: {
        title: 'A change to your PRD is waiting',
        body: 'Marcus, the engineer, found the timekeeping API only updates hourly, so R4 ("refresh every 15 minutes") can\'t be met. He proposed hourly refresh, with evidence. Priya agreed; Kim hasn\'t replied.',
        next: 'Review R4 in the right panel. Marcus\'s build contradicted it. Write a reason, then approve, or use Deny ▾ to deny or request more evidence.',
      },
      moreEvidence: { title: 'Waiting on Marcus', body: 'You asked Marcus for more evidence. R4 stays pending; nothing in the PRD changes yet.', next: 'Wait for Marcus to reply.' },
      resent: {
        title: 'Marcus sent new evidence',
        body: 'He attached a changelog entry where the data owner confirmed the hourly sync in Sept 2026. Both owners now agree.',
        next: 'Check the new evidence, pick what else to update, write a reason, then "Approve and publish v1.1".',
      },
      approved: { title: 'R4 is verified in PRD v1.1', body: 'Your approval updated the PRD and the linked work. The decision record on the right keeps who checked what, and why it changed.', next: 'Read the decision record, then choose Done. Try the Map to see the code and Figma frames R4 touches.' },
      denied: { title: 'You kept R4 as written', body: 'The proposal is closed and Marcus was notified.', next: 'You are done.' },
    };
    return { ...steps[stage], where: 'Rea web app' };
  }
  return null;
}

const TERMS = [
  ['PRD', 'Product requirements document: the agreed list of what the dashboard must do.'],
  ['R4', 'Requirement 4 in the PRD: how often the dashboard refreshes.'],
  ['Rea', 'The tool being tested. It keeps the PRD in sync with the tools each person uses.'],
  ['Pending', 'A change someone proposed that is not approved yet. Don\'t build on it.'],
  ['Assumed', 'Approved, but nobody has checked it against a source yet.'],
  ['Evidence', 'Proof attached to a proposal, like a spec section or an API response.'],
  ['MCP', 'How Rea connects to tools like Codex. You can ignore it.'],
];

const PEOPLE_LINE = 'Marcus · engineer · Priya · designer · Dana · product manager (approves changes) · Kim · business lead';

export function Guide() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(null);
  const ref = useRef(null);
  const step = stepFor(state);
  const key = `${state.role}:${state.stage}:${state.codeUpdated}:${state.labelUpdated}:${state.priya.stance}`;
  const unread = seen !== key;

  useEffect(() => { if (open) setSeen(key); }, [open, key]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); };
  }, [open]);

  if (!step) return null;

  return html`<div className="guide" ref=${ref}>
    ${open && html`<div className="guide-pop" role="dialog" aria-label="What's happening">
      <div className="guide-head">
        <span className="tiny-label">What's happening · ${step.where}</span>
        <span className="grow" />
        <button className="icon-btn sm" onClick=${() => setOpen(false)} aria-label="Close guide"><${X} size=${14} /></button>
      </div>
      <div className="guide-body">
        <h3>${step.title}</h3>
        <p>${step.body}</p>
        <div className="guide-next">
          <div className="tiny-label">What you can do</div>
          <p>${step.next}</p>
        </div>
        <details className="guide-terms">
          <summary><${ChevronRight} size=${13} className="guide-chev" /> Who's who and terms</summary>
          <p className="muted small">${PEOPLE_LINE}</p>
          <dl>${TERMS.map(([t, d]) => html`<div key=${t}><dt>${t}</dt><dd>${d}</dd></div>`)}</dl>
        </details>
      </div>
    </div>`}
    <button
      className=${cx('guide-btn', open && 'open')}
      onClick=${() => setOpen(!open)}
      aria-label=${open ? 'Close guide' : "What's happening? Open guide"}
      aria-expanded=${open}
      title="What's happening?"
    >
      ${open ? html`<${X} size=${18} />` : html`<${MessageCircleQuestion} size=${20} />`}
      ${!open && unread && html`<span className="guide-dot" aria-hidden="true" />`}
    </button>
  </div>`;
}
