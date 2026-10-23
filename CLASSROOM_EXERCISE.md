# Classroom OPORD exercise preview

Build 4.7.0-classroom-preview. Original fictional exercise content, version 1.0.

## Scope

The home menu opens an independent instructor workbench. It generates student handouts and separate **draft** facilitator discussion notes entirely in the browser. It does not use an API, access the reference library at runtime, change mission saves, collect student answers, or award grades. Nothing is automatically transmitted. Generated packets are not persisted; instructors must download them before leaving.

Three authored challenge profiles cover service access, displacement and transition. A deterministic seed selects setting, first review time and coordination windows. This is bounded authored variation, not unrestricted generation of arbitrary orders. Same seed + challenge + exercise version reproduce the facts. Optional class labels do not change the fact-set ID. Retain the generated HTML files as the authoritative copy of a particular class exercise.

Student output contains a simplified situation/mission/execution packet, phase purposes, organization responsibilities, explicit authority and capacity limits, and six written exercises. It is intentionally not a full five-paragraph OPORD or real-world tasking. The fictional support-group task organization is an instructional simplification, not a claim about Army force structure. It models one CA company HQ and three CATs consistently. Team support priorities are recommendations, not formal attachment authority.

Print opens a separate window with inline print CSS. Downloaded HTML works offline and can be printed or saved as PDF from a browser. No remote resources, scripts or facilitator content are embedded in student files. All dynamic strings are HTML-escaped. Student preview uses a sandboxed iframe. Pop-up blocking produces a download alternative.

## Source relationship and release boundary

The user supplied an informal schoolhouse exercise, `OPORD PE.docx` (reviewed 19 October 2026). Its section structure—task organization, situation, mission, execution, and final Questions—motivated this feature. Its final Questions ask learners to connect CA to key tasks, explain contributions across four phases and justify priorities for three CATs. Those are source observations, not an approved doctrinal format or answer key.

All locations, organizations, accounts, questions and discussion notes in the generator are newly authored fictional content. No source file, raw extract, marked/held schoolhouse text, tactical dispositions or supplied source answer keys are bundled. Exact source-version metadata and local review notes remain in the separate reference library. Public deployment was not performed or authorized by this change. The new exercise content still needs instructor review before graded use.

## Answer-key handoff

The colleague's key is pending. Facilitator notes are prompts only: no correct team assignment, point scale, pass/fail threshold or approved model answer is implied. Before adding scoring:

1. Match the key to its original exercise and distinguish fixed facts from acceptable reasoning.
2. Identify acceptable alternatives and which claims require a specific source/edition.
3. Reconcile the original company/battalion inconsistency and clarify support priorities versus formal command relationships.
4. Check applicability to each generated challenge. A key for the original cannot automatically grade all variants.
5. Obtain instructor approval for criteria, scoring, release and version labeling; add regression tests.

## Narrative connection — subsequent local integration

The same structure can connect a campaign's command intent to information gaps, encounters, recommendations and transition conditions. Later integration should reuse a structured decision context rather than merely add more narrative text. Track the question being answered, evidence and uncertainty, partner responsibilities, approvals, deferred needs and the resulting command decision. Civil partners may refuse or have limited capacity. An unvisited opportunity is not automatically failure, and new injects must not retroactively change what the player knew.

Build 4.8.0 adds the bounded live-campaign brief/follow-up/handover connection described in `COMMAND_CONTINUITY.md`. This workbench still does **not** inject its generated order into mission playthroughs. Do not claim a full campaign-wide MDMP, resource-approval engine or general understanding of free-text recommendations is implemented.

## Verification

Unit and app-integration tests cover deterministic variants, theme coherence, separate output audiences, HTML escaping, print/pop-up behavior, export, main-menu navigation, and mission-save isolation with external fetch prohibited. Manual browser/physical print layout verification remains pending because browser access to the existing local preview was denied by policy. Inspect print preview on Letter/A4 before classroom distribution; sheet sections can flow to additional pages.

Verification run 19 October 2026: all 254 tests across 32 suites passed after the final UI change. The production build compiled successfully. No push or deployment was performed.
