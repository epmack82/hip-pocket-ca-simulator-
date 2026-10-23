# Local foundation and mission-planning preview — 4.4.1

## Mission planning update

After the preparation and mission briefing, **Plan Your First Move** provides staging context and a choice among the mission's generated engagements. Cards contain preliminary reporting, mission relevance, and a listed contact; arrival details and undiscovered leads are not exposed. Players select a location, optionally record a rationale, and explicitly travel there.

After conclusion, **Plan Your Next Move** shows only remaining locations, developed leads as planning context, and continuing consequences. Site order is not graded and adds no travel penalty. One site still uses one exercise day. Generated location IDs and story content remain stable; visits, saves, and reports follow the chosen order. Lead detours remain part of the existing in-site workflow, not extra selectable full-day engagements.

**Your Purpose Here** now sits below the location title and outside the story. The arrival box no longer contains the appended instruction paragraph. Planning rationale is included in the AAR and both report exports without score credit. Older saves resume their current site and enter planning after its conclusion; no restart is required to continue them.

## What changed

Gameplay now follows one path:

`raw action → local parser → conduct / engagement policies → one WorldUpdate → saved world → scene + scores + AAR + report`

- No AI API requests, keys, model downloads, player accounts, or private network connection are needed for gameplay.
- The existing static website can serve the production build. The Synology and the old Render API are not prerequisites.
- Interpretation keeps action clauses, targets, stated/requested permission, negation, reported conduct, interpreter availability, and unresolved details.
- Conduct findings take priority over incompatible positive credit. Consequences persist across locations. Three serious turns or one critical event end ordinary mission play.
- Scores are evidence-based, bounded, and cannot be farmed by repeating the same rule for the same participant at a site. Applied deltas, not just requested deltas, are recorded.
- The same WorldUpdate provides the response and the continuity scene. The AAR and exported report read the saved score ledger.
- Worksheet completion checks the expected fields. Removing placeholders or claiming documents in prose does not complete a product.
- An end-of-mission leader report can be downloaded as HTML or evidence JSON, or printed to PDF with the browser. It includes completion status, readiness attempts, skipped blocks, field dimensions, submitted products, decisions, persistent consequences, and leader-review space.
- The existing playtest feedback export remains separate from the leader report.

## Deliberate limits

This is a **bounded, authored simulation**, not a general-purpose language model. It does not understand every sentence or every cultural nuance. Unknown clauses remain visible and receive no invented credit or penalty. Five site-specific story profiles (school, water, substation, clinic, market) and a generic service profile supply consistent fictional evidence. Longer missions still need broader authored content and validated evaluation examples.

The rubric is a prototype, not a validated personnel assessment. Role changes guidance, not the scoring scale. Culture-specific Thai norms, command procedures, and protected-population policies require qualified instructor/subject-matter review before unit rollout. No personal examples have been turned into named characters.

Legacy response engines remain for compatibility tests and selected display/product helpers. They are **not chained into the gameplay decision path**. The compatibility interpretation entry point is local and does not call the old semantic service.

## Running and checking

Use Node.js 22+ and the pinned pnpm version from package.json.

```text
pnpm install --frozen-lockfile
pnpm test:ci
pnpm build
pnpm preview
pnpm start
```

The lockfile and explicit ESLint configuration dependency make installation reproducible. Optional core-js postinstall messages are explicitly disabled; linting remains enabled. The Create React App toolchain has deprecated dependencies; a framework migration should be a separate, tested change rather than mixed into the gameplay rewrite.

All tests are local. UI integration tests replace fetch with a failing mock and exercise a three-location mission, save/reload, terminal failure, a fresh independent session, worksheet submission, and leader report downloads.

### Verified preview checks

- 206 tests pass in 27 suites, including arbitrary site order, planning save/load, legacy save compatibility, skip/terminal paths, and ungraded rationale export.
- The CI production build and a separate ESLint check pass with linting enabled. A browser check verified the new staging screen, selecting the school instead of the first listed site, the purpose section above arrival, and return to the remaining locations with a developed lead visible.
- A browser playthrough reached the three-day debrief, restored a saved mission, displayed skipped readiness correctly, and triggered the leader-report download.
- Named-speaker continuity is tested across clauses and turns; site-topic words such as "clinic service" do not select the clinic director.
- The built JavaScript contains none of the old interpretation, evaluation, or debrief API endpoints.

These checks establish the tested behavior, not universal language understanding or a validated unit assessment. Start a new mission when evaluating the final build; the local browser's test-only save includes earlier development responses.

## Retest checklist

1. Start a new three-day mission, review the planning screen, and choose a location other than the first listed. The temporary readiness skip must show as not taken in the AAR and report.
2. Greet the host with interpreter support; ask a focused service question. Return to Location: the same scene must appear.
3. Invite the second named stakeholder, including a small spelling error. Verify who answers and receives relationship credit.
4. Exclude the interpreter, then ask another question. No invisible translation or new claim should be credited.
5. Request permission for contact with a vulnerable group versus describing contact without it. Requests are not completed contact.
6. Submit mixed courtesy and misconduct. Review the actual consequence, teammate reaction, persistent record, and later scenes.
7. Claim a KLE report in prose, then submit its worksheet through Create a Product. Compare the receipt and completion.
8. Save and reload both at a location and on the planning screen. Conclude the mission and download the leader report. Compare grades to the AAR and inspect the decision evidence and ungraded route rationale.
9. Flag unsupported or misleading interpretations and export the playtest report for a reviewed content/rule update. This is manual improvement, not automatic model training.

## Data and sharing

Saves and playtest history remain in this browser's local storage. Clearing site data or changing browsers can lose them. Exports include user-entered text and product content; review before sharing and use fictional/unclassified information only.

Identity is self-entered. Without a trusted server or supervised session, a browser-generated report cannot independently prove who took the assessment or prevent editing. It is a reviewable completion record, not a digitally verified qualification. Never upload real medical, victim, personnel, classified, or operationally sensitive information.

## Release boundary

This branch is an isolated preview. Do not run the old force-push publishing script: its file list omits the new engine and report modules. Build and review this complete branch before updating the public site. The production website has not been changed by this local implementation.
