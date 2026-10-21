import React, { useEffect, useRef, useState } from 'react';
import { CLASSROOM_THEMES, CLASSROOM_VERSION, generateClassroomOpord, classroomOpordHtml, printClassroomPacket } from './classroomOpord';
import { downloadFile } from './performanceReport';
import './studyPractice.css';
import './classroomOpord.css';

export default function ClassroomOpordScreen({ onExit }) {
  const [options, setOptions] = useState({ seed: 'classroom-001', theme: 'services', className: '' });
  const [packet, setPacket] = useState(() => generateClassroomOpord(options));
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState(false);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const pending = JSON.stringify(generateClassroomOpord(options)) !== JSON.stringify(packet);
  const update = (key, value) => setOptions(previous => ({ ...previous, [key]: value }));
  function generate(event) {
    event.preventDefault();
    setPacket(generateClassroomOpord(options));
    setNotice('Packet generated. The student handout and draft facilitator guide now share the same exercise ID.');
  }
  function newVariant() {
    const next = { ...options, seed: `class-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` };
    setOptions(next);
    setPacket(generateClassroomOpord(next));
    setNotice('New variant generated. Review its coordination windows and retain this seed with both handouts.');
  }
  function output(audience, print) {
    try {
      const html = classroomOpordHtml(packet, audience);
      if (print) {
        setNotice(printClassroomPacket(html) ? 'Print dialog requested in a separate window. Review page layout before printing. Nothing was sent automatically.' : 'The print window was blocked. Allow pop-ups for this site, or download the HTML handout and open it in your browser to print.');
      } else {
        downloadFile(`${packet.id}-${audience}.html`, html, 'text/html;charset=utf-8');
        setNotice('Download requested. Open the HTML file in a browser and use Print or Save as PDF. Keep the matching exercise ID with your facilitator guide.');
      }
    } catch { setNotice('The packet could not be exported. Try again; your generated packet is still here.'); }
  }
  return <main className="study-shell classroom-shell"><div className="study-wrap">
    <nav className="study-nav" aria-label="Classroom navigation"><button onClick={onExit}>← Hip Pocket home</button><span>INSTRUCTOR WORKBENCH · EXERCISE v{CLASSROOM_VERSION}</span></nav>
    <header className="study-header"><p className="study-eyebrow">CLASSROOM OPORD EXERCISE</p><h1 ref={heading} tabIndex={-1}>Read the mission.<br />Make the CA case.</h1><p>Generate a fictional order-reading exercise, print student worksheets, and lead a discussion about priorities, partners and command decisions.</p><p className="study-small">Independent of mission saves and grades. No login or paid service. Download your packet before leaving; this workbench does not save it automatically.</p></header>
    <div className="classroom-layout">
      <form onSubmit={generate} className="study-card classroom-controls">
        <h2>Build a class packet</h2>
        <label htmlFor="classroom-theme">Civil challenge</label><select id="classroom-theme" value={options.theme} onChange={e => update('theme', e.target.value)}>{CLASSROOM_THEMES.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select>
        <label htmlFor="classroom-seed">Variant seed</label><input id="classroom-seed" maxLength={60} value={options.seed} onChange={e => update('seed', e.target.value)} />
        <p className="study-small">Reuse the same seed, theme and exercise version to recreate the facts. Change the seed for a different setting and coordination window; change the challenge for a different civil problem.</p>
        <label htmlFor="classroom-class">Class label (optional)</label><input id="classroom-class" maxLength={90} value={options.className} onChange={e => update('className', e.target.value)} placeholder="October staff practice" />
        <div className="study-actions"><button className="study-primary" type="submit">Generate Packet</button><button type="button" onClick={newVariant}>Generate New Variant</button></div>
        {pending && <p role="status" className="study-small">Settings changed. Generate the packet to update the preview and exports.</p>}
      </form>
      <section className="study-card classroom-brief" aria-label="Generated exercise summary"><p className="study-eyebrow">CURRENT PACKET · {packet.id}</p><h2>{packet.themeName}</h2><p>{packet.taskForce} · {packet.region}</p><p>{packet.situation}</p><div className="classroom-stats"><div><strong>3</strong><span>CA teams to prioritize</span></div><div><strong>4</strong><span>phases to connect</span></div><div><strong>6</strong><span>written discussion tasks</span></div></div><h3>The commander’s decision</h3><p>{packet.decision}</p><p className="study-small">First review: {packet.firstReview} · {packet.partnerWindow}</p></section>
    </div>
    <section className="study-card"><h2>Print, share, teach</h2><p>Student packets include the simplified order, source-attributed initial reports, coordination limits and writing space. The facilitator guide is a separate file, never bundled into the student handout.</p>
      <p className="study-warning"><strong>Answer key pending.</strong> The facilitator guide contains draft discussion prompts only. It is not an approved answer key, score sheet or doctrinal certification. Review it with your colleague before graded use.</p>
      <div className="study-actions"><button disabled={pending} className="study-primary" onClick={() => output('student', true)}>Print Student Handout</button><button disabled={pending} onClick={() => output('student', false)}>Download Student Handout</button><button disabled={pending} onClick={() => output('facilitator', true)}>Print Draft Facilitator Guide</button><button disabled={pending} onClick={() => output('facilitator', false)}>Download Draft Facilitator Guide</button></div>
      <p className="study-small">Print preview controls paper size and Save as PDF. If pop-ups are blocked, download the HTML file and print it from your browser. Files stay on your device until you share them.</p>
      {notice && <p role="status" className="study-notice">{notice}</p>}
      <button aria-expanded={preview} aria-controls="classroom-preview" onClick={() => setPreview(!preview)}>{preview ? 'Hide Student Preview' : 'Preview Student Handout'}</button>
      {preview && <iframe id="classroom-preview" title="Student handout preview" sandbox="" srcDoc={classroomOpordHtml(packet)} />}
    </section>
    <footer className="study-footer">Original fictional classroom material, informed by the supplied exercise’s structure. Not an official OPORD format. This workbench does not change the mission story, generate an approved answer key or automatically record student performance.</footer>
  </div></main>;
}
