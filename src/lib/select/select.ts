import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { uniqueId } from '../internal/unique-id';
import { SelectOption } from './select-option';

const PAGE_SIZE = 10;
const TYPEAHEAD_TIMEOUT_MS = 500;

/**
 * Single-select control: a labelled trigger that opens a list of options.
 *
 * Implements the WAI-ARIA APG "select-only combobox" pattern. DOM focus stays
 * on the trigger at all times; the active option is conveyed with
 * `aria-activedescendant`. The value is read and written through Angular
 * forms (`formControl`, `formControlName` or `ngModel`).
 *
 * Keyboard: ↓/Enter/Space open; ↑/↓, Home/End, PageUp/PageDown and typing move
 * the active option; Enter/Space choose it; Escape closes without changing the
 * value; Tab (or any blur) chooses the active option and moves on.
 *
 * ```html
 * <cw-select label="Reviewer" placeholder="Select a reviewer"
 *            [options]="reviewerOptions" [formControl]="reviewerId" />
 * ```
 */
@Component({
  selector: 'cw-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select<T> implements ControlValueAccessor {
  /** Visible label. Required: every instance must be named for assistive technology. */
  readonly label = input.required<string>();
  /** The choices. Rendered in order; disabled options stay visible and navigable. */
  readonly options = input.required<readonly SelectOption<T>[]>();
  /** Text shown while nothing is selected. The kit ships no default copy. */
  readonly placeholder = input('');

  protected readonly labelId = uniqueId('cw-select-label');
  protected readonly listboxId = uniqueId('cw-select-listbox');

  protected readonly value = signal<T | null>(null);
  protected readonly disabled = signal(false);
  protected readonly open = signal(false);
  /** Index of the keyboard-active option, or -1. Changed only by keyboard navigation. */
  protected readonly activeIndex = signal(-1);

  protected readonly selectedIndex = computed(() => {
    const value = this.value();
    return this.options().findIndex((option) => Object.is(option.value, value));
  });
  protected readonly selectedOption = computed<SelectOption<T> | undefined>(
    () => this.options()[this.selectedIndex()],
  );
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return this.open() && index >= 0 && index < this.options().length ? this.optionId(index) : null;
  });

  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly listbox = viewChild<ElementRef<HTMLElement>>('listbox');

  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};
  private typeaheadBuffer = '';
  private typeaheadAt = 0;

  constructor() {
    // With aria-activedescendant the browser does not scroll for us.
    afterRenderEffect(() => {
      const id = this.activeOptionId();
      const listbox = this.listbox()?.nativeElement;
      if (id && listbox) {
        listbox.querySelector(`[id="${id}"]`)?.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  writeValue(value: T | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.close();
    }
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected focusTrigger(): void {
    if (!this.disabled()) {
      this.trigger().nativeElement.focus();
    }
  }

  protected onTriggerClick(): void {
    if (this.disabled()) {
      return;
    }
    if (this.open()) {
      this.close();
    } else {
      this.openAt(this.selectedIndex());
    }
  }

  protected onOptionClick(index: number): void {
    if (this.commit(index)) {
      this.close();
    }
  }

  /** Leaving the control chooses the keyboard-active option (APG), then closes. */
  protected onBlur(): void {
    if (this.open()) {
      this.commit(this.activeIndex());
      this.close();
    }
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }
    const handled = this.open() ? this.handleOpenKey(event) : this.handleClosedKey(event);
    if (handled) {
      event.preventDefault();
    }
  }

  private handleClosedKey(event: KeyboardEvent): boolean {
    const last = this.options().length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        this.openAt(this.selectedIndex());
        return true;
      case 'ArrowUp':
      case 'Home':
        this.openAt(Math.min(0, last));
        return true;
      case 'End':
        this.openAt(last);
        return true;
      default:
        if (!this.isTypeaheadKey(event)) {
          return false;
        }
        this.openAt(this.selectedIndex());
        this.typeahead(event.key);
        return true;
    }
  }

  private handleOpenKey(event: KeyboardEvent): boolean {
    const active = this.activeIndex();
    const last = this.options().length - 1;
    switch (event.key) {
      case 'ArrowDown':
        this.activeIndex.set(Math.min(active + 1, last));
        return true;
      case 'ArrowUp':
        if (event.altKey) {
          this.chooseActive();
        } else {
          this.activeIndex.set(Math.min(Math.max(active - 1, 0), last));
        }
        return true;
      case 'Home':
        this.activeIndex.set(Math.min(0, last));
        return true;
      case 'End':
        this.activeIndex.set(last);
        return true;
      case 'PageUp':
        this.activeIndex.set(Math.min(Math.max(active - PAGE_SIZE, 0), last));
        return true;
      case 'PageDown':
        this.activeIndex.set(Math.min(active + PAGE_SIZE, last));
        return true;
      case 'Enter':
        this.chooseActive();
        return true;
      case ' ':
        if (this.typeaheadInProgress()) {
          this.typeahead(' ');
        } else {
          this.chooseActive();
        }
        return true;
      case 'Escape':
        this.close();
        return true;
      case 'Tab':
        // Not prevented: focus moves on and onBlur() chooses the active option.
        return false;
      default:
        if (!this.isTypeaheadKey(event)) {
          return false;
        }
        this.typeahead(event.key);
        return true;
    }
  }

  /** Enter/Space/Alt+↑: choose the active option. A disabled one leaves the list open. */
  private chooseActive(): void {
    const index = this.activeIndex();
    if (index < 0 || this.commit(index)) {
      this.close();
    }
  }

  /** Writes the option's value if it can be chosen. Returns false for a disabled or missing option. */
  private commit(index: number): boolean {
    const option = this.options()[index];
    if (!option || option.disabled) {
      return false;
    }
    if (!Object.is(option.value, this.value())) {
      this.value.set(option.value);
      this.onChange(option.value);
    }
    return true;
  }

  private openAt(index: number): void {
    this.open.set(true);
    this.activeIndex.set(index);
  }

  private close(): void {
    this.open.set(false);
    this.activeIndex.set(-1);
    this.typeaheadBuffer = '';
  }

  private isTypeaheadKey(event: KeyboardEvent): boolean {
    return (
      event.key.length === 1 &&
      event.key !== ' ' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    );
  }

  private typeaheadInProgress(): boolean {
    return this.typeaheadBuffer !== '' && Date.now() - this.typeaheadAt < TYPEAHEAD_TIMEOUT_MS;
  }

  /**
   * Moves the active option to the next label starting with the typed text.
   * Repeating one character cycles through the labels that start with it.
   */
  private typeahead(char: string): void {
    this.typeaheadBuffer = this.typeaheadInProgress() ? this.typeaheadBuffer + char : char;
    this.typeaheadAt = Date.now();

    const buffer = this.typeaheadBuffer.toLocaleLowerCase();
    const cycling = [...buffer].every((c) => c === buffer[0]);
    const search = cycling ? buffer[0] : buffer;
    const options = this.options();
    const current = this.activeIndex();
    const start = cycling ? current + 1 : Math.max(current, 0);

    for (let offset = 0; offset < options.length; offset++) {
      const index = (start + offset) % options.length;
      if (options[index].label.toLocaleLowerCase().startsWith(search)) {
        this.activeIndex.set(index);
        return;
      }
    }
  }
}
