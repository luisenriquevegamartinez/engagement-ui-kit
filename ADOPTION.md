# Adopting the `cw-status-badge` change

## Versioning and release

The badge change is a **major** version (2.0.0).
- `isReady`, `isProcessing`, `isError`, `isSmall`, `isLarge` and `tooltip` are removed.
- `label` is now required.

I would ship it in two steps, so the fix and the migration are decoupled.

**1.x minor (no breaking changes):**
- the accessibility fix (the label was `aria-hidden`, so screen readers announced nothing)
- token-based styles
- the new `tone` and `size` inputs, alongside the old booleans marked `@deprecated` with a
  one-time dev-mode warning

Every team gets the accessibility fix by upgrading, without touching code.

**2.0:** removes the deprecated inputs. This repository shows the 2.0 end state.

**What consuming teams must do:**
- Map their own states to a tone. For example, the workbench maps `READY` to `success`,
  `PROCESSING` to `info` and `ERROR` to `danger`.
- Replace the size booleans with `size`.
- Make any text they had put in `tooltip` visible.
- Drop styles that targeted the badge's internal `.badge` class.

## Making adoption safe, not just possible

- **The compiler helps, but only partly.** With strict templates, every removed *binding* is a
  compile error (NG8002 "Can't bind to 'isReady'"). I checked this by building against the old
  call sites. But a *static* attribute such as `tooltip="..."` is valid HTML: it compiles
  silently and does nothing. So the release needs an `ng update` schematic that rewrites the
  literal cases and flags `tooltip` usages, plus a lint rule for the rest.
- **The CHANGELOG** gets an old-to-new table and before/after examples.
- **CI on the kit:**
  - a public-API golden file, so an unintended API change fails review
  - a snapshot of semantic token names, because renaming a token is a breaking change
  - an automated contrast check of token pairs in every theme
  - axe checks and visual diffs per theme
- **Pre-release:** a `next` dist-tag canary that one consuming team adopts before the release.

## Two kit versions in one page (module federation)

**What would go wrong:**
- **Tokens are global.** Both versions write custom properties to `:root`, so the last
  stylesheet wins. If v2 renamed or removed a token that v1 components use, those components
  would render with invalid values. Token names are therefore public API: additions only within
  a major, and aliases kept for renames.
- **A singleton share goes stale silently.** If the kit is a `singleton` shared dependency and a
  remote compiled against v1 receives v2 at runtime, its compiled bindings (`isReady`) target
  inputs that no longer exist. Setting `requiredVersion` with `strictVersion` makes a major
  mismatch fail at load time instead of rendering wrong.
- **Leaked global styles.** Any global style from the kit leaks across every app on the page. v1's
  `::ng-deep .engagement-row .badge` did exactly that; it is gone.

**What makes this better in my design:**
- Component styles are scoped, and there are no global selectors.
- Generated ids use a counter shared through `globalThis[Symbol.for(...)]`. Two copies of the kit
  cannot both produce `cw-select-1`. If they did, `aria-activedescendant` could point at another
  app's element and a screen reader would announce the wrong option.
- The popup renders in place, so there is no global overlay container for two versions to
  contest.
- Themes are attributes on any subtree, so a remote can keep its own theme island.

**What makes it worse:** the design deliberately depends on one shared global contract, the
semantic token names on `:root`. That contract is what has to be versioned with the most care.
