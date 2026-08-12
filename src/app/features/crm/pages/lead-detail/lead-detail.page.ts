import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
  DriveOsToastService,
  DriveOsInputDirective,
} from '../../../../shared/ui';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { FinancingOption, LeadDetails, LeadSourceType, LeadStatus } from '../../models/lead.model';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { CrmTasksApiService } from '../../data-access/crm-tasks-api.service';
import { CrmTask, CrmTaskType } from '../../models/crm-task.model';
import { CrmActivitiesApiService } from '../../data-access/crm-activities-api.service';
import { CrmActivity, CrmActivityDirection, CrmActivityType } from '../../models/crm-activity.model';

@Component({
  selector: 'driveos-lead-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    DriveOsInputDirective,
  ],
  templateUrl: './lead-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(LeadsApiService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  private readonly tasksApi = inject(CrmTasksApiService);
  private readonly activitiesApi = inject(CrmActivitiesApiService);

  readonly lead = signal<LeadDetails | null>(null);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isEditingQualification = signal(false);
  readonly isSavingQualification = signal(false);
  readonly isConverting = signal(false);
  readonly tasks = signal<CrmTask[]>([]);
  readonly isCreatingTask = signal(false);
  readonly isSavingTask = signal(false);
  readonly activities = signal<CrmActivity[]>([]);
  readonly isCreatingActivity = signal(false);
  readonly isSavingActivity = signal(false);
  readonly canReadActivities = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.activities.read));
  readonly canCreateActivity = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.activities.create));
  readonly activityForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<CrmActivityType>('Call', Validators.required),
    direction: this.formBuilder.nonNullable.control<CrmActivityDirection>('Outbound', Validators.required),
    subject: ['', [Validators.required, Validators.maxLength(200)]],
    details: ['', Validators.maxLength(4000)],
    occurredAtUtc: ['', Validators.required],
  });
  readonly canReadTasks = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.tasks.read));
  readonly canCreateTask = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.tasks.create));
  readonly canCompleteTask = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.tasks.complete));
  readonly canCancelTask = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.tasks.cancel));
  readonly taskForm = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<CrmTaskType>('Call', Validators.required),
    title: ['', [Validators.required, Validators.maxLength(200)]],
    notes: ['', Validators.maxLength(2000)],
    dueAtUtc: ['', Validators.required],
  });
  readonly canQualify = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.leads.qualify));
  readonly canConvert = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.conversions.convertToStudent));
  readonly qualificationForm = this.formBuilder.nonNullable.group({
    need: ['', [Validators.required, Validators.maxLength(1000)]],
    licenseCategory: ['', [Validators.required, Validators.maxLength(30)]],
    availability: ['', [Validators.required, Validators.maxLength(500)]],
    targetDate: [''],
    financing: this.formBuilder.nonNullable.control<FinancingOption>('Unknown', Validators.required),
    notes: ['', Validators.maxLength(2000)],
  });
  readonly displayName = computed(() => {
    const lead = this.lead();
    return lead ? `${lead.firstName} ${lead.lastName}` : '';
  });

  private readonly leadId = this.route.snapshot.paramMap.get('leadId');

  constructor() {
    if (!this.leadId) {
      this.isLoading.set(false);
      void this.router.navigate(['/crm/leads']);
      return;
    }

    this.load();
  }

  goBack(): void { void this.router.navigate(['/crm/leads']); }
  reload(): void { this.load(); }
  convertToStudent(): void {
    if (!this.leadId || this.lead()?.status !== 'Won' || this.lead()?.convertedPersonId) return;
    void this.router.navigate(['/crm/leads', this.leadId, 'convert']);
  }
  openTaskForm(): void { this.taskForm.reset({ type: 'Call', title: '', notes: '', dueAtUtc: '' }); this.isCreatingTask.set(true); }
  cancelTaskForm(): void { this.isCreatingTask.set(false); }
  saveTask(): void {
    if (!this.leadId || this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }
    const value = this.taskForm.getRawValue(); this.isSavingTask.set(true);
    this.tasksApi.create(this.leadId, { type: value.type, title: value.title.trim(),
      notes: value.notes.trim() || null, dueAtUtc: new Date(value.dueAtUtc).toISOString(), assignedToUserId: null })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { this.isSavingTask.set(false); this.isCreatingTask.set(false); this.loadTasks(); this.toast.success(this.translate.instant('crm.tasks.created')); },
        error: (error: HttpErrorResponse) => { this.isSavingTask.set(false); this.showErrors(error); },
      });
  }
  closeTask(task: CrmTask, cancel: boolean): void {
    const request = cancel ? this.tasksApi.cancel(task.id) : this.tasksApi.complete(task.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.loadTasks(), error: (error: HttpErrorResponse) => this.showErrors(error),
    });
  }
  isOverdue(task: CrmTask): boolean { return task.status === 'Pending' && new Date(task.dueAtUtc).getTime() < Date.now(); }
  openActivityForm(): void {
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    this.activityForm.reset({ type: 'Call', direction: 'Outbound', subject: '', details: '', occurredAtUtc: localNow });
    this.isCreatingActivity.set(true);
  }
  cancelActivityForm(): void { this.isCreatingActivity.set(false); }
  saveActivity(): void {
    if (!this.leadId || this.activityForm.invalid) { this.activityForm.markAllAsTouched(); return; }
    const value = this.activityForm.getRawValue();
    const direction: CrmActivityDirection = value.type === 'Note' ? 'None' : value.direction;
    this.isSavingActivity.set(true);
    this.activitiesApi.create(this.leadId, {
      type: value.type, direction, subject: value.subject.trim(),
      details: value.details.trim() || null,
      occurredAtUtc: new Date(value.occurredAtUtc).toISOString(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSavingActivity.set(false); this.isCreatingActivity.set(false);
        this.loadActivities(); this.toast.success(this.translate.instant('crm.activities.created'));
      },
      error: (error: HttpErrorResponse) => { this.isSavingActivity.set(false); this.showErrors(error); },
    });
  }
  editQualification(): void {
    const lead = this.lead();
    if (!lead) return;
    this.qualificationForm.reset({
      need: lead.qualification?.need ?? '',
      licenseCategory: lead.qualification?.licenseCategory ?? lead.licenseCategory,
      availability: lead.qualification?.availability ?? '',
      targetDate: lead.qualification?.targetDate ?? '',
      financing: lead.qualification?.financing ?? 'Unknown',
      notes: lead.qualification?.notes ?? '',
    });
    this.isEditingQualification.set(true);
  }
  cancelQualification(): void { this.isEditingQualification.set(false); }
  saveQualification(): void {
    if (!this.leadId || this.qualificationForm.invalid) {
      this.qualificationForm.markAllAsTouched(); return;
    }
    const value = this.qualificationForm.getRawValue();
    this.isSavingQualification.set(true);
    this.api.qualify(this.leadId, {
      ...value,
      targetDate: value.targetDate || null,
      notes: value.notes.trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSavingQualification.set(false);
        this.isEditingQualification.set(false);
        this.toast.success(this.translate.instant('crm.qualification.success'));
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingQualification.set(false);
        for (const message of this.apiErrorService.getMessages(error)) this.toast.error(this.translate.instant('errors.title'), message);
      },
    });
  }
  statusKey(status: LeadStatus): string { return `crm.leads.statuses.${status}`; }
  sourceKey(source: LeadSourceType): string { return `crm.leads.sources.${source}`; }

  statusVariant(status: LeadStatus): DriveOsBadgeVariant {
    if (status === 'Won') return 'success';
    if (status === 'Lost') return 'danger';
    if (status === 'Dormant') return 'warning';
    return status === 'New' ? 'info' : 'neutral';
  }

  private load(): void {
    if (!this.leadId) return;

    this.isLoading.set(true);
    this.hasError.set(false);
    this.api.getById(this.leadId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.isLoading.set(false);
        this.loadTasks();
        this.loadActivities();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        for (const message of this.apiErrorService.getMessages(error)) {
          this.toast.error(this.translate.instant('errors.title'), message);
        }
      },
    });
  }

  private loadTasks(): void {
    if (!this.leadId || !this.canReadTasks()) return;
    this.tasksApi.getByLead(this.leadId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: tasks => this.tasks.set(tasks), error: () => this.tasks.set([]),
    });
  }
  private loadActivities(): void {
    if (!this.leadId || !this.canReadActivities()) return;
    this.activitiesApi.getByLead(this.leadId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: activities => this.activities.set(activities), error: () => this.activities.set([]),
    });
  }
  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.apiErrorService.getMessages(error)) this.toast.error(this.translate.instant('errors.title'), message);
  }
}
