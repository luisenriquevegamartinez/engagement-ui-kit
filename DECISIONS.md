# Decisions

Five decisions where another reasonable implementation would have behaved differently.

## 1. ARIA pattern: select-only combobox with `aria-activedescendant`

`cw-select` follows the WAI-ARIA APG
[select-only combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/).
DOM focus never leaves the trigger. The active option is conveyed with `aria-activedescendant`,
and `aria-controls` is set only while the list is open. Because focus never moves, it can never
be lost when the list is removed, and there is nothing to restore on close.

Two details keep that guarantee in practice:
- The listbox prevents `mousedown`. Otherwise clicking an option would move focus to `<body>`.
- The listbox has `tabindex="-1"`. Otherwise Chrome's keyboard-focusable scrollers would let Tab
  land in a list that is about to be removed.

**Alternative considered:** a button that moves focus into the listbox, using roving `tabindex`.
Screen readers would follow DOM focus natively and scrolling would come for free. But every way
of closing (Escape, selection, click outside, disabling) would then need explicit focus
restoration, and each one is a path where focus can drop to the document.
The cost of my choice is that the component scrolls the active option into view itself.

## 2. Commit model: APG's, with safeguards against silent assignment

Following APG, leaving the control (Tab or a click outside) commits the *keyboard-active* option.
Escape is the way to dismiss without changing the selection. The active option and the selected
value are separate states: arrowing through options changes nothing until you commit.

Taken literally, that model can assign a reviewer nobody chose, so three safeguards apply:
- With no value, the list opens with **no** active option until the user navigates.
- Mouse hover is a visual highlight only and never moves the active option.
- A disabled option is never committed.

The test suite covers these safeguards. Breaking any of them fails at least one test; I checked
this by deliberately introducing each break.

**Alternative considered:** explicit-only commit, where only Enter, Space or a click commit and
Tab or a click outside just close. It matches the brief's wording ("dismissing the list without
changing the selection") even more literally, and it would not need the safeguards. I chose APG
because it is the documented pattern that assistive-technology users and reviewers can check the
component against. The deviation would have been harder to justify than the safeguards were to
build.

## 3. Options are data; typing jumps rather than filters

Options are passed as `SelectOption<T>[]`, with `value`, `label`, optional `description` and
optional `disabled`. Consumers map their domain onto it; the workbench does this for reviewers,
change groups and 500 numeric cost centres. Typing jumps to the next matching label, as a native
`<select>` does. A space joins the search while one is in progress, so "Jean B" works.

**Alternatives considered:**
- **Projected `<cw-option>` children** would allow rich option content. But typeahead would
  depend on DOM text, it would need parent/child registration, and several hundred options would
  mean several hundred component instances.
- **Filtering** would make it an editable combobox: an `<input>` with `aria-autocomplete="list"`
  and a live region announcing the result count. That is a different pattern, and I would choose
  it if hundreds of options were the common case rather than the edge case.

## 4. Forms integration through `ControlValueAccessor`, not Signal Forms

The value flows only through Angular forms. `onChange` fires only when the value actually
changes, so re-selecting the current value does not mark the control dirty, and `writeValue` never
does. Signal Forms are marked `@experimental` in the installed Angular 21.2. A shared kit should not
build its public contract on an experimental API. CVA works with reactive forms, template-driven
forms (both are demonstrated in the workbench), and with Signal Forms' `FormField`, which accepts
CVA controls for compatibility.

## 5. Tokens: two tiers, and themes that only re-point semantic tokens

- **Components consume semantic tokens only.** A check confirms that no hex value or primitive
  appears outside `src/lib/tokens`.
- **Semantic tokens reference primitives, never other semantic tokens.** A custom property
  resolves `var()` on the element where it is declared, and descendants inherit the computed
  value. If a theme island (for example a federated remote with `data-cw-theme` on its root)
  overrode only a base token, anything aliased to it on `:root` would keep the old value.
- **Themes are opt-in.** They are set with `data-cw-theme` on any element.
- **Proof it is cheap.** The high-contrast theme needed zero component changes: one file and two
  lines in `tokens.scss`.
- **High contrast over dark.** I chose it because it tests the non-colour tokens too (border and
  focus-ring widths), it reaches AAA (>= 7:1) with the existing primitives, and it applies
  automatically under `prefers-contrast: more` when the app has not chosen a theme. It is
  distinct from forced-colors mode, where the OS picks every colour. Components cope with that by
  never relying on background alone.

**Alternative considered:** a third tier of public component tokens (e.g. `--cw-select-option-bg`).
It would give consumers more knobs, but every token would become a versioned contract. Variants
use private `--_*` properties instead.

## Assumptions

- Option values are compared with `Object.is`. Values should be primitives or stable references.
  `compareWith` is a candidate addition.
- A value that is not among the options shows the placeholder. The form value is never rewritten
  silently.
- The kit ships no user-facing copy (Caseware ships in 16 languages). The label, placeholder and
  option text all come from inputs.
- The popup is rendered in place, not portaled, so it inherits the theme scope of its subtree.
  The known cost is covered in SUBMISSION.md.
