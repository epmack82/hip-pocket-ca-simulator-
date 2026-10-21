# Command continuity preview

Local build 4.8.0-command-preview, 21 October 2026. This is an original, bounded simulation feature, not a validated doctrine rubric or a general free-text planning evaluator.

## What now connects

- **Field:** an optional Brief Command form attaches up to ten existing findings, preserving source, reliability and source-action identity. The learner states a recommendation and uncertainty, and selects a request type. Raising a question without attachments is allowed but does not create supporting evidence.
- **Command:** structured requests produce an authored staff response. Collection priorities are recorded; specialist requests with attached findings are referred for feasibility review; handover recommendations remain pending review. No command response grants funding, contracts, technical work, public commitments, access permissions, partner acceptance or transition authority.
- **Planning:** an optional follow-up destination appears on the existing campaign map and destination card. This does not select a route automatically, add visit slots, create a deadline or penalize a different choice.
- **Arrival:** the next site displays the learner's linked recommendation as the team's context. It does not claim that locals have heard the brief or that its assertions are true.
- **Reassessment:** genuinely new finding IDs at the linked destination trigger a review/rebrief notice. Another attributed claim remains a claim. Repeating an existing finding or simply arriving does not resolve the original issue.
- **Continuity:** revisions preserve prior briefs and evidence snapshots. The original brief can be revised from another site or the planning board. Open gaps, requests, conduct conditions and unvisited destinations remain visible at handover.
- **Leader review:** HTML/JSON performance reports contain command briefs, uncertainty, source evidence, staff responses and revision status. Field action counts, grades, permissions, relationships, products and visit budgets are unchanged by command briefing.

## Important limits

The simulation branches on the learner's **structured request and attached records**, not an assumed full understanding of the free-text recommendation. Written reasoning is retained for leader review, not silently accepted, executed, or graded. The UI explicitly says so. Specialist labels are generic fictional liaison roles, not an assertion about a specific unit's task organization or authority.

Existing world state is extended with optional `commandBriefs`; old saves work without it. Only submitted briefs persist. Unsubmitted drafts are not autosaved. The form warns learners to submit or copy the draft before leaving. The classroom OPORD generator remains independent: choosing one of its variants does not currently create a live campaign from that order.

This version does not simulate resource-allocation approvals, completed repairs, automatic referrals outside the app, partner acceptance, independently verified capacity or a complete MDMP cycle. It never removes an unresolved question merely because the mission ends. Forged evidence keys, unavailable destination selections and revisions of already-superseded entries are rejected.

## Source and design boundary

The supplied informal `OPORD PE.docx` model motivated linking commander intent, phases, subordinate responsibilities and CA reasoning. Exact source/version and reviewed section locators are in the separate library's `OPORD_PE_REVIEW.md`. The library's `START_HERE.md` and `REVIEW_NOTES.md` govern reference handling. This change adds no copied source passages, held documents or partial downloads to the app. Command questions, status rules and dialogue are new design choices, not quoted doctrine or an approved answer key.

The public release boundary is unchanged: local implementation only, no push or deployment. The reference library is not read by the application at runtime.

## Verification and playtest

Automated coverage includes attachment traceability, unchanged scores/world evidence, no referral without attachments, partner selection, visit-versus-resolution distinction, new-material detection, immutable revision history, saved-world compatibility, terminal-mission guards, handover risks, export escaping, and full app save/reload through a linked follow-up and debrief. Network calls remain prohibited in app integration tests.

Verification on 21 October 2026: 265 tests across 33 suites passed; the ten command-continuity tests passed again after the final legacy-evidence wording adjustment. Production build compiled successfully and the resulting bundle contains the command UI, follow-up context and pending-approval status. No push or deployment performed.

Manual browser and print layout verification remains pending because access to the existing local preview was previously denied by browser policy. Do not bypass that denial with an alternate browser or raw protocol.

Suggested playtest: ask a source about service conditions → Continue Scene → Brief Command → attach its attributed account and propose a different destination → conclude the site → select the linked destination on the planning board → obtain new information → revise the original brief → finish the campaign and review the leader export. Confirm no promise or approval was invented, and compare your initial recommendation with your revision.
