import React from 'react';
import { Store, School, HeartPulse, Droplets, Building2, Truck, Zap, MapPin } from 'lucide-react';
import './fieldScene.css';
const symbols = { market: Store, school: School, clinic: HeartPulse, water: Droplets, irrigation: Droplets, port: Truck, substation: Zap, municipal: Building2 };
export default function CampaignMap({ scenarios, records, selected, onSelect, visitLimit = scenarios.length, sites = {}, commandTargets = [] }) {
  const visited = new Set(records.map(r => r.scenarioId));
  return <section className="campaign-atlas" aria-label="Campaign destination board">
    <header className="atlas-header"><span className="field-eyebrow">Field planning · Fictional exercise</span><h2>Your area of operations</h2><p>{Math.max(0, visitLimit - records.length)} visit slots remaining · {scenarios.length - visited.size} destinations available. Select a site on the board, review its brief below, then choose to travel.</p><p>Schematic only—not geographic positions, distances or navigation routes. Lines are illustrative and do not imply access.</p></header>
    <div className="atlas-board">
      <svg className="atlas-landscape" viewBox="0 0 900 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-30 70C200 180 200 300 450 280S750 350 950 450" fill="none" stroke="#8cb5bd" strokeWidth="36"/><path d="M-30 70C200 180 200 300 450 280S750 350 950 450" fill="none" stroke="#406e79" strokeWidth="25"/><path d="M0 400L900 90M40 0L820 500M0 215L900 215" fill="none" stroke="#c3c4a0" strokeWidth="6" strokeDasharray="12 7"/></svg>
      <div className="atlas-nodes">{scenarios.map((scenario, i) => {
        const Icon = symbols[scenario.metadata?.site] || MapPin;
        const leads = (sites[scenario.id]?.leads || []).filter(l => l.status === 'open').length;
        const [place, ...area] = scenario.location.split(',');
        return <button key={scenario.id} className="atlas-node" disabled={visited.has(scenario.id)} onClick={() => onSelect(scenario.id)} aria-pressed={selected === scenario.id} aria-label={`${i + 1}. ${scenario.location}. ${visited.has(scenario.id) ? 'Concluded' : 'Available'}`}>
          <span className="atlas-node-top"><Icon size={23} aria-hidden="true"/><b>{String(i + 1).padStart(2, '0')}</b></span><span className="atlas-node-title">{place}</span><span className="atlas-node-subtitle">{area.join(',')}</span><span className="atlas-node-status">{visited.has(scenario.id) ? '✓ Concluded' : selected === scenario.id ? '● Selected · 1 visit slot' : '○ Available · 1 visit slot'}{leads ? ` · ${leads} open lead${leads === 1 ? '' : 's'} recorded here` : ''}{commandTargets.includes(scenario.id) ? ' · Command brief follow-up' : ''}</span>
        </button>;
      })}</div>
    </div>
    <footer className="atlas-legend"><span>○ Available</span><span>● Selected</span><span>✓ Concluded</span><span>Only recorded leads are shown</span></footer>
  </section>;
}
