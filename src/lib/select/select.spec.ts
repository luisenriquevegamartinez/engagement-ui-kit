import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, getByRole, queryByRole } from '@testing-library/dom';

import { Select } from './select';
import { SelectOption } from './select-option';

/**
 * Tests drive the component the way a user and assistive technology meet it:
 * through the combobox's role, accessible name, ARIA state and the bound
 * FormControl. They target the regressions that would reach a user: a wrong
 * value committed (or committed silently), a broken ARIA contract, and
 * disabled options that can still be chosen.
 */

const PEOPLE: SelectOption<string>[] = [
  { value: 'alice', label: 'Alice' },
  { value: 'bob', label: 'Bob', disabled: true },
  { value: 'carol', label: 'Carol' },
];

@Component({
  imports: [Select, ReactiveFormsModule],
  template: `
    <cw-select label="Reviewer" placeholder="Choose" [options]="options()" [formControl]="control" />
    <button type="button">Next field</button>
  `,
})
class Host {
  readonly options = signal<readonly SelectOption<string>[]>(PEOPLE);
  readonly control = new FormControl<string | null>(null);
}

describe('Select', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let root: HTMLElement;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [Host] });
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    root = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const combobox = () => getByRole(root, 'combobox', { name: 'Reviewer' });
  const listbox = () => queryByRole(root, 'listbox');
  const activeOption = () => {
    const id = combobox().getAttribute('aria-activedescendant');
    return id ? document.getElementById(id) : null;
  };

  async function press(key: string, init: KeyboardEventInit = {}) {
    fireEvent.keyDown(combobox(), { key, ...init });
    await fixture.whenStable();
  }

  async function focusElsewhere() {
    combobox().focus();
    getByRole(root, 'button', { name: 'Next field' }).focus();
    await fixture.whenStable();
  }

  describe('ARIA contract', () => {
    it('exposes name, collapsed state and placeholder value while closed', () => {
      expect(combobox().getAttribute('aria-expanded')).toBe('false');
      expect(combobox().hasAttribute('aria-controls')).toBe(false);
      expect(combobox().textContent?.trim()).toBe('Choose');
    });

    it('links the combobox to the listbox and the active option while open', async () => {
      await press('ArrowDown');
      await press('ArrowDown');

      expect(combobox().getAttribute('aria-expanded')).toBe('true');
      const controlled = document.getElementById(combobox().getAttribute('aria-controls')!);
      expect(controlled).toBe(listbox());
      expect(getByRole(root, 'listbox', { name: 'Reviewer' })).toBe(listbox());
      expect(activeOption()?.getAttribute('role')).toBe('option');
      expect(activeOption()?.textContent).toContain('Alice');
    });
  });

  describe('dismissing and committing', () => {
    it('Escape closes without changing the value and keeps focus on the combobox', async () => {
      host.control.setValue('alice');
      combobox().focus();
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Escape');

      expect(host.control.value).toBe('alice');
      expect(host.control.dirty).toBe(false);
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(combobox());
    });

    it('does not assign anything when the list is opened with no value and focus leaves', async () => {
      combobox().focus();
      await press('Enter');
      const firstOption = getByRole(listbox()!, 'option', { name: 'Alice' });
      fireEvent.mouseMove(firstOption);
      fireEvent.mouseOver(firstOption);
      await focusElsewhere();

      expect(host.control.value).toBeNull();
      expect(host.control.dirty).toBe(false);
      expect(host.control.touched).toBe(true);
      expect(listbox()).toBeNull();
    });

    it('commits the keyboard-active option when focus leaves (APG Tab behaviour)', async () => {
      combobox().focus();
      await press('ArrowDown');
      await press('ArrowDown');
      await focusElsewhere();

      expect(host.control.value).toBe('alice');
      expect(host.control.dirty).toBe(true);
    });

    it('selects with arrows and Enter, marks dirty and closes', async () => {
      combobox().focus();
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Enter');

      expect(host.control.value).toBe('carol');
      expect(host.control.dirty).toBe(true);
      expect(listbox()).toBeNull();
      expect(combobox().textContent?.trim()).toBe('Carol');
    });

    it('does not mark the control dirty when the current value is chosen again', async () => {
      host.control.setValue('carol');
      await press('Enter');
      await press('Enter');

      expect(host.control.value).toBe('carol');
      expect(host.control.dirty).toBe(false);
    });
  });

  describe('unavailable options', () => {
    it('are conveyed with aria-disabled and cannot be chosen by keyboard, click or blur', async () => {
      combobox().focus();
      await press('ArrowDown');
      await press('ArrowDown');
      await press('ArrowDown');

      const bob = activeOption()!;
      expect(bob.textContent).toContain('Bob');
      expect(bob.getAttribute('aria-disabled')).toBe('true');

      await press('Enter');
      expect(listbox()).not.toBeNull();
      fireEvent.click(bob);
      await fixture.whenStable();
      await focusElsewhere();

      expect(host.control.value).toBeNull();
      expect(host.control.dirty).toBe(false);
    });
  });

  describe('forms integration', () => {
    it('shows a value written by the form without marking it dirty', async () => {
      host.control.setValue('carol');
      await fixture.whenStable();

      expect(combobox().textContent?.trim()).toBe('Carol');
      expect(host.control.dirty).toBe(false);
    });

    it('becomes inert when the control is disabled', async () => {
      host.control.disable();
      await fixture.whenStable();

      expect(combobox().getAttribute('aria-disabled')).toBe('true');
      expect(combobox().getAttribute('tabindex')).toBe('-1');
      await press('ArrowDown');
      expect(listbox()).toBeNull();
    });
  });

  describe('pointer', () => {
    it('keeps focus on the combobox when an option is pressed, and chooses it on click', async () => {
      combobox().focus();
      await press('ArrowDown');
      const carol = getByRole(listbox()!, 'option', { name: 'Carol' });

      expect(fireEvent.mouseDown(carol)).toBe(false);
      fireEvent.click(carol);
      await fixture.whenStable();

      expect(host.control.value).toBe('carol');
      expect(listbox()).toBeNull();
    });
  });

  describe('with several hundred options', () => {
    beforeEach(async () => {
      host.options.set(
        Array.from({ length: 500 }, (_, i) => ({ value: `v${i + 1}`, label: `Option ${i + 1}` })),
      );
      await fixture.whenStable();
    });

    it('reaches the last option with End and scrolls it into view', async () => {
      const scrolled: Element[] = [];
      const original = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function (this: Element) {
        scrolled.push(this);
      };
      try {
        combobox().focus();
        await press('End');

        expect(activeOption()?.textContent).toContain('Option 500');
        expect(scrolled.at(-1)).toBe(activeOption());
      } finally {
        Element.prototype.scrollIntoView = original;
      }
    });

    it('jumps to a late option by typing its label, spaces included', async () => {
      combobox().focus();
      for (const key of 'option 499') {
        await press(key);
      }

      // Accessible name, not textContent: the decorative check mark must not be announced.
      expect(activeOption()).toBe(getByRole(listbox()!, 'option', { name: 'Option 499' }));
    });
  });
});
