import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Visual meaning of a badge. Consumers map their own states onto a tone. */
export type StatusBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type StatusBadgeSize = 'sm' | 'md' | 'lg';

/**
 * A short, read-only status label, e.g. an engagement's processing state.
 *
 * The label is the content: it is visible and read by assistive technology.
 * The coloured dot is decorative, so meaning never depends on colour alone.
 *
 * ```html
 * <cw-status-badge label="Ready" tone="success" />
 * ```
 *
 * Breaking change in 2.0: `isReady`, `isProcessing`, `isError`, `isSmall`,
 * `isLarge` and `tooltip` were removed in favour of `tone` and `size`, and
 * `label` is now required. See ADOPTION.md.
 */
@Component({
  selector: 'cw-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-size]': 'size()',
  },
})
export class StatusBadge {
  /** Visible text. Required: a badge without a label conveys nothing to assistive technology. */
  readonly label = input.required<string>();
  readonly tone = input<StatusBadgeTone>('neutral');
  readonly size = input<StatusBadgeSize>('md');
}
