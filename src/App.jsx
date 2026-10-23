import React, { useState, useEffect } from 'react';
import { ChevronRight, Send, Package, ArrowRight, Loader2, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { createMissionSeed, generateMission, summarizeMissionCoverage } from './scenarioEngine';
import { buildValidationBrief, createSiteState, siteStatusSummary } from './siteProgression';
import MissionProductDialog from './MissionProductDialog';
import SubmissionReceipt from './SubmissionReceipt';
import { getKnowledgeQuestions, gradeKnowledgeQuestions } from './knowledgeChecks';
import { teamHuddleNarrative } from './teamNarrative';
import { firstAvailableSaveSlot, saveConfirmation } from './saveManager';
import { currentContinuityNarrative } from './continuityEngine';
import { buildDecisionTimeline } from './engagementProfile';
import { determineMissionDisposition } from './missionOutcome';
import { recommendTrainingRecognition } from './awardRecommendation';
import { ELIGIBILITY_REFERENCES, gradeAwardPractice, RECOGNITION_LEVELS } from './awardEducation';
import { buildPlaytestReport, createPlaytestTurn, reportFilename, updateTurnFeedback } from './playtestReport';
import { processUnifiedAction, outcomeFromTurn } from './unifiedActionPipeline';
import { migrateWorldState, SCORE_DIMENSIONS } from './worldUpdate';
import { APP_VERSION, buildPerformanceReport, performanceReportHtml, performanceDebrief, downloadFile } from './performanceReport';
import { siteOrientation, remainingSites } from './missionPlanning';
import MissionPlanning from './MissionPlanningScreen';
import StudyPractice from './StudyPracticeScreen';
import ClassroomOpordScreen from './ClassroomOpordScreen';
import CommandContinuityPanel, { CommandArrivalNote } from './CommandContinuityPanel';
import { submitCommandBrief } from './commandContinuity';
import { CAMPAIGNS, campaignDay, campaignTradeoffs, emptyChiefPlan } from './campaign';
import ChiefPlanningScreen from './ChiefPlanningScreen';
import MarketScenePanel, { ConversationPanel, FollowUpNotes } from './MarketScenePanel';
import CampaignMap from './CampaignMap';
import MarketActionHelper from './MarketActionHelper';
import { isMarket } from './marketScene';

// ===== SCENARIO DATA (MOVED OUTSIDE COMPONENT) =====
// Retained temporarily for save migration reference; new missions use scenarioEngine.js.
// eslint-disable-next-line no-unused-vars
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

const DEFAULT_TRAINING_PERSONALIZATION = {
  enabled: false,
  region: '',
  missionLabel: '',
  teamNames: {
    chief: '',
    sgt: '',
    canco: '',
    specialist: ''
  }
};

export default function HipPocketV43() {
  // ===== PHASE 1: CHARACTER CREATION STATE =====
  const [screen, setScreen] = useState('loadOrNew');
  const [operator, setOperator] = useState({ name: '', callsign: '' });
  const [playerRole, setPlayerRole] = useState(null); // 'specialist'|'canco'|'sgt'|'chief'
  const [missionDuration, setMissionDuration] = useState(null); // 3|7|14|29
  const [visitLimit, setVisitLimit] = useState(3);
  const [chiefPlan, setChiefPlan] = useState(emptyChiefPlan);
  const [missionSeed, setMissionSeed] = useState('');
  const [trainingPersonalization, setTrainingPersonalization] = useState(DEFAULT_TRAINING_PERSONALIZATION);
  const [saveSlots, setSaveSlots] = useState([null, null, null, null, null]); // Load from localStorage

  // ===== PHASE 2: DIFFICULTY & PROGRESSION STATE =====
  const [currentDay, setCurrentDay] = useState(1);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioLog, setScenarioLog] = useState([]);
  const [scenarioRecord, setScenarioRecord] = useState(null);
  const [missionRecords, setMissionRecords] = useState([]);
  const [routeDecisions, setRouteDecisions] = useState([]);
  const [planningSelection, setPlanningSelection] = useState('');
  const [planningRationale, setPlanningRationale] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [siteStates, setSiteStates] = useState({});
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);

  const [lastOutcome, setLastOutcome] = useState(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [lastDeltas, setLastDeltas] = useState({});
  const [debrief, setDebrief] = useState(null);
  const [checkPhase, setCheckPhase] = useState('annex');
  const [checkAttempt, setCheckAttempt] = useState(1);
  const [checkAnswers, setCheckAnswers] = useState({});
  const [checkFeedback, setCheckFeedback] = useState(null);
  const [activeLead, setActiveLead] = useState(null);
  const [leadReturnPending, setLeadReturnPending] = useState(false);
  const [missionConsequences, setMissionConsequences] = useState([]);
  const [saveNotice, setSaveNotice] = useState('');
  const [readinessResults, setReadinessResults] = useState({});
  const [awardPractice, setAwardPractice] = useState({ level: '', achievement: '', impact: '', scope: '', support: '' });
  const [awardPracticeResult, setAwardPracticeResult] = useState(null);
  const [playtestTurns, setPlaytestTurns] = useState([]);
  const [testerFeedbackOpen, setTesterFeedbackOpen] = useState(false);
  const [testerFeedback, setTesterFeedback] = useState({ categories: [], expectedResponse: '', notes: '' });
  const [reportNotice, setReportNotice] = useState('');
  const [worldState, setWorldState] = useState(() => migrateWorldState());
  const [sessionId, setSessionId] = useState('');
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionCompletedAt, setSessionCompletedAt] = useState(null);

  // ===== LOAD SAVES FROM LOCALSTORAGE ON MOUNT =====
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  useEffect(() => {
    try {
      const savedSlots = JSON.parse(localStorage.getItem('hipPocket_saves') || 'null');
      if (Array.isArray(savedSlots)) setSaveSlots([...savedSlots.slice(0, 5), ...Array(5).fill(null)].slice(0, 5));
    } catch {
      setSaveNotice('A saved mission could not be read. It has not been deleted; export your browser data before clearing it.');
    }
  }, []);

  useEffect(() => {
    if (missionSeed && playtestTurns.length) {
      localStorage.setItem(`hipPocket_playtest_${missionSeed}`, JSON.stringify(playtestTurns));
    }
  }, [missionSeed, playtestTurns]);

  // ===== SEEDED OFFLINE SCENARIO ENGINE =====
  const [missionScenarios, setMissionScenarios] = useState([]);
  
  // Generate only when explicitly starting a mission. Loading a save must not
  // regenerate its destination pool or invalidate recorded site IDs.

  function currentScenario() {
    const scenario = missionScenarios[scenarioIndex];
    return scenario ? { ...scenario, day: currentDay } : {};
  }

  function personalizedRegion() {
    return trainingPersonalization.enabled && trainingPersonalization.region.trim()
      ? trainingPersonalization.region.trim()
      : 'Dara Lam';
  }

  function personalizedMissionLabel() {
    return trainingPersonalization.enabled && trainingPersonalization.missionLabel.trim()
      ? trainingPersonalization.missionLabel.trim()
      : `${personalizedRegion()} HADR Assessment`;
  }

  function currentSiteState() {
    const scenario = currentScenario();
    return siteStates[scenario.id] || createSiteState(scenario);
  }

  // ===== DIFFICULTY MULTIPLIER SYSTEM =====
  const roleMultipliers = {
    'specialist': 0.8,  // 20% easier
    'canco': 0.9,       // 10% easier
    'sgt': 1.0,         // baseline
    'chief': 1.2        // 20% harder
  };

  function getComplexityMultiplier() {
    return missionDuration ? 1 + (currentDay / missionDuration) * 0.4 : 1;
  }

  function getFinalDifficultyMultiplier() {
    const role = roleMultipliers[playerRole] || 1.0;
    const complexity = getComplexityMultiplier();
    return role * complexity;
  }

  // ===== PHASE 3: PERSISTENCE =====
  function saveGame(slotNumber = currentSaveSlot, overrides = {}) {
    const saveData = {
      operator,
      playerRole,
      missionDuration,
      visitLimit,
      chiefPlan,
      missionSeed,
      trainingPersonalization,
      missionScenarios,
      currentDay,
      scenarioIndex,
      scenarioLog,
      scenarioRecord,
      missionRecords,
      routeDecisions,
      planningSelection,
      planningRationale,
      allProducts,
      siteStates,
      activeLead,
      relationships,
      missionConsequences,
      readinessResults,
      playtestTurns,
      worldState,
      sessionId,
      sessionStartedAt,
      sessionCompletedAt,
      debrief,
      screen,
      lastOutcome,
      pendingAdvance,
      leadReturnPending,
      timestamp: new Date().toISOString(),
      ...overrides
    };
    const newSlots = [...saveSlots];
    newSlots[slotNumber] = saveData;
    setSaveSlots(newSlots);
    localStorage.setItem('hipPocket_saves', JSON.stringify(newSlots));
    return saveData;
  }


  function beginNewGame() {
    const availableSlot = firstAvailableSaveSlot(saveSlots);
    if (availableSlot < 0) {
      setSaveNotice('All five save slots are occupied. Delete a save before starting a new mission.');
      return;
    }
    resetGame();
    setCurrentSaveSlot(availableSlot);
    setSessionId(window.crypto?.randomUUID?.() || `session-${Date.now()}`);
    setSessionStartedAt(new Date().toISOString());
    setSessionCompletedAt(null);
    setSaveNotice(`New mission reserved in Save Slot ${availableSlot + 1}.`);
    setScreen('characterCreation');
  }

  function saveAndExit() {
    const saveData = saveGame(currentSaveSlot);
    setSaveNotice(saveConfirmation(currentSaveSlot, saveData));
    setScreen('loadOrNew');
  }

  function loadGame(slotNumber) {
    const save = saveSlots[slotNumber];
    if (!save) return;
    setOperator(save.operator);
    setPlayerRole(save.playerRole);
    setMissionDuration(save.missionDuration);
    setVisitLimit(save.visitLimit || save.missionScenarios?.length || save.missionDuration);
    setChiefPlan(save.chiefPlan || emptyChiefPlan());
    setMissionSeed(save.missionSeed || `LEGACY-${new Date(save.timestamp).getTime()}`);
    setTrainingPersonalization(save.trainingPersonalization || DEFAULT_TRAINING_PERSONALIZATION);
    setMissionScenarios(save.missionScenarios || generateMission({ seed: save.missionSeed || `LEGACY-${new Date(save.timestamp).getTime()}`, days: save.missionDuration, role: save.playerRole }));
    setCurrentDay(save.currentDay);
    setScenarioIndex(save.scenarioIndex);
    setScenarioLog(save.scenarioLog);
    setScenarioRecord(save.scenarioRecord);
    setMissionRecords(save.missionRecords);
    setRouteDecisions(save.routeDecisions || []);
    setPlanningSelection(save.planningSelection || '');
    setPlanningRationale(save.planningRationale || '');
    setAllProducts(save.allProducts || []);
    setSiteStates(save.siteStates || {});
    setActiveLead(save.activeLead || null);
    setRelationships(save.relationships);
    setMissionConsequences(save.missionConsequences || []);
    setReadinessResults(save.readinessResults || {});
    setPlaytestTurns(save.playtestTurns || []);
    setWorldState(migrateWorldState({ world: save.worldState, siteStates: save.siteStates, relationships: save.relationships, missionConsequences: save.missionConsequences }));
    setSessionId(save.sessionId || `legacy-${save.missionSeed || slotNumber}`);
    setSessionStartedAt(save.sessionStartedAt || null);
    setSessionCompletedAt(save.sessionCompletedAt || null);
    setDebrief(save.debrief || null);
    setLastOutcome(save.lastOutcome || null);
    setPendingAdvance(save.pendingAdvance || false);
    setLeadReturnPending(save.leadReturnPending || false);
    setCurrentSaveSlot(slotNumber);
    const preparation = ['chiefPlanning', 'annexKBriefing', 'teamHuddle', 'readinessCheck', 'missionBriefing', 'missionPlanning'];
    setScreen(save.debrief ? 'debrief' : save.worldState?.missionOutcome?.terminated ? 'missionFailure' : preparation.includes(save.screen) ? save.screen : save.lastOutcome && ['outcomeDisplay', 'productDisplay'].includes(save.screen) ? save.screen : save.pendingAdvance && save.lastOutcome ? 'outcomeDisplay' : 'scenarioScreen');
  }

  function deleteSave(slotNumber) {
    const newSlots = [...saveSlots];
    newSlots[slotNumber] = null;
    setSaveSlots(newSlots);
    localStorage.setItem('hipPocket_saves', JSON.stringify(newSlots));
  }

  function getSaveDescription(save) {
    if (!save) return null;
    const scenario = save.missionScenarios?.[save.scenarioIndex];
    const location = save.screen === 'missionPlanning' ? 'Mission planning — choose next location' : scenario?.location || 'Legacy mission';
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

  function applyTurn(turn, summaryLabel) {
    const scenario = currentScenario();
    const normalizedResult = outcomeFromTurn(turn);
    const nextWorld = turn.nextWorld;
    const advancedSiteState = nextWorld.sites[scenario.id];
    const deltas = normalizedResult.relationshipShifts;
    const nextLog = [...scenarioLog, summaryLabel];
    const nextRecord = { ...normalizedResult, summaryLabel };
    const product = normalizedResult.product;
    const nextProducts = product ? [...allProducts.filter(p => !(p.name === product.name && p.scenarioId === scenario.id)), {
      ...product, scenarioId: scenario.id, scenarioName: scenario.name
    }] : allProducts;
    const playtestTurn = createPlaytestTurn({
      missionSeed, scenario, day: currentDay, locationNumber: missionRecords.length + 1,
      actionNumber: advancedSiteState.actionCount, playerAction: turn.actionRecord.rawText,
      summaryLabel, interpretation: turn.interpretation, outcome: normalizedResult,
      relationshipChanges: deltas, siteState: advancedSiteState
    });
    playtestTurn.actionRecord = turn.actionRecord;
    playtestTurn.worldUpdate = turn.worldUpdate;
    const nextTurns = [...playtestTurns, playtestTurn];
    setWorldState(nextWorld);
    setMissionConsequences(nextWorld.persistentConditions);
    setRelationships(nextWorld.relationships);
    setSiteStates(nextWorld.sites);
    setLastDeltas(deltas);
    setLastOutcome(normalizedResult);
    setScenarioLog(nextLog);
    setScenarioRecord(nextRecord);
    setAllProducts(nextProducts);
    setPlaytestTurns(nextTurns);
    setTesterFeedbackOpen(false);
    setTesterFeedback({ categories: [], expectedResponse: '', notes: '' });
    setReportNotice('');
    return {
      result: normalizedResult,
      save: { worldState: nextWorld, missionConsequences: nextWorld.persistentConditions,
        relationships: nextWorld.relationships, siteStates: nextWorld.sites,
        scenarioLog: nextLog, scenarioRecord: nextRecord, allProducts: nextProducts,
        playtestTurns: nextTurns, lastOutcome: normalizedResult }
    };
  }

  function toggleFeedbackCategory(category) {
    setTesterFeedback(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(item => item !== category)
        : [...prev.categories, category]
    }));
  }

  function saveTesterFeedback() {
    const latest = playtestTurns[playtestTurns.length - 1];
    if (!latest) return;
    const updated = updateTurnFeedback(playtestTurns, latest.id, {
      inaccurate: true,
      categories: testerFeedback.categories,
      expectedResponse: testerFeedback.expectedResponse.trim(),
      notes: testerFeedback.notes.trim()
    });
    setPlaytestTurns(updated);
    saveGame(currentSaveSlot, { playtestTurns: updated });
    setTesterFeedbackOpen(false);
    setReportNotice('Flag saved in this browser and mission save. Nothing was sent. Download the playtest report below and share it with your administrator.');
  }

  function exportPlaytestReport() {
    if (!playtestTurns.length) {
      setReportNotice('Complete at least one action before exporting a report.');
      return;
    }
const report = buildPlaytestReport({ missionSeed, turns: playtestTurns, appVersion: APP_VERSION });
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportFilename(missionSeed);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setReportNotice('Playtest report downloaded. Review it, then upload it to Codex for analysis.');
  }

  // Every field action, product, and lead goes through the same local decision.
  function runEval(rawText, summaryLabel, opts = {}) {
    if (loading) return;
    setLoading(true);
    setError(null);
    setLastSubmission({ rawText, summaryLabel, opts });
    try {
      const scenario = currentScenario();
      const activeScenario = opts.kind === 'lead' && activeLead
        ? { ...scenario, keyStakeholders: [activeLead.contact], location: activeLead.label } : scenario;
      const world = { ...worldState, sites: siteStates, relationships };
      const turn = processUnifiedAction({
        id: (sessionId || missionSeed) + '-turn-' + ((world.history || []).length + 1),
        rawText, kind: opts.kind || 'action', productName: opts.productName, missionProduct: opts.missionProduct,
        seed: missionSeed, scenarioId: scenario.id, turnNumber: (world.history || []).length + 1,
        scenario: activeScenario, activeLead: opts.kind === 'lead' ? activeLead : null, stakeholders: activeScenario.keyStakeholders,
        location: activeScenario.location, siteType: scenario.siteType,
        submittedProducts: allProducts.filter(p => p.scenarioId === scenario.id).map(p => p.name),
        worldState: world
      });
      if (!turn.ok) throw new Error(turn.errors.join(' '));
      const applied = applyTurn(turn, summaryLabel);
      const nextScreen = applied.result.missionTerminated ? 'missionFailure' : applied.result.product ? 'productDisplay' : 'outcomeDisplay';
      setPendingAdvance(Boolean(opts.isMoveOn));
      setLeadReturnPending(opts.kind === 'lead');
      setScreen(nextScreen);
      setActionText(''); setShowProductPanel(false);
      saveGame(currentSaveSlot, { ...applied.save, screen: nextScreen, pendingAdvance: Boolean(opts.isMoveOn), leadReturnPending: opts.kind === 'lead' });
    } catch (e) {
      setError(e.message || 'The local action could not be recorded. Your previous state is unchanged.');
    } finally { setLoading(false); }
  }

  function retry() {
    if (lastSubmission) runEval(lastSubmission.rawText, lastSubmission.summaryLabel, lastSubmission.opts);
  }

  function submitAction() {
    if (actionText.trim()) runEval(actionText.trim(), actionText.trim());
  }

  function submitLeadAction() {
    if (activeLead && actionText.trim()) runEval(actionText.trim(), actionText.trim(), { kind: 'lead' });
  }

  function submitProduct(brief) {
    const content = `Product: ${brief.name}\nRecipient: ${brief.recipient.trim()}\nPurpose: ${brief.purpose.trim()}\nKey finding and uncertainty: ${brief.keyFinding.trim()}`;
    runEval(content, 'Submitted ' + brief.name, { kind: 'product', productName: brief.name, missionProduct: brief });
  }

  function recordCommandBrief(draft, scenarioId) {
    const nextWorld = submitCommandBrief({ world: worldState, scenarios: missionScenarios, records: missionRecords, scenarioId, draft, day: currentDay });
    // Persist before acknowledging the brief; preserve existing field evidence and scores.
    saveGame(currentSaveSlot, { worldState: nextWorld });
    setWorldState(nextWorld);
  }

  function moveOn() {
    if (loading) return;
    if (scenarioRecord) finalizeScenario();
    else runEval('Depart without engaging at this location.', 'Departed without engaging', { kind: 'skip', isMoveOn: true });
  }

  function openMissionPlanning(overrides = {}) {
    setPlanningSelection('');
    setPlanningRationale('');
    setPendingAdvance(false);
    setActiveLead(null);
    setLeadReturnPending(false);
    setScreen('missionPlanning');
    saveGame(currentSaveSlot, { ...overrides, planningSelection: '', planningRationale: '', screen: 'missionPlanning', pendingAdvance: false, activeLead: null, leadReturnPending: false });
  }

  function travelToSelectedSite() {
    if (missionRecords.length >= visitLimit) return;
    const choice = remainingSites(missionScenarios, missionRecords).find(({ scenario }) => scenario.id === planningSelection);
    if (!choice || worldState.missionOutcome?.terminated) return;
    const decisions = [...routeDecisions, { scenarioId: choice.scenario.id, location: choice.scenario.location, scenarioName: choice.scenario.name,
      day: currentDay, rationale: planningRationale.trim(), selectedAt: new Date().toISOString() }];
    setRouteDecisions(decisions);
    setScenarioIndex(choice.index);
    setScenarioLog([]); setScenarioRecord(null); setLastOutcome(null); setLastDeltas({});
    setActionText(''); setShowProductPanel(false); setError(null); setReportNotice('');
    setPlanningSelection(''); setPlanningRationale('');
    setScreen('scenarioScreen');
    saveGame(currentSaveSlot, { routeDecisions: decisions, scenarioIndex: choice.index, scenarioLog: [], scenarioRecord: null,
      lastOutcome: null, planningSelection: '', planningRationale: '', screen: 'scenarioScreen', pendingAdvance: false, activeLead: null, leadReturnPending: false });
  }

  function finalizeScenario() {
    const scenario = currentScenario();
    const newRecord = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      location: scenario.location,
      hadrFocus: scenario.hadrFocus,
      summaryLabel: scenarioRecord?.summaryLabel || 'Moved on without engaging',
      qualityScore: scenarioRecord?.qualityScore ?? 0,
      discSignal: scenarioRecord?.discSignal || 'c',
      consequenceChain: scenarioRecord?.consequenceChain || null,
      day: currentDay,
      siteProgress: currentSiteState()
    };
    const updatedRecords = [...missionRecords, newRecord];
    setMissionRecords(updatedRecords);
    setScenarioLog([]);
    setScenarioRecord(null);
    setLastDeltas({});

    if (updatedRecords.length < visitLimit && remainingSites(missionScenarios, updatedRecords).length) {
      const nextDay = campaignDay(missionDuration, visitLimit, updatedRecords.length);
      setCurrentDay(nextDay);
      openMissionPlanning({ missionRecords: updatedRecords, currentDay: nextDay, scenarioLog: [], scenarioRecord: null, lastOutcome: null });
    } else {
      setScreen('debriefLoading');
      generateDebrief(updatedRecords);
    }
  }

  function finishTerminatedMission() {
    const scenario = currentScenario();
    const terminalRecord = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      location: scenario.location,
      hadrFocus: scenario.hadrFocus,
      summaryLabel: scenarioRecord?.summaryLabel || 'Mission terminated by command',
      qualityScore: scenarioRecord?.qualityScore ?? -100,
      discSignal: scenarioRecord?.discSignal || 'c',
      consequenceChain: scenarioRecord?.consequenceChain || null,
      day: currentDay,
      siteProgress: currentSiteState(),
      missionTerminated: true
    };
    const updatedRecords = [...missionRecords, terminalRecord];
    setMissionRecords(updatedRecords);
    setScreen('debriefLoading');
    generateDebrief(updatedRecords);
  }

  function applySuggestion(text) {
    setActionText(prev => (prev ? prev + ' ' + text : text));
  }

  function optionalNextActions(scenario, siteState) {
    const stakeholder = scenario.keyStakeholders?.[0] || 'the primary stakeholder';
    const suggestions = [];
    if (!(siteState.actions || []).length) {
      suggestions.push(`Introduce the team to ${stakeholder}, explain the mission purpose, ask permission to continue, and invite their initial concerns.`);
    } else {
      suggestions.push(`Ask ${stakeholder} one focused follow-up question about the most important unresolved information gap.`);
    }
    if (!(siteState.discoveries || []).length) {
      suggestions.push(`Ask ${stakeholder} what has changed, who is affected, who else has relevant information, and what records may exist.`);
    } else {
      suggestions.push(`Select one stakeholder claim already collected and compare it with a named second source, relevant record, or direct observation.`);
    }
    if ((siteState.informationGaps || []).some(gap => /capacity|condition|population|consequence/i.test(gap))) {
      suggestions.push(`Request permission to observe current site conditions and document capacity, affected populations, and immediate risks.`);
    }
    if ((siteState.informationGaps || []).some(gap => /authority|coordination/i.test(gap))) {
      suggestions.push(`Identify the responsible local authority and confirm the coordination pathway without promising assistance or an outcome.`);
    }
    const openLead = (siteState.leads || []).find(lead => lead.status !== 'completed');
    if (openLead) {
      suggestions.push(`Ask what specifically connects this location to the ${openLead.label}, then decide whether the developed lead is relevant enough to investigate.`);
    }
    return suggestions.slice(0, 4);
  }

  function continueFromOutcome() {
    // By this point React has committed the evaluation and location progress,
    // so this save includes the action the trainee just completed.
    if (leadReturnPending) {
      setLeadReturnPending(false);
      setActiveLead(null);
      setScreen('scenarioScreen');
      saveGame(currentSaveSlot, { screen: 'scenarioScreen', leadReturnPending: false, activeLead: null });
    } else if (pendingAdvance) {
      finalizeScenario();
    } else {
      setScreen('scenarioScreen');
      saveGame(currentSaveSlot, { screen: 'scenarioScreen' });
    }
  }

  function getPerformanceReport(records = missionRecords, completedAt = sessionCompletedAt) {
    return buildPerformanceReport({
      world: worldState, operator, playerRole, sessionId, missionSeed,
      missionLabel: personalizedMissionLabel(), startedAt: sessionStartedAt, completedAt,
      plannedLocations: visitLimit, missionRecords: records, readinessResults, products: allProducts, routeDecisions,
      unvisitedDestinations: campaignTradeoffs(missionScenarios, records), chiefPlan, missionScenarios
    });
  }

  function exportPerformanceReport(format) {
    const report = getPerformanceReport();
    const filename = 'hip-pocket-performance-' + String(sessionId || missionSeed).replace(/[^a-z0-9-]/gi, '_');
    if (format === 'json') downloadFile(filename + '.json', JSON.stringify(report, null, 2), 'application/json');
    else downloadFile(filename + '.html', performanceReportHtml(report), 'text/html;charset=utf-8');
    setReportNotice(format === 'json' ? 'Performance evidence downloaded.' : 'Report downloaded. Open it and use Print → Save as PDF.');
  }

  function printPerformanceReport() {
    const frame = document.createElement('iframe');
    frame.title = 'Printable Soldier Performance Report';
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0';
    frame.onload = () => {
      frame.contentWindow.onafterprint = () => frame.remove();
      frame.contentWindow.focus();
      frame.contentWindow.print();
    };
    frame.srcdoc = performanceReportHtml(getPerformanceReport());
    document.body.appendChild(frame);
  }

  function generateDebrief(records) {
    const endedAt = new Date().toISOString();
    const text = performanceDebrief(getPerformanceReport(records, endedAt));
    setSessionCompletedAt(endedAt);
    setDebrief(text);
    setScreen('debrief');
    saveGame(currentSaveSlot, { missionRecords: records, sessionCompletedAt: endedAt, debrief: text, screen: 'debrief', pendingAdvance: false, activeLead: null });
  }

  function resetGame() {
    setScreen('loadOrNew');
    setOperator({ name: '', callsign: '' });
    setPlayerRole(null);
    setMissionDuration(null);
    setVisitLimit(3);
    setChiefPlan(emptyChiefPlan());
    setMissionScenarios([]);
    setTrainingPersonalization(DEFAULT_TRAINING_PERSONALIZATION);
    setCurrentDay(1);
    setScenarioIndex(0);
    setScenarioLog([]);
    setScenarioRecord(null);
    setMissionRecords([]);
    setRouteDecisions([]);
    setPlanningSelection('');
    setPlanningRationale('');
    setAllProducts([]);
    setSiteStates({});
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
    setLastOutcome(null);
    setLastDeltas({});
    setPendingAdvance(false);
    setDebrief(null);
    setError(null);
    setCheckPhase('annex');
    setCheckAttempt(1);
    setCheckAnswers({});
    setCheckFeedback(null);
    setActiveLead(null);
    setLeadReturnPending(false);
    setMissionConsequences([]);
    setReadinessResults({});
    setAwardPractice({ level: '', achievement: '', impact: '', scope: '', support: '' });
    setAwardPracticeResult(null);
    setPlaytestTurns([]);
    setTesterFeedbackOpen(false);
    setTesterFeedback({ categories: [], expectedResponse: '', notes: '' });
    setReportNotice('');
    setWorldState(migrateWorldState());
    setSessionId('');
    setSessionStartedAt(null);
    setSessionCompletedAt(null);
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
  if (screen === 'chiefPlanning') {
    return <ChiefPlanningScreen plan={chiefPlan} onChange={setChiefPlan} visits={visitLimit} destinations={missionScenarios.length} onSave={saveAndExit}
      onContinue={() => { const plan = { ...chiefPlan, completed: true }; setChiefPlan(plan); setScreen('annexKBriefing'); saveGame(currentSaveSlot, { chiefPlan: plan, screen: 'annexKBriefing' }); }} />;
  }
  if (screen === 'studyPractice') {
    return <StudyPractice onExit={() => setScreen('loadOrNew')} />;
  }
  if (screen === 'classroomOpord') {
    return <ClassroomOpordScreen onExit={() => setScreen('loadOrNew')} />;
  }
  if (screen === 'loadOrNew') {
    const hasSaves = saveSlots.some(s => s !== null);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold text-white mb-3">Hip Pocket</h1>
            <p className="text-blue-200 text-xl mb-2">Civil Affairs Training · {APP_VERSION}</p>
            <p className="text-slate-400">Save & load • Role-based difficulty • Drill weekend, annual training, deployment</p>
          </div>

          <section className="bg-slate-800 rounded-lg p-6 border border-teal-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Study & Staff Practice</h2>
            <p className="text-slate-300 mb-4">Practice engagement preparation, reporting and civil assessment without starting a mission. Save your work and export a report for leader review.</p>
            <button onClick={() => setScreen('studyPractice')} className="bg-teal-700 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-bold">Open Study & Staff Practice</button>
          </section>

          <section className="bg-slate-800 rounded-lg p-6 border border-sky-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Classroom OPORD Exercise</h2>
            <p className="text-slate-300 mb-4">Generate a fictional staff exercise for your class: mission analysis, CA contributions across phases, and three-team prioritization. Print student worksheets and separate draft facilitator notes.</p>
            <button onClick={() => setScreen('classroomOpord')} className="bg-sky-700 hover:bg-sky-600 text-white px-6 py-3 rounded-lg font-bold">Open Classroom OPORD Exercise</button>
          </section>

          {saveNotice && (
            <div className={`rounded-lg p-4 border mb-6 ${
              saveNotice.startsWith('All five')
                ? 'bg-red-950/50 border-red-700 text-red-100'
                : 'bg-green-950/50 border-green-700 text-green-100'
            }`}>
              <p className="font-semibold">{saveNotice}</p>
            </div>
          )}

          {hasSaves && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">CONTINUE GAME</h2>
              <div className="space-y-2 mb-6">
                {saveSlots.map((save, idx) => (
                  <div key={idx} className="bg-slate-700/50 rounded p-3 flex items-center justify-between">
                    {save ? (
                      <>
                        <div className="flex-1">
                          <p className="text-white font-semibold">{getSaveDescription(save)?.location}</p>
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
                onClick={beginNewGame}
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
                onClick={beginNewGame}
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
        desc: 'Guided difficulty. Optional next-action ideas and additional guidance.',
        difficulty: '★☆☆☆'
      },
      {
        id: 'canco',
        name: 'CANCO',
        desc: 'Intermediate difficulty. Some guidance. The same evidence rubric applies.',
        difficulty: '★★☆☆'
      },
      {
        id: 'sgt',
        name: 'Team Sergeant',
        desc: 'Advanced difficulty. Minimal hints and responsibility for team performance.',
        difficulty: '★★★☆'
      },
      {
        id: 'chief',
        name: 'Team Chief',
        desc: 'Command difficulty. Begin with a pre-deployment planning rehearsal, then lead without hints. The same evidence rubric applies.',
        difficulty: '★★★★'
      }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-purple-700 to-purple-800 rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-white">SELECT YOUR ROLE & DIFFICULTY</h1>
            <p className="text-purple-100 mt-2">Your role determines guidance, scenario complexity and leadership responsibility—not a different standard for what is true.</p>
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
    const durations = CAMPAIGNS;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 rounded-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-white">SELECT MISSION DURATION</h1>
            <p className="text-indigo-100 mt-2">Choose a simulated training period—not hours of required gameplay. Save and resume whenever you need.</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={trainingPersonalization.enabled}
                onChange={(event) => setTrainingPersonalization({
                  ...trainingPersonalization,
                  enabled: event.target.checked
                })}
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="text-white font-bold block">Personalize this training mission</span>
                <span className="text-slate-300 text-sm">Optionally replace the fictional region and generated teammate names to make the narrative feel more familiar.</span>
              </span>
            </label>

            {trainingPersonalization.enabled && (
              <div className="mt-5 space-y-4">
                <div className="bg-amber-950/30 border border-amber-800 rounded p-4">
                  <p className="text-amber-200 text-sm font-semibold">Use fictional or approved unclassified training information only.</p>
                  <p className="text-amber-100/80 text-xs mt-1">Do not enter classified information, CUI, PII, exact operational locations, real threat reporting, or other sensitive mission details. These entries stay in this browser and in its local save slots.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <label className="text-slate-300 text-sm">
                    Country or fictional region
                    <input
                      type="text"
                      value={trainingPersonalization.region}
                      onChange={(event) => setTrainingPersonalization({
                        ...trainingPersonalization,
                        region: event.target.value
                      })}
                      placeholder="Leave blank to use Dara Lam"
                      className="w-full mt-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
                    />
                  </label>
                  <label className="text-slate-300 text-sm">
                    Mission title
                    <input
                      type="text"
                      value={trainingPersonalization.missionLabel}
                      onChange={(event) => setTrainingPersonalization({
                        ...trainingPersonalization,
                        missionLabel: event.target.value
                      })}
                      placeholder="Example: Regional HADR Preparation"
                      className="w-full mt-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
                    />
                  </label>
                </div>

                <div>
                  <p className="text-slate-300 text-sm font-semibold mb-2">Optional teammate names</p>
                  <p className="text-slate-400 text-xs mb-3">Leave any field blank and the simulator will generate that teammate.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      ['chief', 'Team Chief'],
                      ['sgt', 'Team Sergeant'],
                      ['canco', 'Civil Affairs NCO'],
                      ['specialist', 'Civil Affairs Specialist']
                    ].map(([key, label]) => (
                      <label key={key} className="text-slate-300 text-sm">
                        {label}
                        <input
                          type="text"
                          value={trainingPersonalization.teamNames[key]}
                          onChange={(event) => setTrainingPersonalization({
                            ...trainingPersonalization,
                            teamNames: {
                              ...trainingPersonalization.teamNames,
                              [key]: event.target.value
                            }
                          })}
                          placeholder="Generated if blank"
                          className="w-full mt-1 px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 mb-6">
            {durations.map(dur => (
              <button
                key={dur.days}
                onClick={() => {
                  const seed = createMissionSeed();
                  setMissionSeed(seed);
                  setMissionDuration(dur.days);
                  setVisitLimit(dur.visits);
                  setChiefPlan(emptyChiefPlan());
                  setMissionScenarios(generateMission({ seed, days: dur.days, role: playerRole, candidateCount: dur.destinations, includeMarket: true }));
                  setCurrentDay(1);
                  setScenarioIndex(0);
                  setScenarioLog([]);
                  setScenarioRecord(null);
                  setMissionRecords([]);
                  setAllProducts([]);
                  setSiteStates({});
                  setPlaytestTurns([]);
                  setReportNotice('');
                  setScreen(playerRole === 'chief' ? 'chiefPlanning' : 'annexKBriefing');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 rounded-lg p-6 border border-slate-700 hover:border-indigo-600 text-left transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">{dur.name}</h3>
                  <span className="text-slate-400 text-sm">{dur.days} simulated days · {dur.visits} visits</span>
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
                <p><strong>MISSION:</strong> Assess the {personalizedRegion()} region's civil environment with focus on HADR capability and disaster response readiness.</p>
                <p><strong>COMMANDER'S INTENT:</strong> Understand the region's vulnerability to disasters and identify assets/gaps for HADR planning.</p>
                <p><strong>HADR FOCUS:</strong> Emergency sheltering, medical response, fire response, water/health risk, supply logistics, evacuation capability, population vulnerability.</p>
                <p><strong>EXPECTED PRODUCTS:</strong> Infrastructure assessments (ATP 3-57.50), KLE reports, HADR contingency plans, gap analysis memos — as relevant to what you find.</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">ASCOPE BASELINE — CIVIL ENVIRONMENT</h2>
              <div className="space-y-3 text-slate-100 text-sm">
                <p><strong>AREAS:</strong> {personalizedRegion()} municipality, ~50 sq km, prone to flooding (seasonal). Main road connects to provincial capital (2 hours).</p>
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
            onClick={() => {
              setCheckPhase('annex');
              setCheckAttempt(1);
              setCheckAnswers({});
              setCheckFeedback(null);
              setScreen('teamHuddle');
            }}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Continue to Mission Brief <ChevronRight className="inline ml-2 w-5 h-5" />
          </button>

          <div className="bg-amber-950/30 border border-amber-700 rounded-lg p-5">
            <p className="text-amber-200 text-xs font-bold uppercase tracking-wide">Temporary testing shortcut</p>
            <p className="text-slate-300 text-sm mt-2">For repeated application testing only. This bypasses the team huddle and all three learning checks; skipped readiness blocks receive no score.</p>
            <button
              onClick={() => {
                setReadinessResults({
                  annex: { skippedForTesting: true },
                  ascope: { skippedForTesting: true },
                  pmesii: { skippedForTesting: true }
                });
                setCheckPhase('annex');
                setCheckAttempt(1);
                setCheckAnswers({});
                setCheckFeedback(null);
                setScreen('missionBriefing');
              }}
              className="w-full mt-4 bg-amber-700 hover:bg-amber-600 text-white px-6 py-3 rounded font-bold"
            >
              Skip Refreshers for Testing
            </button>
          </div>

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

  // ===== RENDER: TEAM HUDDLE =====
  if (screen === 'teamHuddle') {
    const huddle = teamHuddleNarrative(
      missionSeed,
      playerRole,
      trainingPersonalization.enabled
        ? { region: personalizedRegion(), teamNames: trainingPersonalization.teamNames }
        : {}
    );
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/90 rounded-xl border border-blue-700 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-8">
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">Pre-Deployment • Team Room</p>
              <h1 className="text-4xl font-bold text-white mt-2">{huddle.title}</h1>
            </div>

            <div className="p-8">
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {huddle.roster.map(member => (
                  <div key={member.key} className={`rounded-lg border p-4 ${member.isPlayer ? 'bg-green-900/30 border-green-600' : 'bg-slate-900/60 border-slate-700'}`}>
                    <p className={member.isPlayer ? 'text-green-200 font-bold' : 'text-white font-semibold'}>{member.display}</p>
                    {member.isPlayer && <p className="text-green-300 text-xs mt-1">YOUR ROLE</p>}
                  </div>
                ))}
              </div>

              <div className="space-y-5 text-slate-100 text-lg leading-relaxed">
                {huddle.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>

              <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-5">
                <p className="text-blue-100 font-semibold">Team objective</p>
                <p className="text-blue-200 text-sm mt-1">Confirm what the Annex K requires, refresh the team’s analytical frameworks, and deploy with a shared understanding of the mission.</p>
              </div>

              <button
                onClick={() => setScreen('readinessCheck')}
                className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
              >
                Join the Team Review <ChevronRight className="inline ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: PRE-MISSION LEARNING CHECK =====
  if (screen === 'readinessCheck') {
    const questions = getKnowledgeQuestions(checkPhase, checkAttempt, missionSeed);
    const allAnswered = questions.every(question => checkAnswers[question.id] !== undefined);
    const phaseNames = {
      annex: 'Annex K Mission Understanding',
      ascope: 'ASCOPE Refresher',
      pmesii: 'PMESII-PT Refresher'
    };
    const phaseName = phaseNames[checkPhase];
    const phaseNumber = { annex: 1, ascope: 2, pmesii: 3 }[checkPhase];

    function advanceKnowledgeCheck() {
      if (checkPhase === 'annex') {
        setCheckPhase('ascope');
        setCheckAttempt(1);
        setCheckAnswers({});
        setCheckFeedback(null);
      } else if (checkPhase === 'ascope') {
        setCheckPhase('pmesii');
        setCheckAttempt(1);
        setCheckAnswers({});
        setCheckFeedback(null);
      } else {
        setScreen('missionBriefing');
      }
    }

    function submitKnowledgeCheck() {
      const result = gradeKnowledgeQuestions(questions, checkAnswers);
      setReadinessResults(prev => ({
        ...prev,
        [checkPhase]: {
          ...(prev[checkPhase] || {}),
          attempts: checkAttempt,
          questionCount: questions.length,
          firstAttemptPassed: checkAttempt === 1 ? result.passed : prev[checkPhase]?.firstAttemptPassed || false,
          firstAttemptMissed: checkAttempt === 1 ? result.missed.length : prev[checkPhase]?.firstAttemptMissed ?? 0,
          completedPassed: result.passed,
          finalMissed: result.missed.length
        }
      }));
      if (result.passed) {
        advanceKnowledgeCheck();
      } else {
        setCheckFeedback(result);
      }
    }

    function continueAfterMiss() {
      if (checkAttempt === 1) {
        setCheckAttempt(2);
        setCheckAnswers({});
        setCheckFeedback(null);
      } else {
        advanceKnowledgeCheck();
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-700 to-blue-800 rounded-lg p-8 mb-6">
            <p className="text-cyan-100 text-sm">Learning block {phaseNumber} of 3 • Attempt {checkAttempt} of 2</p>
            <h1 className="text-3xl font-bold text-white mt-1">{phaseName}</h1>
            <p className="text-cyan-100 mt-2">This is a refresher, not a gate. Missed answers show the relevant point; after a second attempt you will continue regardless.</p>
          </div>

          <div className="space-y-5">
            {questions.map((question, questionIndex) => (
              <div key={question.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <p className="text-white font-semibold mb-4">{questionIndex + 1}. {question.prompt}</p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label key={option} className="flex gap-3 bg-slate-700/60 hover:bg-slate-700 rounded p-3 text-slate-100 cursor-pointer">
                      <input
                        type="radio"
                        name={question.id}
                        checked={Number(checkAnswers[question.id]) === optionIndex}
                        onChange={() => setCheckAnswers(prev => ({ ...prev, [question.id]: optionIndex }))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {checkFeedback && (
            <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-5 mt-6">
              <p className="text-amber-100 font-bold mb-3">Review before continuing</p>
              {checkFeedback.missed.map(question => <p key={question.id} className="text-amber-50 text-sm mb-2">{question.review}</p>)}
              <button onClick={continueAfterMiss} className="mt-3 bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded font-bold">
                {checkAttempt === 1 ? 'Try New Questions' : 'Continue Training'}
              </button>
            </div>
          )}

          {!checkFeedback && (
            <button
              onClick={submitKnowledgeCheck}
              disabled={!allAnswered}
              className="w-full mt-6 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-4 rounded font-bold"
            >
              Check Understanding
            </button>
          )}
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
    const coverage = summarizeMissionCoverage(missionScenarios);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-green-700 to-green-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white">MISSION BRIEFING</h1>
            <p className="text-green-100 mt-2">{personalizedMissionLabel()} — {missionDuration} simulated days</p>
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
              <p className="text-white">Assess {personalizedRegion()}'s civil environment for HADR readiness across {missionDuration} days of engagement.</p>
              <p className="text-slate-400 text-sm mt-2">You can visit {visitLimit} of {missionScenarios.length} possible destinations. Prioritize what you need to learn and leave a useful handover for what you cannot cover. Unvisited destinations are not automatic failures.</p>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-3">Planned Training Exposure</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/50 rounded p-3"><p className="text-slate-400 text-xs">Site types</p><p className="text-white text-xl font-bold">{Object.keys(coverage.sites).length}</p></div>
                <div className="bg-slate-900/50 rounded p-3"><p className="text-slate-400 text-xs">Mission activities</p><p className="text-white text-xl font-bold">{Object.keys(coverage.missions).length}</p></div>
                <div className="bg-slate-900/50 rounded p-3"><p className="text-slate-400 text-xs">Environments</p><p className="text-white text-xl font-bold">{Object.keys(coverage.environments).length}</p></div>
                <div className="bg-slate-900/50 rounded p-3"><p className="text-slate-400 text-xs">Complications</p><p className="text-white text-xl font-bold">{Object.keys(coverage.complications).length}</p></div>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wide mb-2">Field-visit budget</h3>
              <p className="text-white">{visitLimit} visit slots · {missionScenarios.length} destinations · Play at your own pace</p>
            </div>
          </div>

          <button
            onClick={() => openMissionPlanning()}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-lg font-bold text-lg"
          >
            Plan Your First Move <ChevronRight className="inline ml-2 w-5 h-5" />
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

  if (screen === 'missionPlanning') {
    return <MissionPlanning scenarios={missionScenarios} records={missionRecords} sites={siteStates} consequences={missionConsequences}
      world={worldState} onCommandBrief={recordCommandBrief}
      visitLimit={visitLimit} duration={missionDuration} chiefPlan={chiefPlan}
      day={currentDay} region={personalizedRegion()} missionLabel={personalizedMissionLabel()} selected={planningSelection} rationale={planningRationale}
      onSelect={setPlanningSelection} onRationale={setPlanningRationale} onTravel={travelToSelectedSite} onSave={saveAndExit} />;
  }

  // ===== RENDER: PLAYABLE LEAD SCENE =====
  if (screen === 'leadScene' && activeLead) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8">
        <LoadingOverlay />
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Follow-on engagement</p>
          <h1 className="text-4xl font-bold text-white mt-2 mb-6">{activeLead.label}</h1>

          <div className="bg-slate-800 rounded-lg p-8 border border-indigo-700 mb-6 text-slate-100 text-lg leading-relaxed">
            <p className="whitespace-pre-wrap">{activeLead.scene}</p>
            <p className="mt-5 text-amber-100">Before the conversation settles, a new complication becomes visible: {activeLead.tension}</p>
          </div>

          <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-5 mb-6">
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wide">What brought you here</p>
            <p className="text-white mt-2">{activeLead.discoveryText || activeLead.reason}</p>
            <p className="text-slate-300 text-sm mt-3">You have not yet confirmed that this location explains conditions at the {activeLead.originLocation}. Decide how you will engage, what you will observe, and how you will test the original claim.</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <label className="text-slate-400 text-xs font-bold uppercase tracking-wide block mb-2">How does your team investigate?</label>
            <textarea
              value={actionText}
              onChange={(event) => setActionText(event.target.value)}
              placeholder="Describe how you approach the contact, what you ask or observe, and how you will validate the connection..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-700 text-white rounded border border-slate-600 placeholder-slate-500 resize-y mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={submitLeadAction}
                disabled={!actionText.trim() || loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-3 rounded font-bold"
              >
                Conduct Follow-Up
              </button>
              <button
                onClick={() => {
                  setActionText('');
                  setActiveLead(null);
                  setScreen('scenarioScreen');
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold"
              >
                Return Without Engaging
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: SCENARIO SCREEN =====
  if (screen === 'scenarioScreen' && playerRole && missionDuration) {
    const scenario = currentScenario();
    const siteState = currentSiteState();
    const hasProgress = siteState.actions.length > 0;
    const validationBrief = buildValidationBrief(siteState);
    const showHints = playerRole === 'specialist' || playerRole === 'canco';
    const diffMult = getFinalDifficultyMultiplier().toFixed(2);
    const orientation = siteOrientation(scenario);
    const routeChoice = routeDecisions.find(choice => choice.scenarioId === scenario.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <LoadingOverlay />
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-blue-300 text-sm">Day {currentDay} of {missionDuration} • Visit {missionRecords.length + 1} of {visitLimit} · {missionScenarios.length} possible destinations</p>
              <p className="text-slate-400 text-xs mt-1">Mission seed: {missionSeed}</p>
              <h1 className="text-4xl font-bold text-white mt-1">{scenario.name}</h1>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">DIFFICULTY</p>
              <p className="text-white font-bold text-lg">{diffMult}x</p>
              <button
                onClick={saveAndExit}
                className="mt-3 bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-4 py-2 rounded font-semibold text-sm"
              >
                Save & Exit
              </button>
            </div>
          </div>

          <ErrorBanner />

          <section aria-labelledby="site-purpose" className="mb-6 border-l-4 border-cyan-400 bg-slate-800/60 rounded-r-lg px-6 py-5">
            <h2 id="site-purpose" className="text-cyan-200 text-sm font-bold uppercase tracking-wide">Your Purpose Here</h2>
            <p className="text-white mt-2 leading-relaxed">{orientation.purpose} Distinguish reported concerns from verified findings and identify appropriate follow-up.</p>
            {routeChoice && <p className="text-slate-300 text-sm mt-2">You chose this location for Day {routeChoice.day}.{routeChoice.rationale ? ` Your reasoning: ${routeChoice.rationale}` : ''}</p>}
            <p className="text-slate-400 text-sm mt-3">Read the scene, then describe what your team says or does. Use Create a Product to submit documents. Conclude the site when you are ready to plan your next move.</p>
          </section>

          <details className="mb-6 rounded-lg border border-cyan-700 bg-slate-900 p-4 text-white">
            <summary className="cursor-pointer font-semibold">AO Map · Current location: {scenario.location}</summary>
            <CampaignMap scenarios={missionScenarios} records={missionRecords} selected={scenario.id} visitLimit={visitLimit} sites={worldState.sites || {}} readOnly />
          </details>

          <div className="flex flex-col">
          <CommandArrivalNote world={worldState} scenario={scenario} scenarios={missionScenarios} records={missionRecords} />
          {missionConsequences.length > 0 && (
            <div className="order-2 bg-red-950/60 rounded-lg p-5 border border-red-700 mb-6">
              <p className="text-red-300 text-xs font-bold uppercase tracking-wide">Active Mission Consequences</p>
              <div className="space-y-4 mt-3">
                {missionConsequences.map(item => (
                  <div key={item.id}>
                      <p className="text-white font-semibold">{item.title} <span className="text-red-300 text-sm">({item.status}; {item.occurrenceCount || 1} occurrence{(item.occurrenceCount || 1) === 1 ? '' : 's'})</span></p>
                    <ul className="text-red-100 text-sm list-disc pl-5 mt-2 space-y-1">
                      {item.persistentEffects.map(effect => <li key={effect}>{effect}</li>)}
                    </ul>
                    {item.mitigationNote && <p className="text-amber-200 text-sm mt-2">{item.mitigationNote}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasProgress && (validationBrief.claims.length > 0 || validationBrief.gaps.length > 0 || validationBrief.leads.length > 0) && (
            <div className="order-first bg-amber-950/30 rounded-lg p-6 border border-amber-600 mb-6">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">Where you left off · What requires validation</p>
              <p className="text-slate-300 text-sm mt-2">
                These are claims or unresolved questions—not confirmed facts. Choose a source, record, observation, or comparison that could confirm or contradict them.
              </p>

              {validationBrief.claims.length > 0 && (
                <div className="mt-4">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">Claims currently on the table</p>
                  <ul className="text-white text-sm space-y-2 list-disc pl-5">
                    {validationBrief.claims.map(claim => <li key={claim}>{claim}</li>)}
                  </ul>
                </div>
              )}

              {validationBrief.gaps.length > 0 && (
                <div className="mt-4">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">Questions that remain unanswered</p>
                  <ul className="text-amber-100 text-sm space-y-2 list-disc pl-5">
                    {validationBrief.gaps.map(gap => <li key={gap}>{gap}</li>)}
                  </ul>
                </div>
              )}

              {validationBrief.leads.length > 0 && (
                <div className="mt-5">
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">Available validation leads</p>
                  <div className="space-y-2">
                    {validationBrief.leads.map(lead => (
                      <div key={lead.id} className="bg-slate-900/70 border border-amber-800 rounded p-4 flex justify-between items-center gap-3">
                        <div>
                          <p className="text-white font-semibold">{lead.label}</p>
                          <p className="text-slate-300 text-sm mt-1">{lead.discoveryText || lead.reason}</p>
                          <p className="text-amber-300 text-xs mt-2">Possible source: {lead.contact || 'Follow the lead to identify a source'}</p>
                        </div>
                        <button
                          onClick={() => {
                            setActiveLead(lead);
                            setActionText('');
                            setScreen('leadScene');
                          }}
                          className="shrink-0 bg-indigo-700 hover:bg-indigo-600 text-white text-xs px-3 py-2 rounded"
                        >
                          {lead.status === 'being investigated' ? 'Continue Lead' : 'Investigate Lead'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isMarket(scenario) ? <div className="order-1"><MarketScenePanel scenario={scenario} site={siteState} text={hasProgress ? currentContinuityNarrative(siteState, scenario) : orientation.arrival} continued={hasProgress} /></div> : <div className="order-1 bg-gradient-to-br from-slate-800 to-blue-950/40 rounded-lg p-8 border-2 border-blue-500 mb-6 text-slate-100 leading-relaxed shadow-lg shadow-blue-950/30">
            <p className="text-blue-300 text-sm font-bold uppercase tracking-wide mb-3">{hasProgress ? 'Continuity Scene — The Story Continues' : routeChoice ? 'Arrival — At Your Chosen Location' : 'Arrival — At the Location'}</p>
            <p className="whitespace-pre-wrap text-lg leading-8">{hasProgress ? currentContinuityNarrative(siteState, scenario) : orientation.arrival}</p>
          </div>}

          {hasProgress && (
            <>
            <div className="order-3 bg-blue-950/40 rounded-lg p-6 border border-blue-700 mb-6">
              <p className="text-blue-300 text-xs font-bold uppercase tracking-wide mb-2">Current Mission Status</p>
              <p className="text-slate-100 leading-relaxed">{siteStatusSummary(siteState, scenario)}</p>
              {siteState.sequencingNote && <p className="text-amber-200 text-sm mt-3">{siteState.sequencingNote}</p>}
            </div>
            <div className="order-6 bg-slate-800 rounded-lg p-6 border border-teal-700 mb-6">
              <div className="flex justify-between items-start gap-4 mb-5">
                <div>
                  <p className="text-teal-300 text-xs font-bold uppercase tracking-wide">Location Progress</p>
                  <h2 className="text-white text-xl font-bold mt-1">{siteState.stage === 'developed' ? 'Working picture developed' : 'Engagement underway'}</h2>
                </div>
                <span className="bg-teal-900/50 text-teal-200 px-3 py-1 rounded-full text-xs">{siteState.actions.length} action{siteState.actions.length === 1 ? '' : 's'}</span>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">What you have established</p>
                  {siteState.discoveries.length ? (
                    <ul className="text-slate-200 text-sm space-y-2 list-disc pl-5">
                      {siteState.discoveries.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  ) : <p className="text-slate-500 text-sm">No findings recorded yet.</p>}
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-bold uppercase mb-2">Remaining information gaps</p>
                  {siteState.informationGaps.length ? (
                    <ul className="text-amber-100 text-sm space-y-2 list-disc pl-5">
                      {siteState.informationGaps.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  ) : <p className="text-slate-500 text-sm">No explicit gaps recorded.</p>}
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Performance picture</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SCORE_DIMENSIONS.map(([key, label]) => (
                    <div key={key} className="bg-slate-900/50 rounded p-2">
                      <p className="text-slate-400 text-xs">{label}</p>
                      <p className="text-white font-bold">{siteState.dimensionScores[key] || 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              {siteState.completedProducts.length > 0 && (
                <p className="text-green-300 text-sm mt-4">Products completed: {siteState.completedProducts.join(', ')}</p>
              )}
            </div>
            </>
          )}

          <div className="order-5 bg-gradient-to-br from-green-950/50 to-slate-800 rounded-lg p-7 border-2 border-green-500 mb-6 shadow-lg shadow-green-950/20">
            <label className="text-green-300 text-xl font-bold uppercase tracking-wide block mb-2">What Will You Do Next?</label>
            {isMarket(scenario) && <MarketActionHelper key={scenario.id} stakeholders={scenario.keyStakeholders} onDraft={text => setActionText(current => current ? current + '\n' + text : text)} />}
            <p className="text-slate-200 mb-4">
              Make the next decision in the story. Describe what you actually say or do based on the continuity scene, current mission status, and information requiring validation.
            </p>
            {showHints && (
              <a href="#optional-next-actions" className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 text-sm font-semibold mb-4">
                <span aria-hidden="true">💡</span> Not sure what to do? Review optional next-action ideas lower on this page.
              </a>
            )}
            <textarea
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="For example: introduce the team, explain your purpose, ask permission to continue, listen, observe, validate information, coordinate, or describe another action in your own words..."
              rows={5}
              className="w-full px-4 py-3 bg-slate-900/80 text-white rounded border-2 border-slate-500 focus:border-green-400 placeholder-slate-500 resize-y mb-4"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={submitAction}
                disabled={!actionText.trim() || loading}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Action
              </button>
              <button
                onClick={() => setShowProductPanel(true)}
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" /> Create a Product
              </button>
            </div>
          </div>
          </div>

          <CommandContinuityPanel key={scenario.id} world={worldState} scenarios={missionScenarios} records={missionRecords} scenario={scenario} day={currentDay} onSubmit={recordCommandBrief} />

          {showHints && (
            <div id="optional-next-actions" className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6 scroll-mt-6">
              <p className="text-blue-200 text-sm font-semibold">💡 OPTIONAL NEXT ACTIONS</p>
              <p className="text-slate-300 text-xs mt-1 mb-3">
                If you are unsure how to continue, these are possible mission-progressing actions—not required or automatically correct answers. Select one to place it in the action box, then adjust it to fit what you have actually learned.
              </p>
              <div className="flex flex-wrap gap-2">
                {optionalNextActions(scenario, siteState).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => applySuggestion(suggestion)}
                    className="bg-blue-800/50 hover:bg-blue-700 text-left text-blue-100 text-xs px-3 py-2 rounded"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!showProductPanel && (
            <div>
              <button
                onClick={moveOn}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2"
              >
                {hasProgress ? 'Conclude Site & Continue' : 'Move to Next Location'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {showProductPanel && <MissionProductDialog scenario={scenario} onClose={() => setShowProductPanel(false)} onSubmit={submitProduct} />}
        </div>
      </div>
    );
  }

  // ===== RENDER: TERMINAL MISSION FAILURE =====
  if (screen === 'missionFailure' && lastOutcome) {
    const disposition = lastOutcome.missionDisposition || determineMissionDisposition(missionConsequences);
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full">
          <div className="bg-red-950/70 border-2 border-red-600 rounded-lg p-8">
            <p className="text-red-300 text-sm font-bold uppercase tracking-widest">Terminal Mission Outcome</p>
            <h1 className="text-4xl font-bold text-white mt-2">{disposition.status}</h1>
            <p className="text-red-100 text-lg mt-6">{disposition.reason}</p>
            <div className="bg-slate-950/60 border border-slate-700 rounded p-5 mt-6">
              <p className="text-white whitespace-pre-wrap">{lastOutcome.narrativeOutcome}</p>
            </div>
            <p className="text-amber-200 text-sm mt-6">{disposition.trainingNote}</p>
            <p className="text-slate-300 text-sm mt-3">This action score: <strong className="text-red-300">{lastOutcome.qualityScore}</strong>. The playthrough ends here and proceeds to the AAR.</p>
            <button onClick={finishTerminatedMission} className="w-full mt-8 bg-red-700 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg">
              Proceed to Mission-Failure AAR <ChevronRight className="inline ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: OUTCOME DISPLAY =====
  if (screen === 'outcomeDisplay' && lastOutcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <SubmissionReceipt turns={playtestTurns.filter(t => t.scenario.id === currentScenario().id)} />
          <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 mb-6 text-slate-100 leading-relaxed">
            {isMarket(currentScenario()) ? <><p className="field-eyebrow mb-5">At the market · The scene responds</p><ConversationPanel text={lastOutcome.narrativeOutcome} /><FollowUpNotes site={currentSiteState()} /></> : <p className="whitespace-pre-wrap">{lastOutcome.narrativeOutcome}</p>}
          </div>

          {lastOutcome.actionInterpretation && (
            <details className="bg-indigo-950/35 rounded-lg p-5 border border-indigo-600 mb-6">
              <summary className="text-indigo-200 font-bold cursor-pointer">How This Action Was Interpreted</summary>
              <p className="text-slate-300 text-xs mt-2 mb-4">
                Unrecognized details are not treated as established facts or completed outcomes. If this response missed your intent, flag it below and share the downloaded feedback with your administrator.
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <p><span className="text-slate-400">Intent:</span> <span className="text-white">{lastOutcome.actionInterpretation.intent}</span></p>
                <p><span className="text-slate-400">Mission relevance:</span> <span className="text-white">{lastOutcome.actionInterpretation.missionRelevance}</span></p>
                <p><span className="text-slate-400">Permission:</span> <span className="text-white">{lastOutcome.actionInterpretation.permission}</span></p>
                <p><span className="text-slate-400">Professional risk:</span> <span className="text-white">{lastOutcome.actionInterpretation.professionalRisk}</span></p>
                <p><span className="text-slate-400">Protected population:</span> <span className="text-white">{lastOutcome.actionInterpretation.protectedPopulation}</span></p>
                <p><span className="text-slate-400">Interpreter role:</span> <span className="text-white">{lastOutcome.actionInterpretation.interpreterRole}</span></p>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase">Actions understood</p>
                <ul className="list-disc pl-5 text-slate-200 text-sm mt-1">
                  {lastOutcome.actionInterpretation.actions.map((item, index) => <li key={index}>{typeof item === 'string' ? item : item.description}{typeof item === 'object' && <span className="text-slate-400"> — {item.negated ? 'not performed' : item.hypothetical ? 'hypothetical' : item.kinds?.join(', ') || 'unresolved'}</span>}</li>)}
                </ul>
              </div>
              <p className="text-indigo-100 text-sm mt-4"><strong>Decision:</strong> {lastOutcome.worldUpdate?.classification || 'Legacy interpretation'}</p>
              {lastOutcome.actionInterpretation.ambiguities?.length > 0 && <p className="text-amber-200 text-sm mt-2">Some details remain unresolved. They have not earned credit or caused a penalty.</p>}
            </details>
          )}

          {lastOutcome.coachingInsight && (
            <div className="bg-amber-950/40 rounded-lg p-5 border border-amber-600 mb-6">
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wide mb-2">Coaching After the Consequence</p>
              <p className="text-amber-50 leading-relaxed">{lastOutcome.coachingInsight}</p>
            </div>
          )}

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

          <div className="bg-slate-800/70 rounded-lg p-5 border border-slate-600 mb-6">
            <p className="text-slate-200 font-bold">Help improve this response</p>
            <p className="text-slate-400 text-sm mt-1">Nothing is sent automatically. Flag inaccurate feedback now, then export the playtest report when you are ready.</p>
            {playtestTurns.some(t => t.reviewFlags?.length) && <p className="text-amber-200 text-sm mt-2">Unrecognized details have also been logged automatically in this browser. The exported report includes them alongside your manual flags and original submissions.</p>}
            {!testerFeedbackOpen ? (
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={() => setTesterFeedbackOpen(true)} className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded font-semibold">
                  Flag This Response
                </button>
                <button onClick={exportPlaytestReport} className="bg-indigo-700 hover:bg-indigo-600 text-white px-4 py-2 rounded font-semibold">
                  Export Playtest Report ({playtestTurns.length} turns)
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    ['misunderstood-action', 'Misunderstood action'],
                    ['missed-risk', 'Missed risk or misconduct'],
                    ['wrong-relationship', 'Wrong relationship change'],
                    ['story-continuity', 'Story did not continue'],
                    ['unrealistic-reaction', 'Unrealistic reaction'],
                    ['other', 'Other']
                  ].map(([value, label]) => (
                    <button key={value} onClick={() => toggleFeedbackCategory(value)} className={`px-3 py-2 rounded text-sm border ${testerFeedback.categories.includes(value) ? 'bg-amber-700 border-amber-400 text-white' : 'bg-slate-900 border-slate-600 text-slate-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <label className="block text-sm text-slate-300">
                  What should the system have understood or done instead?
                  <textarea value={testerFeedback.expectedResponse} onChange={event => setTesterFeedback(prev => ({ ...prev, expectedResponse: event.target.value }))} className="w-full mt-2 bg-slate-950 border border-slate-600 rounded p-3 text-white" rows="3" placeholder="Example: The player excluded the interpreter and should not have received credit for interpreter support." />
                </label>
                <label className="block text-sm text-slate-300">
                  Additional notes (optional)
                  <textarea value={testerFeedback.notes} onChange={event => setTesterFeedback(prev => ({ ...prev, notes: event.target.value }))} className="w-full mt-2 bg-slate-950 border border-slate-600 rounded p-3 text-white" rows="2" />
                </label>
                <div className="flex gap-3">
                  <button onClick={saveTesterFeedback} className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded font-semibold">Save Flag</button>
                  <button onClick={() => setTesterFeedbackOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded">Cancel</button>
                </div>
              </div>
            )}
            {reportNotice && <p className="text-emerald-300 text-sm mt-3">{reportNotice}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={continueFromOutcome}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
            >
              {leadReturnPending ? 'Return with Findings' : pendingAdvance ? 'Continue' : 'Continue Scene'} <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={saveAndExit}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-6 py-4 rounded font-bold text-lg"
            >
              Save & Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== RENDER: PRODUCT DISPLAY =====
  if (screen === 'productDisplay' && lastOutcome && lastOutcome.product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-3xl mx-auto">
          <SubmissionReceipt turns={playtestTurns.filter(t => t.scenario.id === currentScenario().id)} />
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
            <p className="text-green-200 font-semibold">{lastOutcome.product.name}</p>
            <p className="text-green-300 text-sm mt-1">Filed with: {lastOutcome.product.recipient}</p>
            <p className="text-green-300 text-sm mt-1">Assessment Standard: {lastOutcome.product.citationStandard}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-6 text-slate-100 overflow-x-auto">
            <p className="whitespace-pre-wrap mb-6">{lastOutcome.narrativeOutcome}</p>
            {lastOutcome.product.mode !== 'mission-brief' && <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">{lastOutcome.product.content}</pre>}
          </div>

          {lastOutcome.product.mode === 'mission-brief' ? <section className="bg-green-950/40 border border-green-600 rounded-lg p-5 mb-6 text-white"><h2 className="font-bold text-xl">Mission product recorded</h2><p className="mt-2">Reporting-practice credit recorded once for this site. The recipient, purpose and key finding are saved for leader review. Repeated submissions do not add more credit.</p><p className="text-sm text-green-200 mt-2">A full template and factual accuracy were not assessed. No document was sent outside this exercise.</p></section> : <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-6">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Worksheet Completion Score</p>
            <p className="text-2xl font-bold text-white">{lastOutcome.product.completionScore ?? lastOutcome.productCompletionPercent ?? 0} / 100</p>
            <p className="text-slate-300 text-sm mt-2">Trainee-entry fields completed: {lastOutcome.productCompletionPercent ?? 0}%</p>
            <p className="text-slate-300 text-sm mt-2">Current site practice score across all dimensions: {lastOutcome.qualityScore} / 100</p>
            <p className="text-amber-200 text-xs mt-3">Worksheet completion is not a factual-accuracy grade. Source validation, analysis, and doctrinal quality require instructor review.</p>
          </div>}

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={continueFromOutcome}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded font-bold text-lg flex items-center justify-center gap-2"
            >
              {pendingAdvance ? 'Continue' : 'Continue Scene'} <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={saveAndExit}
              className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-6 py-4 rounded font-bold text-lg"
            >
              Save & Exit
            </button>
          </div>
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
    const report = getPerformanceReport();
    const avgScore = report.overallScore;
    const evidenceDimensions = report.dimensions.map(d => ({
      ...d, description: 'Local practice rubric',
      evidence: d.evidence.length ? d.evidence.length + ' recorded scoring decision(s); see the downloadable evidence report.' : 'No demonstrated evidence recorded.'
    }));
    const readinessScores = report.readiness.map(r => r.firstAttemptScore).filter(n => n !== null);
    const engagementProfile = {
      dimensions: evidenceDimensions, overallScore: avgScore,
      readinessScore: readinessScores.length ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length) : null,
      strongest: [...evidenceDimensions].filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 2),
      priorities: [...evidenceDimensions].sort((a, b) => a.score - b.score).slice(0, 2),
      tendency: 'Evidence from this playthrough',
      tendencyStatement: report.scoreExplanation, confidence: report.legacyHistory ? 'Limited legacy record' : 'Traceable local decisions',
      confidenceExplanation: 'These are practice scores, not a validated measure of job proficiency.',
      nextChallenge: 'Review the lowest-scoring areas and the decision evidence with your first-line leader.'
    };
    const decisionTimeline = buildDecisionTimeline(missionRecords);
    const missionDisposition = worldState.missionOutcome || { terminated: false };
    const recognition = recommendTrainingRecognition(missionRecords, allProducts, missionConsequences, engagementProfile, missionDisposition);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-gradient-to-r from-amber-700 to-amber-800 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-white">MISSION DEBRIEF</h1>
            <p className="text-amber-100 mt-2">{personalizedMissionLabel()} — After-Action Review</p>
            <p className="text-amber-200 text-xs mt-2">Build {APP_VERSION} · Local engine</p>
          </div>

          <section className="bg-green-950/40 border border-green-600 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white">Share Your Performance Report</h2>
            {report.unvisitedDestinations.length > 0 && <details className="text-slate-200 my-4"><summary className="cursor-pointer font-bold">Tradeoffs: {report.unvisitedDestinations.length} destinations left for handover</summary><p className="my-2">These are unresolved knowledge gaps, not automatic failures. Discuss why you prioritized the sites you visited and what the next team should follow up.</p><ul className="list-disc pl-5">{report.unvisitedDestinations.map(site => <li key={site.id}>{site.location}</li>)}</ul></details>}
            <p className="text-slate-200 mt-2">{report.status} · {report.overallScore}/100 practice score. Includes readiness results, products, decision evidence, and space for first-line-leader review.</p>
            {!report.readinessComplete && <p className="text-amber-200 mt-2">Readiness checks were skipped or incomplete. The report records this explicitly.</p>}
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={printPerformanceReport} className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded font-bold">Print / Save as PDF</button>
              <button onClick={() => exportPerformanceReport('html')} className="bg-blue-700 hover:bg-blue-600 text-white px-5 py-3 rounded font-bold">Download Leader Report</button>
              <button onClick={() => exportPerformanceReport('json')} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded font-bold">Download Evidence JSON</button>
            </div>
            <p className="text-slate-400 text-xs mt-3">{report.provenance} Reports contain the text you entered; review them before sharing.</p>
            {reportNotice && <p role="status" className="text-green-200 mt-3">{reportNotice}</p>}
          </section>

          <CommandContinuityPanel world={worldState} scenarios={missionScenarios} records={missionRecords} reviewOnly />

          <div className="bg-blue-950/60 border-2 border-blue-600 rounded-lg p-5">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wide">AAR Learning Activities</p>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-2">
              <div>
                <h2 className="text-white text-xl font-bold">Awards recommendation exercise</h2>
                <p className="text-slate-200 text-sm mt-1">
                  Compare recognition levels and practice writing the achievement, impact, scope, duration, and evidence.
                </p>
              </div>
              <a
                href="#awards-practice"
                className="shrink-0 text-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded font-bold"
              >
                Go to Awards Practice
              </a>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">PERFORMANCE SUMMARY</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-slate-400 text-xs font-bold uppercase">Readiness · First Attempt</p>
                  <p className="text-white text-2xl font-bold mt-1">{engagementProfile.readinessScore ?? 'Not taken'}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-950/70 to-indigo-950/70 border border-blue-700 rounded-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-blue-300 text-xs font-bold uppercase tracking-wide">Civil Affairs Engagement Profile</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{engagementProfile.tendency}</h3>
                    <p className="text-blue-100 mt-2">{engagementProfile.tendencyStatement}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded p-3 min-w-48">
                    <p className="text-slate-400 text-xs font-bold uppercase">Profile Confidence</p>
                    <p className="text-white font-bold mt-1">{engagementProfile.confidence}</p>
                    <p className="text-slate-300 text-xs mt-1">{engagementProfile.confidenceExplanation}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mt-6">
                  {engagementProfile.dimensions.map(dimension => (
                    <div key={dimension.key}>
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold">{dimension.label}</p>
                          <p className="text-slate-400 text-xs">{dimension.description}</p>
                        </div>
                        <p className="text-blue-200 font-bold">{dimension.score}</p>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full ${dimension.score >= 70 ? 'bg-green-500' : dimension.score >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${dimension.score}%` }}
                        />
                      </div>
                      <p className="text-slate-300 text-xs mt-2">{dimension.evidence}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-7">
                  <div className="bg-green-950/30 border border-green-800 rounded p-4">
                    <p className="text-green-300 text-xs font-bold uppercase">Demonstrated Strengths</p>
                    {engagementProfile.strongest.map(item => (
                      <p key={item.key} className="text-green-100 text-sm mt-2"><strong>{item.label}:</strong> {item.evidence}</p>
                    ))}
                  </div>
                  <div className="bg-amber-950/30 border border-amber-800 rounded p-4">
                    <p className="text-amber-300 text-xs font-bold uppercase">Development Priorities</p>
                    {engagementProfile.priorities.map(item => (
                      <p key={item.key} className="text-amber-100 text-sm mt-2"><strong>{item.label}:</strong> {item.evidence}</p>
                    ))}
                    <p className="text-amber-200 text-sm mt-3">{engagementProfile.nextChallenge}</p>
                  </div>
                </div>

                <p className="text-slate-400 text-xs mt-5">Training aid only: this profile describes behavior demonstrated during this playthrough. It is not a psychological assessment or a determination of suitability, potential, or fitness for service.</p>
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
              <h2 className="text-2xl font-bold text-white mb-4">EVALUATOR SUMMARY</h2>
              <div className="bg-slate-700/50 rounded p-4">
                <p className="text-slate-100 leading-relaxed whitespace-pre-wrap">{debrief}</p>
              </div>
            </div>

            {routeDecisions.length > 0 && <section className="border-t border-slate-700 pt-6" aria-labelledby="route-review">
              <h2 id="route-review" className="text-2xl font-bold text-white mb-2">ROUTE CHOICES</h2>
              <p className="text-slate-400 text-sm mb-4">Your order of visits and optional reasoning are recorded for discussion, not scored.</p>
              <ol className="space-y-3">{routeDecisions.map(choice => <li key={choice.scenarioId} className="bg-slate-700/50 rounded p-4">
                <p className="text-white font-semibold">Day {choice.day}: {choice.location}</p>
                <p className="text-slate-300 text-sm mt-1">{choice.rationale || 'No planning rationale entered (optional).'}</p>
              </li>)}</ol>
            </section>}

            <div id="awards-practice" className="border-t border-slate-700 pt-6 scroll-mt-6">
              <h2 className="text-2xl font-bold text-white mb-4">TRAINING RECOGNITION RECOMMENDATION</h2>
              <div className={`rounded-lg p-5 border ${recognition.level.startsWith('No favorable') ? 'bg-red-950/40 border-red-800' : 'bg-amber-950/30 border-amber-700'}`}>
                <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">{recognition.category}</p>
                <p className="text-white text-2xl font-bold mt-1">{recognition.level}</p>
                <p className="text-slate-100 mt-3">{recognition.rationale}</p>
                <p className="text-slate-300 text-sm mt-3"><strong>Next step:</strong> {recognition.nextStep}</p>
                <p className="text-slate-400 text-xs mt-4">{recognition.regulatoryBasis}</p>
                <p className="text-amber-200 text-xs mt-2">{recognition.disclaimer}</p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white">AWARDS EDUCATION &amp; PRACTICE</h2>
              <p className="text-slate-300 mt-2">
                Practice building an evidence-based recommendation. This exercise teaches how to distinguish recognition levels;
                it does not create, submit, or approve an award.
              </p>

              <div className="grid md:grid-cols-2 gap-3 mt-5">
                {RECOGNITION_LEVELS.map(level => (
                  <div key={level.id} className="bg-slate-700/50 border border-slate-600 rounded p-4">
                    <p className="text-blue-200 font-semibold">{level.label}</p>
                    <p className="text-slate-200 text-sm mt-2">{level.use}</p>
                    <p className="text-amber-200 text-xs mt-2"><strong>Caution:</strong> {level.caution}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/60 border border-blue-800 rounded-lg p-5 mt-6">
                <h3 className="text-xl font-bold text-white">Build a Practice Recommendation</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Use the evidence from this mission. Strong recommendations explain the Soldier's specific contribution,
                  measurable effect, scope, duration, and supporting records.
                </p>

                <label className="block text-blue-200 text-sm font-bold mt-5 mb-2">Proposed recognition level</label>
                <select
                  value={awardPractice.level}
                  onChange={event => {
                    setAwardPractice({ ...awardPractice, level: event.target.value });
                    setAwardPracticeResult(null);
                  }}
                  className="w-full bg-slate-700 border border-slate-500 rounded px-4 py-3 text-white"
                >
                  <option value="">Select the level you believe the record supports</option>
                  {RECOGNITION_LEVELS.map(level => <option key={level.id} value={level.id}>{level.label}</option>)}
                </select>

                {[
                  ['achievement', 'Specific achievement', 'What did the Soldier personally do? Use specific actions rather than duty-description language.'],
                  ['impact', 'Measurable or observable impact', 'What changed, who benefited, what risk was reduced, or what decision was enabled?'],
                  ['scope', 'Scope and duration', 'Identify the period, locations, organizations affected, responsibility, and whether this was one act or sustained service.'],
                  ['support', 'Supporting evidence', 'List orders, reports, products, evaluations, rosters, messages, witnesses, or partner feedback that substantiate the recommendation.']
                ].map(([field, label, placeholder]) => (
                  <div key={field} className="mt-4">
                    <label className="block text-blue-200 text-sm font-bold mb-2">{label}</label>
                    <textarea
                      value={awardPractice[field]}
                      onChange={event => {
                        setAwardPractice({ ...awardPractice, [field]: event.target.value });
                        setAwardPracticeResult(null);
                      }}
                      placeholder={placeholder}
                      rows={3}
                      className="w-full bg-slate-700 border border-slate-500 rounded px-4 py-3 text-white placeholder-slate-400"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  disabled={!awardPractice.level}
                  onClick={() => setAwardPracticeResult(gradeAwardPractice(awardPractice, recognition))}
                  className="mt-5 w-full bg-blue-700 hover:bg-blue-600 disabled:bg-slate-600 disabled:text-slate-400 text-white font-bold px-5 py-3 rounded"
                >
                  Review My Recommendation
                </button>

                {awardPracticeResult && (
                  <div className={`mt-5 rounded-lg border p-5 ${awardPracticeResult.aligned ? 'bg-green-950/30 border-green-700' : 'bg-amber-950/30 border-amber-700'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-slate-300 text-xs font-bold uppercase">Practice exercise score</p>
                        <p className="text-white text-3xl font-bold">{awardPracticeResult.score}/100</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-slate-200"><strong>Your selection:</strong> {awardPracticeResult.selectedLabel}</p>
                        <p className="text-slate-200 mt-1"><strong>Simulator comparison:</strong> {awardPracticeResult.expectedLabel}</p>
                      </div>
                    </div>
                    <ul className="list-disc pl-5 text-slate-100 text-sm mt-4 space-y-2">
                      {awardPracticeResult.feedback.map(item => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-bold text-white">Eligibility-Based Awards Quick Reference</h3>
                <p className="text-slate-300 text-sm mt-1">
                  These forms of recognition are based on official eligibility rules, qualifying operations, dates, orders,
                  or service—not the simulator's performance score.
                </p>
                <div className="space-y-3 mt-4">
                  {ELIGIBILITY_REFERENCES.map(([name, guidance]) => (
                    <div key={name} className="bg-slate-700/40 border border-slate-600 rounded p-4">
                      <p className="text-purple-200 font-semibold">{name}</p>
                      <p className="text-slate-200 text-sm mt-1">{guidance}</p>
                    </div>
                  ))}
                </div>
                <p className="text-amber-200 text-xs mt-4">
                  Always verify current eligibility and processing requirements with the servicing S-1/G-1 and official Army
                  Human Resources Command guidance. Participation in an exercise or humanitarian activity does not automatically
                  create entitlement.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">KEY DECISIONS</h2>
              {decisionTimeline.length ? (
                <div className="space-y-3">
                  {decisionTimeline.slice(0, 12).map((decision, index) => (
                    <div key={`${decision.location}-${index}`} className="bg-slate-700/50 rounded p-4">
                      <p className="text-blue-300 text-xs font-bold uppercase">{decision.location} • Decision {decision.order}</p>
                      <p className="text-slate-100 mt-1">{decision.action}</p>
                    </div>
                  ))}
                  {decisionTimeline.length > 12 && <p className="text-slate-400 text-sm">Showing 12 of {decisionTimeline.length} recorded decisions.</p>}
                </div>
              ) : <p className="text-slate-400">No player decisions were recorded.</p>}
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h2 className="text-2xl font-bold text-white mb-4">TRAINING PRODUCTS</h2>
              {allProducts.length ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {allProducts.map((product, index) => (
                    <div key={`${product.name}-${index}`} className="bg-slate-700/50 rounded p-4">
                      <p className="text-white font-semibold">{product.name}</p>
                      <p className="text-slate-300 text-sm mt-1">{product.type} • {product.scenarioName}</p>
                      {product.completionScore !== undefined && <p className="text-green-300 text-sm mt-2">Worksheet completion: {product.completionScore}/100</p>}
                      <p className="text-slate-400 text-xs mt-2">Routed to: {product.recipient}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400">No training products were completed.</p>}
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

            {missionConsequences.length > 0 && (
              <div className="border-t border-red-800 pt-6">
                <h2 className="text-2xl font-bold text-red-200 mb-4">MISSION CONSEQUENCES</h2>
                <div className="bg-red-950/40 border border-red-800 rounded p-4 space-y-4">
                  {missionConsequences.map(item => (
                    <div key={item.id}>
                      <p className="text-white font-semibold">{item.title} ({item.status}; {item.occurrenceCount || 1} occurrence{(item.occurrenceCount || 1) === 1 ? '' : 's'})</p>
                      <p className="text-red-100 text-sm mt-1">{item.categories.join('; ')}</p>
                      <ul className="text-red-100 text-sm list-disc pl-5 mt-2">
                        {item.persistentEffects.map(effect => <li key={effect}>{effect}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
