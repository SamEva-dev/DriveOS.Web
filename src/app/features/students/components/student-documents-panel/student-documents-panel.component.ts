import { DatePipe } from '@angular/common';
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
import { DriveOsToastService } from '../../../../shared/ui/toast/driveos-toast.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentDocument, StudentDocuments } from '../../models/student.models';

type DocumentAction =
  | { type: 'request' }
  | { type: 'upload'; document: StudentDocument }
  | { type: 'validate'; document: StudentDocument; approve: boolean }
  | { type: 'share'; document: StudentDocument }
  | { type: 'archive'; document: StudentDocument }
  | null;

interface VisibilityOption {
  value: number;
  labelKey: string;
}

@Component({
  selector: 'driveos-student-documents-panel',
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
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-documents-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDocumentsPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = input.required<string>();
  readonly documents = input.required<StudentDocuments>();
  readonly enrollmentId = input<string | null>(null);
  readonly refreshed = output<void>();

  readonly action = signal<DocumentAction>(null);
  readonly saving = signal(false);
  readonly downloadInProgress = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedVisibility = signal(4);

  readonly canRequest = computed(() => this.hasPermission(STUDENT_PERMISSIONS.documentRequest));
  readonly canUpload = computed(() => this.hasPermission(STUDENT_PERMISSIONS.documentUpload));
  readonly canValidate = computed(() => this.hasPermission(STUDENT_PERMISSIONS.documentValidate));
  readonly canShare = computed(() => this.hasPermission(STUDENT_PERMISSIONS.documentShare));
  readonly canDownload = computed(() => this.hasPermission(STUDENT_PERMISSIONS.documentDownload));

  readonly categories = [
    'Identity',
    'Residence',
    'Authorization',
    'Photograph',
    'RegulatoryEvidence',
    'Funding',
    'Contract',
    'Exam',
    'Certificate',
    'PartnerDocument',
  ] as const;
  readonly visibilityOptions: readonly VisibilityOption[] = [
    { value: 1, labelKey: 'students.enrollment.documents.visibility.student' },
    { value: 2, labelKey: 'students.enrollment.documents.visibility.guardians' },
    { value: 4, labelKey: 'students.enrollment.documents.visibility.administrativeStaff' },
    { value: 8, labelKey: 'students.enrollment.documents.visibility.pedagogicalStaff' },
    { value: 16, labelKey: 'students.enrollment.documents.visibility.financeStaff' },
    { value: 32, labelKey: 'students.enrollment.documents.visibility.partners' },
  ];

  readonly requestForm = this.fb.nonNullable.group({
    documentType: ['', [Validators.required, Validators.maxLength(120)]],
    category: ['Identity', Validators.required],
    expiresOn: [''],
  });
  readonly validationForm = this.fb.nonNullable.group({
    reason: ['', [Validators.maxLength(500)]],
  });
  readonly archiveForm = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
  });

  openRequest(): void {
    this.requestForm.reset({ documentType: '', category: 'Identity', expiresOn: '' });
    this.selectedVisibility.set(4);
    this.action.set({ type: 'request' });
  }

  openUpload(document: StudentDocument): void {
    this.selectedFile.set(null);
    this.action.set({ type: 'upload', document });
  }

  openValidation(document: StudentDocument, approve: boolean): void {
    this.validationForm.reset({ reason: '' });
    this.action.set({ type: 'validate', document, approve });
  }

  openShare(document: StudentDocument): void {
    this.selectedVisibility.set(this.visibilityMask(document.visibility));
    this.action.set({ type: 'share', document });
  }

  openArchive(document: StudentDocument): void {
    this.archiveForm.reset({ reason: '' });
    this.action.set({ type: 'archive', document });
  }

  cancel(): void {
    this.action.set(null);
    this.selectedFile.set(null);
  }

  chooseFile(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.selectedFile.set(inputElement.files?.item(0) ?? null);
  }

  toggleVisibility(value: number): void {
    const current = this.selectedVisibility();
    this.selectedVisibility.set((current & value) === value ? current & ~value : current | value);
  }

  visibilitySelected(value: number): boolean {
    return (this.selectedVisibility() & value) === value;
  }

  requestDocument(): void {
    if (this.requestForm.invalid || this.selectedVisibility() === 0 || this.saving()) {
      this.requestForm.markAllAsTouched();
      return;
    }
    const value = this.requestForm.getRawValue();
    this.run(
      this.api.requestDocument(this.studentId(), {
        enrollmentId: this.enrollmentId(),
        documentType: value.documentType.trim(),
        category: value.category,
        visibility: this.selectedVisibility(),
        expiresOn: value.expiresOn || null,
      }),
      'students.enrollment.documents.feedback.requested',
    );
  }

  upload(): void {
    const current = this.action();
    const file = this.selectedFile();
    if (current?.type !== 'upload' || !file || this.saving()) return;
    this.run(
      this.api.uploadDocument(this.studentId(), current.document.id, file),
      current.document.currentVersion > 0
        ? 'students.enrollment.documents.feedback.replaced'
        : 'students.enrollment.documents.feedback.uploaded',
    );
  }

  validate(): void {
    const current = this.action();
    if (current?.type !== 'validate' || this.saving()) return;
    const reason = this.validationForm.getRawValue().reason.trim();
    if (!current.approve && reason.length < 3) {
      this.validationForm.controls.reason.setErrors({ required: true });
      this.validationForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.validateDocument(this.studentId(), current.document.id, {
        approve: current.approve,
        reason: reason || null,
      }),
      current.approve
        ? 'students.enrollment.documents.feedback.approved'
        : 'students.enrollment.documents.feedback.rejected',
    );
  }

  share(): void {
    const current = this.action();
    if (current?.type !== 'share' || this.selectedVisibility() === 0 || this.saving()) return;
    this.run(
      this.api.shareDocument(this.studentId(), current.document.id, this.selectedVisibility()),
      'students.enrollment.documents.feedback.shared',
    );
  }

  archive(): void {
    const current = this.action();
    if (current?.type !== 'archive' || this.archiveForm.invalid || this.saving()) {
      this.archiveForm.markAllAsTouched();
      return;
    }
    this.run(
      this.api.archiveDocument(
        this.studentId(),
        current.document.id,
        this.archiveForm.getRawValue().reason.trim(),
      ),
      'students.enrollment.documents.feedback.archived',
    );
  }

  download(document: StudentDocument): void {
    if (!this.canDownload() || document.currentVersion <= 0 || this.downloadInProgress()) return;
    this.downloadInProgress.set(document.id);
    this.api.downloadDocument(this.studentId(), document.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = window.document.createElement('a');
        anchor.href = url;
        anchor.download = `${document.documentType || 'document'}-v${document.currentVersion}`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.downloadInProgress.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.downloadInProgress.set(null);
        this.showError(error);
      },
    });
  }

  statusVariant(status: string): DriveOsBadgeVariant {
    if (status === 'Approved') return 'success';
    if (['Rejected', 'Expired'].includes(status)) return 'danger';
    if (['Requested', 'Uploaded', 'Processing', 'PendingReview', 'Expiring'].includes(status))
      return 'warning';
    return 'neutral';
  }

  canUploadDocument(document: StudentDocument): boolean {
    return this.canUpload() && document.status !== 'Archived';
  }

  canValidateDocument(document: StudentDocument): boolean {
    return this.canValidate() && document.status === 'PendingReview';
  }

  private run(operation: Observable<unknown>, feedbackKey: string): void {
    this.saving.set(true);
    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.action.set(null);
        this.selectedFile.set(null);
        this.toast.success(this.translate.instant(feedbackKey));
        this.refreshed.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.showError(error);
      },
    });
  }

  private visibilityMask(value: string | number): number {
    if (typeof value === 'number') return value;
    const names: Record<string, number> = {
      Student: 1,
      Guardians: 2,
      AdministrativeStaff: 4,
      PedagogicalStaff: 8,
      FinanceStaff: 16,
      Partners: 32,
    };
    return value
      .split(',')
      .map((part) => part.trim())
      .reduce((mask, name) => mask | (names[name] ?? 0), 0);
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }

  private hasPermission(permission: string): boolean {
    this.authorization.permissions();
    return this.authorization.hasPermission(permission);
  }
}
