import React, { useEffect, useRef, useState } from 'react';

export default function MissionProductDialog({ scenario, onClose, onSubmit }) {
  const dialog = useRef(null);
  const [brief, setBrief] = useState({ name: scenario.suggestedProducts?.[0] || 'Field report', recipient: '', purpose: '', keyFinding: '' });
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const node = dialog.current;
    if (node.showModal) node.showModal(); else node.setAttribute('open', '');
    return () => { if (node.close) node.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  const ready = Object.values(brief).every(v => v.trim());
  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="product-dialog-title" style={{ width: 'calc(100% - 2rem)', maxHeight: '90vh' }} className="m-auto max-w-2xl overflow-y-auto rounded-xl bg-slate-900 text-white border border-blue-500 p-6 backdrop:bg-black/70">
    <form onSubmit={e => { e.preventDefault(); if (ready) onSubmit(brief); }} className="space-y-4">
      <h2 id="product-dialog-title" className="text-2xl font-bold">Create a Mission Product</h2>
      <p className="text-slate-300">Keep the scene moving: choose the product, who needs it, why, and one key finding. This earns reporting-practice credit, not a grade for a full template or factual accuracy.</p>
      <label className="block">Product type<select className="block w-full bg-slate-800 border border-slate-500 rounded p-3 mt-2" value={brief.name} onChange={e => setBrief({ ...brief, name: e.target.value })}>{(scenario.suggestedProducts?.length ? scenario.suggestedProducts : ['Field report']).map(name => <option key={name}>{name}</option>)}</select></label>
      {[['recipient', 'Recipient', 'Who should receive this?'], ['purpose', 'Purpose', 'What decision or follow-up should this support?'], ['keyFinding', 'Key finding and uncertainty', 'What did you learn, from whom, and what still needs confirmation?']].map(([key, label, placeholder]) => <label key={key} className="block">{label}<textarea required maxLength={3000} rows={key === 'keyFinding' ? 3 : 2} value={brief[key]} onChange={e => setBrief({ ...brief, [key]: e.target.value })} placeholder={placeholder} className="block w-full bg-slate-800 border border-slate-500 rounded p-3 mt-2" /></label>)}
      <p className="text-sm text-blue-200">Detailed templates are available separately in Study & Staff Practice → Template Workshop. These fields are not sent to a real recipient.</p>
      <div className="flex flex-wrap gap-3"><button disabled={!ready} className="bg-green-700 disabled:bg-slate-700 rounded px-5 py-3 font-bold">Record Mission Product</button><button type="button" className="bg-slate-700 rounded px-5 py-3" onClick={onClose}>Cancel</button></div>
    </form>
  </dialog>;
}
