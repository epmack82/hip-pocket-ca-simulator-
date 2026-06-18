import React, { useState, useEffect } from 'react';
import { ChevronRight, Send, Package, ArrowRight, Loader2, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

// ===== SCENARIO DATA (MOVED OUTSIDE COMPONENT) =====
const BASE_SCENARIOS = [
  {
    id: 1,
    name: 'School Visit — Dara Lam Primary School',
    location: 'Dara Lam Primary School',
    hadrFocus: 'Emergency shelter capacity for displaced populations',
    narrative: `You arrive at Dara Lam Primary School. The Principal meets you at the gate, wiping chalk dust from her hands. "Welcome — we don't get many visitors out here. We have 142 students, six teachers, and a building that's seen better days, but it's solid." 

She gestures toward four classrooms, a shared multipurpose room, a hand-dug well, and two latrines around back. A handful of kids peer at you from a doorway before a teacher ushers them back to lessons.

The Principal waits, hands clasped, clearly curious why a Civil Affairs team would be interested in her school.`,
    keyStakeholders: ['School Principal'],
    suggestedProducts: [
      'School Infrastructure Assessment (ATP 3-57.50)',
      'KLE — School Principal',
      'HADR Shelter Recommendation Memo'
    ],
    referenceStandards: {
      planned: 'PLANNED ASSESSMENT (STP 41-38B34, para 15993-16128): Conducts a full ATP 3-57.50 school assessment (condition, capacity ~300, water, sanitation, security, accessibility using ASCOPE), interviews the Principal on disaster readiness, documents specific numbers and contact info, files a formal assessment with Battalion S-9 via CIM Cell, and explicitly recommends the school for the HADR contingency plan. Result: school becomes a documented 300-person shelter asset, used effectively when disaster strikes.',
      deliberate: 'DELIBERATE ASSESSMENT (STP 41-38B34, para 7215-7330): Visits the school, conducts methodical assessment per requirements, observes general condition, talks with the Principal to understand disaster readiness, notes rough capacity (~300), documents findings (Who/What/Where/When/Why), and files assessment with S-9. Result: school is a known but unformalized asset, used with some delay during a disaster.',
      initial: 'INITIAL ASSESSMENT (STP 41-38B34, para 7111-7203): Brief initial visit to validate assumptions and identify follow-on assessment priorities. Observes school condition, meets Principal, notes general capacity, documents briefly. Result: school baseline is known but not fully assessed; asset may be incomplete or unavailable during initial disaster response.'
    }
  },
  {
    id: 2,
    name: 'Fire Station Visit — Dara Lam',
    location: 'Dara Lam Fire Station',
    hadrFocus: 'Regional fire response capability',
    narrative: `The fire station is a single open bay with one aging fire truck parked inside, its paint faded from years of dry-season sun. The Fire Chief, a wiry man in a worn uniform, wipes his hands on a rag as he greets you.

"Four of us total," he says, nodding toward two younger firefighters checking hose connections nearby. "One truck. We make do."

He glances toward the tree line at the edge of town — dry brush stretches for kilometers beyond it. "Dry season's coming. It's always... interesting." He doesn't elaborate, but the look on his face says he's seen fires get away from him before.`,
    keyStakeholders: ['Fire Chief'],
    suggestedProducts: [
      'Fire Station Assessment (ATP 3-57.50)',
      'KLE — Fire Chief',
      'HADR Capability Gap Memo'
    ],
    referenceStandards: {
      planned: 'PLANNED ASSESSMENT (STP 41-38B34, para 15993-16128): Conducts a full ATP 3-57.50 Fire Station Assessment using ASCOPE framework (equipment, personnel, training, mutual aid, HAZMAT, rescue capability), documents specific gaps (1 truck vs. regional need, no mutual aid agreements, training shortfalls), files assessment with S-4 and S-9, and recommends equipment/training support. Result: Brigade allocates equipment and training; fire response improves before dry season.',
      deliberate: 'DELIBERATE ASSESSMENT (STP 41-38B34, para 7215-7330): Talks methodically with the Fire Chief, observes the facility in detail, documents general limitations and gaps, files an assessment summary with S-9 noting resource constraints. Result: limitation is documented but coordination with S-4 for resource support is missing; response remains constrained.',
      initial: 'INITIAL ASSESSMENT (STP 41-38B34, para 7111-7203): Brief informal chat with Fire Chief, observe facility, note general constraints and staffing level. No formal documentation or filing. Result: no baseline exists; Brigade assumes adequate capability; gaps go unaddressed.'
    }
  },
  {
    id: 3,
    name: 'Water Treatment Plant — Dara Lam',
    location: 'Dara Lam Water Treatment Plant',
    hadrFocus: 'Public health risk from water contamination',
    narrative: `The water treatment plant hums quietly, an older facility with rust streaks down its concrete walls. The Plant Manager walks you through it with practiced pride — "Regular maintenance, good system" — but a few steps behind him, a local health worker catches your eye and falls into step beside you.

Once the Manager is out of earshot, she speaks quietly. "We've had several hookworm cases this month. All from the same neighborhoods — the ones downstream of here." She glances back at the plant. "The testing logs haven't been updated in a while. I don't know if anyone's looked."`,
    keyStakeholders: ['Water Plant Manager', 'Local Health Worker'],
    suggestedProducts: [
      'Water System Assessment (ATP 3-57.50)',
      'KLE — Health Worker',
      'Public Health Risk Memo'
    ],
    referenceStandards: {
      planned: 'PLANNED ASSESSMENT (STP 41-38B34, para 15993-16128): Conducts a full ATP 3-57.50 water assessment (source, treatment capacity, distribution, testing frequency, contamination risk, downstream populations), interviews both the Manager and Health Worker, documents specific health risks and testing gaps, files assessment with S-4 (water logistics) and S-1 (population impact), and recommends water quality verification and testing protocol improvements. Result: contamination risk is identified and mitigated; public health crisis is averted.',
      deliberate: 'DELIBERATE ASSESSMENT (STP 41-38B34, para 7215-7330): Talks with Manager and Health Worker, observes treatment facility and distribution system, notes general health risks, documents rough capacity and testing practices, files summary with S-9. Result: risk is noted but mitigation is delayed; health situation worsens until Brigade acts.',
      initial: 'INITIAL ASSESSMENT (STP 41-38B34, para 7111-7203): Brief visit to plant, casual conversation with Manager, notes general system status. Health risks are not explored. Result: contamination risk goes undetected; population suffers outbreak.'
    }
  }
];

export default function HipPocketV43() {
  // ===== PHASE 1: CHARACTER CREATION STATE =====
  const [screen, setScreen] = useState('loadOrNew');
  const [operator, setOperator] = useState({ name: '', callsign: '' });
  const [playerRole, setPlayerRole] = useState(null); // 'specialist'|'canco'|'sgt'|'chief'
  const [missionDuration, setMissionDuration] = useState(null); // 3|7|14|29
  const [saveSlots, setSaveSlots] = useState([null, null, null, null, null]); // Load from localStorage

  // ===== PHASE 2: DIFFICULTY & PROGRESSION STATE =====
  const [currentDay, setCurrentDay] = useState(1);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioLog, setScenarioLog] = useState([]);
  const [scenarioRecord, setScenarioRecord] = useState(null);
  const [missionRecords, setMissionRecords] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [currentSaveSlot, setCurrentSaveSlot] = useState(0); // Which slot is this game saved to

  const [relationships, setRelationships] = useState({
    'School Principal': 50,
    'Fire Chief': 50,
    'Water Plant Manager': 50,
    'Local Health Worker': 50,
    'Ahmad (Interpreter)': 60,
    'SSG Davis (CMOC)': 50
  });

  // ===== UI STATE =====
  const [actionText, setActionText] = useState('');
  const [showProductPanel, setShowProductPanel] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [customProductMode, setCustomProductMode] = useState(false);
  const [customProductText, setCustomProductText] = useState('');
  const [productDetails, setProductDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);

  const [lastOutcome, setLastOutcome] = useState(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [lastDeltas, setLastDeltas] = useState({});
  const [debrief, setDebrief] = useState(null);

  // ===== LOAD SAVES FROM LOCALSTORAGE ON MOUNT =====
  useEffect(() => {
    const savedSlots = JSON.parse(localStorage.getItem('hipPocket_saves') || 'null');
    if (savedSlots) {
      setSaveSlots(savedSlots);
    }
  }, []);

  // ===== HELPER: SHUFFLE AND BUILD MISSION SCENARIOS =====
  // Memoize scenarios so they don't rebuild on every render
  const [missionScenarios, setMissionScenarios] = useState([]);
  
  useEffect(() => {
    if (playerRole && missionDuration) {
      // Build mission scenarios from BASE_SCENARIOS with complexity escalation
      const shuffled = [...BASE_SCENARIOS].sort(() => Math.random() - 0.5);
      const missions = [];
      for (let day = 1; day <= missionDuration; day++) {
        const scenarioId = shuffled[(day - 1) % BASE_SCENARIOS.length].id;
        const baseScenario = BASE_SCENARIOS.find(s => s.id === scenarioId);
        // Complexity escalates from 1.0 to 1.4 across mission duration
        const complexityMultiplier = 1.0 + (day / missionDuration) * 0.4;
        missions.push({
          ...baseScenario,
          day,
          complexityMultiplier,
          difficultyContext: day === 1 ? 'Introduction' : day === missionDuration ? 'Final Assessment' : 'Ongoing'
        });
      }
      setMissionScenarios(missions);
    }
  }, [playerRole, missionDuration]);

  function currentScenario() {
    return missionScenarios[scenarioIndex] || {};
  }

  // ===== DIFFICULTY MULTIPLIER SYSTEM =====
  const roleMultipliers = {
    'specialist': 0.8,  // 20% easier
    'canco': 0.9,       // 10% easier
    'sgt': 1.0,         // baseline
    'chief': 1.2        // 20% harder
  };

  function getComplexityMultiplier() {
    const scenario = currentScenario();
    return scenario.complexityMultiplier || 1.0;
  }

  function getFinalDifficultyMultiplier() {
    const role = roleMultipliers[playerRole] || 1.0;
    const complexity = getComplexityMultiplier();
    return role * complexity;
  }

  // ===== PHASE 3: PERSISTENCE =====
  function saveGame(slotNumber = currentSaveSlot) {
    const saveData = {
      operator,
      playerRole,
      missionDuration,
      currentDay,
      scenarioIndex,
      scenarioLog,
      scenarioRecord,
      missionRecords,
      allProducts,
      relationships,
      timestamp: new Date().toISOString()
    };
    const newSlots = [...saveSlots];
    newSlots[slotNumber] = saveData;
    setSaveSlots(newSlots);
    localStorage.setItem('hipPocket_saves', JSON.stringify(newSlots));
  }

  function autoSave() {
    saveGame(currentSaveSlot);
  }

  function loadGame(slotNumber) {
    const save = saveSlots[slotNumber];
    if (!save) return;
    setOperator(save.operator);
    setPlayerRole(save.playerRole);
    setMissionDuration(save.missionDuration);
    setCurrentDay(save.currentDay);
    setScenarioIndex(save.scenarioIndex);
    setScenarioLog(save.scenarioLog);
    setScenarioRecord(save.scenarioRecord);
    setMissionRecords(save.missionRecords);
    setAllProducts(save.allProducts);
    setRelationships(save.relationships);
    setCurrentSaveSlot(slotNumber);
    setScreen('scenarioScreen');
  }

  function deleteSave(slotNumber) {
    const newSlots = [...saveSlots];
    newSlots[slotNumber] = null;
    setSaveSlots(newSlots);
    localStorage.setItem('hipPocket_saves', JSON.stringify(newSlots));
  }

  function getSaveDescription(save) {
    if (!save) return null;
    const scenario = BASE_SCENARIOS.find(s => s.id === save.scenarioIndex + 1) || BASE_SCENARIOS[save.scenarioIndex % 3];
    const location = scenario?.location || 'Unknown';
    const role = save.playerRole.charAt(0).toUpperCase() + save.playerRole.slice(1);
    const mins = Math.floor((Date.now() - new Date(save.timestamp).getTime()) / 60000);
    const timeAgo = mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;
    return {
      location,
      day: save.currentDay,
      duration: save.missionDuration,
      role,
      timeAgo
    };
  }

  // ===== API CALL (UNCHANGED) =====
  async function callClaude(systemPrompt, userMsg) {
    try {
      const response = await fetch('https://hip-pocket-api.onrender.com/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, userMsg })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API error');
      }
      return data;
    } catch (error) {
      throw new Error(error.message || 'Could not evaluate action');
    }
  }

  // ===== CONTEXT BUILDERS =====
  function buildContextBlock() {
    const scenario = currentScenario();
    const complexity = getComplexityMultiplier();
    const roleDesc = {
      'specialist': 'You are a CA Specialist — junior role, here to observe and learn.',
      'canco': 'You are a Civil Affairs NCO (CANCO) — responsible for tactical CA execution.',
      'sgt': 'You are a Team Sergeant — responsible for team mission success and NCO oversight.',
      'chief': 'You are the Team Chief — fully responsible for team mission success and all CA decisions.'
    }[playerRole];

    return `
CIVIL AFFAIRS TRAINING SCENARIO — Hip Pocket v4.3
${roleDesc}

SCENARIO: ${scenario.name}
LOCATION: ${scenario.location}
DAY: ${currentDay} of ${missionDuration}
MISSION DAY CONTEXT: ${scenario.difficultyContext}

HADR FOCUS: ${scenario.hadrFocus}

NARRATIVE:
${scenario.narrative}

KEY STAKEHOLDERS: ${scenario.keyStakeholders.join(', ')}
SUGGESTED PRODUCTS: ${scenario.suggestedProducts.join(', ')}

REFERENCE STANDARDS (STP 41-38B34 Assessment Tiers):
PLANNED: ${scenario.referenceStandards.planned}
DELIBERATE: ${scenario.referenceStandards.deliberate}
INITIAL: ${scenario.referenceStandards.initial}

CURRENT RELATIONSHIPS:
${Object.entries(relationships).map(([name, value]) => `- ${name}: ${value}/100`).join('\n')}

ASSESSMENT DIFFICULTY MULTIPLIER: ${complexity.toFixed(2)}x
(Higher = stricter grading expectations for this day/role combination)
`;
  }

  function priorLogBlock() {
    if (scenarioLog.length === 0) return '';
    return `\nPRIOR ACTIONS THIS SCENARIO:\n${scenarioLog.map(l => `- ${l}`).join('\n')}\n`;
  }

  // ===== EVAL SYSTEM PROMPT (UPDATED FOR v4.3) =====
  const EVAL_SYSTEM_PROMPT = `You are an experienced Civil Affairs training evaluator for the US Army. You evaluate trainee actions in a realistic HADR civil assessment scenario. Respond ONLY with valid JSON, no markdown.

Your evaluation accounts for:
1. STP 41-38B34 performance standards (PLANNED: 6 measures, DELIBERATE: 7 measures, INITIAL: 4 measures)
2. Assessment quality based on ASCOPE/PMESII-PT framework
3. Appropriate routing per FM 3-57 CNDE rules: threat networks→S-2, sustainment networks→S-4, targeting→S-3, general civil data→CIM Cell/S-9, NGOs→S-3+S-9
4. Annex citations: Annex K (CAO), Annex P (Host-Nation Support), Annex V (Interagency)
5. Relationship shifts based on engagement quality

DIFFICULTY ADJUSTMENT: Apply the difficulty multiplier from the scenario context. A trainee scoring 70 at 1.0x would score 56 at 1.2x (higher multiplier = stricter evaluation). At 0.8x, they'd score 84 (more generous).

RESPONSE JSON FORMAT (always include these fields):
{
  "narrativeOutcome": "2-3 sentences describing immediate consequence of this action",
  "qualityScore": <0-100 based on assessment standard and difficulty multiplier>,
  "assessmentType": "PLANNED|DELIBERATE|INITIAL|OTHER",
  "performanceMeasures": <count of measures met for the assessed type>,
  "relationshipShifts": {"Name": -5 to +10},
  "annexCitation": "K|P|V|multiple|none",
  "routingRationale": "brief routing explanation",
  "product": {
    "name": "Product Name",
    "type": "Assessment|KLE|Memo|Plan|Other",
    "content": "core content (2-3 sentences)",
    "recipient": "S-2|S-3|S-4|S-9|CIM Cell|Other",
    "citationStandard": "ATP 3-57.50|other doctrine"
  } OR null,
  "feedbackTone": "encouraging|neutral|direct" <-- match role expectations
}`;

  function applyResult(result, summaryLabel) {
    const deltas = result.relationshipShifts || {};
    setLastDeltas(deltas);
    setLastOutcome(result); // ← THIS WAS MISSING!
    setRelationships(prev => {
      const updated = { ...prev };
      Object.entries(deltas).forEach(([k, v]) => {
        const base = updated[k] !== undefined ? updated[k] : 50;
        updated[k] = Math.min(100, Math.max(0, base + v));
      });
      return updated;
    });

    const gist = (result.narrativeOutcome || '').split('. ')[0] + '.';
    setScenarioLog(prev => [...prev, `${summaryLabel} → ${gist}`]);
    setScenarioRecord({ ...result, summaryLabel });

    if (result.product) {
      setAllProducts(prev => [...prev, { ...result.product, scenarioName: currentScenario().name }]);
    }
  }

  // ===== SUBMIT HANDLERS =====
  async function runEval(userMsg, summaryLabel, opts = {}) {
    const { isMoveOn } = opts;
    setLoading(true);
    setError(null);
    setLastSubmission({ userMsg, summaryLabel, isMoveOn });
    try {
      const result = await callClaude(EVAL_SYSTEM_PROMPT, userMsg);
      applyResult(result, summaryLabel);
      setPendingAdvance(isMoveOn);
      setScreen(result.product ? 'productDisplay' : 'outcomeDisplay');
      setActionText('');
      setShowProductPanel(false);
      setSelectedProductType(null);
      setCustomProductMode(false);
      setCustomProductText('');
      setProductDetails('');
      autoSave(); // Auto-save after each action
    } catch (e) {
      setError('Something went wrong evaluating that. You can try again.');
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    if (!lastSubmission) return;
    const { userMsg, summaryLabel, isMoveOn } = lastSubmission;
    runEval(userMsg, summaryLabel, { isMoveOn });
  }

  function submitAction() {
    if (!actionText.trim() || loading) return;
    const userMsg = `${buildContextBlock()}${priorLogBlock()}\nTRAINEE'S ACTION: "${actionText.trim()}"\n\nEvaluate this action and respond with the JSON shape described.`;
    runEval(userMsg, `Action: "${actionText.trim().substring(0, 80)}"`);
  }

  function submitProduct() {
    const productType = customProductMode ? customProductText.trim() : selectedProductType;
    if (!productType || loading) return;
    const detailsLine = productDetails.trim() ? `\nADDITIONAL DETAILS FROM TRAINEE: "${productDetails.trim()}"` : '';
    const userMsg = `${buildContextBlock()}${priorLogBlock()}\nTRAINEE WANTS TO CREATE THIS PRODUCT: "${productType}"${detailsLine}\n\nGenerate this product and evaluate the overall scenario quality based on all actions taken so far, including this product. Respond with the JSON shape described.`;
    runEval(userMsg, `Product: "${productType}"`);
  }

  function moveOn() {
    if (loading) return;
    if (scenarioRecord) {
      finalizeScenario();
    } else {
      const userMsg = `${buildContextBlock()}\nThe trainee chose to move on from this location WITHOUT taking any action or creating any product.\n\nEvaluate against the INITIAL reference and respond with the JSON shape described (omit "product").`;
      runEval(userMsg, 'Moved on without engaging', { isMoveOn: true });
    }
  }

  function finalizeScenario() {
    const scenario = currentScenario();
    const newRecord = {
      scenarioName: scenario.name,
      location: scenario.location,
      hadrFocus: scenario.hadrFocus,
      summaryLabel: scenarioRecord?.summaryLabel || 'Moved on without engaging',
      qualityScore: scenarioRecord?.qualityScore ?? 0,
      discSignal: scenarioRecord?.discSignal || 'c',
      consequenceChain: scenarioRecord?.consequenceChain || null,
      day: currentDay
    };
    const updatedRecords = [...missionRecords, newRecord];
    setMissionRecords(updatedRecords);
    setScenarioLog([]);
    setScenarioRecord(null);
    setLastDeltas({});

    if (currentDay < missionDuration) {
      setCurrentDay(currentDay + 1);
      setScenarioIndex(scenarioIndex + 1);
      setScreen('scenarioScreen');
      autoSave();
    } else {
      setScreen('debriefLoading');
      generateDebrief(updatedRecords);
    }
  }

  function applySuggestion(text) {
    setActionText(prev => (prev ? prev + ' ' + text : text));
  }

  function continueFromOutcome() {
    if (pendingAdvance) {
      finalizeScenario();
    } else {
      setScreen('scenarioScreen');
    }
  }

  async function generateDebrief(records) {
    setLoading(true);
    try {
      const summary = records.map(r => `${r.scenarioName}: ${r.summaryLabel} (${r.qualityScore} pts)`).join('\n');
      const productsText = allProducts.map(p => `${p.name} (${p.type}) → ${p.recipient}`).join('\n');
      const userMsg = `Review this trainee's CA mission performance and generate a brief encouraging debrief:

MISSION SUMMARY:
${summary}

PRODUCTS CREATED:
${productsText || '(none)'}

RELATIONSHIPS:
${Object.entries(relationships).map(([name, val]) => `${name}: ${val}/100`).join('\n')}

Generate a brief debrief (5-7 sentences) that:
1. Highlights 1-2 strengths
2. Identifies 1-2 areas for improvement
3. Notes relationship dynamics
4. Gives forward guidance
Respond with only the debrief text, no JSON.`;

      const response = await fetch('https://hip-pocket-api.onrender.com/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMsg })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'API error');
      }
      setDebrief(data.text);
      setScreen('debrief');
    } catch (e) {
      setError('Could not generate debrief. You can try again.');
      setScreen('debriefError');
    } finally {
      setLoading(false);
    }
  }

  function resetGame() {
    setScreen('loadOrNew');
    setOperator({ name: '', callsign: '' });
    setPlayerRole(null);
    setMissionDuration(null);
    setCurrentDay(1);
    setScenarioIndex(0);
    setScenarioLog([]);
    setScenarioRecord(null);
    setMissionRecords([]);
    setAllProducts([]);
    setRelationships({
      'School Principal': 50,
      'Fire Chief': 50,
      'Water Plant Manager': 50,
      'Local Health Worker': 50,
      'Ahmad (Interpreter)': 60,
      'SSG Davis (CMOC)': 50
    });
    setActionText('');
    setShowProductPanel(false);
    setSelectedProductType(null);
    setCustomProductMode(false);
    setCustomProductText('');
    setProductDetails('');
    setLastOutcome(null);
    setLastDeltas({});
    setPendingAdvance(false);
    setDebrief(null);
    setError(null);
    setCurrentSaveSlot(0);
  }

  // ===== COMPONENTS =====
  const LoadingOverlay = () => {
    if (!loading) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          <p className="text-slate-200">Evaluating...</p>
        </div>
      </div>
    );
  };

  const ErrorBanner = () => {
    if (!error) return null;
    return (
      <div className="bg-red-900/40 border border-red-700 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-200 text-sm">{error}</p>
          <button
            onClick={retry}
            className="mt-2 flex items-center gap-2 text-red-300 hover:text-red-100 text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  };

  // ===== RENDER: LOAD OR NEW GAME =====
  if (screen === 'loadOrNew') {
    const hasSaves = saveSlots.some(s => s !== null);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-3">Hip Pocket</h1>
            <p className="text-blue-200 text-xl mb-2">Civil Affairs Training v4.3</p>
            <p className="text-slate-400">Save & load • Difficulty scaling • 3/7/14/29-day missions</p>
          </div>

          {hasSaves && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">CONTINUE GAME</h2>
              <div className="space-y-2 mb-6">
                {saveSlots.map((save, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded p-3 flex items-center justify-between">
                    {save ? (
                      <>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{BASE_SCENARIOS.find(s => s.id === (idx % 3) + 1)?.location}</p>
                          <p className="text-slate-300 text-sm">Day {save.currentDay} of {save.missionDuration} • {save.playerRole} • {getSaveDescription(save)?.timeAgo}</p>
                        </div>
                        <button
                          onClick={() => loadGame(idx)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold mr-2"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSave(idx)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm">[Empty Slot]</p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setScreen('characterCreation')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg"
              >
                Start New Game
              </button>
            </div>
          )}

          {!hasSaves && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
              <p className="text-slate-400 text-sm mb-6">No saved games. Start a new mission.</p>
              <button
                onClick={() => setScreen('characterCreation')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
              >
                Start New Game <ChevronRight className="inline ml-2 w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== RENDER: CHARACTER CREATION =====
  if (screen === 'characterCreation') {
    const canContinue = operator.name && operator.callsign;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-white">CHARACTER CREATION</h1>
            <p className="text-blue-100 mt-2">Identify yourself before deployment</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Your Name"
                value={operator.name}
                onChange={(e) => setOperator({ ...operator, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
              />
              <input
                type="text"
                placeholder="Call Sign (e.g., SSG Mackie)"
                value={operator.callsign}
                onChange={(e) => setOperator({ ...operator, callsign: e.target.value })}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
              />
            </div>

            <button
              onClick={() => canContinue && setScreen('roleSelection')}
              disabled={!canContinue}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-4 rounded-lg font-bold text-lg"
            >
              Continue <ChevronRight className="inline ml-2 w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setScreen('loadOrNew')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: ROLE SELECTION =====
  if (screen === 'roleSelection') {
    const roles = [
      {
        id: 'specialist',
        name: 'CA Specialist',
        desc: 'Junior role. Maximum hints and assistance. Most lenient grading.',
        difficulty: '★☆☆☆'
      },
      {
        id: 'canco',
        name: 'CANCO',
        desc: 'Mid-level NCO. Some hints. Standard grading expectations.',
        difficulty: '★★☆☆'
      },
      {
        id: 'sgt',
        name: 'Team Sergeant',
        desc: 'Senior NCO. Minimal hints. Strict grading standards.',
        difficulty: '★★★☆'
      },
      {
        id: 'chief',
        name: 'Team Chief',
        desc: 'Team leader. No hints. Maximum rigor. Full responsibility.',
        difficulty: '★★★★'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-white">SELECT YOUR ROLE</h1>
            <p className="text-purple-100 mt-2">Choose your difficulty level</p>
          </div>

          <div className="space-y-3 mb-6">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setPlayerRole(role.id);
                  setScreen('missionSelection');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-6 border border-slate-700 hover:border-blue-600 text-left transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{role.name}</h3>
                  <span className="text-amber-400 text-sm">{role.difficulty}</span>
                </div>
                <p className="text-slate-300 text-sm">{role.desc}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setScreen('characterCreation')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: MISSION SELECTION =====
  if (screen === 'missionSelection') {
    const durations = [
      { days: 3, name: '3-Day Mission', desc: 'Short orientation. ~3 hours playtime. Good for quick training.' },
      { days: 7, name: '7-Day Mission', desc: 'Standard deployment. ~8 hours playtime. Full civil assessment training.' },
      { days: 14, name: '14-Day Mission', desc: 'Extended AO prep. ~16 hours playtime. Advanced assessment cycle.' },
      { days: 29, name: '29-Day Mission', desc: 'Full civil preparation. ~32 hours playtime. Comprehensive CA immersion.' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-white">SELECT MISSION DURATION</h1>
            <p className="text-indigo-100 mt-2">Choose how long your deployment lasts</p>
          </div>

          <div className="space-y-3 mb-6">
            {durations.map(dur => (
              <button
                key={dur.days}
                onClick={() => {
                  setMissionDuration(dur.days);
                  setCurrentDay(1);
                  setScenarioIndex(0);
                  setScenarioLog([]);
                  setScenarioRecord(null);
                  setMissionRecords([]);
                  setAllProducts([]);
                  setScreen('annexKBriefing');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-6 border border-slate-700 hover:border-indigo-600 text-left transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{dur.name}</h3>
                  <span className="text-slate-400 text-sm">{dur.days} days</span>
                </div>
                <p className="text-slate-300 text-sm">{dur.desc}</p>
              </button>
            ))}
          </div>

          <button
            onClick={() => setScreen('roleSelection')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: ANNEX K BRIEFING =====
  if (screen === 'annexKBriefing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white">ANNEX K — CIVIL AFFAIRS OPERATIONS</h1>
            <p className="text-blue-100 mt-2">Mission context and CA framework</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">MISSION DIRECTIVE</h2>
              <div className="space-y-4 text-slate-100 text-sm leading-relaxed">
                <p><strong>MISSION:</strong> Assess the Dara Lam region's civil environment with focus on HADR capability and disaster response readiness.</p>
                <p><strong>COMMANDER'S INTENT:</strong> Understand the region's vulnerability to disasters and identify assets/gaps for HADR planning.</p>
                <p><strong>HADR FOCUS:</strong> Emergency sheltering, medical response, fire response, water/health risk, supply logistics, evacuation capability, population vulnerability.</p>
                <p><strong>EXPECTED PRODUCTS:</strong> Infrastructure assessments (ATP 3-57.50), KLE reports, HADR contingency plans, gap analysis memos — as relevant to what you find.</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">ASCOPE BASELINE — CIVIL ENVIRONMENT</h2>
              <div className="space-y-3 text-slate-100 text-sm">
                <p><strong>AREAS:</strong> Dara Lam municipality, ~50 sq km, prone to flooding (seasonal). Main road connects to provincial capital (2 hours).</p>
                <p><strong>STRUCTURES:</strong> Government building, school, fire station, health clinic, water treatment plant, market, temple.</p>
                <p><strong>CAPABILITIES:</strong> Limited government capacity. Fire department understaffed. School is a community hub. Health services basic. Water system aging.</p>
                <p><strong>ORGANIZATIONS:</strong> Mayor's office, school principal, health worker, fire chief, civil society leaders.</p>
                <p><strong>PEOPLE:</strong> ~15,000 population, 65% rural, agriculture-dependent, significant vulnerability to seasonal flooding.</p>
                <p><strong>EVENTS:</strong> Dry season (May-October, high fire risk). Monsoon season (October-April, flooding risk). Annual harvest (September-October).</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">YOUR CIVIL AFFAIRS ROLE</h2>
              <div className="space-y-3 text-slate-100 text-sm">
                <p>As a CA team, you will:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Conduct civil assessments per FM 3-57 and ATP 3-57.50 doctrine</li>
                  <li>Document civil infrastructure, capabilities, and vulnerabilities</li>
                  <li>Build relationships with key civil leaders and stakeholders</li>
                  <li>Produce CA intelligence products for Brigade planning</li>
                  <li>Route products via CNDE rules to appropriate staff sections</li>
                  <li>Support HADR contingency planning with actionable civil knowledge</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-900/30 border border-blue-700 rounded p-4">
              <p className="text-blue-200 text-sm"><strong>Key Doctrine:</strong> FM 3-57 Civil Affairs Operations, ATP 3-57.50 Civil Knowledge Integration, STP 41-38B34 38B Performance Standards</p>
            </div>
          </div>

          <button
            onClick={() => setScreen('missionBriefing')}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Continue to Mission Brief <ChevronRight className="inline ml-2 w-5 h-5" />
          </button>

          <button
            onClick={() => setScreen('missionSelection')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Change Mission
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: MISSION BRIEFING =====
  if (screen === 'missionBriefing') {
    const roleDisplay = {
      'specialist': 'Civil Affairs Specialist',
      'canco': 'Civil Affairs NCO (CANCO)',
      'sgt': 'Team Sergeant',
      'chief': 'Team Chief'
    }[playerRole];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white">MISSION BRIEFING</h1>
            <p className="text-green-100 mt-2">Dara Lam HADR Assessment — {missionDuration}-Day Deployment</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <div>
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">Operator</h3>
              <p className="text-white text-lg font-bold">{operator.callsign}</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">Role</h3>
              <p className="text-white text-lg font-bold">{roleDisplay}</p>
              <p className="text-slate-400 text-sm mt-1">
                {playerRole === 'specialist' && 'You will receive hints and support throughout the mission.'}
                {playerRole === 'canco' && 'You are expected to execute CA missions with some guidance.'}
                {playerRole === 'sgt' && 'You are responsible for team performance and must demonstrate tactical CA expertise.'}
                {playerRole === 'chief' && 'You have full responsibility for mission success. Minimal support. High standards.'}
              </p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">Mission</h3>
              <p className="text-white">Assess Dara Lam's civil environment for HADR readiness across {missionDuration} days of engagement.</p>
              <p className="text-slate-400 text-sm mt-2">You will visit 3 primary locations multiple times in randomized order. Difficulty escalates as the mission progresses. Days 1-2 are introductory; later days demand full doctrinal rigor.</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">Estimated Duration</h3>
              <p className="text-white">{Math.round(missionDuration * 8 / 3)} hours of gameplay</p>
            </div>
          </div>

          <button
            onClick={() => setScreen('scenarioScreen')}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Deploy <ChevronRight className="inline ml-2 w-5 h-5" />
          </button>

          <button
            onClick={() => setScreen('missionSelection')}
            className="w-full text-slate-400 hover:text-slate-300 text-sm"
          >
            ← Change Mission
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: SCENARIO SCREEN =====
  if (screen === 'scenarioScreen' && playerRole && missionDuration) {
    const scenario = currentScenario();
    const showHints = playerRole === 'specialist' || playerRole === 'canco';
    const diffMult = getFinalDifficultyMultiplier().toFixed(2);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <LoadingOverlay />
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-blue-300 text-sm">Day {currentDay} of {missionDuration} • Location {scenarioIndex + 1} of {missionScenarios.length}</p>
              <h1 className="text-4xl font-bold text-white mt-1">{scenario.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">DIFFICULTY</p>
              <p className="text-white font-bold text-lg">{diffMult}x</p>
            </div>
          </div>

          <ErrorBanner />

          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-6 text-slate-100 leading-relaxed">
            <p className="whitespace-pre-wrap">{scenario.narrative}</p>
          </div>

          {showHints && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
              <p className="text-blue-200 text-sm font-semibold mb-3">💡 SUGGESTED APPROACH:</p>
              <div className="flex flex-wrap gap-2">
                {scenario.suggestedProducts.map(prod => (
                  <button
                    key={prod}
                    onClick={() => applySuggestion(prod)}
                    className="bg-blue-800/50 hover:bg-blue-700 text-blue-100 text-xs px-3 py-2 rounded"
                  >
                    {prod}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-2">What will you do?</label>
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="Describe your action, assessment approach, or engagement strategy..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500 resize-none mb-4"
            />
            <button
              onClick={submitAction}
              disabled={!actionText.trim() || loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Action
            </button>
          </div>

          {!showProductPanel && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowProductPanel(true)}
                disabled={loading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" /> Create Product
              </button>
              <button
                onClick={moveOn}
                disabled={loading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
              >
                Move to Next Location <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {showProductPanel && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-3">Product Type</label>
              {!customProductMode ? (
                <div className="space-y-2 mb-4">
                  {scenario.suggestedProducts.map(prod => (
                    <button
                      key={prod}
                      onClick={() => setSelectedProductType(prod)}
                      className={`w-full text-left px-4 py-2 rounded border ${
                        selectedProductType === prod
                          ? 'bg-blue-700 border-blue-600 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {prod}
                    </button>
                  ))}
                  <button
                    onClick={() => setCustomProductMode(true)}
                    className="w-full text-left px-4 py-2 rounded border border-slate-600 text-slate-300 hover:bg-slate-600 italic"
                  >
                    + Custom Product Type
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Enter custom product type"
                    value={customProductText}
                    onChange={(e) => setCustomProductText(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500 mb-2"
                  />
                  <button
                    onClick={() => setCustomProductMode(false)}
                    className="text-slate-400 hover:text-slate-300 text-sm"
                  >
                    ← back to suggestions
                  </button>
                </div>
              )}

              <textarea
                value={productDetails}
                onChange={(e) => setProductDetails(e.target.value)}
                placeholder="Add any specific details to include (optional)"
                rows={2}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500 resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={submitProduct}
                  disabled={(!selectedProductType && !customProductText.trim()) || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" /> Create
                </button>
                <button
                  onClick={() => {
                    setShowProductPanel(false);
                    setSelectedProductType(null);
                    setCustomProductMode(false);
                    setCustomProductText('');
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== RENDER: OUTCOME DISPLAY =====
  if (screen === 'outcomeDisplay' && lastOutcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-6 text-slate-100 leading-relaxed">
            <p className="whitespace-pre-wrap">{lastOutcome.narrativeOutcome}</p>
          </div>

          {Object.keys(lastDeltas).length > 0 && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Relationship Changes</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(lastDeltas).map(([name, delta]) => (
                  <span
                    key={name}
                    className={`text-sm px-3 py-1 rounded-full ${
                      delta > 0
                        ? 'bg-green-900/40 text-green-300'
                        : delta < 0
                        ? 'bg-red-900/40 text-red-300'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {name} {delta > 0 ? '+' : ''}{delta}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={continueFromOutcome}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
          >
            {pendingAdvance ? 'Continue' : 'Back to Location'} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: PRODUCT DISPLAY =====
  if (screen === 'productDisplay' && lastOutcome && lastOutcome.product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-200 font-semibold">{lastOutcome.product.name}</p>
            <p className="text-green-300 text-sm mt-1">Filed with: {lastOutcome.product.recipient}</p>
            <p className="text-green-300 text-sm mt-1">Assessment Standard: {lastOutcome.product.citationStandard}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6 text-slate-100">
            <p>{lastOutcome.product.content}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Assessment Quality</p>
            <p className="text-2xl font-bold text-white">{lastOutcome.qualityScore} / 100</p>
            <p className="text-slate-300 text-sm mt-2">Type: {lastOutcome.assessmentType}</p>
            <p className="text-slate-300 text-sm">Measures Met: {lastOutcome.performanceMeasures}</p>
          </div>

          <button
            onClick={continueFromOutcome}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
          >
            {pendingAdvance ? 'Continue' : 'Back to Location'} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER: DEBRIEF LOADING =====
  if (screen === 'debriefLoading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-200 text-lg">Generating debrief...</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: DEBRIEF =====
  if (screen === 'debrief' && debrief) {
    const totalScore = missionRecords.reduce((sum, r) => sum + (r.qualityScore || 0), 0);
    const avgScore = missionRecords.length > 0 ? (totalScore / missionRecords.length).toFixed(1) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-amber-700 to-amber-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white">MISSION DEBRIEF</h1>
            <p className="text-amber-100 mt-2">After-Action Review</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">PERFORMANCE SUMMARY</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-slate-400 text-xs font-bold uppercase">Scenarios Completed</p>
                  <p className="text-white text-2xl font-bold mt-1">{missionRecords.length}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-slate-400 text-xs font-bold uppercase">Avg Assessment Score</p>
                  <p className="text-white text-2xl font-bold mt-1">{avgScore}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-slate-400 text-xs font-bold uppercase">Products Created</p>
                  <p className="text-white text-2xl font-bold mt-1">{allProducts.length}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-3">Scenario Results:</h3>
              <div className="space-y-2">
                {missionRecords.map((record, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded p-3 flex justify-between">
                    <div>
                      <p className="text-white font-semibold">{record.scenarioName}</p>
                      <p className="text-slate-300 text-sm">{record.summaryLabel}</p>
                    </div>
                    <p className="text-white font-bold text-lg">{record.qualityScore}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">DEBRIEF</h2>
              <div className="bg-slate-700/50 rounded p-4">
                <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{debrief}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">FINAL RELATIONSHIPS</h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(relationships).map(([name, value]) => (
                  <div key={name} className="bg-slate-700/50 rounded p-3">
                    <p className="text-slate-300 text-sm">{name}</p>
                    <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="text-white font-semibold mt-1">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Start New Mission <ChevronRight className="inline ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return <div className="text-white p-8">Loading...</div>;
}
