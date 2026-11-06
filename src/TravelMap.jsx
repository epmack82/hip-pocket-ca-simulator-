import React from 'react';
import { Store, School, HeartPulse, Droplets, Building2, Anchor, Zap, MapPin, Tent, Package } from 'lucide-react';
const symbols = { market: Store, school: School, clinic: HeartPulse, water: Droplets, irrigation: Droplets, port: Anchor, substation: Zap, municipal: Building2, aid: Package };

// Stable exercise coordinates, derived only from the mission's existing site order.
export function travelPoints(scenarios) {
  return scenarios.map((s, i) => ({ id: s.id, x: 150 + (i % 3) * 290 + (Math.floor(i / 3) % 2) * 35, y: 100 + Math.floor(i / 3) * 190 }));
}
export default function TravelMap({ scenarios, records, selected, onSelect, readOnly, sites = {}, commandTargets = [] }) {
  const points = travelPoints(scenarios);
  const height = Math.max(460, Math.ceil(points.length / 3) * 190 + 130);
  const base = { x: 85, y: height - 55 };
  const visited = new Set(records.map(r => r.scenarioId));
  const current = readOnly ? points.find(p => p.id === selected) : points.find(p => p.id === records[records.length - 1]?.scenarioId);
  const origin = current || base;
  const destination = points.find(p => p.id === selected);
  const route = (a, b) => `${a.x},${a.y} ${a.x},${(a.y + b.y) / 2} ${b.x},${(a.y + b.y) / 2} ${b.x},${b.y}`;
  return <div className="travel-map-scroll">
    <svg className="travel-map" viewBox={`0 0 1000 ${height}`} role="group" aria-label="Fictional travel map with site icons">
      <rect width="1000" height={height} fill="#263f3b" />
      {[0, 1, 2, 3].map(i => <path key={i} d={`M${600+i*55} 0 Q${430+i*55} 160 ${700+i*55} ${height}`} stroke="#91a27a" strokeWidth="2" opacity=".18" fill="none" />)}
      <path d={`M370 0 C270 150 570 220 480 ${height}`} fill="none" stroke="#6c9ca3" strokeWidth="30" opacity=".65" />
      <path d={`M370 0 C270 150 570 220 480 ${height}`} fill="none" stroke="#376773" strokeWidth="18" />
      {points.map((p, i) => <polyline key={p.id} points={route(i ? points[i - 1] : base, p)} fill="none" stroke="#d1c49b" strokeWidth="5" opacity=".5" />)}
      {!readOnly && destination && <polyline points={route(origin, destination)} fill="none" stroke="#ffda84" strokeWidth="6" strokeDasharray="10 6" />}
      <g transform="translate(925 55)" fill="#e4e7cc"><path d="M0 5 L-12 38 L0 30 L12 38Z"/><text textAnchor="middle" y="-8" fontSize="20">N</text></g>
      <g transform={`translate(${base.x} ${base.y})`}><circle r="25" fill="#203d36" stroke="#f4d485" strokeWidth="3"/><Tent x="-15" y="-15" width="30" height="30" color="#f4d485"/><text x="36" y="0" fill="#fff" fontSize="18" fontWeight="bold">Team staging point</text><text x="36" y="24" fill="#f4d485" fontSize="14">{records.length ? 'Mission starting point' : 'Your team starts here'}</text></g>
      {points.map((p, i) => {
        const s = scenarios[i], disabled = readOnly || visited.has(p.id);
        const Icon = symbols[s.metadata?.site] || MapPin;
        const [place, ...area] = s.location.split(',');
        const leads = (sites[s.id]?.leads || []).filter(l => l.status === 'open').length;
        const choose = () => { if (!disabled) onSelect(p.id); };
        return <g key={p.id} role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled} aria-pressed={selected === p.id} aria-label={`Map destination: ${s.location}`} onClick={choose} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } }} className="travel-pin" transform={`translate(${p.x} ${p.y})`}>
          <circle r="25" fill={selected === p.id ? '#f3cf79' : visited.has(p.id) ? '#426e64' : '#142e34'} stroke="#efd799" strokeWidth="3" />
          <Icon x="-14" y="-14" width="28" height="28" color={selected === p.id ? '#122c30' : '#efd799'} aria-hidden="true" />
          <foreignObject x="-130" y="34" width="260" height="112"><label className="map-site-label" onClick={e => e.stopPropagation()}>
            <input type="radio" name={disabled ? undefined : 'destination'} value={s.id} disabled={disabled} checked={selected === s.id} onChange={choose} aria-label={`Visit ${s.location} — ${s.name?.split(' — ')[0] || place}`} />
            <strong>{place}</strong><span>{area.join(',')}</span><small>{visited.has(p.id) ? '✓ Concluded' : selected === p.id ? '● Selected · 1 visit slot' : '○ Available · 1 visit slot'}{leads ? ` · ${leads} open lead${leads === 1 ? '' : 's'} recorded here` : ''}{commandTargets.includes(s.id) ? ' · Command brief follow-up' : ''}</small>
          </label></foreignObject>
          {current?.id === p.id && <text textAnchor="middle" y="-35" fill="#fff" fontSize="14">TEAM HERE</text>}
          {visited.has(p.id) && <text x="29" y="-14" fill="#fff" fontSize="20">✓</text>}
        </g>;
      })}
    </svg>
    <p className="travel-map-note">North is up · Choose any available site—there is no prescribed order. Gold dashed line: proposed connection. Fictional layout, not to scale; routes do not establish access or change the visit budget.</p>
  </div>;
}
