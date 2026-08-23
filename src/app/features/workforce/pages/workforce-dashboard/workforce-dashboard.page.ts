import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatCardComponent } from '../../../../shared/ui/stat-card/driveos-stat-card.component';
import { WorkforceApiService } from '../../data-access/workforce-api.service';
import { WorkforceDashboard, WorkforceDashboardAlert } from '../../models/workforce.models';

@Component({
  selector: 'driveos-workforce-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsFormAlertComponent,
    DriveOsPageHeaderComponent,
    DriveOsSpinnerComponent,
    DriveOsStatCardComponent,
  ],
  templateUrl: './workforce-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkforceDashboardPage {
  private readonly api = inject(WorkforceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);

  readonly dashboard = signal<WorkforceDashboard | null>(null);
  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    this.api.getDashboard(30).subscribe({
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

  alertMessage(alert: WorkforceDashboardAlert): string {
    return this.translate.instant(alert.messageKey, alert.parameters ?? {});
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
}
