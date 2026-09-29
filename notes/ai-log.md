# AI usage log

Running notes that feed the "AI usage" part of SUBMISSION.md. One line per event: what the AI
produced, what I changed or rejected, and how I verified it.

## Planning

- Claude (Opus) read the brief, the starter and the job description, and drafted a phased plan
  with a decision table. I made the owning calls in an interview: execution mode, second theme,
  commit/dismiss model, badge API, test tooling.
- The first draft was internally inconsistent: Tab committed the active option but blur did not.
  I flagged it against the brief ("dismissing the list without changing the selection"). We
  checked APG's `select-only.js` (`onComboBlur` calls `selectOption`) and I chose the full APG
  model, with three safeguards against silently assigning a reviewer.
- ARIA claims were verified against the APG combobox pattern, the select-only example and the
  keyboard-interface guidance (disabled options stay focusable), not taken from memory.
- I questioned the second-theme choice (high-contrast vs dark). The reassessment showed similar
  implementation cost, and I kept high-contrast.

## Implementation

<!-- Per phase: what I reviewed, what I changed, what I rejected, how I verified. -->

### Phase 1: tokens

- The AI first wrote `--cw-radius-pill: var(--cw-radius-pill)`. That is a self-reference: the
  semantic name collided with the primitive name, which makes the property invalid. It was
  renamed to `--cw-radius-round`, and this is the reason every semantic name carries a role word.
- Contrast was verified with a script against the real primitive hex values rather than
  estimated by hand. amber-700 on amber-50 measured 4.41:1, so warning text uses amber-800.

### Phase 2: cw-select

- A test assertion was written as `.toBeTruthy` without the call, so it asserted nothing.
  Caught in review before running.
- A test compared `textContent` and failed on the decorative "✓". The fix was to assert the
  accessible name instead (`getByRole(..., { name })`), because that is what a screen reader
  actually receives.
- Mutation check: I temporarily broke two safeguards (opening with the first option active; no
  `preventDefault` on mousedown). 5 tests failed, which confirms the tests guard those behaviours.
- Verified in real Chrome with a Playwright script kept outside the repo, so it adds no
  dependency: Tab order, the popup position, the disabled option announced as `aria-disabled`,
  Escape, Tab committing the active option, typeahead cycling, End scrolling through 500
  options, and click keeping focus. The first run seemed to lag one step. That was the driver
  reading the DOM before zoneless change detection rendered, not a component bug.

### Phase 3: cw-status-badge

- Built against the old call sites on purpose, to test the ADOPTION claim that strict templates
  catch the migration. They catch every removed *binding* (NG8002 for isReady, isProcessing,
  isError, isSmall, isLarge) but **not** `tooltip="..."`. A static attribute silently becomes a
  plain HTML attribute. So the compiler is only part of the migration checklist; static
  attributes need a lint rule or codemod.
- Mutation check: putting `aria-hidden` back on the label fails the badge test.
- In Chrome's accessibility snapshot, an engagement row now reads "... 4 pending Ready". In v1
  the status was not announced at all.

### Phase 4: high-contrast theme

- Adding the theme changed zero component files: one new token file plus 2 lines in
  `tokens.scss`. That is the evidence that the semantic layer makes a second theme cheap.
- Every high-contrast pair meets AAA (>= 7:1). The hand estimates in the plan (amber 7.6,
  green 10.4, red 10.7, blue 11.7) were confirmed by the script.
- Checked in Chrome: the toggle; `prefers-contrast: more` applying the theme automatically; an
  explicit "default" winning over the OS preference; the active option keeping its outline under
  `forced-colors`.
- The forced-colors screenshot exposed a real bug in the Phase 2 code. The chevron was drawn as
  a CSS border triangle, and forced colors repaints the transparent borders, so it rendered as a
  solid bar. It was replaced with an SVG using `fill="currentColor"`. The badge dot disappears in
  forced colors; that is acceptable because it is decorative and the label carries the meaning.

### Phase 5: documentation

- The AI drafted DECISIONS, ADOPTION, SUBMISSION and the README kit section. [Record what you
  rewrote.]
- The draft claimed "breaking any safeguard fails a test", but only one of the three had been
  mutation-checked. The other two were checked before keeping the claim: allowing a disabled
  option to be committed, and making hover move the active option. Each one fails a test.
