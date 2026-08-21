import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { StudentsApiService } from '../../../students/data-access/students-api.service';
import { PedagogyApiService } from '../../../pedagogy/data-access/pedagogy-api.service';
import { ProgressionCompetency } from '../../../pedagogy/models/student-pedagogy-overview.models';
import { StudentIdentity, StudentStatuses } from '../../../students/models/student.models';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import { TrainingIncidentDetail, TrainingSessionDetail, TrainingSessionPreparation } from '../../models/training-session-detail.models';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../domain/training-delivery-permissions';

type SessionDetailTab = 'summary' | 'participants' | 'preparation' | 'attendance' | 'execution' | 'report' | 'incidents' | 'history';
type DrawerKind = 'technical' | 'incident' | 'preparation' | 'prestartCheck' | 'start' | 'quickObservation' | 'marker' | 'quickIntervention' | 'interrupt' | 'reportIncident' | 'finish' | 'attendanceCorrection' | 'vehicleUsage';

@Component({
  selector: 'driveos-training-session-detail-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, TranslatePipe, DriveOsButtonComponent, DriveOsDrawerComponent, DriveOsEmptyStateComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './training-session-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingSessionDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly students = inject(StudentsApiService);
  private readonly pedagogy = inject(PedagogyApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);

  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly session = signal<TrainingSessionDetail | null>(null);
  readonly incidents = signal<readonly TrainingIncidentDetail[]>([]);
  readonly studentDisplayName = signal('');
  readonly studentIdentity = signal<StudentIdentity | null>(null);
  readonly studentStatuses = signal<StudentStatuses | null>(null);
  readonly activeTab = signal<SessionDetailTab>('summary');
  readonly drawer = signal<DrawerKind | null>(null);
  readonly selectedIncident = signal<TrainingIncidentDetail | null>(null);
  readonly preparation = signal<TrainingSessionPreparation | null>(null);
  readonly preparing = signal(false);
  readonly preparationErrors = signal<readonly string[]>([]);
  readonly starting = signal(false);
  readonly startErrors = signal<readonly string[]>([]);
  readonly now = signal(Date.now());
  readonly executionSaving = signal(false);
  readonly executionErrors = signal<readonly string[]>([]);
  readonly observationType = signal(5);
  readonly observationContent = signal('');
  readonly observationInternal = signal(false);
  readonly markerType = signal(3);
  readonly markerSeverity = signal(2);
  readonly markerCompetencyId = signal<string | null>(null);
  readonly markerShortNote = signal('');
  readonly markerUseLocation = signal(false);
  readonly markerLatitude = signal<number | null>(null);
  readonly markerLongitude = signal<number | null>(null);
  readonly markerCompetencies = signal<readonly ProgressionCompetency[]>([]);
  readonly markerCompetenciesLoading = signal(false);
  readonly interventionType = signal(1);
  readonly interventionSeverity = signal(2);
  readonly interventionContext = signal('');
  readonly interventionReason = signal('');
  readonly interventionCompetencyId = signal<string | null>(null);
  readonly interventionOutcome = signal('');
  readonly interventionInternalComment = signal('');
  readonly interventionSharedExplanation = signal('');
  readonly interventionCreateIncident = signal(false);
  readonly interruptionReason = signal(9);
  readonly interruptionDescription = signal('');
  readonly incidentType = signal(1);
  readonly incidentSeverity = signal(2);
  readonly incidentDescription = signal('');
  readonly incidentImmediateActions = signal('');
  readonly finishSaving = signal(false);
  readonly finishErrors = signal<readonly string[]>([]);
  readonly finishMileage = signal<number | null>(null);
  readonly finishEnergyLevel = signal<number | null>(null);
  readonly finishVehicleIssue = signal(false);
  readonly finishVehicleIssueDescription = signal('');
  readonly finishVehicleIssueActions = signal('');
  readonly finishMode = signal<'now' | 'later'>('now');
  readonly attendanceSaving = signal(false);
  readonly attendanceErrors = signal<readonly string[]>([]);
  readonly attendanceStatus = signal(1);
  readonly attendanceArrivalLocal = signal('');
  readonly attendanceDepartureLocal = signal('');
  readonly attendanceReason = signal('');
  readonly attendanceOverrideReason = signal('');
  readonly attendanceUseOverride = signal(false);
  readonly vehicleUsageSaving = signal(false);
  readonly vehicleUsageErrors = signal<readonly string[]>([]);
  readonly vehicleMileage = signal<number | null>(null);
  readonly vehicleEnergyType = signal<1 | 2 | 3>(1);
  readonly vehicleEnergyLevel = signal<number | null>(null);
  readonly vehicleEnergyQuantity = signal<number | null>(null);
  readonly vehicleEnergyNote = signal('');
  readonly vehicleAnomaly = signal(false);
  readonly vehicleAnomalyDescription = signal('');
  private readonly clockHandle = window.setInterval(() => this.now.set(Date.now()), 30_000);

  readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  readonly plannedDurationMinutes = computed(() => {
    const s = this.session();
    if (!s) return 0;
    return Math.max(0, Math.round((new Date(s.plannedEndAtUtc).getTime() - new Date(s.plannedStartAtUtc).getTime()) / 60000));
  });
  readonly activeInterruption = computed(() => this.session()?.interruptions.some((x) => x.isActive) ?? false);
  readonly inProgress = computed(() => this.session()?.status === 3);
  readonly isInterrupted = computed(() => this.session()?.status === 6 || this.activeInterruption());
  readonly executionActive = computed(() => this.inProgress() || this.isInterrupted());
  readonly elapsedMinutes = computed(() => {
    const startedAt = this.session()?.actualStartAtUtc;
    if (!startedAt) return 0;
    const end = this.session()?.actualEndAtUtc ? new Date(this.session()!.actualEndAtUtc!).getTime() : this.now();
    return Math.max(0, Math.floor((end - new Date(startedAt).getTime()) / 60000));
  });
  readonly canRecordObservation = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.execution.observationRecord));
  readonly canRecordIntervention = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.execution.interventionRecord));
  readonly canInterrupt = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.execution.interrupt));
  readonly canResume = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.execution.resume));
  readonly canReportIncident = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.incidents.report));
  readonly canComplete = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.sessions.complete));
  readonly canRecordVehicleUsage = computed(() => this.authorization.hasPermission('TrainingDelivery.Execution.Odometer.Record'));
  readonly canCorrectAttendance = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.attendance.correct));
  readonly canOverrideAttendance = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.attendance.override));
  readonly attendanceDurationMinutes = computed(() => {
    const attendance = this.session()?.currentAttendance;
    if (!attendance?.actualArrivalAtUtc || !attendance.actualDepartureAtUtc) return null;
    return Math.max(0, Math.round((new Date(attendance.actualDepartureAtUtc).getTime() - new Date(attendance.actualArrivalAtUtc).getTime()) / 60000));
  });
  readonly plannedDurationDeltaMinutes = computed(() => {
    const delivered = this.session()?.deliveredDurationMinutes;
    return delivered === null || delivered === undefined ? null : delivered - this.plannedDurationMinutes();
  });
  readonly openIncidents = computed(() => this.incidents().filter((x) => x.status !== 5 && x.status !== 6));
  readonly canPrepare = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.sessions.prepare));
  readonly canStart = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.sessions.start));
  readonly startActionVisible = computed(() => {
    const status = this.session()?.status;
    return this.canStart() && (status === 1 || status === 2);
  });
  readonly startAuthoritativelyReady = computed(() => {
    const status = this.session()?.status;
    return status === 2 && (this.preparation()?.canStart ?? true);
  });
  readonly readinessPassedCount = computed(() => this.preparation()?.checks.filter((x) => x.status === 1).length ?? 0);
  readonly readinessBlockedCount = computed(() => this.preparation()?.checks.filter((x) => x.status === 2).length ?? 0);
  readonly readinessReviewCount = computed(() => this.preparation()?.checks.filter((x) => x.status === 3).length ?? 0);
  readonly studentIdentityVerified = computed(() => {
    const status = this.studentIdentity()?.verificationStatus;
    return status === 'DocumentVerified' || status === 'ExternallyVerified';
  });
  readonly studentEnrollmentActive = computed(() => this.session() !== null && this.studentStatuses()?.enrollmentStatus === 'Active');
  readonly studentSchedulingAllowed = computed(() => {
    const statuses = this.studentStatuses();
    if (!statuses) return false;
    return statuses.schedulingStatus !== 'Blocked'
      && !this.hasBlockingAction(statuses.currentlyBlockedActions, 'Schedule')
      && !this.hasBlockingAction(statuses.currentlyBlockedActions, 'StartLesson');
  });
  readonly studentHasBlockingRestriction = computed(() => {
    const statuses = this.studentStatuses();
    if (!statuses) return false;
    return statuses.blocks.some((block) =>
      block.status === 'Active'
      && (this.hasBlockingAction(block.blockingActions, 'Schedule') || this.hasBlockingAction(block.blockingActions, 'StartLesson')));
  });
  readonly vehicleAssigned = computed(() => !!this.session()?.vehicleId);
  readonly vehicleComplianceCheck = computed(() => this.preparation()?.checks.find((x) => x.code.toLowerCase().includes('fleet') || x.code.toLowerCase().includes('vehicle')) ?? null);
  readonly vehicleOperationallyValid = computed(() => {
    const check = this.vehicleComplianceCheck();
    return !this.vehicleAssigned() || check?.status === 1 || check?.status === 4;
  });
  readonly prestartAutomaticReady = computed(() =>
    this.studentIdentityVerified() &&
    this.studentEnrollmentActive() &&
    this.studentSchedulingAllowed() &&
    !this.studentHasBlockingRestriction() &&
    this.vehicleOperationallyValid() &&
    (this.preparation()?.canStart ?? false));

  readonly markerCount = computed(() => this.session()?.markers.length ?? 0);
  readonly historyCount = computed(() => {
    const s = this.session();
    if (!s) return 0;
    return s.attendanceHistory.length + s.interventions.length + s.observations.length + s.markers.length + s.interruptions.length + s.odometerReadings.length + s.energyEntries.length + s.competencyAssessments.length;
  });

  readonly tabs: readonly { key: SessionDetailTab; labelKey: string; icon: string }[] = [
    { key: 'summary', labelKey: 'training.sessionDetail.tabs.summary', icon: 'ph ph-squares-four' },
    { key: 'participants', labelKey: 'training.sessionDetail.tabs.participants', icon: 'ph ph-users-three' },
    { key: 'preparation', labelKey: 'training.sessionDetail.tabs.preparation', icon: 'ph ph-check-square-offset' },
    { key: 'attendance', labelKey: 'training.sessionDetail.tabs.attendance', icon: 'ph ph-user-check' },
    { key: 'execution', labelKey: 'training.sessionDetail.tabs.execution', icon: 'ph ph-steering-wheel' },
    { key: 'report', labelKey: 'training.sessionDetail.tabs.report', icon: 'ph ph-clipboard-text' },
    { key: 'incidents', labelKey: 'training.sessionDetail.tabs.incidents', icon: 'ph ph-warning-octagon' },
    { key: 'history', labelKey: 'training.sessionDetail.tabs.history', icon: 'ph ph-clock-counter-clockwise' },
  ];

  constructor() { this.load(); }

  ngOnDestroy(): void { window.clearInterval(this.clockHandle); }

  setTab(tab: SessionDetailTab): void { this.activeTab.set(tab); }
  back(): void { void this.router.navigate(['/training/sessions']); }
  openTechnical(): void { this.drawer.set('technical'); }
  openPreparation(): void { this.drawer.set('preparation'); }
  openPrestartCheck(): void { this.drawer.set('prestartCheck'); }
  openStart(): void {
    this.startErrors.set([]);
    this.drawer.set('start');
    if (this.canPrepare()) this.runPreparationCheck();
  }
  openIncident(incident: TrainingIncidentDetail): void { this.selectedIncident.set(incident); this.drawer.set('incident'); }
  openQuickObservation(): void { this.resetExecutionFeedback(); this.drawer.set('quickObservation'); }
  openVehicleUsage(): void {
    this.vehicleUsageErrors.set([]);
    this.vehicleMileage.set(this.session()?.latestOdometerKilometers ?? null);
    this.vehicleEnergyLevel.set(this.session()?.latestEnergyLevelPercent ?? this.session()?.endEnergyLevelPercent ?? null);
    this.vehicleEnergyQuantity.set(null);
    this.vehicleEnergyNote.set('');
    this.vehicleAnomaly.set(false);
    this.vehicleAnomalyDescription.set('');
    this.drawer.set('vehicleUsage');
  }
  openMarker(): void {
    this.resetExecutionFeedback();
    this.markerShortNote.set('');
    this.markerCompetencyId.set(null);
    this.markerUseLocation.set(false);
    this.markerLatitude.set(null);
    this.markerLongitude.set(null);
    this.drawer.set('marker');
    this.loadMarkerCompetencies();
  }
  openQuickIntervention(): void { this.resetExecutionFeedback(); this.drawer.set('quickIntervention'); }
  openInterrupt(): void { this.resetExecutionFeedback(); this.drawer.set('interrupt'); }
  openReportIncident(): void { this.resetExecutionFeedback(); this.drawer.set('reportIncident'); }
  openFinish(): void {
    if (!this.inProgress() || !this.canComplete()) return;
    this.finishErrors.set([]);
    this.finishMileage.set(this.session()?.latestOdometerKilometers ?? null);
    this.finishEnergyLevel.set(this.session()?.endEnergyLevelPercent ?? null);
    this.finishVehicleIssue.set(false);
    this.finishVehicleIssueDescription.set('');
    this.finishVehicleIssueActions.set('');
    this.finishMode.set('now');
    this.drawer.set('finish');
  }
  closeDrawer(): void { this.drawer.set(null); this.selectedIncident.set(null); this.resetExecutionFeedback(); }

  recordQuickObservation(): void {
    const content = this.observationContent().trim();
    if (!this.inProgress() || !this.canRecordObservation() || !content) return;
    this.executeSessionMutation(this.api.recordObservation(this.sessionId, {
      operationId: crypto.randomUUID(),
      type: this.observationType(),
      observedAtUtc: new Date().toISOString(),
      content,
      isInternal: this.observationInternal(),
    }), () => {
      this.observationContent.set('');
      this.observationInternal.set(false);
    });
  }

  recordMarker(): void {
    const note = this.markerShortNote().trim();
    if (!this.executionActive() || !this.canRecordObservation() || !note) return;
    const withLocation = this.markerUseLocation();
    this.executeSessionMutation(this.api.recordMarker(this.sessionId, {
      operationId: crypto.randomUUID(),
      type: this.markerType(),
      occurredAtUtc: new Date().toISOString(),
      competencyId: this.markerCompetencyId(),
      shortNote: note,
      severity: this.markerSeverity(),
      latitude: withLocation ? this.markerLatitude() : null,
      longitude: withLocation ? this.markerLongitude() : null,
      createdOffline: false,
    }), () => {
      this.markerShortNote.set('');
      this.markerCompetencyId.set(null);
      this.markerUseLocation.set(false);
      this.markerLatitude.set(null);
      this.markerLongitude.set(null);
    });
  }

  recordQuickIntervention(): void {
    const context = this.interventionContext().trim();
    const reason = this.interventionReason().trim();
    if (!this.inProgress() || !this.canRecordIntervention() || !context || !reason) return;
    const operationId = crypto.randomUUID();
    this.executionSaving.set(true);
    this.executionErrors.set([]);
    this.api.recordIntervention(this.sessionId, {
      operationId,
      type: this.interventionType(),
      severity: this.interventionSeverity(),
      occurredAtUtc: new Date().toISOString(),
      context,
      reason,
      relatedCompetencyId: this.interventionCompetencyId(),
      outcome: this.interventionOutcome().trim() || null,
      internalComment: this.interventionInternalComment().trim() || null,
      sharedExplanation: this.interventionSharedExplanation().trim() || null,
    }).subscribe({
      next: (session) => {
        this.session.set(session);
        const createIncident = this.interventionCreateIncident() && this.canReportIncident() && this.interventionSeverity() >= 3;
        if (!createIncident) { this.finishInterventionSave(); return; }
        this.api.reportIncident(this.sessionId, {
          operationId: crypto.randomUUID(), incidentType: 1, severity: this.interventionSeverity(), occurredAtUtc: new Date().toISOString(),
          description: `${context} — ${reason}`, immediateActions: this.interventionOutcome().trim() || reason, additionalParticipants: [],
        }).subscribe({
          next: (incident) => { this.incidents.update(items => [incident, ...items]); this.finishInterventionSave(); },
          error: (error: HttpErrorResponse) => { this.executionErrors.set(this.apiErrors.getMessages(error)); this.executionSaving.set(false); }
        });
      },
      error: (error: HttpErrorResponse) => { this.executionErrors.set(this.apiErrors.getMessages(error)); this.executionSaving.set(false); }
    });
  }

  private finishInterventionSave(): void {
    this.executionSaving.set(false);
    this.drawer.set(null);
    this.interventionContext.set(''); this.interventionReason.set(''); this.interventionCompetencyId.set(null);
    this.interventionOutcome.set(''); this.interventionInternalComment.set(''); this.interventionSharedExplanation.set(''); this.interventionCreateIncident.set(false);
  }

  interruptSession(): void {
    if (!this.inProgress() || !this.canInterrupt() || this.activeInterruption()) return;
    this.executeSessionMutation(this.api.interruptSession(this.sessionId, {
      operationId: crypto.randomUUID(),
      reason: this.interruptionReason(),
      description: this.interruptionDescription().trim() || null,
      interruptedAtUtc: new Date().toISOString(),
    }), () => this.interruptionDescription.set(''));
  }

  resumeSession(): void {
    if (!this.isInterrupted() || !this.canResume() || !this.activeInterruption()) return;
    this.executeSessionMutation(this.api.resumeSession(this.sessionId, {
      operationId: crypto.randomUUID(),
      resumedAtUtc: new Date().toISOString(),
    }));
  }

  reportQuickIncident(): void {
    const description = this.incidentDescription().trim();
    const immediateActions = this.incidentImmediateActions().trim();
    if (!this.inProgress() || !this.canReportIncident() || !description || !immediateActions) return;
    this.executionSaving.set(true);
    this.executionErrors.set([]);
    this.api.reportIncident(this.sessionId, {
      operationId: crypto.randomUUID(),
      incidentType: this.incidentType(),
      severity: this.incidentSeverity(),
      occurredAtUtc: new Date().toISOString(),
      description,
      immediateActions,
      additionalParticipants: [],
    }).subscribe({
      next: (incident) => {
        this.incidents.update((items) => [incident, ...items]);
        this.executionSaving.set(false);
        this.drawer.set(null);
        this.incidentDescription.set('');
        this.incidentImmediateActions.set('');
      },
      error: (error: HttpErrorResponse) => {
        this.executionErrors.set(this.apiErrors.getMessages(error));
        this.executionSaving.set(false);
      },
    });
  }



  setVehicleEnergyType(value: string | number): void {
    const type = Number(value);
    if (type === 1 || type === 2 || type === 3) {
      this.vehicleEnergyType.set(type);
    }
  }

  saveVehicleUsage(): void {
    const session = this.session();
    if (!session || this.vehicleUsageSaving()) return;
    const mileage = this.vehicleMileage();
    const level = this.vehicleEnergyLevel();
    const quantity = this.vehicleEnergyQuantity();
    const now = new Date().toISOString();
    const calls = [];
    if (mileage !== null && mileage !== session.latestOdometerKilometers) {
      if (session.latestOdometerKilometers !== null && mileage < session.latestOdometerKilometers) { this.vehicleUsageErrors.set(['errors.trainingDelivery.session.odometer.mustBeMonotonic']); return; }
      calls.push(this.api.recordOdometer(this.sessionId, { operationId: crypto.randomUUID(), odometerKilometers: mileage, source: 2, observedAtUtc: now }));
    }
    if (level !== null || (this.vehicleEnergyType() !== 1 && quantity !== null)) {
      calls.push(this.api.recordEnergy(this.sessionId, { operationId: crypto.randomUUID(), type: this.vehicleEnergyType(), energyLevelPercent: level, quantity: this.vehicleEnergyType() === 1 ? null : quantity, observedAtUtc: now, note: this.vehicleEnergyNote().trim() || null, createdOffline: !navigator.onLine }));
    }
    if (this.vehicleAnomaly() && this.vehicleAnomalyDescription().trim()) {
      calls.push(this.api.reportIncident(this.sessionId, { operationId: crypto.randomUUID(), incidentType: 4, severity: 2, occurredAtUtc: now, description: this.vehicleAnomalyDescription().trim(), immediateActions: this.vehicleEnergyNote().trim() || 'Vehicle anomaly recorded from SCR-SES-013', additionalParticipants: [] }));
    }
    if (!calls.length) { this.closeDrawer(); return; }
    this.vehicleUsageSaving.set(true);
    forkJoin(calls).subscribe({ next: () => { this.vehicleUsageSaving.set(false); this.closeDrawer(); this.load(); }, error: (error: HttpErrorResponse) => { this.vehicleUsageSaving.set(false); this.vehicleUsageErrors.set(this.apiErrors.getMessages(error)); } });
  }

  openAttendanceCorrection(): void {
    const attendance = this.session()?.currentAttendance;
    if (!attendance || (!this.canCorrectAttendance() && !this.canOverrideAttendance())) return;
    this.attendanceErrors.set([]);
    this.attendanceStatus.set(attendance.status);
    this.attendanceArrivalLocal.set(this.toLocalInput(attendance.actualArrivalAtUtc));
    this.attendanceDepartureLocal.set(this.toLocalInput(attendance.actualDepartureAtUtc));
    this.attendanceReason.set(attendance.reason ?? '');
    this.attendanceOverrideReason.set('');
    this.attendanceUseOverride.set(false);
    this.drawer.set('attendanceCorrection');
  }

  saveAttendanceCorrection(): void {
    const session = this.session();
    const attendance = session?.currentAttendance;
    if (!session || !attendance || this.attendanceSaving()) return;

    const useOverride = this.attendanceUseOverride();
    if (useOverride && (!this.canOverrideAttendance() || !this.attendanceOverrideReason().trim())) return;
    if (!useOverride && !this.canCorrectAttendance()) return;

    const request = {
      operationId: crypto.randomUUID(),
      status: this.attendanceStatus(),
      actualArrivalAtUtc: this.fromLocalInput(this.attendanceArrivalLocal()),
      actualDepartureAtUtc: this.fromLocalInput(this.attendanceDepartureLocal()),
      reason: this.attendanceReason().trim() || null,
      evidenceDocumentId: attendance.evidenceDocumentId,
      overrideReason: useOverride ? this.attendanceOverrideReason().trim() : null,
    };

    this.attendanceSaving.set(true);
    this.attendanceErrors.set([]);
    const mutation = useOverride
      ? this.api.overrideAttendance(this.sessionId, request)
      : this.api.correctAttendance(this.sessionId, request);

    mutation.subscribe({
      next: (updated) => {
        this.session.set(updated);
        this.attendanceSaving.set(false);
        this.drawer.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.attendanceErrors.set(this.apiErrors.getMessages(error));
        this.attendanceSaving.set(false);
      },
    });
  }

  goToCompletion(): void { this.openFinish(); }

  finishSession(): void {
    const session = this.session();
    if (!session || !this.inProgress() || !this.canComplete() || this.activeInterruption()) return;
    const endAt = new Date().toISOString();
    const mileage = this.finishMileage();
    const currentMileage = session.latestOdometerKilometers;
    if (mileage !== null && currentMileage !== null && mileage < currentMileage) {
      this.finishErrors.set(['training.sessionDetail.finish.errors.mileageLower']);
      return;
    }
    if (this.finishVehicleIssue() && (!this.finishVehicleIssueDescription().trim() || !this.finishVehicleIssueActions().trim())) {
      this.finishErrors.set(['training.sessionDetail.finish.errors.vehicleIssueRequired']);
      return;
    }

    this.finishSaving.set(true);
    this.finishErrors.set([]);
    const operations: Array<ReturnType<TrainingDeliveryApiService['recordOdometer']> | ReturnType<TrainingDeliveryApiService['reportIncident']>> = [];
    if (mileage !== null && (currentMileage === null || mileage !== currentMileage)) {
      operations.push(this.api.recordOdometer(this.sessionId, { operationId: crypto.randomUUID(), odometerKilometers: mileage, source: 2, observedAtUtc: endAt }));
    }
    if (this.finishVehicleIssue()) {
      operations.push(this.api.reportIncident(this.sessionId, {
        operationId: crypto.randomUUID(), incidentType: 4, severity: 2, occurredAtUtc: endAt,
        description: this.finishVehicleIssueDescription().trim(), immediateActions: this.finishVehicleIssueActions().trim(), additionalParticipants: [],
      }));
    }

    const finish = () => this.api.finishSession(this.sessionId, {
      operationId: crypto.randomUUID(), actualEndAtUtc: endAt, endEnergyLevelPercent: this.finishEnergyLevel(),
    }).subscribe({
      next: (updated) => {
        this.session.set(updated);
        this.finishSaving.set(false);
        this.drawer.set(null);
        this.activeTab.set('report');
        if (this.finishMode() === 'now') void this.router.navigate(['/training/sessions', this.sessionId, 'report']);
      },
      error: (error: HttpErrorResponse) => { this.finishErrors.set(this.apiErrors.getMessages(error)); this.finishSaving.set(false); },
    });

    if (!operations.length) { finish(); return; }
    forkJoin(operations).subscribe({
      next: () => finish(),
      error: (error: HttpErrorResponse) => { this.finishErrors.set(this.apiErrors.getMessages(error)); this.finishSaving.set(false); },
    });
  }

  startSession(): void {
    if (!this.sessionId || !this.canStart() || !this.startAuthoritativelyReady()) return;

    this.starting.set(true);
    this.startErrors.set([]);
    this.api.startSession(this.sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        this.starting.set(false);
        this.drawer.set(null);
        this.activeTab.set('execution');
      },
      error: (error: HttpErrorResponse) => {
        this.startErrors.set(this.apiErrors.getMessages(error));
        this.starting.set(false);
      },
    });
  }

  runPreparationCheck(): void {
    if (!this.sessionId || !this.canPrepare()) return;
    this.preparing.set(true);
    this.preparationErrors.set([]);

    this.api.prepareSession(this.sessionId).subscribe({
      next: (preparation) => {
        this.preparation.set(preparation);
        this.preparing.set(false);
        this.session.update((current) => current ? {
          ...current,
          status: preparation.sessionStatus,
          readinessCheckedAtUtc: preparation.checkedAtUtc,
          readyInstructorId: preparation.currentInstructorId,
          readyVehicleId: preparation.currentVehicleId,
          readyBranchId: preparation.currentBranchId,
          readyPlannedStartAtUtc: preparation.currentPlannedStartAtUtc,
          readyPlannedEndAtUtc: preparation.currentPlannedEndAtUtc,
        } : current);
      },
      error: (error: HttpErrorResponse) => {
        this.preparationErrors.set(this.apiErrors.getMessages(error));
        this.preparing.set(false);
      },
    });
  }

  load(): void {
    if (!this.sessionId) return;
    this.loading.set(true);
    this.errors.set([]);
    this.api.getSession(this.sessionId).subscribe({
      next: (session) => {
        this.session.set(session);
        forkJoin({
          incidents: this.api.getSessionIncidents(session.id),
          student: this.students.getOverview(session.studentId),
          identity: this.students.getIdentity(session.studentId),
          statuses: this.students.getStatuses(session.studentId),
        }).subscribe({
          next: ({ incidents, student, identity, statuses }) => {
            this.incidents.set(incidents);
            this.studentDisplayName.set(`${student.profile.firstName} ${student.profile.lastName}`.trim());
            this.studentIdentity.set(identity);
            this.studentStatuses.set(statuses);
            this.loading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            this.errors.set(this.apiErrors.getMessages(error));
            this.loading.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  private executeSessionMutation(request: import('rxjs').Observable<TrainingSessionDetail>, onSuccess?: () => void): void {
    this.executionSaving.set(true);
    this.executionErrors.set([]);
    request.subscribe({
      next: (session) => {
        this.session.set(session);
        this.executionSaving.set(false);
        this.drawer.set(null);
        onSuccess?.();
      },
      error: (error: HttpErrorResponse) => {
        this.executionErrors.set(this.apiErrors.getMessages(error));
        this.executionSaving.set(false);
      },
    });
  }

  private loadMarkerCompetencies(): void {
    const session = this.session();
    if (!session || this.markerCompetencies().length || this.markerCompetenciesLoading()) return;
    this.markerCompetenciesLoading.set(true);
    this.pedagogy.getStudentPedagogyOverview(session.studentId, session.trainingPathId).subscribe({
      next: (overview) => {
        this.markerCompetencies.set(overview.progression?.competencies ?? []);
        this.markerCompetenciesLoading.set(false);
      },
      error: () => {
        this.markerCompetencies.set([]);
        this.markerCompetenciesLoading.set(false);
      },
    });
  }


  private toLocalInput(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  private fromLocalInput(value: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private resetExecutionFeedback(): void { this.executionErrors.set([]); }

  statusKey(value: number): string { return `training.statuses.session.${value}`; }
  attendanceKey(value: number | null): string { return value === null ? 'training.statuses.attendance.none' : `training.statuses.attendance.${value}`; }
  incidentSeverityKey(value: number): string { return `training.sessionDetail.incidentSeverity.${value}`; }
  incidentStatusKey(value: number): string { return `training.sessionDetail.incidentStatus.${value}`; }
  observationTypeKey(value: number): string { return `training.sessionDetail.observationType.${value}`; }
  markerTypeKey(value: number): string { return `training.sessionDetail.marker.type.${value}`; }
  markerSeverityKey(value: number): string { return `training.sessionDetail.marker.severity.${value}`; }
  interventionTypeKey(value: number): string { return `training.sessionDetail.intervention.type.${value}`; }
  interventionSeverityKey(value: number): string { return `training.sessionDetail.interventionSeverity.${value}`; }
  readinessStatusKey(value: number): string { return `training.sessionDetail.preparation.status.${value}`; }
  private hasBlockingAction(value: number | string, action: 'Schedule' | 'StartLesson'): boolean {
    const mask = action === 'Schedule' ? 1 : 2;
    if (typeof value === 'number') return (value & mask) === mask;
    return value.split(',').some((item) => item.trim().toLowerCase() === action.toLowerCase());
  }
}

