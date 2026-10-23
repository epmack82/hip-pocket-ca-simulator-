# Market encounter preview — 4.6.0

This is a local preview, not a published release. Start a new mission and choose
Central Market from the planning board. Every new campaign includes that option;
it is not automatically visited or treated as the correct first choice. Existing
saves retain their original destination pools.

## What changed

- A responsive illustrated schematic destination board, with a visit budget,
  selection states and counts of already-recorded open leads. No real positions,
  travel times, implied access or undiscovered leads.
- Bundled fictional market artwork and portraits for Mali (market association
  chair) and Niran (transport cooperative representative). Other roles retain
  text/initial cards. Names resolve to the same canonical stakeholder roles used
  by saves and scoring.
- Separate narrative and dialogue presentation for the market. Greetings remember
  direct engagement; inquiries remain attributed claims; apologies do not erase
  prior incidents. Serious conduct and interpreter exclusion keep their existing
  decision logic.
- Accepted meeting, procurement and public-communication proposals at the market
  persist as unconfirmed requests in scene notes, saved state and the leader
  report. No appointment, approval or publication is fabricated.

## Important limits

This remains an authored, bounded local interpreter, not general AI understanding.
The richer responses do not make arbitrary prose understandable. Unsupported
details remain visible and can be flagged/exported for review.

The map and people are fictional design material, not doctrine or statements about
Thai culture. No raw schoolhouse documents or extracted text were put into public
assets. The reference library is not consulted at runtime. Follow-up confirmations
and elapsed meeting time are not modeled by this slice; requests stay unconfirmed.

The scene art is atmosphere, not an extra observation that grants evidence credit.
Generated PNGs are bundled locally; there are no runtime image-generation calls.
See ART_PROVENANCE.md for prompts and source assets.

## Retest

Automated verification: 245 tests across 31 suites passed. The production build
passed. Browser testing reached mission setup, but the browser tool subsequently
blocked preview access; final desktop/mobile visual acceptance is still pending.
No production deployment or repository push was performed.

1. Start a new 3-Day Drill Weekend in an empty save slot; choose Central Market.
2. Greet Mali through the interpreter and ask about current service conditions.
3. Continue Scene. Check the named host, attributed claim and introduction status.
4. Invite Niran into the conversation; ask for his perspective.
5. Request a meeting with a stated purpose. It must remain unconfirmed.
6. Save/reload, continue and export the leader report. The original submission,
   dialogue, scores and open request must agree.
7. Try an unsupported action and an explicitly negated action: neither should gain
   invented credit. Existing serious-conduct consequences must not be overwritten
   by warm dialogue.
