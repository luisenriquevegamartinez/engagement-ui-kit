# Engagement UI Kit — Starter Project

An Angular starter for the design system exercise: a small UI kit, the token layer it is built
on, one supplied component, and a workbench application that consumes the kit. Your exercise
brief describes what to build.

## Requirements

- Node.js 20.19+, 22.12+ or 24+ (see `.nvmrc`)
- npm 10+

## Running the project

```bash
npm install                 # install dependencies
npm start                   # dev server on http://localhost:4200
npm test                    # run the tests in watch mode
npm test -- --watch=false   # run the tests once
npm run build               # production build
```

Angular 21, zoneless, strict TypeScript. Tests run on Vitest via the Angular CLI. Prettier is
configured (`npx prettier --write .`); formatting is not assessed.

## The domain

- **Engagement** — a piece of client work, e.g. a statutory audit for one client and one year.
- **Change** — one proposed modification to an engagement, categorised by a `group` label.
- **Reviewer** — a person who can be assigned to review an engagement's pending changes.

The kit is the shared component layer these screens are built from. It is consumed by several
product teams, so its public API, its accessibility behaviour and its theming are the parts that
matter.

## The kit

Everything under `src/lib/` is the kit. Its public surface is
[`src/lib/public-api.ts`](src/lib/public-api.ts): consumers import from there and should never
need to reach into a component folder.

### Tokens

Three files under `src/lib/tokens/`:

| File               | What it is                                                       |
| ------------------ | ---------------------------------------------------------------- |
| `_primitives.scss` | Supplied. Raw values — palette, spacing, radii, type, elevation. |
| `_semantic.scss`   | A stub. The layer that says what those values are _for_. Yours.  |
| `tokens.scss`      | The entry point, loaded once from `src/styles.scss`.             |

Primitives are CSS custom properties, so the layer above them can be re-pointed at runtime. A
primitive says what a value _is_ (`--cw-blue-600`); it never says what it is _for_.

### The supplied component

`cw-status-badge` ([`src/lib/status-badge/`](src/lib/status-badge)) shows an engagement's
processing state. It is real code of the kind that accumulates in a component library before
anyone owns it, and your brief asks you to do something about it. Read it before you judge it.

## The kit after this exercise

The decisions behind this section are in [DECISIONS.md](DECISIONS.md), and the badge migration
is in [ADOPTION.md](ADOPTION.md).

### Tokens and theming

- Components use only semantic tokens (`--cw-<category>-<role>[-<variant>]`, e.g.
  `--cw-color-text-muted` or `--cw-border-width-default`), never primitives or raw colours.
- A semantic token points directly at a primitive, never at another semantic token, so a theme
  applied to a subtree resolves predictably.
- A theme is a block that re-declares semantic tokens.
  [`_theme-high-contrast.scss`](src/lib/tokens/_theme-high-contrast.scss) is the example.

To apply a theme, set `data-cw-theme="high-contrast"` (or `"default"`) on `<html>` or on any
subtree. With no attribute, the high-contrast theme follows the user's `prefers-contrast: more`
preference.

### `cw-select`

```html
<cw-select label="Reviewer" placeholder="Select a reviewer"
           [options]="options" [formControl]="reviewerId" />
```

`options` is a `SelectOption<T>[]`: `{ value, label, description?, disabled? }`. The component
works with reactive and template-driven forms.

| Key | List closed | List open |
| --- | --- | --- |
| ↓ / Enter / Space | Open | ↓ next option; Enter/Space choose the active option |
| ↑ / Home / End | Open on first / first / last | Move to previous / first / last |
| PageUp / PageDown | — | Move 10 options |
| Typing | Open and jump to a match | Jump to a match (repeat a letter to cycle) |
| Escape | — | Close without changing the value |
| Tab | Move on | Choose the active option and move on |

Unavailable options can be reached and are announced as unavailable, but they cannot be chosen.

### `cw-status-badge` 2.0

```html
<cw-status-badge label="Ready" tone="success" size="sm" />
```

`tone` is one of `neutral | info | success | warning | danger`, and `size` is one of
`sm | md | lg`. Both have defaults (`neutral` and `md`).

## The workbench

`src/app/` is a consumer of the kit, not part of it. It exists so components can be built,
demonstrated and reviewed in a running application. Change it freely — including replacing the
placeholder in the _Review filters_ section, and updating call sites if you change a component's
API.

Sample data lives in [`src/app/data/engagement-fixtures.ts`](src/app/data/engagement-fixtures.ts).
The fixtures are representative rather than exhaustive, so rely on the shapes rather than on
specific ids, counts, ordering or values.

## What is yours

How the kit is put together is intentionally left to you: the semantic token layer and how a
theme overrides it, each component's public API, how accessibility behaviour is implemented, how
styles are structured, what the documentation surface looks like, and what you test. The starter
takes no position on any of it.

Visual design is not assessed beyond the components being usable and legible. Storybook is
welcome if you want it, but it is not expected and setting it up is not a good use of the time.

## Layout

```text
src/
  lib/                             # the kit
    public-api.ts                  # its public surface
    tokens/
      _primitives.scss             # supplied raw values
      _semantic.scss               # stub: the layer that is yours
      tokens.scss                  # style entry point
    status-badge/                  # the supplied component
  app/                             # the workbench: a consumer of the kit
    app.ts / app.html / app.scss
    app.config.ts
    data/engagement-fixtures.ts    # sample data
  styles.scss                      # tokens + a small reset
```
