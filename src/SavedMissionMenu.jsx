import React from 'react';
export default function SavedMissionMenu({ slots, describe, onLoad, onDelete }) {
  return <details className="saved-menu">
    <summary className="entry-continue">Continue a saved mission</summary>
    <div className="saved-menu-panel">
      <h2 className="font-bold text-lg mb-3">Saved missions</h2>
      {slots.map((save, i) => save && <div key={i} className="saved-menu-row">
        <div><p className="font-semibold">{describe(save)?.location}</p><p className="text-sm text-slate-300">Day {save.currentDay} of {save.missionDuration} · {save.playerRole} · {describe(save)?.timeAgo}</p></div>
        <div className="flex gap-2"><button onClick={() => onLoad(i)} className="bg-teal-700 rounded px-3 py-2">Load</button><button aria-label={`Delete saved mission ${i + 1}`} onClick={() => onDelete(i)} className="border border-slate-500 rounded px-3 py-2">Delete</button></div>
      </div>)}
    </div>
  </details>;
}
