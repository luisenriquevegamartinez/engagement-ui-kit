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
