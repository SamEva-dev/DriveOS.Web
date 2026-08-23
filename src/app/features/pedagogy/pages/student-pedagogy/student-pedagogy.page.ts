import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PedagogyApiService } from '../../data-access/pedagogy-api.service';
import {
  ProgressionCompetency,
  StudentPedagogyOverview,
  StudentRegulatoryTrainingRecordOverview,
} from '../../models/student-pedagogy-overview.models';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import {
  DriveOsStatusBadgeComponent,
  DriveOsStatusTone,
} from '../../../../shared/ui/status-badge/driveos-status-badge.component';

type PedagogySection =
  'overview' | 'competencies' | 'history' | 'reviews' | 'remediation' | 'readiness';

@Component({
  selector: 'driveos-student-pedagogy-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    DriveOsStatusBadgeComponent,
  ],
  templateUrl: './student-pedagogy.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentPedagogyPage {
  private readonly api = inject(PedagogyApiService);
  private readonly route = inject(ActivatedRoute);
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly data = signal<StudentPedagogyOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly regulatoryRecord = signal<StudentRegulatoryTrainingRecordOverview | null>(null);
  readonly regulatoryLoading = signal(false);
  readonly regulatoryError = signal(false);
  readonly section = signal<PedagogySection>('overview');
  readonly sections: readonly PedagogySection[] = [
    'overview',
    'competencies',
    'history',
    'reviews',
    'remediation',
    'readiness',
  ];
  readonly requiredPending = computed(() => {
    const p = this.data()?.progression;
    return p ? Math.max(0, p.requiredCompetencies - p.assessedRequiredCompetencies) : 0;
  });

  constructor() {
    this.load();
  }

  load(trainingPathId?: string | null): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getStudentPedagogyOverview(this.studentId, trainingPathId).subscribe({
      next: (value) => {
        this.data.set(value);
        this.loading.set(false);
        this.loadRegulatoryRecord(value.selectedTrainingPathId);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  changeTrainingPath(trainingPathId: string): void {
    if (trainingPathId) this.load(trainingPathId);
  }

  private loadRegulatoryRecord(trainingPathId?: string | null): void {
    this.regulatoryRecord.set(null);
    this.regulatoryError.set(false);

    if (this.data()?.trainingPath?.countryCode?.toUpperCase() !== 'FR') {
      this.regulatoryLoading.set(false);
      return;
    }

    this.regulatoryLoading.set(true);
    this.api.getStudentRegulatoryTrainingRecordOverview(this.studentId, trainingPathId).subscribe({
      next: (value) => {
        this.regulatoryRecord.set(value);
        this.regulatoryLoading.set(false);
      },
      error: () => {
        this.regulatoryError.set(true);
        this.regulatoryLoading.set(false);
      },
    });
  }

  regulatoryTone(status?: string | null): DriveOsStatusTone {
    const value = (status ?? '').toLowerCase();
    if (value === 'accepted') return 'success';
    if (['rejected', 'failed'].includes(value)) return 'danger';
    if (['waitingfordata', 'pending', 'processing', 'retrypending'].includes(value)) return 'warning';
    return 'neutral';
  }

  regulatoryStatusKey(status?: string | null): string {
    return status
      ? `pedagogy.student.regulatoryRecord.status.${status}`
      : 'pedagogy.student.regulatoryRecord.status.notStarted';
  }

  regulatoryIssueKey(code: string): string {
    return `pedagogy.student.regulatoryRecord.issues.${code}`;
  }

  statusTone(status: string): DriveOsStatusTone {
    const value = (status ?? '').toLowerCase();
    if (['active', 'completed', 'ready', 'published'].includes(value)) return 'success';
    if (['cancelled', 'blocked', 'notready'].includes(value)) return 'danger';
    if (['suspended', 'readywithconditions', 'inprogress', 'requested', 'draft'].includes(value))
      return 'warning';
    return 'neutral';
  }

  alertTone(severity: string): 'info' | 'warning' | 'danger' {
    const value = (severity ?? '').toLowerCase();
    if (value === 'danger' || value === 'error') return 'danger';
    return value === 'warning' ? 'warning' : 'info';
  }

  alertTranslationKey(code: string): string {
    return `pedagogy.student.alerts.${code.replace('Pedagogy.', '')}`;
  }

  competencyLevelKey(item: ProgressionCompetency): string {
    return item.currentLevelCode
      ? `pedagogy.student.levels.${item.currentLevelCode}`
      : 'pedagogy.student.levels.notAssessed';
  }
}
