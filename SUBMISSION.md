# Submission notes

## What is in the repository

- **`cw-select`** (`src/lib/select/`): an accessible single-select control using Angular forms.
  It is used in the workbench for reviewers, for change groups (template-driven) and for 500
  cost centres.
- **Semantic token layer** (`src/lib/tokens/_semantic.scss`) and a **high-contrast theme**
  (`_theme-high-contrast.scss`), switchable from the workbench header.
- **`cw-status-badge` 2.0**: a breaking change, described in ADOPTION.md.
- **Tests**: `select.spec.ts` (13) and `status-badge.spec.ts` (1). Run them with
  `npx ng test --watch=false`.
- **Notes**: `DECISIONS.md`, `ADOPTION.md`, and `notes/ai-log.md`, the running log this section
  summarises.
- **Commits**: one per phase, so the history reads as the order of the work.

## Why these tests

They target the regressions that would reach a user:

- a reviewer assigned that nobody chose
- a value changed by a dismissal
- a disabled option that can still be chosen
- a broken ARIA link between the combobox, the listbox and the active option
- forms state (dirty, touched, disabled) reported wrongly

They query by role and accessible name through `@testing-library/dom`, so they assert what a
screen reader receives rather than attributes alone. That is its only use: it is a dev-only
dependency with no runtime cost.

Each key test was checked by breaking the behaviour it guards and watching it fail.

## AI usage

I used Claude (Claude Code) as an implementation partner.

**Where it helped:**

- reading the brief and the starter
- drafting a phased plan with a decision table
- implementing phase by phase while I reviewed each phase at a checkpoint

**Where I corrected or overrode it:**

- **Tab and blur.** Its first plan committed the active option on Tab but not on blur. I flagged
  this against the brief. We checked APG's source code and I chose the full APG model, which led
  to the three safeguards.
- **Second theme.** I questioned whether high contrast was the right choice and kept it after
  the trade-off was laid out.
- **Its own bugs, caught in review:**
  - a self-referencing token (`--cw-radius-pill: var(--cw-radius-pill)`)
  - a test assertion that asserted nothing
  - a test that checked `textContent` instead of the accessible name
  - a CSS chevron that turned into a solid bar under forced colors, found only by rendering it

**How I verified what it produced:**

- ARIA claims were checked against the APG pages and example source, not taken on trust.
- Contrast was measured with a script against the real primitive values.
- Tests were mutation-checked (each safeguard broken on purpose to see a test fail).
- Behaviour was driven in real Chrome: keyboard only, 500 options, `prefers-contrast` and
  `forced-colors` emulation.
- The breaking-change claim was tested by compiling against the old call sites.
- I did a manual pass with NVDA and Chrome. The select and the badges were announced as
  expected. The one exception: the theme radio buttons and their labels in the workbench header
  were not announced. Chrome's accessibility tree exposes them correctly (a group named "Theme"
  with three named radios), so the markup is not the obvious cause. I did not have time to find
  the actual cause. It affects the workbench, not the kit.

## Time spent

About three hours in total. The per-phase figures are estimates:

| Phase | Approx. time |
| --- | --- |
| Analysing the brief and the starter; planning and decisions | ~30 min |
| Semantic token layer and moving the workbench onto it | ~20 min |
| `cw-select`, its tests, and workbench integration | ~65 min |
| `cw-status-badge` rework and call-site updates | ~20 min |
| High-contrast theme and theme switcher | ~15 min |
| Documentation (DECISIONS, ADOPTION, notes and README) | ~20 min |

## What I would do next

1. An end-to-end suite in Playwright, with axe, on the workbench in both themes. jsdom does no
   layout, so positioning and scrolling are only verified manually today.
2. Find why NVDA did not announce the theme radio group.
3. Promote the contrast and token-naming check (currently a local script) into CI.
4. The `ng update` schematic and lint rule described in ADOPTION.md.
5. `compareWith` for object values, and a way to render richer option content without losing
   typeahead.
6. Popup positioning that escapes clipping (see below).

## A risk I knowingly left

The listbox is rendered in place with `position: absolute`. Inside an ancestor with
`overflow: hidden` or `auto` (a scrolling table, a dialog body), it will be clipped. Collision
handling was out of scope. Rendering in place was deliberate: the popup keeps the theme of its
subtree and there is no shared overlay container. But clipping is a real failure in the kinds of
screens this kit serves.

**Next test I would write:** a Playwright test that mounts `cw-select` inside an
`overflow: hidden` container near its bottom edge, opens it, and asserts that the last option is
visible: its bounding box lies within the viewport, and `document.elementFromPoint` at its centre
returns the option. That test should fail today. It would then drive the choice between the
Popover API with anchor positioning and a portaled overlay.
