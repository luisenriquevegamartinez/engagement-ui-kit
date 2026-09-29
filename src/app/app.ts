import { Component, DOCUMENT, effect, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { Select, SelectOption, StatusBadge, StatusBadgeTone } from '../lib/public-api';
import {
  CHANGE_GROUPS,
  ENGAGEMENTS,
  EngagementStatus,
  REVIEWERS,
} from './data/engagement-fixtures';

/**
 * The workbench: a consumer of the kit in `src/lib`.
 *
 * It exists so components can be built, demonstrated and reviewed in a running
 * application. Change it freely — it is a consumer, not part of the kit.
 */
@Component({
  selector: 'app-root',
  imports: [FormsModule, ReactiveFormsModule, Select, StatusBadge],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly engagements = ENGAGEMENTS;

  /** `system` leaves the attribute off, so the kit follows `prefers-contrast`. */
  protected readonly theme = signal<'system' | 'default' | 'high-contrast'>('system');

  protected readonly themeOptions = [
    { value: 'system', label: 'Follow system' },
    { value: 'default', label: 'Default' },
    { value: 'high-contrast', label: 'High contrast' },
  ] as const;

  constructor() {
    const root = inject(DOCUMENT).documentElement;
    effect(() => {
      const theme = this.theme();
      if (theme === 'system') {
        root.removeAttribute('data-cw-theme');
      } else {
        root.setAttribute('data-cw-theme', theme);
      }
    });
  }

  /** The domain-to-kit mapping lives in the consumer; the kit only knows tones. */
  protected readonly statusBadges: Record<EngagementStatus, { label: string; tone: StatusBadgeTone }> = {
    READY: { label: 'Ready', tone: 'success' },
    PROCESSING: { label: 'Processing', tone: 'info' },
    ERROR: { label: 'Error', tone: 'danger' },
  };

  /** A form control for the reviewer filter, ready for a form-integrated control. */
  protected readonly reviewerId = new FormControl<string | null>(null);

  protected readonly reviewerOptions: SelectOption<string>[] = REVIEWERS.map((reviewer) => ({
    value: reviewer.id,
    label: reviewer.name,
    description: reviewer.unavailable ? `${reviewer.role} · Unavailable` : reviewer.role,
    disabled: reviewer.unavailable,
  }));

  /** Reuse beyond reviewers, bound with template-driven forms. */
  protected changeGroup: string | null = null;
  protected readonly changeGroupOptions: SelectOption<string>[] = CHANGE_GROUPS.map((group) => ({
    value: group,
    label: group,
  }));

  /** Scale check: several hundred options, some unavailable, with non-string values. */
  protected readonly costCentre = new FormControl<number | null>(null);
  protected readonly costCentreOptions: SelectOption<number>[] = Array.from(
    { length: 500 },
    (_, i) => ({
      value: i + 1,
      label: `Cost centre ${String(i + 1).padStart(3, '0')}`,
      disabled: (i + 1) % 7 === 0,
    }),
  );

  protected toggleReviewerDisabled(): void {
    if (this.reviewerId.disabled) {
      this.reviewerId.enable();
    } else {
      this.reviewerId.disable();
    }
  }

  protected assignFirstAvailableReviewer(): void {
    this.reviewerId.setValue(this.reviewerOptions.find((option) => !option.disabled)?.value ?? null);
  }
}
