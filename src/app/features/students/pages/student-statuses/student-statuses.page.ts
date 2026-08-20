import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
} from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsCardComponent } from '../../../../shared/ui/card/driveos-card.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsInputDirective } from '../../../../shared/ui/input/driveos-input.directive';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentBlock, StudentStatuses } from '../../models/student.models';

type StatusAction =
  | { type: 'apply' }
  | { type: 'release'; block: StudentBlock }
  | { type: 'override'; block: StudentBlock }
  | null;

interface BlockingActionOption {
  readonly value: number;
  readonly code: string;
}

@Component({
  selector: 'driveos-student-statuses-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-statuses.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentStatusesPage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly data = signal<StudentStatuses | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly saving = signal(false);
  readonly action = signal<StatusAction>(null);
  readonly selectedBlock = computed(() => {
    const current = this.action();
    return current && current.type !== 'apply' ? current.block : null;
  });

  readonly canApplyBlock = computed(() => this.hasPermission(STUDENT_PERMISSIONS.blocksApply));
  readonly canReleaseBlock = computed(() => this.hasPermission(STUDENT_PERMISSIONS.blocksRelease));
  readonly canOverrideBlock = computed(() =>
    this.hasPermission(STUDENT_PERMISSIONS.blocksOverride),
  );

  readonly blockingActionOptions: readonly BlockingActionOption[] = [
    { value: 1, code: 'Schedule' },
    { value: 2, code: 'StartLesson' },
    { value: 4, code: 'Sign' },
    { value: 8, code: 'PresentExam' },
    { value: 16, code: 'Transfer' },
    { value: 32, code: 'Refund' },
    { value: 64, code: 'Close' },
    { value: 128, code: 'PortalAccess' },
  ];

  readonly activeBlocks = computed(
    () =>
      this.data()?.blocks.filter(
        (block) => block.status === 'Active' || block.status === 'Overridden',
      ) ?? [],
  );

  readonly history = computed(
    () =>
      this.data()?.blocks.filter(
        (block) => block.status !== 'Active' && block.status !== 'Overridden',
      ) ?? [],
  );

  readonly domains = computed(() => {
    const value = this.data();
    return value
      ? [
          { code: 'profile', status: value.studentProfileStatus, icon: 'ph-user' },
          { code: 'enrollment', status: value.enrollmentStatus ?? 'None', icon: 'ph-file-text' },
          { code: 'administrative', status: value.administrativeStatus, icon: 'ph-clipboard-text' },
          { code: 'financial', status: value.financialStatus, icon: 'ph-credit-card' },
          { code: 'pedagogical', status: value.pedagogicalStatus, icon: 'ph-graduation-cap' },
          { code: 'scheduling', status: value.schedulingStatus, icon: 'ph-calendar' },
          { code: 'exam', status: value.examStatus, icon: 'ph-seal-check' },
          { code: 'portal', status: value.portalAccessStatus, icon: 'ph-browser' },
        ]
      : [];
  });

  readonly applyForm = this.fb.nonNullable.group({
    blockType: ['', [Validators.required, Validators.maxLength(80)]],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    sourceDomain: ['Students', [Validators.required, Validators.maxLength(80)]],
    severity: [3, Validators.required],
    expectedResolution: ['', Validators.maxLength(500)],
    blockingActions: this.fb.nonNullable.group({
      schedule: false,
      startLesson: false,
      sign: false,
      presentExam: false,
      transfer: false,
      refund: false,
      close: false,
      portalAccess: false,
    }),
  });

  readonly releaseForm = this.fb.nonNullable.group({
    resolutionType: [1, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  readonly overrideForm = this.fb.nonNullable.group({
    untilLocal: ['', Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.studentId();
    this.loading.set(true);
    this.error.set(false);
    this.api.getStatuses(id).subscribe({
      next: (value) => {
        this.data.set(value);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  openApply(): void {
    this.applyForm.reset({
      blockType: '',
      reason: '',
      sourceDomain: 'Students',
      severity: 3,
      expectedResolution: '',
      blockingActions: {
        schedule: false,
        startLesson: false,
        sign: false,
        presentExam: false,
        transfer: false,
        refund: false,
        close: false,
        portalAccess: false,
      },
    });
    this.action.set({ type: 'apply' });
  }

  openRelease(block: StudentBlock): void {
    this.releaseForm.reset({ resolutionType: 1, reason: '' });
    this.action.set({ type: 'release', block });
  }

  openOverride(block: StudentBlock): void {
    this.overrideForm.reset({ untilLocal: this.defaultOverrideDate(), reason: '' });
    this.action.set({ type: 'override', block });
  }

  cancelAction(): void {
    this.action.set(null);
  }

  applyBlock(): void {
    const blockingActions = this.selectedBlockingActions();
    if (this.applyForm.invalid || blockingActions === 0 || this.saving()) {
      this.applyForm.markAllAsTouched();
      if (blockingActions === 0) {
        this.toast.error(
          this.translate.instant('students.statuses.validation.blockingActionRequired'),
        );
      }
      return;
    }

    const value = this.applyForm.getRawValue();
    this.run(
      this.api.applyStudentBlock(this.studentId(), {
        blockType: value.blockType.trim(),
        reason: value.reason.trim(),
        sourceDomain: value.sourceDomain.trim(),
        blockingActions,
        severity: Number(value.severity),
        expectedResolution: value.expectedResolution.trim(),
      }),
      'students.statuses.feedback.blockApplied',
    );
  }

  releaseBlock(): void {
    const current = this.action();
    if (current?.type !== 'release' || this.releaseForm.invalid || this.saving()) {
      this.releaseForm.markAllAsTouched();
      return;
    }

    const value = this.releaseForm.getRawValue();
    this.run(
      this.api.releaseStudentBlock(this.studentId(), current.block.id, {
        resolutionType: Number(value.resolutionType),
        reason: value.reason.trim(),
      }),
      'students.statuses.feedback.blockReleased',
    );
  }

  overrideBlock(): void {
    const current = this.action();
    if (current?.type !== 'override' || this.overrideForm.invalid || this.saving()) {
      this.overrideForm.markAllAsTouched();
      return;
    }

    const value = this.overrideForm.getRawValue();
    const until = new Date(value.untilLocal);
    if (Number.isNaN(until.getTime()) || until <= new Date()) {
      this.toast.error(this.translate.instant('students.statuses.validation.overrideFuture'));
      return;
    }

    this.run(
      this.api.overrideStudentBlock(this.studentId(), current.block.id, {
        reason: value.reason.trim(),
        untilUtc: until.toISOString(),
      }),
      'students.statuses.feedback.blockOverridden',
    );
  }

  variant(status: string): DriveOsBadgeVariant {
    if (
      ['Active', 'Compliant', 'Clear', 'Eligible', 'Enabled', 'Ready', 'Validated'].includes(status)
    )
      return 'success';
    if (['Blocked', 'Suspended', 'Critical', 'Rejected', 'Overdue', 'Disabled'].includes(status))
      return 'danger';
    if (['Pending', 'Warning', 'Incomplete', 'Overridden'].includes(status)) return 'warning';
    return 'neutral';
  }

  severityVariant(severity: string): DriveOsBadgeVariant {
    return severity === 'Critical' || severity === 'Blocking'
      ? 'danger'
      : severity === 'Warning'
        ? 'warning'
        : 'info';
  }

  blockingActions(value: number | string): readonly string[] {
    if (typeof value === 'string')
      return value === 'None' ? [] : value.split(',').map((item) => item.trim());
    return this.blockingActionOptions
      .filter((item) => (value & item.value) === item.value)
      .map((item) => item.code);
  }

  trackBlock(_: number, block: StudentBlock): string {
    return block.id;
  }

  private selectedBlockingActions(): number {
    const value = this.applyForm.controls.blockingActions.getRawValue();
    const selected = [
      value.schedule ? 1 : 0,
      value.startLesson ? 2 : 0,
      value.sign ? 4 : 0,
      value.presentExam ? 8 : 0,
      value.transfer ? 16 : 0,
      value.refund ? 32 : 0,
      value.close ? 64 : 0,
      value.portalAccess ? 128 : 0,
    ];
    return selected.reduce((sum, flag) => sum | flag, 0);
  }

  private run(operation: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelAction();
        this.toast.success(this.translate.instant(feedbackKey));
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        for (const message of this.errors.getMessages(error)) this.toast.error(message);
      },
    });
  }

  private hasPermission(permission: string): boolean {
    this.authorization.permissions();
    return this.authorization.hasPermission(permission);
  }

  private studentId(): string {
    return this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  }

  private defaultOverrideDate(): string {
    const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
