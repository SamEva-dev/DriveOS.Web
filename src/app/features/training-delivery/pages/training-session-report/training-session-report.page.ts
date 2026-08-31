import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import {
  TrainingSessionDetail,
  TrainingSessionNarrativeRevision,
  TrainingSessionReportReview,
} from '../../models/training-session-detail.models';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../domain/training-delivery-permissions';

interface LocalReportDraft {
  readonly sessionId: string;
  readonly currentStep: number;
  readonly serverVersion: number;
  readonly summary: string;
  readonly objectivesWorked: string;
  readonly objectivesAchieved: string;
  readonly nextObjective: string;
  readonly sharedComment: string;
  readonly internalNote: string;
  readonly savedAtUtc: string;
  readonly pendingSync: boolean;
}

@Component({
  selector: 'driveos-training-session-report-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsSpinnerComponent,
    DriveOsDrawerComponent,
  ],
  templateUrl: './training-session-report.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingSessionReportPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private saveTimer: number | null = null;

  readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  private readonly requestedStep = Number(this.route.snapshot.queryParamMap.get('step') ?? 0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly online = signal(navigator.onLine);
  readonly errors = signal<readonly string[]>([]);
  readonly session = signal<TrainingSessionDetail | null>(null);
  readonly step = signal(1);
  readonly serverVersion = signal(0);
  readonly lastSavedAtUtc = signal<string | null>(null);
  readonly pendingSync = signal(false);
  readonly review = signal<TrainingSessionReportReview | null>(null);
  readonly reviewing = signal(false);
  readonly submitting = signal(false);
  readonly submitDrawerOpen = signal(false);
  readonly requestSupervisorReview = signal(false);
  readonly canCreateSharedComment = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.narratives.createShared),
  );
  readonly canCreateInternalNote = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.narratives.createInternal),
  );
  readonly canReadInternalNote = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.narratives.readInternal),
  );
  readonly canReadReports = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.read),
  );
  readonly canWriteReports = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.write),
  );
  readonly canSubmitReports = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.submit),
  );
  readonly canRequestReview = computed(() =>
    this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.requestReview),
  );
  readonly reportLocked = computed(() => [2, 3, 4].includes(this.session()?.report?.status ?? 0));

  readonly summary = signal('');
  readonly objectivesWorked = signal('');
  readonly objectivesAchieved = signal('');
  readonly nextObjective = signal('');
  readonly sharedComment = signal('');
  readonly internalNote = signal('');
  readonly internalNoteHistory = signal<readonly TrainingSessionNarrativeRevision[]>([]);

  readonly steps = [
    'summary',
    'attendance',
    'competencies',
    'observations',
    'safety',
    'nextObjectives',
    'vehicle',
    'sharedComment',
    'validation',
  ] as const;
  readonly progress = computed(() => Math.round((this.step() / this.steps.length) * 100));
  readonly currentStepKey = computed(() => this.steps[this.step() - 1]);
  readonly canGoBack = computed(() => this.step() > 1);
  readonly canGoNext = computed(() => this.step() < this.steps.length);

  private readonly onOnline = () => {
    this.online.set(true);
    if (this.pendingSync()) this.save(false);
  };
  private readonly onOffline = () => this.online.set(false);
  private readonly onVisibility = () => {
    if (document.visibilityState === 'hidden') this.save(true);
  };

  constructor() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.load();
  }

  ngOnDestroy(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.persistLocal(true);
  }

  backToSession(): void {
    void this.router.navigate(['/training/sessions', this.sessionId], {
      queryParams: { tab: 'report' },
    });
  }
  openRevision(): void {
    void this.router.navigate(['/training/sessions', this.sessionId, 'report', 'revision']);
  }

  previous(): void {
    if (!this.canGoBack()) return;
    this.save(true);
    this.step.update((value) => value - 1);
    this.persistLocal(this.pendingSync());
  }

  next(): void {
    if (!this.canGoNext()) return;
    this.save(true);
    this.step.update((value) => value + 1);
    this.persistLocal(this.pendingSync());
    if (this.step() === 9) this.refreshReview();
  }

  fieldChanged(): void {
    if (this.reportLocked() || !this.canWriteReports()) return;
    this.persistLocal(true);
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.save(false), 700);
  }

  save(localOnly: boolean): void {
    if (this.reportLocked() || !this.canWriteReports()) return;
    this.persistLocal(true);
    if (localOnly || !this.online() || this.saving()) return;

    this.saving.set(true);
    this.errors.set([]);
    this.api
      .saveReportDraft(this.sessionId, {
        operationId: crypto.randomUUID(),
        expectedVersion: this.serverVersion(),
        lastCompletedStep: this.step(),
        summary: this.nullIfEmpty(this.summary()),
        objectivesWorked: this.nullIfEmpty(this.objectivesWorked()),
        objectivesAchieved: this.nullIfEmpty(this.objectivesAchieved()),
        nextObjective: this.nullIfEmpty(this.nextObjective()),
        sharedComment: this.canCreateSharedComment()
          ? this.nullIfEmpty(this.sharedComment())
          : null,
        internalNote: this.canCreateInternalNote() ? this.nullIfEmpty(this.internalNote()) : null,
      })
      .subscribe({
        next: (session) => {
          this.session.set(session);
          this.serverVersion.set(session.report?.version ?? this.serverVersion());
          this.lastSavedAtUtc.set(session.report?.lastSavedAtUtc ?? new Date().toISOString());
          this.pendingSync.set(false);
          this.persistLocal(false);
          this.saving.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.apiErrors.getMessages(error));
          this.pendingSync.set(true);
          this.persistLocal(true);
          this.saving.set(false);
        },
      });
  }

  refreshReview(): void {
    if (!this.canReadReports() || !this.sessionId) return;
    this.reviewing.set(true);
    this.api.getReportReview(this.sessionId).subscribe({
      next: (review) => {
        this.review.set(review);
        this.serverVersion.set(review.serverVersion);
        this.reviewing.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.reviewing.set(false);
      },
    });
  }

  prepareSubmission(requestReview: boolean): void {
    if (!this.canSubmitReports()) return;
    this.requestSupervisorReview.set(requestReview);
    this.refreshReview();
    this.submitDrawerOpen.set(true);
  }

  confirmSubmission(): void {
    const review = this.review();
    if (!review?.canSubmit || this.submitting()) return;
    this.submitting.set(true);
    this.errors.set([]);
    const afterReady = () =>
      this.api
        .submitReport(this.sessionId, this.serverVersion(), this.requestSupervisorReview())
        .subscribe({
          next: (session) => {
            this.session.set(session);
            this.serverVersion.set(session.report?.version ?? this.serverVersion());
            this.pendingSync.set(false);
            this.submitDrawerOpen.set(false);
            this.submitting.set(false);
            this.clearLocal();
            this.refreshReview();
          },
          error: (error: HttpErrorResponse) => {
            this.errors.set(this.apiErrors.getMessages(error));
            this.submitting.set(false);
            this.refreshReview();
          },
        });

    if (review.reportStatus === 1) {
      afterReady();
      return;
    }
    this.api.markReportReady(this.sessionId, this.serverVersion()).subscribe({
      next: (session) => {
        this.session.set(session);
        this.serverVersion.set(session.report?.version ?? this.serverVersion());
        afterReady();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.submitting.set(false);
        this.refreshReview();
      },
    });
  }

  private load(): void {
    const local = this.readLocal();
    if (local) this.applyLocal(local);
    this.api.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        const report = session.report;
        if (report && (!local || (!local.pendingSync && report.version >= local.serverVersion))) {
          this.serverVersion.set(report.version);
          this.step.set(Math.max(1, Math.min(9, report.lastCompletedStep || 1)));
          this.summary.set(report.summary ?? '');
          this.objectivesWorked.set(report.objectivesWorked ?? '');
          this.objectivesAchieved.set(report.objectivesAchieved ?? '');
          this.nextObjective.set(report.nextObjective ?? '');
          this.sharedComment.set(report.sharedComment ?? '');
          this.internalNote.set('');
          if (this.canReadInternalNote()) {
            this.api.getInternalNote(this.sessionId).subscribe({
              next: (note) => {
                this.internalNote.set(note.internalNote ?? '');
                this.internalNoteHistory.set(note.history);
              },
              error: () => {
                this.internalNote.set('');
                this.internalNoteHistory.set([]);
              },
            });
          }
          this.lastSavedAtUtc.set(report.lastSavedAtUtc);
          this.pendingSync.set(false);
          this.persistLocal(false);
        } else if (!report && !local) {
          this.objectivesWorked.set(session.objectives ?? '');
        }
        if (this.requestedStep >= 1 && this.requestedStep <= 9 && !this.reportLocked()) {
          this.step.set(this.requestedStep);
        }
        this.loading.set(false);
        if (this.step() === 9) this.refreshReview();
        if (local?.pendingSync && this.online() && !this.reportLocked()) this.save(false);
      },
      error: (error: HttpErrorResponse) => {
        if (!local) this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  private persistLocal(pendingSync: boolean): void {
    const draft: LocalReportDraft = {
      sessionId: this.sessionId,
      currentStep: this.step(),
      serverVersion: this.serverVersion(),
      summary: this.summary(),
      objectivesWorked: this.objectivesWorked(),
      objectivesAchieved: this.objectivesAchieved(),
      nextObjective: this.nextObjective(),
      sharedComment: this.sharedComment(),
      internalNote: this.internalNote(),
      savedAtUtc: new Date().toISOString(),
      pendingSync,
    };
    localStorage.setItem(this.storageKey(), JSON.stringify(draft));
    this.lastSavedAtUtc.set(draft.savedAtUtc);
    this.pendingSync.set(pendingSync);
  }

  private readLocal(): LocalReportDraft | null {
    try {
      const raw = localStorage.getItem(this.storageKey());
      return raw ? (JSON.parse(raw) as LocalReportDraft) : null;
    } catch {
      return null;
    }
  }

  private applyLocal(local: LocalReportDraft): void {
    this.step.set(Math.max(1, Math.min(9, local.currentStep)));
    this.serverVersion.set(local.serverVersion);
    this.summary.set(local.summary);
    this.objectivesWorked.set(local.objectivesWorked);
    this.objectivesAchieved.set(local.objectivesAchieved);
    this.nextObjective.set(local.nextObjective);
    this.sharedComment.set(local.sharedComment);
    this.internalNote.set(local.internalNote);
    this.lastSavedAtUtc.set(local.savedAtUtc);
    this.pendingSync.set(local.pendingSync);
  }

  private clearLocal(): void {
    localStorage.removeItem(this.storageKey());
    this.pendingSync.set(false);
  }

  private storageKey(): string {
    return `driveos.training.reportDraft.${this.sessionId}`;
  }
  private nullIfEmpty(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }
}
