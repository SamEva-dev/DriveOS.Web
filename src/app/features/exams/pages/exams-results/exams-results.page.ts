import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  ExamAttestation,
  ExamFailureAnalysis,
  ExamRemediationRequest,
  ExamResult,
  ExamSuccessConsequence,
  ExamSuccessProcess,
} from '../../models/exams.models';

type ResultTab = 'result' | 'failure' | 'remediation' | 'success' | 'attestations';
type DrawerMode =
  | 'recordResult'
  | 'verify'
  | 'correct'
  | 'finding'
  | 'narrative'
  | 'completeFailure'
  | 'configureRemediation'
  | 'cancelRemediation'
  | 'issueAttestation'
  | 'correctAttestation'
  | 'signAttestation'
  | 'deliverAttestation'
  | 'revokeAttestation'
  | null;

@Component({
  selector: 'driveos-exams-results-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
  ],
  templateUrl: './exams-results.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsResultsPage {
  private readonly api = inject(ExamsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);

  studentId = '';
  readonly items = signal<readonly ExamResult[]>([]);
  readonly selected = signal<ExamResult | null>(null);
  readonly failure = signal<ExamFailureAnalysis | null>(null);
  readonly remediation = signal<ExamRemediationRequest | null>(null);
  readonly success = signal<ExamSuccessProcess | null>(null);
  readonly consequences = signal<readonly ExamSuccessConsequence[]>([]);
  readonly attestations = signal<readonly ExamAttestation[]>([]);
  readonly messages = signal<readonly string[]>([]);
  readonly loading = signal(false);
  readonly contextLoading = signal(false);
  readonly saving = signal(false);
  readonly activeTab = signal<ResultTab>('result');
  readonly drawerMode = signal<DrawerMode>(null);
  readonly selectedAttestation = signal<ExamAttestation | null>(null);

  readonly isFailed = computed(() => this.selected()?.outcome === 'Failed');
  readonly isPassed = computed(() => this.selected()?.outcome === 'Passed');
  readonly canRecord = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.results.record));
  readonly canImport = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.results.import));
  readonly canVerify = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.results.verify));
  readonly canFinalize = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.results.finalize),
  );
  readonly canCorrect = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.results.correct));
  readonly canFailureRead = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.failureAnalysis.read),
  );
  readonly canFailureManage = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.failureAnalysis.manage),
  );
  readonly canRemediationRead = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.remediation.read),
  );
  readonly canRemediationManage = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.remediation.manage),
  );
  readonly canSuccessRead = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.success.read));
  readonly canSuccessManage = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.success.manage),
  );
  readonly canCertRead = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.certifications.read),
  );
  readonly canCertIssue = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.certifications.issue),
  );
  readonly canCertRevoke = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.certifications.revoke),
  );

  resultEntry = {
    attemptId: '',
    importMode: false,
    outcome: 'Passed',
    score: null as number | null,
    failureReasonCode: '',
    comments: '',
    sourceKind: 'Manual',
    providerCode: 'Manual',
    externalResultId: '',
    evidenceDocumentId: '',
    receivedAtUtc: '',
  };
  verificationReference = '';
  correction = {
    outcome: 'Passed',
    score: null as number | null,
    failureReasonCode: '',
    comments: '',
    sourceKind: 'Manual',
    providerCode: 'Manual',
    externalResultId: '',
    evidenceDocumentId: '',
    receivedAtUtc: '',
    correctionReason: '',
  };
  finding = {
    kind: 'OfficialFailureReason',
    code: '',
    detail: '',
    critical: false,
    source: 'Manual',
  };
  narrative = { instructorAnalysis: '', studentFeedback: '', recommendation: '' };
  failureCompletion = { summary: '', recommendation: '' };
  remediationForm = {
    trainingPathId: '',
    responsibleUserId: '',
    reviewDate: '',
    targetDate: '',
    mockExamRequired: false,
    fundingReviewRequired: false,
    recommendedHours: null as number | null,
  };
  remediationCancelReason = '';
  attestationForm = {
    type: 'SuccessAttestation',
    reference: '',
    templateCode: '',
    templateVersion: 1,
    documentId: '',
    documentSha256: '',
    publicVerificationToken: '',
    expiresAtUtc: '',
    supersedesAttestationId: '',
  };
  attestationCorrection = {
    templateCode: '',
    templateVersion: 1,
    documentId: '',
    documentSha256: '',
    publicVerificationToken: '',
  };
  signForm = { signatureProcessReference: '', signatureEvidenceHash: '' };
  deliveryChannel = 'Email';
  revokeForm = { reasonCode: '', notes: '' };

  load(): void {
    if (!this.studentId.trim()) return;
    this.loading.set(true);
    this.messages.set([]);
    this.clearSelection();
    this.api.getStudentResults(this.studentId.trim()).subscribe({
      next: (values) => {
        this.items.set(values);
        this.loading.set(false);
        if (values.length) this.select(values[0]);
      },
      error: (e: HttpErrorResponse) => {
        this.messages.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }

  select(item: ExamResult): void {
    this.selected.set(item);
    this.activeTab.set('result');
    this.loadContext(item);
  }

  private loadContext(item: ExamResult): void {
    this.contextLoading.set(true);
    this.failure.set(null);
    this.remediation.set(null);
    this.success.set(null);
    this.consequences.set([]);
    this.attestations.set([]);
    let remaining = 1;
    const done = () => {
      remaining--;
      if (remaining <= 0) this.contextLoading.set(false);
    };
    if (this.canCertRead()) {
      remaining++;
      this.api.getResultAttestations(item.id).subscribe({
        next: (v) => {
          this.attestations.set(v);
          done();
        },
        error: () => done(),
      });
    }
    if (item.outcome === 'Failed' && this.canFailureRead()) {
      remaining++;
      this.api.getFailureAnalysis(item.id).subscribe({
        next: (v) => {
          this.failure.set(v);
          done();
          this.loadRemediation(v);
        },
        error: () => done(),
      });
    }
    if (item.outcome === 'Passed' && this.canSuccessRead()) {
      remaining += 2;
      this.api.getSuccessProcess(item.id).subscribe({
        next: (v) => {
          this.success.set(v);
          done();
        },
        error: () => done(),
      });
      this.api.getSuccessConsequences(item.id).subscribe({
        next: (v) => {
          this.consequences.set(v);
          done();
        },
        error: () => done(),
      });
    }
    done();
  }

  private loadRemediation(analysis: ExamFailureAnalysis): void {
    if (!this.canRemediationRead()) return;
    this.contextLoading.set(true);
    this.api.getRemediationByResult(analysis.examResultId, analysis.resultRevision).subscribe({
      next: (v) => {
        this.remediation.set(v);
        this.contextLoading.set(false);
      },
      error: () => this.contextLoading.set(false),
    });
  }

  open(mode: DrawerMode, attestation: ExamAttestation | null = null): void {
    const result = this.selected();
    if (!result) return;
    this.selectedAttestation.set(attestation);
    if (mode === 'correct')
      this.correction = {
        outcome: result.outcome,
        score: result.score,
        failureReasonCode: result.failureReasonCode ?? '',
        comments: result.comments ?? '',
        sourceKind: result.sourceKind,
        providerCode: result.providerCode,
        externalResultId: result.externalResultId ?? '',
        evidenceDocumentId: result.evidenceDocumentId ?? '',
        receivedAtUtc: result.receivedAtUtc.slice(0, 16),
        correctionReason: '',
      };
    if (mode === 'narrative' && this.failure())
      this.narrative = {
        instructorAnalysis: this.failure()!.instructorAnalysis ?? '',
        studentFeedback: this.failure()!.studentFeedback ?? '',
        recommendation: this.failure()!.recommendation ?? '',
      };
    if (mode === 'configureRemediation' && this.remediation()) {
      const r = this.remediation()!;
      this.remediationForm = {
        trainingPathId: r.trainingPathId ?? '',
        responsibleUserId: r.responsibleUserId ?? '',
        reviewDate: r.reviewDate ?? '',
        targetDate: r.targetDate ?? '',
        mockExamRequired: r.mockExamRequired,
        fundingReviewRequired: r.fundingReviewRequired,
        recommendedHours: r.recommendedHours,
      };
    }
    if (mode === 'correctAttestation' && attestation?.revisions.length) {
      const rev = attestation.revisions[attestation.revisions.length - 1];
      this.attestationCorrection = {
        templateCode: rev.templateCode,
        templateVersion: rev.templateVersion,
        documentId: rev.documentId,
        documentSha256: rev.documentSha256,
        publicVerificationToken: '',
      };
    }
    this.drawerMode.set(mode);
  }

  closeDrawer(): void {
    this.drawerMode.set(null);
    this.selectedAttestation.set(null);
  }

  recordResult(): void {
    if (
      !this.resultEntry.attemptId.trim() ||
      !this.resultEntry.receivedAtUtc ||
      !this.resultEntry.providerCode.trim()
    )
      return;
    const request = {
      outcome: this.resultEntry.outcome,
      score: this.resultEntry.score,
      failureReasonCode: this.resultEntry.failureReasonCode.trim() || null,
      comments: this.resultEntry.comments.trim() || null,
      sourceKind: this.resultEntry.sourceKind,
      providerCode: this.resultEntry.providerCode.trim(),
      externalResultId: this.resultEntry.externalResultId.trim() || null,
      evidenceDocumentId: this.resultEntry.evidenceDocumentId.trim() || null,
      receivedAtUtc: new Date(this.resultEntry.receivedAtUtc).toISOString(),
      operationId: crypto.randomUUID(),
    };
    const call = this.resultEntry.importMode
      ? this.api.importResult(this.resultEntry.attemptId.trim(), request)
      : this.api.recordResult(this.resultEntry.attemptId.trim(), request);
    this.run(call, (v) => {
      this.items.update((items) => [v, ...items.filter((x) => x.id !== v.id)]);
      this.selected.set(v);
      this.loadContext(v);
    });
  }
  verify(): void {
    const r = this.selected();
    if (!r || !this.verificationReference.trim()) return;
    this.run(this.api.verifyResult(r.id, this.verificationReference.trim()), (v) =>
      this.updateSelected(v),
    );
  }
  finalize(): void {
    const r = this.selected();
    if (!r) return;
    this.run(this.api.finalizeResult(r.id), (v) => this.updateSelected(v), false);
  }
  correct(): void {
    const r = this.selected();
    if (!r || !this.correction.correctionReason.trim()) return;
    this.run(
      this.api.correctResult(r.id, {
        outcome: this.correction.outcome,
        score: this.correction.score,
        failureReasonCode: this.correction.failureReasonCode.trim() || null,
        comments: this.correction.comments.trim() || null,
        sourceKind: this.correction.sourceKind,
        providerCode: this.correction.providerCode.trim(),
        externalResultId: this.correction.externalResultId.trim() || null,
        evidenceDocumentId: this.correction.evidenceDocumentId.trim() || null,
        receivedAtUtc: new Date(this.correction.receivedAtUtc).toISOString(),
        correctionReason: this.correction.correctionReason.trim(),
        operationId: crypto.randomUUID(),
      }),
      (v) => this.updateSelected(v),
    );
  }
  addFinding(): void {
    const r = this.selected(),
      a = this.failure();
    if (!r || !a || !this.finding.code.trim()) return;
    this.run(
      this.api.addFailureFinding(r.id, a.resultRevision, {
        kind: this.finding.kind,
        code: this.finding.code.trim(),
        detail: this.finding.detail.trim() || null,
        critical: this.finding.critical,
        source: this.finding.source,
      }),
      (v) => this.failure.set(v),
    );
  }
  saveNarrative(): void {
    const r = this.selected(),
      a = this.failure();
    if (!r || !a) return;
    this.run(
      this.api.updateFailureNarrative(r.id, a.resultRevision, {
        instructorAnalysis: this.narrative.instructorAnalysis.trim() || null,
        studentFeedback: this.narrative.studentFeedback.trim() || null,
        recommendation: this.narrative.recommendation.trim() || null,
      }),
      (v) => this.failure.set(v),
    );
  }
  completeFailure(): void {
    const r = this.selected(),
      a = this.failure();
    if (!r || !a || !this.failureCompletion.summary.trim()) return;
    this.run(
      this.api.completeFailureAnalysis(r.id, a.resultRevision, {
        summary: this.failureCompletion.summary.trim(),
        recommendation: this.failureCompletion.recommendation.trim() || null,
      }),
      (v) => {
        this.failure.set(v);
        this.loadRemediation(v);
      },
    );
  }
  createRemediation(): void {
    const r = this.selected(),
      a = this.failure();
    if (!r || !a) return;
    this.run(
      this.api.createRemediation(r.id, a.resultRevision),
      (v) => this.remediation.set(v),
      false,
    );
  }
  configureRemediation(): void {
    const r = this.remediation();
    if (
      !r ||
      !this.remediationForm.trainingPathId ||
      !this.remediationForm.responsibleUserId ||
      !this.remediationForm.reviewDate
    )
      return;
    this.run(
      this.api.configureRemediation(r.id, {
        trainingPathId: this.remediationForm.trainingPathId,
        responsibleUserId: this.remediationForm.responsibleUserId,
        reviewDate: this.remediationForm.reviewDate,
        targetDate: this.remediationForm.targetDate || null,
        mockExamRequired: this.remediationForm.mockExamRequired,
        fundingReviewRequired: this.remediationForm.fundingReviewRequired,
        recommendedHours: this.remediationForm.recommendedHours,
      }),
      (v) => this.remediation.set(v),
    );
  }
  remediationAction(action: 'provision' | 'refresh' | 'validate-representation'): void {
    const r = this.remediation();
    if (!r) return;
    this.run(this.api.remediationAction(r.id, action), (v) => this.remediation.set(v), false);
  }
  cancelRemediation(): void {
    const r = this.remediation();
    if (!r || !this.remediationCancelReason.trim()) return;
    this.run(this.api.cancelRemediation(r.id, this.remediationCancelReason.trim()), (v) =>
      this.remediation.set(v),
    );
  }
  completeSuccess(): void {
    const r = this.selected(),
      s = this.success();
    if (!r || !s) return;
    this.run(
      this.api.completeSuccessProcess(r.id, s.resultRevision),
      (v) => this.success.set(v),
      false,
    );
  }
  archiveSuccess(): void {
    const r = this.selected(),
      s = this.success();
    if (!r || !s) return;
    this.run(
      this.api.archiveSuccessProcess(r.id, s.resultRevision),
      (v) => this.success.set(v),
      false,
    );
  }
  requeueConsequences(): void {
    const r = this.selected();
    if (!r) return;
    this.run(this.api.requeueSuccessConsequences(r.id), (v) => this.consequences.set(v), false);
  }
  issueAttestation(): void {
    const r = this.selected();
    if (
      !r ||
      !this.attestationForm.reference.trim() ||
      !this.attestationForm.templateCode.trim() ||
      !this.attestationForm.documentId.trim() ||
      !this.attestationForm.documentSha256.trim()
    )
      return;
    this.run(
      this.api.issueAttestation(r.id, {
        type: this.attestationForm.type,
        reference: this.attestationForm.reference.trim(),
        templateCode: this.attestationForm.templateCode.trim(),
        templateVersion: this.attestationForm.templateVersion,
        documentId: this.attestationForm.documentId.trim(),
        documentSha256: this.attestationForm.documentSha256.trim(),
        publicVerificationToken: this.attestationForm.publicVerificationToken.trim() || null,
        expiresAtUtc: this.attestationForm.expiresAtUtc
          ? new Date(this.attestationForm.expiresAtUtc).toISOString()
          : null,
        supersedesAttestationId: this.attestationForm.supersedesAttestationId.trim() || null,
        operationId: crypto.randomUUID(),
      }),
      () => this.reloadAttestations(),
    );
  }
  correctAttestation(): void {
    const a = this.selectedAttestation();
    if (
      !a ||
      !this.attestationCorrection.templateCode.trim() ||
      !this.attestationCorrection.documentId.trim() ||
      !this.attestationCorrection.documentSha256.trim()
    )
      return;
    this.run(
      this.api.correctAttestation(a.id, {
        templateCode: this.attestationCorrection.templateCode.trim(),
        templateVersion: this.attestationCorrection.templateVersion,
        documentId: this.attestationCorrection.documentId.trim(),
        documentSha256: this.attestationCorrection.documentSha256.trim(),
        publicVerificationToken: this.attestationCorrection.publicVerificationToken.trim() || null,
      }),
      () => this.reloadAttestations(),
    );
  }
  signAttestation(): void {
    const a = this.selectedAttestation();
    if (
      !a ||
      !this.signForm.signatureProcessReference.trim() ||
      !this.signForm.signatureEvidenceHash.trim()
    )
      return;
    this.run(
      this.api.signAttestation(a.id, {
        signatureProcessReference: this.signForm.signatureProcessReference.trim(),
        signatureEvidenceHash: this.signForm.signatureEvidenceHash.trim(),
      }),
      () => this.reloadAttestations(),
    );
  }
  deliverAttestation(): void {
    const a = this.selectedAttestation();
    if (!a) return;
    this.run(this.api.deliverAttestation(a.id, this.deliveryChannel), () =>
      this.reloadAttestations(),
    );
  }
  revokeAttestation(): void {
    const a = this.selectedAttestation();
    if (!a || !this.revokeForm.reasonCode.trim()) return;
    this.run(
      this.api.revokeAttestation(a.id, {
        reasonCode: this.revokeForm.reasonCode.trim(),
        notes: this.revokeForm.notes.trim() || null,
      }),
      () => this.reloadAttestations(),
    );
  }

  private reloadAttestations(): void {
    const r = this.selected();
    if (!r) return;
    this.api
      .getResultAttestations(r.id)
      .subscribe({
        next: (v) => this.attestations.set(v),
        error: (e: HttpErrorResponse) => this.messages.set(this.errors.getMessages(e)),
      });
  }
  private updateSelected(value: ExamResult): void {
    this.selected.set(value);
    this.items.update((items) => items.map((x) => (x.id === value.id ? value : x)));
    this.loadContext(value);
  }
  private run<T>(request: Observable<T>, next: (v: T) => void, close = true): void {
    this.saving.set(true);
    this.messages.set([]);
    request.subscribe({
      next: (v: T) => {
        next(v);
        this.saving.set(false);
        if (close) this.closeDrawer();
      },
      error: (e: HttpErrorResponse) => {
        this.messages.set(this.errors.getMessages(e));
        this.saving.set(false);
      },
    });
  }
  private clearSelection(): void {
    this.selected.set(null);
    this.failure.set(null);
    this.remediation.set(null);
    this.success.set(null);
    this.consequences.set([]);
    this.attestations.set([]);
  }
}
