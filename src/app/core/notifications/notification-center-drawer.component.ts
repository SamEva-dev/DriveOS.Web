import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { DriveOsDrawerComponent } from '../../shared/ui/drawer/driveos-drawer.component';
import { CommunicationNotificationService } from './communication-notification.service';
import { CommunicationNotification } from './communication-notification.model';

@Component({
  selector: 'driveos-notification-center-drawer',
  standalone: true,
  imports: [DriveOsDrawerComponent, TranslatePipe, DatePipe],
  template: `
    <drive-os-drawer
      [open]="open()"
      size="md"
      [title]="'notifications.title' | translate"
      (closeRequested)="closeRequested.emit()"
    >
      <div class="grid gap-4 p-4">
        <nav class="flex gap-2 border-b border-[var(--driveos-border)]">
          <button
            class="px-3 py-2 text-xs font-bold"
            [class.border-b-2]="tab() === 'marketplace'"
            [class.border-blue-700]="tab() === 'marketplace'"
            (click)="tab.set('marketplace')"
          >
            {{ 'notifications.tabs.marketplace' | translate }}
          </button>
          <button
            class="px-3 py-2 text-xs font-bold"
            [class.border-b-2]="tab() === 'all'"
            [class.border-blue-700]="tab() === 'all'"
            (click)="tab.set('all')"
          >
            {{ 'notifications.tabs.all' | translate }}
          </button>
          <button
            class="ml-auto px-3 py-2 text-xs font-bold"
            [class.border-b-2]="tab() === 'preferences'"
            [class.border-blue-700]="tab() === 'preferences'"
            (click)="openPreferences()"
          >
            {{ 'notifications.tabs.preferences' | translate }}
          </button>
        </nav>
        @if (tab() === 'preferences') {
          <section class="grid gap-3">
            @for (p of preferences(); track p.category) {
              <article class="rounded-xl border border-[var(--driveos-border)] p-3">
                <div class="mb-2 font-bold">{{ categoryLabel(p.category) }}</div>
                <div class="flex flex-wrap gap-5 text-sm">
                  <label class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="p.inAppEnabled"
                      (change)="togglePreference(p.category, 'inApp', $event)"
                    />
                    {{ 'notifications.preferences.inApp' | translate }}
                  </label>
                  <label class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      [checked]="p.emailEnabled"
                      (change)="togglePreference(p.category, 'email', $event)"
                    />
                    {{ 'notifications.preferences.email' | translate }}
                  </label>
                </div>
              </article>
            } @empty {
              <p
                class="rounded-xl border border-dashed p-6 text-center text-sm text-[var(--driveos-text-secondary)]"
              >
                {{ 'notifications.preferences.empty' | translate }}
              </p>
            }
          </section>
        } @else {
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs text-[var(--driveos-text-secondary)]">
              {{ visible().length }} {{ 'notifications.items' | translate }}
            </span>
            <button
              type="button"
              class="rounded-lg border px-3 py-2 text-xs font-bold"
              (click)="load()"
            >
              {{ 'common.actions.refresh' | translate }}
            </button>
          </div>
          @if (loading()) {
            <p class="py-8 text-center text-sm">{{ 'common.loading' | translate }}</p>
          } @else {
            <section class="grid gap-2">
              @for (n of visible(); track n.id) {
                <article
                  class="rounded-xl border p-3"
                  [class.border-blue-300]="n.status === 'Unread'"
                  [class.bg-blue-50]="n.status === 'Unread'"
                >
                  <button
                    type="button"
                    class="grid w-full gap-1 text-left"
                    (click)="openNotification(n)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <strong class="text-sm">{{ message(n) }}</strong>
                      @if (n.status === 'Unread') {
                        <span class="mt-1 size-2 shrink-0 rounded-full bg-blue-700"></span>
                      }
                    </div>
                    <div
                      class="flex flex-wrap items-center gap-2 text-[11px] text-[var(--driveos-text-secondary)]"
                    >
                      <span>{{ categoryLabel(n.category) }}</span>
                      <span>•</span>
                      <span>{{ n.createdAtUtc | date: 'short' }}</span>
                    </div>
                  </button>
                  <div class="mt-2 flex justify-end gap-2">
                    @if (n.status === 'Unread') {
                      <button
                        class="text-xs font-bold text-blue-800"
                        (click)="markRead(n)"
                      >
                        {{ 'notifications.actions.markRead' | translate }}
                      </button>
                    }
                    <button
                      class="text-xs font-bold text-[var(--driveos-text-secondary)]"
                      (click)="dismiss(n)"
                    >
                      {{ 'notifications.actions.dismiss' | translate }}
                    </button>
                  </div>
                </article>
              } @empty {
                <p
                  class="rounded-xl border border-dashed p-8 text-center text-sm text-[var(--driveos-text-secondary)]"
                >
                  {{ 'notifications.empty' | translate }}
                </p>
              }
            </section>
          }
        }
      </div>
    </drive-os-drawer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterDrawerComponent {
  readonly open = input(false);
  readonly closeRequested = output<void>();
  readonly countChanged = output<number>();
  private readonly api = inject(CommunicationNotificationService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  readonly items = signal<readonly CommunicationNotification[]>([]);
  readonly loading = signal(false);
  readonly tab = signal<'marketplace' | 'all' | 'preferences'>('marketplace');
  readonly preferences = signal<any[]>([]);
  readonly visible = computed(() =>
    this.tab() === 'marketplace' ? this.items().filter((n) => this.isMarketplace(n)) : this.items(),
  );
  constructor() {
    effect(() => {
      if (this.open()) void this.load();
    });
  }
  async load() {
    this.loading.set(true);
    try {
      this.items.set(await firstValueFrom(this.api.list(100, false)));
      this.emitCount();
    } finally {
      this.loading.set(false);
    }
  }
  async openPreferences() {
    this.tab.set('preferences');
    const saved = [...(await firstValueFrom(this.api.getPreferences()))];
    const categories = [
      'MISSION',
      'SERVICE_ENTRY',
      'DISPUTE',
      'COMPLIANCE',
      'ENGAGEMENT',
      'INVOICE',
      'PAYMENT',
      'CONTRACT',
    ];
    this.preferences.set(
      categories.map(
        (category) =>
          saved.find((x) => x.category === category) ?? {
            category,
            inAppEnabled: true,
            emailEnabled: true,
          },
      ),
    );
  }
  message(n: CommunicationNotification) {
    const translated = this.translate.instant(n.templateKey, n.parameters as any);
    return translated === n.templateKey
      ? this.translate.instant('notifications.fallback', {
          category: this.categoryLabel(n.category),
        })
      : translated;
  }
  categoryLabel(c: string) {
    const k = `notifications.categories.${c}`;
    const x = this.translate.instant(k);
    return x === k ? c : x;
  }
  isMarketplace(n: CommunicationNotification) {
    return (
      [
        'MISSION',
        'SERVICE_ENTRY',
        'DISPUTE',
        'COMPLIANCE',
        'ENGAGEMENT',
        'INVOICE',
        'PAYMENT',
        'CONTRACT',
      ].includes(n.category) || n.templateKey.startsWith('professionalMarketplace.')
    );
  }
  async markRead(n: CommunicationNotification) {
    if (n.status !== 'Unread') return;
    await firstValueFrom(this.api.markRead(n.id));
    this.items.update((xs) =>
      xs.map((x) =>
        x.id === n.id ? { ...x, status: 'Read', readAtUtc: new Date().toISOString() } : x,
      ),
    );
    this.emitCount();
  }
  async dismiss(n: CommunicationNotification) {
    await firstValueFrom(this.api.dismiss(n.id));
    this.items.update((xs) => xs.filter((x) => x.id !== n.id));
    this.emitCount();
  }
  async openNotification(n: CommunicationNotification) {
    await this.markRead(n);
    const route = this.routeFor(n);
    if (route) {
      this.closeRequested.emit();
      await this.router.navigate(route);
    }
  }
  routeFor(n: CommunicationNotification): any[] | null {
    switch (n.relatedEntityType) {
      case 'PROFESSIONAL_MISSION':
        return ['/marketplace/my-missions'];
      case 'SERVICE_ENTRY':
      case 'SERVICE_DISPUTE':
        return ['/marketplace/my-service-entries'];
      case 'PROFESSIONAL_PROFILE':
      case 'PROFESSIONAL_CREDENTIAL':
      case 'PROFESSIONAL_DOCUMENT': {
        const p = n.parameters['profileId'];
        return p ? ['/marketplace/professionals', p] : null;
      }
      default:
        return ['/marketplace/dashboard'];
    }
  }
  async togglePreference(category: string, kind: 'inApp' | 'email', e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const p = this.preferences().find((x) => x.category === category);
    if (!p) return;
    const next = { ...p, [kind === 'inApp' ? 'inAppEnabled' : 'emailEnabled']: checked };
    await firstValueFrom(this.api.updatePreference(category, next.inAppEnabled, next.emailEnabled));
    this.preferences.update((xs) => xs.map((x) => (x.category === category ? next : x)));
  }
  private emitCount() {
    this.countChanged.emit(this.items().filter((x) => x.status === 'Unread').length);
  }
}
