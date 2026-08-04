import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type DriveOsIconSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'drive-os-icon',
  standalone: true,
  templateUrl: './driveos-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DriveOsIconComponent {
  readonly name = input.required<string>();
  readonly size = input<DriveOsIconSize>('md');
  readonly strokeWidth = input(2);
  readonly decorative = input(true);
  readonly label = input<string | null>(null);

  readonly normalizedName = computed(() => this.normalize(this.name()));
  readonly sizeClass = computed(() => ({ sm: 'size-4', md: 'size-5', lg: 'size-6', xl: 'size-8' })[this.size()]);

  private normalize(value: string): string {
    const token = value
      .replace(/\bph(?:-bold|-duotone|-fill)?\b/g, '')
      .replace(/\bph-/g, '')
      .trim()
      .split(/\s+/)
      .find((part) => !part.startsWith('text-') && !part.startsWith('animate-')) ?? value;

    const aliases: Record<string, string> = {
      'arrows-clockwise': 'refresh-cw',
      'arrow-counter-clockwise': 'rotate-ccw',
      'arrow-left': 'arrow-left',
      'arrow-right': 'arrow-right',
      'arrow-up': 'arrow-up',
      'arrow-down': 'arrow-down',
      'caret-left': 'chevron-left',
      'caret-right': 'chevron-right',
      'caret-double-left': 'chevrons-left',
      'caret-double-right': 'chevrons-right',
      'check-circle': 'circle-check',
      'play-circle': 'circle-play',
      'pause-circle': 'circle-pause',
      'warning-circle': 'circle-alert',
      warning: 'triangle-alert',
      'x-circle': 'circle-x',
      'lock-key': 'lock',
      'paper-plane-tilt': 'send',
      buildings: 'building-2',
      'identification-card': 'id-card',
      'magnifying-glass': 'search',
      'pencil-simple': 'pencil',
      'calendar-dots': 'calendar-days',
      gear: 'settings',
      wallet: 'wallet-cards',
      spinner: 'loader-circle',
      plus: 'plus',
      x: 'x',
      eye: 'eye',
      star: 'star',
      globe: 'globe-2',
      users: 'users',
      car: 'car',
      house: 'house',
      check: 'check',
    };

    return aliases[token] ?? token;
  }
}
