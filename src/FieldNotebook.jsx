import React from 'react';
import CampaignMap from './CampaignMap';
import { FollowUpNotes } from './MarketScenePanel';
import MarketEvidenceExhibit from './MarketEvidenceExhibit';
export default function FieldNotebook({ scenario, site, orientation, routeChoice, validation, scenarios, records, visitLimit, sites, onLead, onProduct, dimensions }) {
  return <details className="field-notebook"><summary>Field Notebook · Mission, evidence, journal & map</summary>
    <details><summary>Mission & purpose</summary><p>{orientation.purpose}</p>{routeChoice?.rationale && <p>Your reason for visiting: {routeChoice.rationale}</p>}</details>
    <MarketEvidenceExhibit scenario={scenario} site={site} />
    <details><summary>Evidence · {validation.claims.length} accounts · {validation.gaps.length} open questions</summary><h3>Attributed accounts — not independently confirmed</h3><ul>{validation.claims.map(c => <li key={c}>{c}</li>)}</ul><h3>Questions to pursue</h3><ul>{validation.gaps.map(g => <li key={g}>{g}</li>)}</ul>{validation.leads.map(lead => <div key={lead.id}><p>{lead.label}: {lead.discoveryText || lead.reason}</p><button onClick={() => onLead(lead)}>Investigate Lead</button></div>)}<p>Check the source and supporting evidence before treating an account as a verified finding.</p></details>
    <details><summary>Recorded findings · Review source status</summary><p>This record can include accounts, observations and comparisons. Recording an item does not independently verify it.</p><ul>{(site.discoveries || []).map((d, i) => <li key={i}>{d}</li>)}</ul></details>
    <details><summary>Journal & open requests</summary><ul>{(site.conversationEvents || []).map(e => <li key={e.id}>{e.participant}: {e.subject}</li>)}</ul><FollowUpNotes site={site} /></details>
    <details><summary>Products</summary><p>{site.completedProducts?.join(', ') || 'No products recorded at this location.'}</p><button onClick={onProduct}>Create a Product</button></details>
    <details><summary>AO Map · {scenario.location}</summary><CampaignMap scenarios={scenarios} records={records} selected={scenario.id} visitLimit={visitLimit} sites={sites} readOnly /></details>
    <details><summary>Progress & coaching · Optional mid-visit review</summary><p>Work in progress, not a final visit grade.</p><ul>{dimensions.map(([key, label]) => <li key={key}>{label}: {site.dimensionScores?.[key] || 0}</li>)}</ul></details>
  </details>;
}
