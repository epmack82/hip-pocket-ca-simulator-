import React from 'react';
import { conversationParagraphs, marketCharacter } from './marketScene';
import './fieldScene.css';

export function ConversationPanel({ text }) {
  return <div className="field-conversation">{conversationParagraphs(text).map((part, i) => {
    if (part.type !== 'dialogue') return <p key={i} className="field-narration">{part.text}</p>;
    const person = marketCharacter(part.speaker.match(/\(([^)]+)\)$/)?.[1] || part.speaker);
    return <blockquote key={i} className="field-dialogue"><header className="field-speaker">{person.portrait && <img src={person.portrait} alt="" />}<span className="field-eyebrow">{part.speaker}</span></header><p>“{part.text}”</p></blockquote>;
  })}</div>;
}
export function FollowUpNotes({ site = {} }) {
  if (!site.followUpRequests?.length) return null;
  return <section className="field-followups" aria-label="Open coordination requests">
    <h3 className="field-eyebrow">Your open requests</h3>
    <p className="field-small">These remain proposals—not appointments, approved projects or published announcements.</p>
    <ul>{site.followUpRequests.map(request => <li key={request.id}><p>{request.description}</p><span>{request.status}</span></li>)}</ul>
    <p className="field-small">Saved with this scene and included in your leader report for follow-up review.</p>
  </section>;
}
export default function MarketScenePanel({ scenario, site = {}, text, continued = false }) {
  return <section className="market-scene" aria-label="Market encounter">
    <figure className="market-hero">
      <img src="/art/market-arrival-v1.png" alt="Painted fictional market lane with produce stalls, awnings, adult vendors and a delivery vehicle." />
      <figcaption><span className="field-eyebrow">Field encounter · Local economy</span><h2>The Central Market</h2><p>{scenario.location}</p></figcaption>
    </figure>
    <p className="field-art-note">Fictional scene illustration · atmosphere, not additional evidence</p>
    <div className="market-scene-body">
      <div className="field-section-heading"><span className="field-eyebrow">{continued ? 'The story continues' : 'Arrival · Your chosen destination'}</span><span className="field-small">{continued ? `${site.actionCount || site.actions?.length || 0} actions recorded` : 'The engagement is yours to begin'}</span></div>
      <ConversationPanel text={text} />
      <section className="market-cast" aria-label="People at this location">
        <h3 className="field-eyebrow">People here · Fictional characters</h3>
        <div className="market-cast-grid">{(scenario.keyStakeholders || []).map(role => {
          const person = marketCharacter(role);
          const engaged = (site.engagedParticipants || []).includes(role);
          return <article key={role} className="market-person">
            {person.portrait ? <img src={person.portrait} alt={`Illustrated portrait of ${person.name}`} loading="lazy" /> : <div className="market-initial" aria-hidden="true">{person.name.charAt(0)}</div>}
            <div><h4>{person.name}</h4><p className="market-role">{person.introduction}</p><p className="market-interest">{person.interest}</p><span className={engaged ? 'market-engaged' : 'market-unmet'}>{engaged ? 'Directly engaged' : 'Available · introduction not recorded'}</span></div>
          </article>;
        })}</div>
        <p className="field-small">Use a character’s name or role in your action. A person’s account is one perspective, not the view of the whole community.</p>
      </section>
      <FollowUpNotes site={site} />
      {!!site.conversationEvents?.length && <details className="field-followups"><summary className="field-eyebrow">Conversation journal · What you have discussed</summary>
        <p className="field-small">Recorded actions, not proof of agreement. Claims still need validation.</p>
        <ul>{site.conversationEvents.map(event => <li key={event.id}><strong>{marketCharacter(event.participant).name}</strong><p>{event.subject}</p><span>{event.evidenceIds.length ? 'Attributed account recorded' : 'No new evidence recorded'}</span></li>)}</ul>
      </details>}
    </div>
  </section>;
}
