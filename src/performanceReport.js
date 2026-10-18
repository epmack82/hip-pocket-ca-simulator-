import { RUBRIC_VERSION, SCORE_DIMENSIONS } from './worldUpdate';

export const APP_VERSION = '4.4.1-planning-preview';
const average = values => values.length ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length) : 0;
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function buildPerformanceReport(input = {}) {
  const world = input.world || {};
  const history = world.history || [];
  const records = world.actionRecords || [];
  const sites = Object.values(world.sites || {});
  const readiness = ['annex', 'ascope', 'pmesii'].map(key => {
    const result = input.readinessResults?.[key];
    const skipped = !result || result.skipped || result.skippedForTesting;
    const questions = result?.questionCount || 3;
    return {
      key, label: { annex: 'Annex K', ascope: 'ASCOPE', pmesii: 'PMESII-PT' }[key],
      status: skipped ? 'Not completed / testing shortcut' : result.completedPassed ? 'Completed — all final answers correct' : 'Completed — review required',
      attempts: skipped ? 0 : result.attempts, firstAttemptScore: skipped ? null : Math.round(100 * (questions - (result.firstAttemptMissed || 0)) / questions),
      finalScore: skipped ? null : Math.round(100 * (questions - (result.finalMissed || 0)) / questions)
    };
  });
  const dimensions = SCORE_DIMENSIONS.map(([key, label]) => ({
    key, label, score: sites.length ? average(sites.map(site => Number(site.dimensionScores?.[key]) || 0)) : 0,
    evidence: history.flatMap(update => (update.scoreChanges || []).filter(c => c.dimension === key).map(c => ({ ...c, actionId: update.actionRecordId, scenarioId: update.scenarioId })))
  }));
  const terminated = Boolean(world.missionOutcome?.terminated);
  const completed = Boolean(input.completedAt) && !terminated && (input.missionRecords || []).length >= Number(input.plannedLocations || 1);
  return {
    reportType: 'Hip Pocket Soldier Performance Report', reportVersion: 1, appVersion: APP_VERSION, rubricVersion: RUBRIC_VERSION,
    sessionId: input.sessionId || 'legacy-session', missionSeed: input.missionSeed || '', missionLabel: input.missionLabel || 'Civil Affairs practice mission',
    soldier: { name: input.operator?.name || 'Not entered', callsign: input.operator?.callsign || '', role: input.playerRole || '' },
    startedAt: input.startedAt || null, completedAt: input.completedAt || null,
    status: terminated ? 'Terminated — mission failure' : completed ? 'Completed' : 'Incomplete',
    readinessComplete: readiness.every(r => r.finalScore !== null), readiness,
    overallScore: average(dimensions.map(d => d.score)), dimensions,
    scoreExplanation: 'Practice rubric: evidence earns category credit once per rule and participant at a site; recorded mistakes can reduce it. Scores are bounded 0–100 and averaged across visited sites. Unobserved categories earn no credit. Worksheet completion is not a factual-accuracy grade. Completion and proficiency are separate; leader review determines follow-up.',
    plannedLocations: Number(input.plannedLocations) || 0, completedLocations: (input.missionRecords || []).length,
    actionCount: history.length, legacyHistory: Boolean(world.legacyHistory),
    routeDecisions: (input.routeDecisions || []).map(choice => ({ scenarioId: choice.scenarioId, location: choice.location, scenarioName: choice.scenarioName, day: choice.day, rationale: choice.rationale || '', selectedAt: choice.selectedAt })),
    products: (input.products || []).map(p => ({ name: p.name, scenarioName: p.scenarioName, completionScore: p.completionScore, completionPercent: p.completionPercent, recipient: p.recipient, content: p.content })),
    conditions: world.persistentConditions || [], relationships: world.relationships || {},
    decisions: history.map(update => ({ actionId: update.actionRecordId, scenarioId: update.scenarioId, action: records.find(r => r.id === update.actionRecordId)?.rawText || 'Legacy action', classification: update.classification, severity: update.severity, response: [...update.effects, ...update.teamReactions, ...update.localReactions].join('\n\n'), coaching: update.coaching, scoreChanges: update.scoreChanges, relationshipChanges: update.relationshipChanges })),
    strengths: dimensions.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 2).map(d => d.label),
    priorities: [...dimensions].sort((a, b) => a.score - b.score).slice(0, 2).map(d => d.label),
    review: { leaderName: '', reviewDate: '', discussionNotes: '', followUpTraining: '' },
    provenance: 'Generated locally from this exercise. Soldier identity is self-entered. This report is a reviewable completion record, not independently authenticated proof of identity or an official qualification.'
  };
}

export function performanceDebrief(report) {
  return `${report.status}. The record contains ${report.actionCount} actions across ${report.completedLocations} concluded locations. ` +
    (report.strengths.length ? `The strongest demonstrated areas were ${report.strengths.join(' and ')}. ` : 'There is not yet enough positive evidence to identify a demonstrated strength. ') +
    `Review ${report.priorities.join(' and ')} with your first-line leader. ` +
    (report.conditions.length ? `${report.conditions.length} conduct or access condition(s) remain in the decision history, including any mitigation. ` : '') +
    (report.readinessComplete ? 'The readiness blocks are recorded separately from field performance. ' : 'One or more readiness blocks were skipped or not completed; this is not a complete readiness assessment. ') +
    'Use the decision evidence and submitted worksheets to discuss what happened, why it happened, and what to practice next.';
}

