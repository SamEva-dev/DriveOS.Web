import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatCardComponent } from '../../../../shared/ui/stat-card/driveos-stat-card.component';
import { WorkforceApiService } from '../../data-access/workforce-api.service';
import { WORKFORCE_PERMISSIONS } from '../../domain/workforce-permissions';
import {
  WorkforceAnalytics,
  WorkforceAnalyticsBreakdown,
  WorkforceAnalyticsMonthlyPoint,
} from '../../models/workforce.models';

type AnalyticsTab = 'overview' | 'activity' | 'compliance' | 'trends';

@Component({
  selector: 'driveos-workforce-analytics-page',
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
    DriveOsStatCardComponent,
  ],
  templateUrl: './workforce-analytics.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkforceAnalyticsPage {
  private readonly api = inject(WorkforceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);

  readonly canRead = computed(() =>
    this.authorization.hasPermission(WORKFORCE_PERMISSIONS.analytics.read),
  );
  readonly analytics = signal<WorkforceAnalytics | null>(null);
  readonly loading = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly activeTab = signal<AnalyticsTab>('overview');
  readonly filterDrawerOpen = signal(false);
  readonly from = signal(this.defaultFrom());
  readonly to = signal(this.isoDate(new Date()));
  readonly draftFrom = signal(this.from());
  readonly draftTo = signal(this.to());

  readonly tabs: readonly AnalyticsTab[] = ['overview', 'activity', 'compliance', 'trends'];

  readonly maxFunctionValue = computed(() => {
    const values =
      this.analytics()?.currentHeadcountByProfessionalFunction.map((item) => item.value) ?? [];
    return Math.max(1, ...values);
  });

  readonly maxMonthlyTimesheetHours = computed(() => {
    const values = this.analytics()?.monthlyTrend.map((item) => item.validatedTimesheetHours) ?? [];
    return Math.max(1, ...values);
  });

  constructor() {
    if (this.canRead()) this.load();
  }

  load(): void {
    if (!this.canRead()) return;
    this.loading.set(true);
    this.errors.set([]);
    this.api.getAnalytics(this.from(), this.to()).subscribe({
      next: (data) => {
        this.analytics.set(data);
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
    if (!this.draftFrom() || !this.draftTo()) return;
    this.from.set(this.draftFrom());
    this.to.set(this.draftTo());
    this.closeFilters();
    this.load();
  }

  resetFilters(): void {
    this.draftFrom.set(this.defaultFrom());
    this.draftTo.set(this.isoDate(new Date()));
  }

  formatPercent(value: number): string {
    return `${this.formatNumber(value, 1)} %`;
  }

  formatHours(value: number): string {
    return `${this.formatNumber(value, 1)} h`;
  }

  formatDays(value: number): string {
    return this.translate.instant('workforce.analytics.units.days', {
      value: this.formatNumber(value, 1),
    });
  }

  monthLabel(point: WorkforceAnalyticsMonthlyPoint): string {
    const date = new Date(point.year, point.month - 1, 1);
    return new Intl.DateTimeFormat(this.translate.currentLang() || 'fr', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  functionLabel(item: WorkforceAnalyticsBreakdown): string {
    const key = `workforce.professionalFunctions.${item.key}`;
    const translated = this.translate.instant(key);
    return translated === key ? item.label : translated;
  }

  functionWidth(item: WorkforceAnalyticsBreakdown): number {
    return Math.max(3, Math.min(100, (item.value / this.maxFunctionValue()) * 100));
  }

  monthlyHoursWidth(point: WorkforceAnalyticsMonthlyPoint): number {
    return Math.max(
      2,
      Math.min(100, (point.validatedTimesheetHours / this.maxMonthlyTimesheetHours()) * 100),
    );
  }

  metricDefinition(key: string): string | null {
    const messageKey = this.analytics()?.metricDefinitions?.[key];
    if (!messageKey) return null;
    const translated = this.translate.instant(messageKey);
    return translated === messageKey ? messageKey : translated;
  }

  private formatNumber(value: number, digits = 0): string {
    return new Intl.NumberFormat(this.translate.currentLang() || 'fr', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  }

  private defaultFrom(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 11, 1);
    return this.isoDate(date);
  }

  private isoDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
