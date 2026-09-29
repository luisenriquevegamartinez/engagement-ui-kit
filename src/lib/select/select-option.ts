/**
 * One choice offered by `cw-select`.
 *
 * Consumers map their own data into this shape, which keeps the component
 * independent of any domain model.
 */
export interface SelectOption<T> {
  /** The value written to the form control when this option is chosen. Compared with `Object.is`. */
  value: T;
  /** Visible text. Also what typeahead matches against and what the closed control displays. */
  label: string;
  /** Optional secondary text shown under the label, e.g. a person's role. */
  description?: string;
  /**
   * The option is shown and can be reached with the keyboard, but cannot be chosen.
   * Exposed to assistive technology as `aria-disabled="true"`.
   */
  disabled?: boolean;
}
