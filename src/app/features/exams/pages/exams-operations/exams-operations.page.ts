import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { ExamsApiService } from '../../data-access/exams-api.service';
import { EXAMS_PERMISSIONS } from '../../domain/exams-permissions';
import {
  ExamAttempt,
  ExamConvocation,
  ExamOperationalPlan,
  ExamOperationalPlanningOptions,
  ExamPreparation,
  ExamResourceAssignment,
} from '../../models/exams.models';

type OperationsTab = 'preparation' | 'convocation' | 'resources' | 'attempt';
type DrawerKind =
  | 'preparation'
  | 'convocationReceive'
  | 'meeting'
  | 'operationalPlan'
  | 'resources'
  | 'attemptReason'
  | 'attemptNote'
  | 'attemptIncident'
  | 'attemptLocation'
  | 'attemptResourceChange'
  | null;

@Component({
  selector: 'driveos-exams-operations-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
  ],
  templateUrl: './exams-operations.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsOperationsPage {
  private readonly api = inject(ExamsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);

  registrationId = '';
  readonly activeTab = signal<OperationsTab>('preparation');
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly messages = signal<readonly string[]>([]);
  readonly preparation = signal<ExamPreparation | null>(null);
  readonly convocation = signal<ExamConvocation | null>(null);
  readonly operationalPlan = signal<ExamOperationalPlan | null>(null);
  readonly options = signal<ExamOperationalPlanningOptions | null>(null);
  readonly assignment = signal<ExamResourceAssignment | null>(null);
  readonly attempt = signal<ExamAttempt | null>(null);
  readonly drawer = signal<DrawerKind>(null);

  meetingPointConfirmed = false;
  vehicleEnergyConfirmed = false;
  instructorConfirmed = false;
  instructionsTransmitted = false;
  reminderOffsets = '7,3,1';
  meetingAtLocal = '';
  meetingInstructions = '';
  deliveryChannel = 'Email';
  convocationForm = {
    examCenterId: '',
    scheduledStartLocal: '',
    scheduledEndLocal: '',
    providerCode: '',
    officialReference: '',
    candidateReference: '',
    instructions: '',
    requiredDocuments: '',
    providerPayloadReference: '',
  };
  departureBranchId = '';
  beforeMinutes = 15;
  afterMinutes = 30;
  instructorRequired = true;
  vehicleRequired = true;
  operationalInstructions = '';
  instructorCalendarResourceId = '';
  vehicleCalendarResourceId = '';
  trainingCategory = 'B';
  transmissionType = 'Manual';
  dualControlRequired = true;
  energyType = '';
  requiredAdaptations = '';
  attemptReasonCode = '';
  attemptNotes = '';
  attemptNote = '';
  pendingAttemptAction = '';
  incidentCode = '';
  incidentDescription = '';
  latitude: number | null = null;
  longitude: number | null = null;
  accuracyMeters: number | null = null;
  locationPurpose = 'ExamCenter';
  resourceChangeReason = '';

  readonly canManagePreparation = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.preparation.manage),
  );
  readonly canUpdateRegistration = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.registrations.update),
  );
  readonly canManageAttempt = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.attempts.manage),
  );

  load(): void {
    const id = this.registrationId.trim();
    if (!id) return;
    this.loading.set(true);
    this.messages.set([]);
    let remaining = 5;
    const done = () => {
      remaining--;
      if (remaining === 0) this.loading.set(false);
    };
    this.api.getPreparation(id).subscribe({
      next: (v) => {
        this.preparation.set(v);
        this.meetingPointConfirmed = v.meetingPointConfirmed;
        this.vehicleEnergyConfirmed = v.vehicleEnergyConfirmed;
        this.instructorConfirmed = v.instructorConfirmed;
        this.instructionsTransmitted = v.instructionsTransmitted;
        this.reminderOffsets = v.reminderOffsetsDays.join(',');
        done();
      },
      error: (e) => {
        this.handleOptional(e);
        done();
      },
    });
    this.api.getConvocation(id).subscribe({
      next: (v) => {
        this.convocation.set(v);
        this.meetingAtLocal = this.toLocalInput(v.internalMeetingAtUtc);
        this.meetingInstructions = v.internalMeetingInstructions ?? '';
        done();
      },
      error: (e) => {
        this.handleOptional(e);
        done();
      },
    });
    this.api.getOperationalPlan(id).subscribe({
      next: (v) => {
        this.operationalPlan.set(v);
        this.beforeMinutes = v.travelBufferBeforeMinutes;
        this.afterMinutes = v.travelBufferAfterMinutes;
        this.departureBranchId = v.departureBranchId ?? '';
        this.instructorRequired = v.instructorRequired;
        this.vehicleRequired = v.vehicleRequired;
        this.operationalInstructions = v.meetingInstructions ?? '';
        done();
      },
      error: (e) => {
        this.handleOptional(e);
        done();
      },
    });
    this.api.getResourceAssignment(id).subscribe({
      next: (v) => {
        this.assignment.set(v);
        this.instructorCalendarResourceId = v.instructorCalendarResourceId ?? '';
        this.vehicleCalendarResourceId = v.vehicleCalendarResourceId ?? '';
        done();
      },
      error: (e) => {
        this.handleOptional(e);
        done();
      },
    });
    this.api.getAttempt(id).subscribe({
      next: (v) => {
        this.attempt.set(v);
        done();
      },
      error: (e) => {
        this.handleOptional(e);
        done();
      },
    });
  }

  savePreparation(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () =>
        this.api.refreshPreparation(id, {
          meetingPointConfirmed: this.meetingPointConfirmed,
          vehicleEnergyConfirmed: this.vehicleEnergyConfirmed,
          instructorConfirmed: this.instructorConfirmed,
          instructionsTransmitted: this.instructionsTransmitted,
          reminderOffsetsDays: this.parseNumbers(this.reminderOffsets),
          operationId: crypto.randomUUID(),
        }),
      (v) => {
        this.preparation.set(v);
        this.drawer.set(null);
      },
    );
  }
  confirmPreparation(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () => this.api.confirmPreparation(id),
      (v) => this.preparation.set(v),
    );
  }

  receiveConvocation(): void {
    const id = this.id();
    if (!id) return;
    const f = this.convocationForm;
    this.run(
      () =>
        this.api.receiveConvocation(id, {
          examCenterId: f.examCenterId.trim(),
          scheduledStartUtc: new Date(f.scheduledStartLocal).toISOString(),
          scheduledEndUtc: new Date(f.scheduledEndLocal).toISOString(),
          providerCode: f.providerCode.trim(),
          officialReference: f.officialReference.trim() || null,
          candidateReference: f.candidateReference.trim() || null,
          instructions: f.instructions.trim() || null,
          requiredDocuments: f.requiredDocuments.trim() || null,
          providerPayloadReference: f.providerPayloadReference.trim() || null,
          operationId: crypto.randomUUID(),
        }),
      (v) => {
        this.convocation.set(v);
        this.drawer.set(null);
      },
    );
  }
  submitIncident(): void {
    const id = this.id();
    if (!id || !this.incidentCode.trim() || !this.incidentDescription.trim()) return;
    this.run(
      () =>
        this.api.examAttemptOperation(id, 'incident', {
          incidentCode: this.incidentCode.trim(),
          description: this.incidentDescription.trim(),
          occurredAtUtc: new Date().toISOString(),
        }),
      (v) => {
        this.attempt.set(v);
        this.drawer.set(null);
      },
    );
  }
  submitLocation(): void {
    const id = this.id();
    if (!id || this.latitude == null || this.longitude == null) return;
    this.run(
      () =>
        this.api.examAttemptOperation(id, 'location', {
          latitude: this.latitude,
          longitude: this.longitude,
          accuracyMeters: this.accuracyMeters,
          purpose: this.locationPurpose.trim(),
          occurredAtUtc: new Date().toISOString(),
        }),
      (v) => {
        this.attempt.set(v);
        this.drawer.set(null);
      },
    );
  }
  submitResourceChange(): void {
    const id = this.id();
    if (!id || !this.resourceChangeReason.trim()) return;
    this.run(
      () =>
        this.api.examAttemptOperation(id, 'resource-change', {
          reason: this.resourceChangeReason.trim(),
          occurredAtUtc: new Date().toISOString(),
        }),
      (v) => {
        this.attempt.set(v);
        this.drawer.set(null);
      },
    );
  }
  saveMeeting(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () =>
        this.api.setConvocationMeeting(id, {
          meetingAtUtc: this.toUtc(this.meetingAtLocal),
          instructions: this.meetingInstructions.trim() || null,
        }),
      (v) => {
        this.convocation.set(v);
        this.drawer.set(null);
      },
    );
  }
  markDelivered(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () => this.api.markConvocationDelivered(id, this.deliveryChannel),
      (v) => this.convocation.set(v),
    );
  }
  acknowledge(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () => this.api.acknowledgeConvocation(id),
      (v) => this.convocation.set(v),
    );
  }
  loadOptions(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () =>
        this.api.getOperationalOptions(id, {
          departureBranchId: this.departureBranchId.trim() || undefined,
          meetingAtUtc: this.toUtc(this.meetingAtLocal) ?? undefined,
          beforeMinutes: this.beforeMinutes,
          afterMinutes: this.afterMinutes,
        }),
      (v) => this.options.set(v),
    );
  }
  saveOperationalPlan(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () =>
        this.api.refreshOperationalPlan(id, {
          meetingAtUtc: this.toUtc(this.meetingAtLocal),
          travelBufferBeforeMinutes: this.beforeMinutes,
          travelBufferAfterMinutes: this.afterMinutes,
          departureBranchId: this.departureBranchId.trim() || null,
          instructorRequired: this.instructorRequired,
          vehicleRequired: this.vehicleRequired,
          meetingInstructions: this.operationalInstructions.trim() || null,
        }),
      (v) => {
        this.operationalPlan.set(v);
        this.drawer.set(null);
        this.loadOptions();
      },
    );
  }
  assignResources(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () =>
        this.api.assignResources(id, {
          instructorCalendarResourceId: this.instructorCalendarResourceId.trim() || null,
          vehicleCalendarResourceId: this.vehicleCalendarResourceId.trim() || null,
          trainingCategory: this.trainingCategory.trim(),
          transmissionType: this.transmissionType.trim() || null,
          dualControlRequired: this.dualControlRequired,
          requiredAdaptations: this.requiredAdaptations
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          energyType: this.energyType.trim() || null,
          operationId: crypto.randomUUID(),
        }),
      (v) => {
        this.assignment.set(v);
        this.drawer.set(null);
      },
    );
  }
  createAttempt(): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () => this.api.createAttempt(id),
      (v) => this.attempt.set(v),
    );
  }
  performAttempt(action: string): void {
    const id = this.id();
    if (!id) return;
    this.run(
      () => this.api.examAttemptOperation(id, action, { occurredAtUtc: new Date().toISOString() }),
      (v) => this.attempt.set(v),
    );
  }
  openReason(action: string): void {
    this.pendingAttemptAction = action;
    this.attemptReasonCode = '';
    this.attemptNotes = '';
    this.drawer.set('attemptReason');
  }
  submitReason(): void {
    const id = this.id();
    if (!id || !this.pendingAttemptAction) return;
    const extra: Record<string, unknown> = {
      reasonCode: this.attemptReasonCode.trim(),
      notes: this.attemptNotes.trim() || null,
    };
    if (this.pendingAttemptAction === 'absent') extra['excused'] = false;
    this.run(
      () => this.api.examAttemptOperation(id, this.pendingAttemptAction, extra),
      (v) => {
        this.attempt.set(v);
        this.drawer.set(null);
      },
    );
  }
  submitNote(): void {
    const id = this.id();
    if (!id || !this.attemptNote.trim()) return;
    this.run(
      () =>
        this.api.examAttemptOperation(id, 'note', {
          note: this.attemptNote.trim(),
          occurredAtUtc: new Date().toISOString(),
        }),
      (v) => {
        this.attempt.set(v);
        this.attemptNote = '';
        this.drawer.set(null);
      },
    );
  }

  private id(): string | null {
    const id = this.registrationId.trim();
    return id || null;
  }
  private run<T>(request: () => Observable<T>, success: (value: T) => void): void {
    this.saving.set(true);
    this.messages.set([]);
    request().subscribe({
      next: (v) => {
        success(v);
        this.saving.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.messages.set(this.errors.getMessages(e));
        this.saving.set(false);
      },
    });
  }
  private handleOptional(e: HttpErrorResponse): void {
    if (e.status !== 404) this.messages.update((x) => [...x, ...this.errors.getMessages(e)]);
  }
  private parseNumbers(value: string): number[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((v) => Number(v.trim()))
          .filter((v) => Number.isInteger(v) && v >= 0),
      ),
    ];
  }
  private toUtc(value: string): string | null {
    return value ? new Date(value).toISOString() : null;
  }
  private toLocalInput(value: string | null): string {
    if (!value) return '';
    const d = new Date(value);
    const z = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
  }
}
