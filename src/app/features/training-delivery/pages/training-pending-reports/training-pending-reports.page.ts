import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../domain/training-delivery-permissions';
import {
  TrainingDeliveryPendingReportItem,
  TrainingDeliveryPendingReportsResponse,
} from '../../models/training-delivery.models';

type PendingReportCategory =
  'all' | 'drafts' | 'complete' | 'sync' | 'correct' | 'validate' | 'overdue';

interface LocalReportDraftSnapshot {
  readonly sessionId: string;
  readonly currentStep: number;
  readonly pendingSync: boolean;
  readonly savedAtUtc: string;
}

@Component({
  selector: 'driveos-training-pending-reports-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './training-pending-reports.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingPendingReportsPage {
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly data = signal<TrainingDeliveryPendingReportsResponse | null>(null);
  readonly category = signal<PendingReportCategory>('all');
  readonly mineOnly = signal(false);
  readonly selected = signal<TrainingDeliveryPendingReportItem | null>(null);
  readonly detailsOpen = signal(false);
  readonly canMonitorAll = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.monitor),
  );
  readonly canSubmit = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.submit),
  );
  readonly localDrafts = signal<ReadonlyMap<string, LocalReportDraftSnapshot>>(new Map());

  readonly items = computed(() => {
    const local = this.localDrafts();
    return (this.data()?.items ?? []).filter((item) => {
      switch (this.category()) {
        case 'drafts':
          return item.reportStatus === 0;
        case 'complete':
          return item.reportStatus < 0 || (item.reportStatus === 0 && item.completionPercent < 100);
        case 'sync':
          return local.get(item.sessionId)?.pendingSync === true;
        case 'correct':
          return item.isRejectedForCorrection;
        case 'validate':
          return item.isWaitingForValidation;
        case 'overdue':
          return item.isOverdue;
        default:
          return true;
      }
    });
  });

  constructor() {
    this.mineOnly.set(!this.canMonitorAll());
    this.refreshLocalDrafts();
    this.load();
  }

  setCategory(category: PendingReportCategory): void {
    this.category.set(category);
  }
  setMineOnly(value: boolean): void {
    if (this.canMonitorAll()) {
      this.mineOnly.set(value);
      this.load();
    }
  }
  openDetails(item: TrainingDeliveryPendingReportItem): void {
    this.selected.set(item);
    this.detailsOpen.set(true);
  }
  closeDetails(): void {
    this.detailsOpen.set(false);
    this.selected.set(null);
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    this.refreshLocalDrafts();
    this.api.getPendingReports(this.mineOnly()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  resume(item: TrainingDeliveryPendingReportItem): void {
    void this.router.navigate(['/training/sessions', item.sessionId, 'report'], {
      queryParams: { step: this.resumeStep(item) },
    });
  }

  openSession(item: TrainingDeliveryPendingReportItem): void {
    void this.router.navigate(['/training/sessions', item.sessionId], {
      queryParams: { tab: 'report' },
    });
  }

  sync(item: TrainingDeliveryPendingReportItem): void {
    this.resume(item);
  }

  resumeStep(item: TrainingDeliveryPendingReportItem): number {
    const local = this.localDrafts().get(item.sessionId);
    return Math.max(1, Math.min(9, local?.currentStep ?? item.resumeStep));
  }

  isSyncPending(item: TrainingDeliveryPendingReportItem): boolean {
    return this.localDrafts().get(item.sessionId)?.pendingSync === true;
  }
  statusKey(item: TrainingDeliveryPendingReportItem): string {
    return item.reportStatus < 0
      ? 'training.pendingReports.status.missing'
      : `training.reportWorkflow.status.${item.reportStatus}`;
  }
  dueKey(item: TrainingDeliveryPendingReportItem): string {
    return item.isOverdue
      ? 'training.pendingReports.due.overdue'
      : 'training.pendingReports.due.upcoming';
  }

  private refreshLocalDrafts(): void {
    const snapshots = new Map<string, LocalReportDraftSnapshot>();
    const prefix = 'driveos.training.reportDraft.';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      try {
        const value = JSON.parse(
          localStorage.getItem(key) ?? 'null',
        ) as LocalReportDraftSnapshot | null;
        if (value?.sessionId) snapshots.set(value.sessionId, value);
      } catch {
        /* Ignore corrupted local cache. */
      }
    }
    this.localDrafts.set(snapshots);
  }
}