export function performanceReportHtml(report) {
  const rows = (items, fields) => items.map(item => '<tr>' + fields.map(key => '<td>' + escape(item[key] ?? 'Not recorded') + '</td>').join('') + '</tr>').join('');
  const evidence = report.decisions.map((d, index) => `<article><h3>Decision ${index + 1} · ${escape(d.classification)}</h3><p><strong>Action:</strong> ${escape(d.action)}</p><p>${escape(d.response)}</p><p><strong>Review:</strong> ${escape(d.coaching.join(' '))}</p><p>${escape(d.scoreChanges.map(c => c.dimension + ' ' + (c.delta >= 0 ? '+' : '') + c.delta + ' [' + c.reasonCode + ']').join('; '))}</p></article>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hip Pocket Performance Report — ${escape(report.sessionId)}</title>
    <style>body{font:15px/1.5 system-ui,sans-serif;color:#172033;margin:32px auto;padding:0 20px;max-width:1000px}h1{font-size:28px}h2{margin-top:30px;border-bottom:2px solid #24466e;padding-bottom:7px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:8px;border:1px solid #ccd4df;vertical-align:top}th{background:#eaf0f7}article{border-left:3px solid #24466e;padding-left:16px;margin:22px 0;break-inside:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere}.meta{background:#eef3f8;padding:18px}.note{font-size:12px;color:#465365}.review{min-height:65px;border-bottom:1px solid #777}@media print{body{margin:0;max-width:none;font-size:11pt}thead{display:table-header-group}h2,h3{break-after:avoid}.no-print{display:none}@page{margin:18mm}}</style></head><body>
    <h1>Hip Pocket · Soldier Performance Report</h1><p class="no-print">Use your browser’s Print command and choose Save as PDF to share this report.</p>
    <div class="meta"><strong>${escape(report.status)}</strong><p>Soldier: ${escape(report.soldier.name)} · ${escape(report.soldier.callsign)}<br>Role: ${escape(report.soldier.role)}<br>Mission: ${escape(report.missionLabel)}<br>Session: ${escape(report.sessionId)}<br>Seed: ${escape(report.missionSeed)}<br>Started: ${escape(report.startedAt || 'Not recorded (legacy save)')}<br>Ended: ${escape(report.completedAt || 'In progress')}<br>Build: ${escape(report.appVersion)} · Rubric: ${escape(report.rubricVersion)}</p></div>
    <h2>Completion and performance</h2><p>${escape(performanceDebrief(report))}</p><p>Practice score: <strong>${report.overallScore}/100</strong> · Locations concluded: ${report.completedLocations}/${report.plannedLocations} · Actions: ${report.actionCount}</p>
    <p class="note">${escape(report.scoreExplanation)}</p>${report.legacyHistory ? '<p>Legacy save: earlier actions lack the new detailed evidence record. Review those limitations before comparing grades.</p>' : ''}
    <table><thead><tr><th>Dimension</th><th>Score / 100</th></tr></thead><tbody>${rows(report.dimensions, ['label', 'score'])}</tbody></table>
    <h2>Readiness checks</h2><table><thead><tr><th>Block</th><th>Status</th><th>Attempts</th><th>First score</th><th>Final score</th></tr></thead><tbody>${rows(report.readiness, ['label', 'status', 'attempts', 'firstAttemptScore', 'finalScore'])}</tbody></table>
    <h2>Route choices and planning rationale</h2><p class="note">Location order and optional reasoning are recorded for discussion only, not scored.</p>${report.routeDecisions?.length ? '<table><thead><tr><th>Day</th><th>Location</th><th>Reasoning (optional)</th></tr></thead><tbody>' + rows(report.routeDecisions.map(choice => ({ ...choice, rationale: choice.rationale || 'Not entered' })), ['day', 'location', 'rationale']) + '</tbody></table>' : '<p>No explicit route choices were recorded (for example, a mission begun before the planning update).</p>'}
    <h2>Submitted products</h2>${report.products.length ? report.products.map(p => '<article><h3>' + escape(p.name) + '</h3><p>Worksheet completion: ' + escape(p.completionScore) + '/100 · Recipient: ' + escape(p.recipient) + '</p><p>' + escape(p.content) + '</p></article>').join('') : '<p>No worksheets submitted.</p>'}
    <h2>Persistent consequences</h2>${report.conditions.length ? report.conditions.map(c => '<p><strong>' + escape(c.title) + ' — ' + escape(c.status) + '</strong><br>' + escape((c.persistentEffects || []).join(' ')) + '</p>').join('') : '<p>No conduct conditions recorded.</p>'}
    <h2>Decision evidence</h2>${evidence || '<p>No new-engine actions recorded.</p>'}
    <h2>First-line-leader review</h2><p class="review">Leader / date:</p><p class="review">Discussion and evidence reviewed:</p><p class="review">Follow-up training:</p>
    <p class="note">${escape(report.provenance)}</p></body></html>`;
}

export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
