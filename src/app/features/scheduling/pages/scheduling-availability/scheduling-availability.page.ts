import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  AddAvailabilityExceptionResult,
  AvailabilityPlan,
  AvailabilityRule,
  CalendarResource,
} from '../../models/scheduling.models';

type AvailabilityContext = 'instructors' | 'students' | 'resources';
type DrawerMode = 'plan' | 'rule' | 'exception' | 'preferences' | null;

@Component({
  selector: 'driveos-scheduling-availability-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-availability.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingAvailabilityPage {
  private readonly api = inject(SchedulingApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly context = signal<AvailabilityContext>('instructors');
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly selectedResourceId = signal<string | null>(null);
  readonly plans = signal<readonly AvailabilityPlan[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly drawerMode = signal<DrawerMode>(null);
  readonly lastImpact = signal<AddAvailabilityExceptionResult | null>(null);

  readonly planFrom = signal(this.todayKey());
  readonly planTo = signal<string>('');

  readonly ruleDay = signal(1);
  readonly ruleStart = signal('08:00');
  readonly ruleEnd = signal('18:00');
  readonly ruleCapacity = signal(1);
  readonly ruleType = signal(1);
  readonly ruleSource = signal(2);
  readonly rulePriority = signal(500);
  readonly ruleBranchId = signal<string>('');
  readonly ruleTrainingCategory = signal('');
  readonly ruleServiceArea = signal('');

  readonly exceptionDate = signal(this.todayKey());
  readonly exceptionStart = signal('08:00');
  readonly exceptionEnd = signal('18:00');
  readonly exceptionType = signal(2);
  readonly exceptionSource = signal<number | null>(null);
  readonly exceptionPriority = signal<number | null>(null);
  readonly exceptionReason = signal('');
  readonly exceptionCapacity = signal<number | null>(null);

  readonly prefMeetingPoint = signal('');
  readonly prefMaxDistance = signal<number | null>(null);
  readonly prefMinimumNotice = signal<number | null>(null);
  readonly prefFrequency = signal<number | null>(null);
  readonly prefInstructorId = signal('');
  readonly prefIntensive = signal(false);
  readonly prefGeo = signal(false);

  readonly canManage = computed(() => this.authorization.hasPermission(SCHEDULING_PERMISSIONS.availability.manage));
  readonly selectedResource = computed(() => this.resources().find((x) => x.id === this.selectedResourceId()) ?? null);
  readonly contextResources = computed(() => this.resources().filter((resource) => this.matchesContext(resource)));
  readonly activePlan = computed(() => this.plans().find((x) => x.status === 'Active') ?? null);
  readonly draftPlan = computed(() => this.plans().find((x) => x.status === 'Draft') ?? null);
  readonly selectedPlan = computed(() => this.draftPlan() ?? this.activePlan() ?? this.plans()[0] ?? null);
  readonly materialContext = computed(() => this.context() === 'resources');
  readonly studentContext = computed(() => this.context() === 'students');
  readonly instructorResources = computed(() => this.resources().filter((resource) => this.resourceTypeCode(resource.resourceType) === '2'));
  readonly instructorContext = computed(() => this.context() === 'instructors');
  readonly weekdays = [
    { value: 1, key: 'scheduling.availability.weekdays.monday' },
    { value: 2, key: 'scheduling.availability.weekdays.tuesday' },
    { value: 3, key: 'scheduling.availability.weekdays.wednesday' },
    { value: 4, key: 'scheduling.availability.weekdays.thursday' },
    { value: 5, key: 'scheduling.availability.weekdays.friday' },
    { value: 6, key: 'scheduling.availability.weekdays.saturday' },
    { value: 0, key: 'scheduling.availability.weekdays.sunday' },
  ] as const;

  constructor() {
    const dataContext = this.route.snapshot.data['availabilityContext'] as AvailabilityContext | undefined;
    const queryContext = this.route.snapshot.queryParamMap.get('context') as AvailabilityContext | null;
    const resourceId = this.route.snapshot.paramMap.get('resourceId')
      ?? this.route.snapshot.paramMap.get('instructorId')
      ?? this.route.snapshot.paramMap.get('studentId')
      ?? this.route.snapshot.queryParamMap.get('resourceId');
    if (dataContext) this.context.set(dataContext);
    else if (queryContext && ['instructors', 'students', 'resources'].includes(queryContext)) this.context.set(queryContext);
    if (resourceId) this.selectedResourceId.set(resourceId);
    this.loadResources();
  }

  setContext(context: AvailabilityContext): void {
    this.context.set(context);
    this.selectedResourceId.set(this.contextResources()[0]?.id ?? null);
    this.plans.set([]);
    this.lastImpact.set(null);
    this.syncUrl();
    if (this.selectedResourceId()) this.loadPlans();
  }

  selectResource(resourceId: string): void {
    this.selectedResourceId.set(resourceId || null);
    this.lastImpact.set(null);
    this.syncUrl();
    this.loadPlans();
  }

  open(mode: Exclude<DrawerMode, null>): void {
    this.successKey.set(null);
    this.errors.set([]);
    this.drawerMode.set(mode);
    if (mode === 'preferences') this.loadPreferenceForm();
    if (mode === 'rule') {
      this.ruleBranchId.set(this.selectedResource()?.branchId ?? '');
      if (this.studentContext()) this.ruleSource.set(7);
      else if (this.materialContext()) this.ruleSource.set(6);
      else this.ruleSource.set(2);
    }
    if (mode === 'exception') {
      if (this.materialContext()) { this.exceptionType.set(10); this.exceptionSource.set(null); }
      else if (this.studentContext()) { this.exceptionType.set(2); this.exceptionSource.set(7); }
      else { this.exceptionType.set(2); this.exceptionSource.set(2); }
    }
  }

  closeDrawer(): void { if (!this.saving()) this.drawerMode.set(null); }

  loadResources(): void {
    this.loading.set(true);
    this.api.getResources().subscribe({
      next: (resources) => {
        this.resources.set(resources);
        const requestedId = this.selectedResourceId();
        const matched = requestedId
          ? this.contextResources().find((x) => x.id === requestedId || x.externalResourceId === requestedId)
          : null;
        if (matched) this.selectedResourceId.set(matched.id);
        else this.selectedResourceId.set(this.contextResources()[0]?.id ?? null);
        if (this.selectedResourceId()) this.loadPlans();
        else this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => { this.errors.set(this.apiErrors.getMessages(error)); this.loading.set(false); },
    });
  }

  loadPlans(): void {
    const resourceId = this.selectedResourceId();
    if (!resourceId) { this.plans.set([]); this.loading.set(false); return; }
    this.loading.set(true);
    this.api.getAvailabilityPlans(resourceId).subscribe({
      next: (plans) => { this.plans.set(plans); this.loading.set(false); },
      error: (error: HttpErrorResponse) => { this.errors.set(this.apiErrors.getMessages(error)); this.loading.set(false); },
    });
  }

  createPlan(): void {
    const resourceId = this.selectedResourceId();
    if (!resourceId) return;
    this.runSave(
      this.api.createAvailabilityPlan(resourceId, { effectiveFrom: this.planFrom(), effectiveTo: this.planTo() || null }),
      'scheduling.availability.messages.planCreated',
    );
  }

  addRule(): void {
    const plan = this.draftPlan();
    if (!plan) return;
    this.runSave(this.api.addAvailabilityRule(plan.id, {
      dayOfWeek: this.ruleDay(),
      startTime: this.ruleStart(),
      endTime: this.ruleEnd(),
      capacity: this.materialContext() ? this.ruleCapacity() : 1,
      type: this.ruleType(),
      source: this.ruleSource(),
      priority: this.rulePriority(),
      branchId: this.ruleBranchId() || null,
      trainingCategory: this.ruleTrainingCategory().trim() || null,
      serviceArea: this.ruleServiceArea().trim() || null,
    }), 'scheduling.availability.messages.ruleAdded');
  }

  addException(): void {
    const plan = this.selectedPlan();
    if (!plan) return;
    const available = this.exceptionType() === 1;
    this.saving.set(true); this.errors.set([]); this.successKey.set(null);
    this.api.addAvailabilityException(plan.id, {
      date: this.exceptionDate(),
      startTime: this.exceptionStart(),
      endTime: this.exceptionEnd(),
      type: this.exceptionType(),
      capacity: available ? (this.materialContext() ? this.exceptionCapacity() ?? this.selectedResource()?.capacity ?? 1 : 1) : null,
      reason: this.exceptionReason().trim() || null,
      source: this.exceptionSource(),
      priority: this.exceptionPriority(),
    }).subscribe({
      next: (result) => {
        this.lastImpact.set(result);
        this.saving.set(false); this.drawerMode.set(null); this.successKey.set('scheduling.availability.messages.exceptionAdded'); this.loadPlans();
      },
      error: (error: HttpErrorResponse) => { this.saving.set(false); this.errors.set(this.apiErrors.getMessages(error)); },
    });
  }

  savePreferences(): void {
    const plan = this.selectedPlan();
    if (!plan) return;
    this.runSave(this.api.updateAvailabilityPreferences(plan.id, {
      preferredMeetingPoint: this.prefMeetingPoint().trim() || null,
      maximumTravelDistanceKm: this.prefMaxDistance(),
      minimumNoticeMinutes: this.prefMinimumNotice(),
      trainingFrequencyPerWeek: this.prefFrequency(),
      preferredInstructorId: this.prefInstructorId() || null,
      intensiveRhythm: this.prefIntensive(),
      oneTimeGeolocationAllowed: this.prefGeo(),
    }), 'scheduling.availability.messages.preferencesSaved');
  }

  activate(plan: AvailabilityPlan): void { this.runSave(this.api.activateAvailabilityPlan(plan.id), 'scheduling.availability.messages.planActivated'); }
  archive(plan: AvailabilityPlan): void { this.runSave(this.api.archiveAvailabilityPlan(plan.id), 'scheduling.availability.messages.planArchived'); }
  removeRule(plan: AvailabilityPlan, rule: AvailabilityRule): void { this.runSave(this.api.removeAvailabilityRule(plan.id, rule.id), 'scheduling.availability.messages.ruleRemoved'); }
  removeException(plan: AvailabilityPlan, exceptionId: string): void { this.runSave(this.api.removeAvailabilityException(plan.id, exceptionId), 'scheduling.availability.messages.exceptionRemoved'); }

  rulesForDay(day: number): readonly AvailabilityRule[] {
    const name = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    return (this.selectedPlan()?.rules ?? []).filter((x) => x.dayOfWeek === name).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  resourceTypeCode(type: string | number): string {
    const value = String(type);
    return ({ Student: '1', Instructor: '2', Vehicle: '3', Room: '4', Branch: '5', Simulator: '6', Equipment: '7', ExamVehicle: '8', PartnerResource: '9', Other: '99' } as Record<string, string>)[value] ?? value;
  }
  resourceTypeKey(type: string | number): string { return `scheduling.resources.type.${this.resourceTypeCode(type)}`; }
  ruleTypeKey(type: string): string { return `scheduling.availability.ruleTypes.${type}`; }
  sourceKey(source: string): string { return `scheduling.availability.sources.${source}`; }
  exceptionTypeKey(type: string): string { return `scheduling.availability.exceptionTypes.${type}`; }
  planStatusKey(status: string): string { return `scheduling.availability.planStatus.${status}`; }

  private matchesContext(resource: CalendarResource): boolean {
    const code = this.resourceTypeCode(resource.resourceType);
    if (this.context() === 'instructors') return code === '2';
    if (this.context() === 'students') return code === '1';
    return ['3', '4', '6', '7', '8', '9'].includes(code);
  }

  private loadPreferenceForm(): void {
    const p = this.selectedPlan()?.preferences;
    this.prefMeetingPoint.set(p?.preferredMeetingPoint ?? '');
    this.prefMaxDistance.set(p?.maximumTravelDistanceKm ?? null);
    this.prefMinimumNotice.set(p?.minimumNoticeMinutes ?? null);
    this.prefFrequency.set(p?.trainingFrequencyPerWeek ?? null);
    this.prefInstructorId.set(p?.preferredInstructorId ?? '');
    this.prefIntensive.set(p?.intensiveRhythm ?? false);
    this.prefGeo.set(p?.oneTimeGeolocationAllowed ?? false);
  }

  private runSave(observable: Observable<unknown>, successKey: string): void {
    this.saving.set(true); this.errors.set([]); this.successKey.set(null);
    observable.subscribe({
      next: () => { this.saving.set(false); this.drawerMode.set(null); this.successKey.set(successKey); this.loadPlans(); },
      error: (error: HttpErrorResponse) => { this.saving.set(false); this.errors.set(this.apiErrors.getMessages(error)); },
    });
  }

  private syncUrl(): void {
    if (!this.route.snapshot.routeConfig?.path?.includes('availability')) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { context: this.context(), resourceId: this.selectedResourceId() },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private todayKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
