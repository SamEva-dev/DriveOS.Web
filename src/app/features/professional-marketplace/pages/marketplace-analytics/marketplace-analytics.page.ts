import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { MarketplaceDashboard, MarketplaceDashboardAlert } from '../../models/marketplace-dashboard.model';

type AnalyticsTab = 'integration' | 'operations' | 'quality' | 'finance';

@Component({
  selector: 'driveos-marketplace-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsFormAlertComponent,
    DriveOsPageHeaderComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './marketplace-analytics.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceAnalyticsPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);

  readonly canRead = computed(() => this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.analytics.read));
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly analytics = signal<MarketplaceDashboard | null>(null);
  readonly previousAnalytics = signal<MarketplaceDashboard | null>(null);
  readonly loading = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly activeTab = signal<AnalyticsTab>('integration');
  readonly filterDrawerOpen = signal(false);
  readonly from = signal(this.daysAgo(29));
  readonly to = signal(this.isoDate(new Date()));
  readonly draftFrom = signal(this.from());
  readonly draftTo = signal(this.to());
  readonly tabs: readonly AnalyticsTab[] = ['integration', 'operations', 'quality', 'finance'];

  readonly periodDays = computed(() => this.inclusiveDays(this.from(), this.to()));

  constructor() {
    if (this.canRead()) this.load();
  }

  load(): void {
    const organizationId = this.organizationId();
    if (!this.canRead() || !organizationId) {
      if (!organizationId) this.errors.set([this.translate.instant('professionalMarketplace.analytics.missingOrganization')]);
      return;
    }

    const previous = this.previousPeriod(this.from(), this.to());
    this.loading.set(true);
    this.errors.set([]);
    forkJoin({
      current: this.api.getOrganizationAnalytics(organizationId, this.from(), this.to()),
      previous: this.api.getOrganizationAnalytics(organizationId, previous.from, previous.to),
    }).subscribe({
      next: ({ current, previous: previousData }) => {
        this.analytics.set(current);
        this.previousAnalytics.set(previousData);
        this.loading.set(false);
      },
      error: (error) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  selectTab(tab: AnalyticsTab): void {
    this.activeTab.set(tab);
  }

  openFilters(): void {
    this.draftFrom.set(this.from());
    this.draftTo.set(this.to());
    this.filterDrawerOpen.set(true);
  }

  closeFilters(): void {
    this.filterDrawerOpen.set(false);
  }

  applyFilters(): void {
    if (!this.draftFrom() || !this.draftTo() || this.draftFrom() > this.draftTo()) return;
    this.from.set(this.draftFrom());
    this.to.set(this.draftTo());
    this.closeFilters();
    this.load();
  }

  setPreset(days: number): void {
    this.draftTo.set(this.isoDate(new Date()));
    this.draftFrom.set(this.daysAgo(days - 1));
  }

  formatPercent(value: number | null): string {
    return value === null ? '—' : `${this.formatNumber(value, 1)} %`;
  }

  formatHours(value: number | null): string {
    return value === null ? '—' : `${this.formatNumber(value, 1)} h`;
  }

  formatMoney(value: number | null, currency: string | null): string {
    if (value === null) return '—';
    try {
      return new Intl.NumberFormat(this.translate.currentLang() || 'fr', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(value);
    } catch {
      return `${this.formatNumber(value, 2)} ${currency ?? ''}`.trim();
    }
  }

  delta(current: number | null, previous: number | null): string {
    if (current === null || previous === null) return '—';
    if (previous === 0) return current === 0 ? '0 %' : this.translate.instant('professionalMarketplace.analytics.comparison.new');
    const value = ((current - previous) / Math.abs(previous)) * 100;
    const sign = value > 0 ? '+' : '';
    return `${sign}${this.formatNumber(value, 1)} %`;
  }

  deltaTone(current: number | null, previous: number | null, inverse = false): string {
    if (current === null || previous === null || current === previous) return 'text-[var(--driveos-text-tertiary)]';
    const improved = inverse ? current < previous : current > previous;
    return improved ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  }

  alertMessage(alert: MarketplaceDashboardAlert): string {
    const translated = this.translate.instant(alert.messageKey);
    return translated === alert.messageKey
      ? this.translate.instant('professionalMarketplace.dashboard.alerts.fallback', { code: alert.code })
      : translated;
  }

  alertTone(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'danger':
      case 'error': return 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100';
      case 'warning': return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100';
      default: return 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-100';
    }
  }

  private previousPeriod(from: string, to: string): { from: string; to: string } {
    const days = this.inclusiveDays(from, to);
    const currentFrom = this.parseDate(from);
    const previousTo = new Date(currentFrom);
    previousTo.setDate(previousTo.getDate() - 1);
    const previousFrom = new Date(previousTo);
    previousFrom.setDate(previousFrom.getDate() - days + 1);
    return { from: this.isoDate(previousFrom), to: this.isoDate(previousTo) };
  }

  private inclusiveDays(from: string, to: string): number {
    const milliseconds = this.parseDate(to).getTime() - this.parseDate(from).getTime();
    return Math.max(1, Math.floor(milliseconds / 86_400_000) + 1);
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.isoDate(date);
  }

  private isoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatNumber(value: number, digits = 0): string {
    return new Intl.NumberFormat(this.translate.currentLang() || 'fr', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }
}
