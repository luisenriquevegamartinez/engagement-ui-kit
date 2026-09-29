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
