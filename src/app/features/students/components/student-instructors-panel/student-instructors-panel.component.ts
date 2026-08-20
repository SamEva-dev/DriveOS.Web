import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import {
  InstructorSuggestion,
  StudentInstructorAssignment,
  StudentInstructors,
} from '../../models/student.models';

type InstructorAction =
  | { type: 'assign' }
  | { type: 'replacePrimary' }
  | { type: 'end'; assignment: StudentInstructorAssignment }
  | null;

@Component({
  selector: 'driveos-student-instructors-panel',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsStateBannerComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './student-instructors-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentInstructorsPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly instructors = input.required<StudentInstructors>();
  readonly primaryBranchId = input<string | null>(null);
  readonly refreshed = output<void>();

  readonly action = signal<InstructorAction>(null);
  readonly saving = signal(false);
  readonly suggestionsLoading = signal(false);
  readonly suggestions = signal<readonly InstructorSuggestion[]>([]);
  readonly suggestionSearchDone = signal(false);

  readonly canAssign = computed(() => this.hasPermission(STUDENT_PERMISSIONS.instructorsAssign));
  readonly canReplace = computed(() => this.hasPermission(STUDENT_PERMISSIONS.instructorsReplace));
  readonly activeAssignments = computed(() =>
    this.instructors().assignments.filter(
      (item) => item.status === 'Active' || item.status === 'Planned',
    ),
  );
  readonly pastAssignments = computed(() =>
    this.instructors().assignments.filter(
      (item) => item.status !== 'Active' && item.status !== 'Planned',
    ),
  );

  readonly searchForm = this.fb.nonNullable.group({
    branchId: [''],
    trainingCategory: ['', [Validators.required, Validators.maxLength(100)]],
  });

  readonly assignForm = this.fb.nonNullable.group({
    instructorId: ['', Validators.required],
    type: [2, Validators.required],
    effectiveFrom: [this.today(), Validators.required],
    effectiveTo: [''],
    trainingCategory: ['', [Validators.required, Validators.maxLength(100)]],
    maximumScope: [127, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  readonly replaceForm = this.fb.nonNullable.group({
    instructorId: ['', Validators.required],
    effectiveFrom: [this.today(), Validators.required],
    effectiveTo: [''],
    trainingCategory: ['', [Validators.required, Validators.maxLength(100)]],
    maximumScope: [127, Validators.required],
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  readonly endForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  constructor() {
    const branchId = this.primaryBranchId();
    if (branchId) this.searchForm.controls.branchId.setValue(branchId);
  }

  openAssign(): void {
    this.assignForm.reset({
      instructorId: '',
      type: 2,
      effectiveFrom: this.today(),
      effectiveTo: '',
      trainingCategory: this.searchForm.getRawValue().trainingCategory,
      maximumScope: 127,
      reason: '',
    });
    this.action.set({ type: 'assign' });
  }

  openReplacePrimary(): void {
    this.replaceForm.reset({
      instructorId: '',
      effectiveFrom: this.today(),
      effectiveTo: '',
      trainingCategory: this.searchForm.getRawValue().trainingCategory,
      maximumScope: 127,
      reason: '',
    });
    this.action.set({ type: 'replacePrimary' });
  }

  openEnd(assignment: StudentInstructorAssignment): void {
    this.endForm.reset({ reason: '' });
    this.action.set({ type: 'end', assignment });
  }

  cancel(): void {
    this.action.set(null);
  }

  searchSuggestions(): void {
    if (this.searchForm.invalid || this.suggestionsLoading()) {
      this.searchForm.markAllAsTouched();
      return;
    }
    const value = this.searchForm.getRawValue();
    this.suggestionsLoading.set(true);
    this.api
      .getInstructorSuggestions(
        this.studentId(),
        value.trainingCategory.trim(),
        value.branchId || this.primaryBranchId(),
      )
      .subscribe({
        next: (items) => {
          this.suggestions.set(items);
          this.suggestionSearchDone.set(true);
          this.suggestionsLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.suggestionsLoading.set(false);
          this.showError(error);
        },
      });
  }

  selectSuggestion(suggestion: InstructorSuggestion): void {
    const action = this.action();
    const category = suggestion.trainingCategory || this.searchForm.getRawValue().trainingCategory;
    if (action?.type === 'replacePrimary') {
      this.replaceForm.patchValue({
        instructorId: suggestion.instructorId,
        trainingCategory: category,
      });
      return;
    }
    if (action?.type !== 'assign') this.openAssign();
    this.assignForm.patchValue({
      instructorId: suggestion.instructorId,
      trainingCategory: category,
    });
  }

  assign(): void {
    if (this.assignForm.invalid || this.saving()) {
      this.assignForm.markAllAsTouched();
      return;
    }
    const value = this.assignForm.getRawValue();
    this.run(
      this.api.assignStudentInstructor(this.studentId(), {
        instructorId: value.instructorId,
        type: Number(value.type),
        effectiveFrom: value.effectiveFrom,
        effectiveTo: value.effectiveTo || null,
        trainingCategory: value.trainingCategory.trim(),
        maximumScope: Number(value.maximumScope),
        reason: value.reason.trim(),
      }),
      'students.assignments.instructors.feedback.assigned',
    );
  }

  replacePrimary(): void {
    if (this.replaceForm.invalid || this.saving()) {
      this.replaceForm.markAllAsTouched();
      return;
    }
    const value = this.replaceForm.getRawValue();
    this.run(
      this.api.replacePrimaryInstructor(this.studentId(), {
        instructorId: value.instructorId,
        effectiveFrom: value.effectiveFrom,
        effectiveTo: value.effectiveTo || null,
        trainingCategory: value.trainingCategory.trim(),
        maximumScope: Number(value.maximumScope),
        reason: value.reason.trim(),
      }),
      'students.assignments.instructors.feedback.primaryReplaced',
    );
  }

  endAssignment(): void {
    const current = this.action();
    if (current?.type !== 'end' || this.endForm.invalid || this.saving()) {
      this.endForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.endStudentInstructorAssignment(
        this.studentId(),
        current.assignment.id,
        this.endForm.getRawValue().reason.trim(),
      ),
      'students.assignments.instructors.feedback.ended',
    );
  }

  isPrimary(instructorId: string): boolean {
    return this.instructors().primaryInstructorId === instructorId;
  }

  instructorLabel(instructorId: string): string {
    return (
      this.suggestions().find((item) => item.instructorId === instructorId)?.displayName ||
      instructorId
    );
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    if (status === 'Active') return 'success';
    if (status === 'Planned') return 'warning';
    if (status === 'Replaced') return 'info';
    return 'neutral';
  }

  availabilityVariant(status: string | number): DriveOsBadgeVariant {
    if (status === 'Available' || status === 1) return 'success';
    if (status === 'Unavailable' || status === 2) return 'danger';
    if (status === 'Warning' || status === 4) return 'warning';
    return 'neutral';
  }

  availabilityLabel(status: string | number): string {
    const normalized =
      typeof status === 'number'
        ? (
            { 1: 'available', 2: 'unavailable', 3: 'notEvaluated', 4: 'warning' } as Record<
              number,
              string
            >
          )[status]
        : status.charAt(0).toLowerCase() + status.slice(1);
    return this.translate.instant(
      `students.assignments.instructors.availability.${normalized || 'notEvaluated'}`,
    );
  }

  assignmentTypeLabel(type: string | number): string {
    const key =
      typeof type === 'number'
        ? (
            {
              1: 'primary',
              2: 'secondary',
              3: 'temporaryReplacement',
              4: 'specialist',
              5: 'examAccompanist',
              6: 'partner',
            } as Record<number, string>
          )[type]
        : (
            {
              PrimaryInstructor: 'primary',
              SecondaryInstructor: 'secondary',
              TemporaryReplacement: 'temporaryReplacement',
              SpecialistInstructor: 'specialist',
              ExamAccompanist: 'examAccompanist',
              PartnerInstructor: 'partner',
            } as Record<string, string>
          )[type];
    return this.translate.instant(`students.assignments.instructors.types.${key || 'secondary'}`);
  }

  scopeLabel(scope: string | number): string {
    const numeric = typeof scope === 'number' ? scope : Number(scope);
    const key = Number.isFinite(numeric)
      ? String(numeric)
      : (
          {
            StudentRead: '1',
            SessionsRead: '2',
            PedagogyRead: '4',
            Theory: '8',
            Practical: '16',
            Simulator: '32',
            Exam: '64',
            All: '127',
          } as Record<string, string>
        )[String(scope)];
    return key
      ? this.translate.instant(`students.assignments.instructors.scopes.${key}`)
      : String(scope);
  }

  private run(operation: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancel();
        this.toast.success(this.translate.instant(feedbackKey));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(error);
      },
    });
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }

  private hasPermission(permission: string): boolean {
    this.authorization.permissions();
    return this.authorization.hasPermission(permission);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
