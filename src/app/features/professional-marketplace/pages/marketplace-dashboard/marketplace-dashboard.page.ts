import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatCardComponent } from '../../../../shared/ui/stat-card/driveos-stat-card.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { MarketplaceDashboard, MarketplaceDashboardAlert } from '../../models/marketplace-dashboard.model';

@Component({
  selector: 'driveos-marketplace-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsFormAlertComponent,
    DriveOsPageHeaderComponent,
    DriveOsSpinnerComponent,
    DriveOsStatCardComponent,
  ],
  templateUrl: './marketplace-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceDashboardPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);

  readonly dashboard = signal<MarketplaceDashboard | null>(null);
  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');

  constructor() {
    this.load();
  }

  load(): void {
    const organizationId = this.organizationId();
    if (!organizationId) {
      this.loading.set(false);
      this.errors.set([this.translate.instant('professionalMarketplace.dashboard.missingOrganization')]);
      return;
    }

    this.loading.set(true);
    this.errors.set([]);
    this.api.getOrganizationDashboard(organizationId).subscribe({
      next: (dashboard) => {
        this.dashboard.set(dashboard);
        this.loading.set(false);
      },
      error: (error) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  alertMessage(alert: MarketplaceDashboardAlert): string {
    const translated = this.translate.instant(alert.messageKey);
    return translated === alert.messageKey
      ? this.translate.instant('professionalMarketplace.dashboard.alerts.fallback', { code: alert.code })
      : translated;
  }

  alertTone(severity: string): 'danger' | 'warning' | 'info' {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'danger':
      case 'error':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  formatPercent(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1)} %`;
  }

  formatHours(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1)} h`;
  }

  formatMoney(value: number | null, currency: string | null): string {
    if (value === null) return '—';
    try {
      return new Intl.NumberFormat(this.translate.currentLang() || 'fr', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency ?? ''}`.trim();
    }
  }
}
