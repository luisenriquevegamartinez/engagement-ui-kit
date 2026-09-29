import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { getByText } from '@testing-library/dom';

import { StatusBadge } from './status-badge';

@Component({
  imports: [StatusBadge],
  template: `<cw-status-badge label="Ready" tone="success" />`,
})
class Host {}

/**
 * The regression that matters: v1 marked the label `aria-hidden`, so screen
 * readers received nothing and the state was conveyed by dot colour alone.
 */
describe('StatusBadge', () => {
  it('exposes its label to assistive technology and hides only the decorative dot', async () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const label = getByText(root, 'Ready');
    expect(label.closest('[aria-hidden="true"]')).toBeNull();
    expect(root.querySelector('.dot')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('cw-status-badge')?.getAttribute('data-tone')).toBe('success');
  });
});
