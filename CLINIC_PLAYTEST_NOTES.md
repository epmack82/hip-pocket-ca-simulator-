# Clinic playtest update (local, not deployed)

- Destination tiles are now the sole destination selectors, with one selected-site brief.
- Command practice and problem reporting are collapsed optional sections. Field command practice remains available for existing workflows; moving it entirely into the planning phase is still pending.
- Clinic inquiry answers cover the requested changed conditions, affected people, other sources, and records. This is bounded authored dialogue, not general natural-language understanding.
- Festival inquiries open a coordination conversation without inventing an event or credit.
- Short-form products show an educational preview and explicitly missing supporting evidence, not an official completed template.
- Fictional clinic illustration added; no source documents used.
- True geographic routing/travel costs remain unimplemented. The destination board remains explicitly schematic.

## Art provenance

Built-in image generation, saved as `public/art/clinic-arrival-v1.png`.

Prompt: Use case: illustration-story. Asset type: wide scene banner for Hip Pocket, a fictional Civil Affairs training game. Create an original realistic painterly illustration of the exterior of a modest district clinic in a fictional Southeast Asian community: shaded public entrance, simple low building, tropical greenery, a few adult visitors waiting on benches and a nurse at the doorway. Calm, humane everyday atmosphere, warm daylight, muted teal and earth colors, detailed environmental storytelling. Wide landscape composition, no text, logos, flags, military insignia, readable records, identifiable real people, medical procedures, or distress. This is scene-setting, not a depiction of confirmed clinical shortages.

Browser visual QA remains pending. Automated tests and production compilation do not replace a playthrough.

## Conversation prototype

Clinic nurse/director encounters now offer six authored topics through the same parser and consequence pipeline as typed input. Ordinary clinic exchanges remain in the scene, with an accessible conversation journal. A topic comparing perspectives appears after both available speakers have been heard. Topic history survives save/load; repeating an account is explicitly not independent corroboration. Conduct consequences still use the outcome screen.

This is the first conversational slice, not a general language engine. Speaker-specific promise tracking, intent clarification choices, richer relationship-dependent branches, and rollout to other locations remain unfinished. Profiles use existing role labels rather than invented persistent personal identities. No additional API calls or source-library content are used.
