import React, { useState } from 'react';
import { downloadFile } from './performanceReport';

export default function SubmissionReceipt({ turns = [] }) {
  const [notice, setNotice] = useState('');
  const latest = turns[turns.length - 1];
  if (!latest) return null;
  const text = `HIP POCKET — SUBMISSION RECEIPT\n${latest.recordedAt}\n${latest.scenario?.location || ''}\n\n${latest.playerAction}`;
  async function copy() {
    try { await navigator.clipboard.writeText(text); setNotice('Submission copied.'); }
    catch { setNotice('Clipboard unavailable. Select the text below or download the receipt.'); }
  }
  return <section className="bg-slate-800 rounded-lg border border-slate-600 p-5 mb-6 text-slate-100" aria-label="Your submitted action">
    <h2 className="font-bold text-lg">Your submitted action</h2><p className="text-sm text-slate-400 mt-1">Recorded in this playthrough · {latest.recordedAt}</p>
    <p className="whitespace-pre-wrap break-words my-4">{latest.playerAction}</p>
    <div className="flex gap-3 flex-wrap"><button onClick={copy} className="bg-slate-700 rounded px-4 py-2">Copy Submission</button><button onClick={() => downloadFile('hip-pocket-submission.txt', text, 'text/plain;charset=utf-8')} className="bg-slate-700 rounded px-4 py-2">Download Submission</button></div>
    {notice && <p role="status" className="text-blue-200 mt-2">{notice}</p>}
    {turns.length > 1 && <details className="mt-4"><summary className="cursor-pointer">Earlier submissions in this scene ({turns.length - 1})</summary>{turns.slice(0, -1).map((turn, i) => <div key={turn.id} className="border-t border-slate-600 mt-3 pt-3"><h3 className="font-bold">Action {i + 1}</h3><p className="whitespace-pre-wrap break-words">{turn.playerAction}</p></div>)}</details>}
  </section>;
}
