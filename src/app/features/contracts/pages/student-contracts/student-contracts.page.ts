import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsToastService } from '../../../../shared/ui';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { ContractsApiService } from '../../data-access/contracts-api.service';
import { CONTRACTS_PERMISSIONS } from '../../domain/contracts-permissions';
import {
  ContractAmendment,
  ContractDocument,
  CreateContractAmendmentRequest,
  SaveTrainingContractSignatoryRequest,
  TrainingContractDetail,
  TrainingContractHistory,
  TrainingContractListItem,
  TrainingContractSignatory,
} from '../../models/training-contract.models';

@Component({
  selector: 'driveos-student-contracts-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './student-contracts.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentContractsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ContractsApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);

  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly contracts = signal<readonly TrainingContractListItem[]>([]);
  readonly selected = signal<TrainingContractDetail | null>(null);
  readonly history = signal<TrainingContractHistory | null>(null);
  readonly historyLoading = signal(false);
  readonly documents = signal<readonly ContractDocument[]>([]);
  readonly documentsLoading = signal(false);
  readonly documentSaving = signal(false);
  readonly documentActionId = signal<string | null>(null);
  readonly documentFile = signal<File | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly generating = signal(false);
  readonly sendingForSignature = signal(false);
  readonly recordingSignature = signal(false);
  readonly activating = signal(false);
  readonly suspending = signal(false);
  readonly terminating = signal(false);
  readonly completing = signal(false);
  readonly expiring = signal(false);
  readonly savingAmendment = signal(false);
  readonly amendmentActionId = signal<string | null>(null);
  readonly savingSignatory = signal(false);
  readonly editingSignatoryId = signal<string | null>(null);
  readonly canGenerate = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.generate),
  );
  readonly canManageSignatories = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.signatoriesManage),
  );
  readonly canVerifySignatories = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.signatoriesVerify),
  );
  readonly canSendForSignature = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.signatureSend),
  );
  readonly canRecordSignature = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.signatureRecord),
  );
  readonly canActivate = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.activate),
  );
  readonly canSuspend = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.suspend),
  );
  readonly canTerminate = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.terminate),
  );
  readonly canComplete = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.complete),
  );
  readonly canExpire = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.expire),
  );
  readonly canReadDocuments = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.documentsRead),
  );
  readonly canUploadDocuments = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.documentsUpload),
  );
  readonly canArchiveDocuments = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.documentsArchive),
  );
  readonly canReadAudit = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.auditRead),
  );
  readonly canManageAmendments = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.amendmentsManage),
  );
  readonly canRecordAmendmentSignature = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.amendmentsSignatureRecord),
  );
  readonly canApplyAmendment = computed(() =>
    this.authorization.hasPermission(CONTRACTS_PERMISSIONS.amendmentsApply),
  );
  readonly canCreateAmendment = computed(
    () =>
      ['Active', 'Amended'].includes(this.selected()?.status ?? '') && this.canManageAmendments(),
  );
  readonly requiredSignatoriesReady = computed(() => {
    const signatories = this.selected()?.signatories ?? [];
    const required = signatories.filter((x) => x.isRequired);
    return (
      required.length > 0 &&
      required.every((x) => x.authorityStatus === 'Verified' && x.status === 'Ready')
    );
  });
  readonly signatoriesEditable = computed(() =>
    ['Draft', 'Generated'].includes(this.selected()?.status ?? ''),
  );
  readonly signableRecipients = computed(() => {
    const process = this.selected()?.currentSignatureProcess;
    if (!process || !['PendingDispatch', 'InProgress', 'PartiallySigned'].includes(process.status))
      return [];
    const unsignedRequired = process.recipients.filter((x) => x.isRequired && !x.hasSigned);
    const nextRequiredOrder = unsignedRequired.length
      ? Math.min(...unsignedRequired.map((x) => x.signingOrder))
      : Number.MAX_SAFE_INTEGER;
    return process.recipients.filter((x) => !x.hasSigned && x.signingOrder <= nextRequiredOrder);
  });

  readonly documentForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
    }),
    documentType: new FormControl('Annex', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    visibility: new FormControl('AuthorizedParties', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    retainUntil: new FormControl<string | null>(null),
    retentionLegalBasis: new FormControl<string | null>(null),
  });

  readonly signatoryForm = new FormGroup({
    kind: new FormControl('Student', { nonNullable: true, validators: [Validators.required] }),
    personId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    representedOrganizationId: new FormControl<string | null>(null),
    displayName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(250)],
    }),
    signingOrder: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    isRequired: new FormControl(true, { nonNullable: true }),
    authorityReference: new FormControl<string | null>(null),
  });

  readonly suspensionForm = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
    effectiveDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    expectedResumeDate: new FormControl<string | null>(null),
  });

  readonly terminationForm = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
    effectiveDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly completionForm = new FormGroup({
    note: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
    effectiveDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly amendmentForm = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
    effectiveDate: new FormControl(new Date().toISOString().slice(0, 10), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl<string | null>(null),
    totalAmount: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    currency: new FormControl('EUR', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(3)],
    }),
    practicalHours: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)],
    }),
    servicesSnapshot: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    paymentScheduleSnapshot: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    cancellationTerms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    bookingRules: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    studentObligations: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    providerObligations: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    examPresentationTerms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    dataProcessingTerms: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly amendmentSignedProofForm = new FormGroup({
    amendmentId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    signedDocumentReference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    documentSha256: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(64), Validators.maxLength(64)],
    }),
    signedAt: new FormControl(this.toLocalDateTimeValue(new Date()), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  readonly signatureEvidenceForm = new FormGroup({
    signatoryId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    signatureMethod: new FormControl('Electronic', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    authenticationMethod: new FormControl('StrongAuthentication', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    provider: new FormControl('DriveOS', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    providerSignatureReference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(250)],
    }),
    certificateReference: new FormControl<string | null>(null),
    ipAddress: new FormControl<string | null>(null),
    userAgent: new FormControl<string | null>(null),
    signedAt: new FormControl(this.toLocalDateTimeValue(new Date()), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.load();
  }

  private load(selectId?: string): void {
    this.api.getTrainingContracts(this.studentId).subscribe({
      next: (items) => {
        this.contracts.set(items);
        this.loading.set(false);
        const id = selectId ?? this.selected()?.id ?? items[0]?.id;
        if (id) this.select(id);
      },
      error: () => this.loading.set(false),
    });
  }

  select(contractId: string): void {
    this.detailLoading.set(true);
    this.cancelSignatoryEdit();
    this.api.getTrainingContract(contractId).subscribe({
      next: (contract) => {
        this.selected.set(contract);
        this.prefillAmendmentForm(contract);
        const firstDraftAmendment = contract.amendments.find((x) => x.status === 'Draft');
        if (firstDraftAmendment)
          this.amendmentSignedProofForm.controls.amendmentId.setValue(firstDraftAmendment.id);
        const first = contract.currentSignatureProcess?.recipients.find((x) => !x.hasSigned);
        if (first) this.signatureEvidenceForm.controls.signatoryId.setValue(first.signatoryId);
        this.detailLoading.set(false);
        this.loadDocuments(contract.id);
        this.loadHistory(contract.id);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  generate(): void {
    const contract = this.selected();
    if (!contract || contract.status !== 'Draft' || !this.canGenerate() || this.generating())
      return;
    this.generating.set(true);
    this.api.generateTrainingContract(contract.id).subscribe({
      next: () => {
        this.generating.set(false);
        this.toast.success(this.translate.instant('contracts.training.generation.success'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.generating.set(false);
        this.showErrors(error);
      },
    });
  }

  sendForSignature(): void {
    const contract = this.selected();
    if (
      !contract ||
      contract.status !== 'Generated' ||
      !this.canSendForSignature() ||
      !this.requiredSignatoriesReady() ||
      this.sendingForSignature()
    )
      return;
    this.sendingForSignature.set(true);
    this.api.sendForSignature(contract.id).subscribe({
      next: () => {
        this.sendingForSignature.set(false);
        this.toast.success(this.translate.instant('contracts.training.signature.sent'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.sendingForSignature.set(false);
        this.showErrors(error);
      },
    });
  }

  activate(): void {
    const contract = this.selected();
    if (!contract || contract.status !== 'Signed' || !this.canActivate() || this.activating())
      return;

    this.activating.set(true);
    this.api.activateTrainingContract(contract.id).subscribe({
      next: () => {
        this.activating.set(false);
        this.toast.success(this.translate.instant('contracts.training.activation.success'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.activating.set(false);
        this.showErrors(error);
      },
    });
  }

  suspend(): void {
    const contract = this.selected();
    if (
      !contract ||
      !['Active', 'Amended'].includes(contract.status) ||
      !this.canSuspend() ||
      this.suspensionForm.invalid ||
      this.suspending()
    ) {
      this.suspensionForm.markAllAsTouched();
      return;
    }
    const value = this.suspensionForm.getRawValue();
    this.suspending.set(true);
    this.api
      .suspendTrainingContract(contract.id, {
        reason: value.reason.trim(),
        effectiveDate: value.effectiveDate,
        expectedResumeDate: value.expectedResumeDate || null,
      })
      .subscribe({
        next: () => {
          this.suspending.set(false);
          this.suspensionForm.patchValue({ reason: '', expectedResumeDate: null });
          this.toast.success(this.translate.instant('contracts.training.suspension.success'));
          this.load(contract.id);
        },
        error: (error: HttpErrorResponse) => {
          this.suspending.set(false);
          this.showErrors(error);
        },
      });
  }

  terminate(): void {
    const contract = this.selected();
    if (
      !contract ||
      !['Active', 'Amended', 'Suspended'].includes(contract.status) ||
      !this.canTerminate() ||
      this.terminationForm.invalid ||
      this.terminating()
    ) {
      this.terminationForm.markAllAsTouched();
      return;
    }

    const value = this.terminationForm.getRawValue();
    this.terminating.set(true);
    this.api
      .terminateTrainingContract(contract.id, {
        reason: value.reason.trim(),
        effectiveDate: value.effectiveDate,
      })
      .subscribe({
        next: () => {
          this.terminating.set(false);
          this.terminationForm.controls.reason.setValue('');
          this.toast.success(this.translate.instant('contracts.training.termination.success'));
          this.load(contract.id);
        },
        error: (error: HttpErrorResponse) => {
          this.terminating.set(false);
          this.showErrors(error);
        },
      });
  }

  recordSignature(): void {
    const contract = this.selected();
    const process = contract?.currentSignatureProcess;
    if (
      !contract ||
      !process ||
      !this.canRecordSignature() ||
      this.signatureEvidenceForm.invalid ||
      this.recordingSignature()
    ) {
      this.signatureEvidenceForm.markAllAsTouched();
      return;
    }

    const value = this.signatureEvidenceForm.getRawValue();
    const signedAt = new Date(value.signedAt);
    if (Number.isNaN(signedAt.getTime())) {
      this.signatureEvidenceForm.controls.signedAt.setErrors({ invalid: true });
      return;
    }

    this.recordingSignature.set(true);
    this.api
      .recordSignature(contract.id, process.id, {
        signatoryId: value.signatoryId,
        documentSha256: process.documentSha256,
        signatureMethod: value.signatureMethod,
        authenticationMethod: value.authenticationMethod,
        provider: value.provider,
        providerSignatureReference: value.providerSignatureReference,
        certificateReference: value.certificateReference || null,
        ipAddress: value.ipAddress || null,
        userAgent: value.userAgent || null,
        signedAtUtc: signedAt.toISOString(),
      })
      .subscribe({
        next: () => {
          this.recordingSignature.set(false);
          this.signatureEvidenceForm.patchValue({
            providerSignatureReference: '',
            certificateReference: null,
            ipAddress: null,
            userAgent: null,
            signedAt: this.toLocalDateTimeValue(new Date()),
          });
          this.toast.success(
            this.translate.instant('contracts.training.signature.evidenceRecorded'),
          );
          this.load(contract.id);
        },
        error: (error: HttpErrorResponse) => {
          this.recordingSignature.set(false);
          this.showErrors(error);
        },
      });
  }

  complete(): void {
    const contract = this.selected();
    if (!contract || this.completionForm.invalid || this.completing()) return;
    this.completing.set(true);
    const value = this.completionForm.getRawValue();
    this.api.completeTrainingContract(contract.id, value).subscribe({
      next: () => {
        this.completing.set(false);
        this.toast.success(this.translate.instant('contracts.training.completion.success'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.completing.set(false);
        this.toast.error(this.errors.getMessages(error).join('\n'));
      },
    });
  }

  expire(): void {
    const contract = this.selected();
    if (!contract || this.expiring()) return;
    this.expiring.set(true);
    this.api.expireTrainingContract(contract.id).subscribe({
      next: () => {
        this.expiring.set(false);
        this.toast.success(this.translate.instant('contracts.training.expiration.success'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.expiring.set(false);
        this.toast.error(this.errors.getMessages(error).join('\n'));
      },
    });
  }

  createAmendment(): void {
    const contract = this.selected();
    if (
      !contract ||
      !this.canCreateAmendment() ||
      this.amendmentForm.invalid ||
      this.savingAmendment()
    ) {
      this.amendmentForm.markAllAsTouched();
      return;
    }
    this.savingAmendment.set(true);
    const value = this.amendmentForm.getRawValue();
    const request: CreateContractAmendmentRequest = {
      ...value,
      endDate: value.endDate || null,
      currency: value.currency.toUpperCase(),
    };
    this.api.createAmendment(contract.id, request).subscribe({
      next: (response) => {
        this.savingAmendment.set(false);
        this.amendmentSignedProofForm.controls.amendmentId.setValue(response.amendmentId);
        this.toast.success(this.translate.instant('contracts.training.amendments.created'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.savingAmendment.set(false);
        this.showErrors(error);
      },
    });
  }

  selectAmendmentForProof(amendment: ContractAmendment): void {
    this.amendmentSignedProofForm.patchValue({
      amendmentId: amendment.id,
      signedDocumentReference: amendment.signedDocumentReference ?? '',
    });
  }

  recordAmendmentSignedProof(): void {
    const contract = this.selected();
    if (!contract || !this.canRecordAmendmentSignature() || this.amendmentSignedProofForm.invalid) {
      this.amendmentSignedProofForm.markAllAsTouched();
      return;
    }
    const value = this.amendmentSignedProofForm.getRawValue();
    const signedAt = new Date(value.signedAt);
    if (Number.isNaN(signedAt.getTime())) return;
    this.amendmentActionId.set(value.amendmentId);
    this.api
      .recordAmendmentSignedProof(contract.id, value.amendmentId, {
        signedDocumentReference: value.signedDocumentReference,
        documentSha256: value.documentSha256,
        signedAtUtc: signedAt.toISOString(),
      })
      .subscribe({
        next: () => {
          this.amendmentActionId.set(null);
          this.toast.success(this.translate.instant('contracts.training.amendments.signed'));
          this.load(contract.id);
        },
        error: (error: HttpErrorResponse) => {
          this.amendmentActionId.set(null);
          this.showErrors(error);
        },
      });
  }

  applyAmendment(amendmentId: string): void {
    const contract = this.selected();
    if (!contract || !this.canApplyAmendment() || this.amendmentActionId()) return;
    this.amendmentActionId.set(amendmentId);
    this.api.applyAmendment(contract.id, amendmentId).subscribe({
      next: () => {
        this.amendmentActionId.set(null);
        this.toast.success(this.translate.instant('contracts.training.amendments.applied'));
        this.load(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.amendmentActionId.set(null);
        this.showErrors(error);
      },
    });
  }

  cancelAmendment(amendmentId: string): void {
    const contract = this.selected();
    if (!contract || !this.canManageAmendments() || this.amendmentActionId()) return;
    this.amendmentActionId.set(amendmentId);
    this.api
      .cancelAmendment(
        contract.id,
        amendmentId,
        this.translate.instant('contracts.training.amendments.cancelReason'),
      )
      .subscribe({
        next: () => {
          this.amendmentActionId.set(null);
          this.toast.success(this.translate.instant('contracts.training.amendments.cancelled'));
          this.load(contract.id);
        },
        error: (error: HttpErrorResponse) => {
          this.amendmentActionId.set(null);
          this.showErrors(error);
        },
      });
  }

  private prefillAmendmentForm(contract: TrainingContractDetail): void {
    this.amendmentForm.reset({
      reason: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
      startDate: contract.startDate,
      endDate: contract.endDate,
      totalAmount: contract.totalAmount,
      currency: contract.currency,
      practicalHours: contract.terms.practicalHours,
      servicesSnapshot: contract.terms.servicesSnapshot,
      paymentScheduleSnapshot: contract.terms.paymentScheduleSnapshot,
      cancellationTerms: contract.terms.cancellationTerms,
      bookingRules: contract.terms.bookingRules,
      studentObligations: contract.terms.studentObligations,
      providerObligations: contract.terms.providerObligations,
      examPresentationTerms: contract.terms.examPresentationTerms,
      dataProcessingTerms: contract.terms.dataProcessingTerms,
    });
  }

  editSignatory(signatory: TrainingContractSignatory): void {
    this.editingSignatoryId.set(signatory.id);
    this.signatoryForm.setValue({
      kind: signatory.kind,
      personId: signatory.personId,
      representedOrganizationId: signatory.representedOrganizationId,
      displayName: signatory.displayName,
      signingOrder: signatory.signingOrder,
      isRequired: signatory.isRequired,
      authorityReference: signatory.authorityReference,
    });
  }

  cancelSignatoryEdit(): void {
    this.editingSignatoryId.set(null);
    this.signatoryForm.reset({
      kind: 'Student',
      personId: '',
      representedOrganizationId: null,
      displayName: '',
      signingOrder: 1,
      isRequired: true,
      authorityReference: null,
    });
  }

  saveSignatory(): void {
    const contract = this.selected();
    if (
      !contract ||
      !this.canManageSignatories() ||
      !this.signatoriesEditable() ||
      this.signatoryForm.invalid ||
      this.savingSignatory()
    ) {
      this.signatoryForm.markAllAsTouched();
      return;
    }
    const value = this.signatoryForm.getRawValue();
    this.savingSignatory.set(true);
    const editingId = this.editingSignatoryId();
    const request: SaveTrainingContractSignatoryRequest = value;
    const onSuccess = (): void => {
      this.savingSignatory.set(false);
      this.cancelSignatoryEdit();
      this.toast.success(this.translate.instant('contracts.training.signatories.saved'));
      this.load(contract.id);
    };
    const onError = (error: HttpErrorResponse): void => {
      this.savingSignatory.set(false);
      this.showErrors(error);
    };

    if (editingId) {
      this.api
        .updateSignatory(contract.id, editingId, {
          displayName: value.displayName,
          signingOrder: value.signingOrder,
          isRequired: value.isRequired,
          authorityReference: value.authorityReference,
        })
        .subscribe({ next: onSuccess, error: onError });
      return;
    }

    this.api.addSignatory(contract.id, request).subscribe({ next: onSuccess, error: onError });
  }

  removeSignatory(signatoryId: string): void {
    const contract = this.selected();
    if (!contract || !this.canManageSignatories() || !this.signatoriesEditable()) return;
    this.api
      .removeSignatory(contract.id, signatoryId)
      .subscribe({
        next: () => this.load(contract.id),
        error: (e: HttpErrorResponse) => this.showErrors(e),
      });
  }

  decideAuthority(signatoryId: string, approved: boolean): void {
    const contract = this.selected();
    if (!contract || !this.canVerifySignatories() || !this.signatoriesEditable()) return;
    const reason = approved
      ? undefined
      : this.translate.instant('contracts.training.signatories.authorityRejectedDefault');
    this.api
      .decideSignatoryAuthority(contract.id, signatoryId, approved, reason)
      .subscribe({
        next: () => this.load(contract.id),
        error: (e: HttpErrorResponse) => this.showErrors(e),
      });
  }

  onDocumentFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.documentFile.set(input.files?.item(0) ?? null);
  }

  uploadDocument(): void {
    const contract = this.selected();
    const file = this.documentFile();
    if (
      !contract ||
      !this.canUploadDocuments() ||
      !file ||
      this.documentForm.invalid ||
      this.documentSaving()
    ) {
      this.documentForm.markAllAsTouched();
      return;
    }
    const value = this.documentForm.getRawValue();
    const data = new FormData();
    data.append('file', file);
    data.append('title', value.title.trim());
    data.append('documentType', value.documentType);
    data.append('visibility', value.visibility);
    if (value.retainUntil) data.append('retainUntil', value.retainUntil);
    if (value.retentionLegalBasis)
      data.append('retentionLegalBasis', value.retentionLegalBasis.trim());
    this.documentSaving.set(true);
    this.api.uploadContractDocument(contract.id, data).subscribe({
      next: () => {
        this.documentSaving.set(false);
        this.documentFile.set(null);
        this.documentForm.reset({
          title: '',
          documentType: 'Annex',
          visibility: 'AuthorizedParties',
          retainUntil: null,
          retentionLegalBasis: null,
        });
        this.toast.success(this.translate.instant('contracts.training.documents.uploaded'));
        this.loadDocuments(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.documentSaving.set(false);
        this.showErrors(error);
      },
    });
  }

  addDocumentVersion(documentId: string, event: Event): void {
    const contract = this.selected();
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!contract || !file || !this.canUploadDocuments() || this.documentActionId()) return;
    this.documentActionId.set(documentId);
    this.api.addContractDocumentVersion(contract.id, documentId, file).subscribe({
      next: () => {
        this.documentActionId.set(null);
        input.value = '';
        this.toast.success(this.translate.instant('contracts.training.documents.versionAdded'));
        this.loadDocuments(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.documentActionId.set(null);
        this.showErrors(error);
      },
    });
  }

  archiveDocument(documentId: string): void {
    const contract = this.selected();
    if (!contract || !this.canArchiveDocuments() || this.documentActionId()) return;
    this.documentActionId.set(documentId);
    this.api.archiveContractDocument(contract.id, documentId).subscribe({
      next: () => {
        this.documentActionId.set(null);
        this.toast.success(this.translate.instant('contracts.training.documents.archived'));
        this.loadDocuments(contract.id);
      },
      error: (error: HttpErrorResponse) => {
        this.documentActionId.set(null);
        this.showErrors(error);
      },
    });
  }

  private loadDocuments(contractId: string): void {
    if (!this.canReadDocuments()) {
      this.documents.set([]);
      return;
    }
    this.documentsLoading.set(true);
    this.api.getContractDocuments(contractId).subscribe({
      next: (items) => {
        this.documents.set(items);
        this.documentsLoading.set(false);
      },
      error: () => this.documentsLoading.set(false),
    });
  }

  private loadHistory(contractId: string): void {
    if (!this.canReadAudit()) {
      this.history.set(null);
      return;
    }
    this.historyLoading.set(true);
    this.api.getTrainingContractHistory(contractId).subscribe({
      next: (history) => {
        this.history.set(history);
        this.historyLoading.set(false);
      },
      error: () => {
        this.history.set(null);
        this.historyLoading.set(false);
      },
    });
  }

  private toLocalDateTimeValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }

  private showErrors(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(message);
  }
}
