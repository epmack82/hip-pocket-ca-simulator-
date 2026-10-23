export const CAMPAIGNS = [
  { days: 3, visits: 3, destinations: 6, name: '3-Day Drill Weekend', desc: 'Choose 3 of 6 destinations. A focused exercise in priorities and follow-through.' },
  { days: 14, visits: 7, destinations: 11, name: '14-Day Annual Training', desc: 'Choose 7 of 11 destinations. Balance collection, coordination and follow-up across two simulated weeks.' },
  { days: 29, visits: 10, destinations: 16, name: '29-Day Deployment', desc: 'Choose 10 of 16 destinations. Build a campaign while leaving a clear handover for what you cannot cover.' }
];
export const campaignDay = (days, visits, completed) => Math.min(days, 1 + Math.floor(completed * days / Math.max(1, visits)));
export function campaignTradeoffs(scenarios, records) {
  const visited = new Set(records.map(r => r.scenarioId));
  return scenarios.filter(s => !visited.has(s.id)).map(s => ({ id: s.id, location: s.location, status: 'Not visited — knowledge gap for handover, not an automatic failure' }));
}
export const emptyChiefPlan = () => ({ priority: '', approach: '', coordination: '', collection: '', rationale: '', completed: false });
