# Study and Staff Practice — local preview

Version 4.4.2-study-preview; curriculum 1.0.0-practice.

Open **Study & Staff Practice** from the home screen, without creating a Soldier profile or starting a mission. Three original fictional practice modules cover engagement preparation, reporting and civil-service assessment. Each provides learning notes, an explicit situation, three knowledge checks, a written task, optional self-review and one possible worked response after submission.

## Assessment boundaries

Only the fixed knowledge checks receive an automatic score. Written work is stored for leader review, not interpreted or graded by keywords. Self-review ticks are learner assertions, not verified performance. Submitting all fields records a practice attempt, not an official pass or qualification. The criteria and example responses are development-authored practice aids pending instructor validation. Alternative evidence-supported responses can be valid.

This module does not fix or change the mission action parser, consequences or grading. No mission setup, site action, relationship or score is changed by studying. The home entry point avoids interrupting active play; save and exit a mission before entering study.

## Persistence and reports

- Dedicated browser storage key: `hipPocket_study_v1`; mission storage is untouched.
- Drafts save as they change. Submitted work is locked; retry starts a fresh draft and preserves earlier attempts.
- Reports include curriculum/lesson versions, timestamps, all attempts and feedback, written work and self-review. Unsubmitted written drafts are explicitly not scored. JSON also includes the draft selections.
- Optional learner identifier is self-entered and unverified. No login or external service is used. No report is sent automatically.
- HTML export is readable/printable in a browser (Print / Save as PDF); JSON is structured evidence. Neither is signed or tamper-resistant. A leader must review the work rather than treat the export as proof of identity or certified completion.
- Save errors warn the learner to export before leaving. Unreadable or unsupported storage is preserved rather than silently overwritten; temporary work can still be exported.
- Storage belongs to the current browser/site origin. Switching ports/domains, clearing browser data or using another device does not carry progress over. Import/cloud sync is not implemented.

## Source and release boundary

The private development reference library is outside this application. No raw schoolhouse files, extracted source text, restricted content or library-search runtime are shipped with this feature. The scenarios, questions and feedback here are original fictional exercises, not copied schoolhouse answer keys or claims of current doctrine. Source observations that informed the development topics remain in the separate library's REVIEW_NOTES.md; they are not release approval.

OPORD interpretation, CA capabilities briefs, COA comparison and MOP/MOE practice remain future modules pending source-edition and rubric review. Do not silently turn historical exercise orders into current Thailand guidance. Public deployment still requires the normal project release decision; this change is a local preview only.

## Verification

Automated tests exercise content consistency, validation, scoring boundaries, versioned attempts, persistence, damaged/unavailable storage, HTML escaping, exports, and mission-save isolation. Browser checks cover the home entry point, narrow-screen layout and submission feedback. The build remains static and has no AI/API dependency.
