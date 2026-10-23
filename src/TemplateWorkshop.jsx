import React, { useState } from 'react';
import { getProductWorksheet } from './productTemplates';
import { downloadFile } from './performanceReport';

const key = 'hipPocket_template_workshop_v1';
const types = ['Site Assessment', 'Post-KLE Report', 'Stakeholder Baseball Card', 'Daily SITREP', 'ASCOPE Worksheet', 'PMESII-PT Worksheet'];
export default function TemplateWorkshop({ onExit }) {
  const [type, setType] = useState(types[0]);
  const [initial] = useState(() => { try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return { drafts: value && typeof value === 'object' && !Array.isArray(value) ? value : {}, warning: '' }; } catch { return { drafts: {}, warning: 'Saved drafts could not be read. Existing storage has not been overwritten.' }; } });
  const [drafts, setDrafts] = useState(initial.drafts);
  const [notice, setNotice] = useState(initial.warning);
  const content = typeof drafts[type] === 'string' ? drafts[type] : getProductWorksheet(type, { id: 'workshop', location: 'Fictional practice location', day: 1 });
  function update(value) {
    const next = { ...drafts, [type]: value }; setDrafts(next);
    if (initial.warning) return;
    try { localStorage.setItem(key, JSON.stringify(next)); setNotice('Draft saved in this browser.'); }
    catch { setNotice('Browser storage is unavailable or full. Download your draft before leaving.'); }
  }
  return <main className="study-shell"><div className="study-wrap"><button onClick={onExit}>← Study & Staff Practice</button><header className="study-header"><p className="study-eyebrow">TEMPLATE WORKSHOP</p><h1>Practice the full product</h1><p>Separate from mission play and scoring. These are existing app-authored training worksheets—not official forms or released schoolhouse attachments. Use fictional information only.</p></header>
    <section className="study-card study-form"><label htmlFor="workshop-type">Template</label><select id="workshop-type" value={type} onChange={e => setType(e.target.value)} className="bg-slate-800 text-white p-3 rounded">{types.map(t => <option key={t}>{t}</option>)}</select><label htmlFor="workshop-draft">Your practice draft</label><textarea id="workshop-draft" rows={22} value={content} onChange={e => update(e.target.value)} /><p role="status">{notice}</p><button className="study-primary" onClick={() => downloadFile('hip-pocket-' + type.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.txt', content, 'text/plain;charset=utf-8')}>Download Template Draft</button><p className="study-small">Replace trainee-entry placeholders, retain source attribution and uncertainty, then review with your leader. No automatic accuracy grade or external submission. Drafts stay on this browser and address; clearing browser data removes them.</p></section>
  </div></main>;
}
