import { DatePipe, JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';
import { AssessmentSessionsApiService } from '../../data-access/assessment-sessions-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import {
  AssessmentResult,
  AssessmentResultConfidence,
  AssessmentResultContent,
} from '../../models/assessment-result.model';

const EMPTY_RESULT: AssessmentResultContent = {
  summary: '', masteredPoints: [], improvementPoints: [], supportNeeds: [],
  theoryHours: null, practicalHoursMin: null, practicalHoursMax: null,
  simulatorHours: null, roadHours: null, intermediateAssessments: null,
  languageSupportRequired: false, adaptedEquipmentRequired: false,
  recommendedDeliveryMode: '', recommendedTraining: '', alternatives: [], prospectComment: '',
};

@Component({
  selector: 'driveos-assessment-result-page',
  standalone: true,
  imports: [DatePipe, JsonPipe, ReactiveFormsModule, TranslatePipe, DriveOsButtonComponent,
    DriveOsCardComponent, DriveOsInputDirective, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './assessment-result.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentResultPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AssessmentSessionsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly result = signal<AssessmentResult | null>(null);
  readonly aiSuggestion = signal<unknown | null>(null);
  readonly loading = signal(true);
  readonly working = signal(false);
  readonly loadFailed = signal(false);
  readonly canRead = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.result.read));
  readonly canCreate = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.result.create));
  readonly canValidate = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.result.validate));
  readonly canShare = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.result.share));
  readonly canCreateOffer = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.create));
  readonly editable = computed(() => this.canCreate() && ['None', 'Draft', 'CorrectionRequested'].includes(this.result()?.status ?? 'None'));
  readonly validated = computed(() => ['Validated', 'Shared'].includes(this.result()?.status ?? ''));

  readonly form = this.fb.nonNullable.group({
    summary: ['', [Validators.required, Validators.maxLength(8000)]],
    masteredPoints: [''], improvementPoints: [''], supportNeeds: [''],
    theoryHours: this.fb.control<number | null>(null),
    practicalHoursMin: this.fb.control<number | null>(null, Validators.min(0)),
    practicalHoursMax: this.fb.control<number | null>(null, Validators.min(0)),
    simulatorHours: this.fb.control<number | null>(null, Validators.min(0)),
    roadHours: this.fb.control<number | null>(null, Validators.min(0)),
    intermediateAssessments: this.fb.control<number | null>(null, Validators.min(0)),
    languageSupportRequired: [false], adaptedEquipmentRequired: [false],
    recommendedDeliveryMode: [''],
    recommendedTraining: ['', [Validators.required, Validators.maxLength(2000)]],
    alternatives: [''], prospectComment: ['', Validators.maxLength(8000)],
    confidence: this.fb.control<AssessmentResultConfidence>('Medium', {
      nonNullable: true,
      validators: Validators.required,
    }),
    correctionReason: ['', Validators.maxLength(2000)],
  });

  private readonly appointmentId = this.route.snapshot.paramMap.get('appointmentId');

  constructor() {
    if (!this.appointmentId) { void this.router.navigate(['/crm']); return; }
    this.load();
  }

  back(): void { void this.router.navigate(['/crm/assessments', this.appointmentId, 'perform']); }

  save(): void {
    const current = this.result();
    if (!current || !this.appointmentId || !this.editable() || this.form.invalid) return;
    this.execute(() => this.api.saveResult(this.appointmentId!, {
      expectedRevision: current.revision,
      result: this.toContent(),
      confidence: this.form.controls.confidence.value,
      aiSuggestion: this.aiSuggestion(),
    }), 'crm.assessments.result.messages.saved');
  }

  requestCorrection(): void {
    const current = this.result();
    const reason = this.form.controls.correctionReason.value.trim();
    if (!current || !this.appointmentId || !this.canValidate() || !reason) return;
    this.execute(() => this.api.requestResultCorrection(this.appointmentId!, current.revision, reason),
      'crm.assessments.result.messages.correctionRequested');
  }

  validate(): void {
    const current = this.result();
    if (!current || !this.appointmentId || !this.canValidate() || current.status !== 'Draft') return;
    this.execute(() => this.api.validateResult(this.appointmentId!, current.revision),
      'crm.assessments.result.messages.validated');
  }

  share(): void {
    const current = this.result();
    if (!current || !this.appointmentId || !this.canShare() || current.status !== 'Validated') return;
    this.execute(() => this.api.shareResult(this.appointmentId!, current.revision),
      'crm.assessments.result.messages.shared');
  }

  createOffer(): void {
    const current = this.result();
    if (!current || !this.validated() || !this.canCreateOffer()) return;
    void this.router.navigate(['/crm/leads', current.leadId, 'offers', 'new'], {
      queryParams: { assessmentId: current.appointmentId },
    });
  }

  private load(): void {
    if (!this.appointmentId || !this.canRead()) { this.loading.set(false); return; }
    this.loading.set(true); this.loadFailed.set(false);
    this.api.getResult(this.appointmentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.apply(result); this.loading.set(false); },
      error: (error) => { this.loading.set(false); this.loadFailed.set(true); this.showError(error); },
    });
  }

  private execute(action: () => ReturnType<AssessmentSessionsApiService['shareResult']>, successKey: string): void {
    this.working.set(true);
    action().pipe(
      switchMap(() => this.api.getResult(this.appointmentId!)),
      finalize(() => this.working.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => { this.apply(result); this.toast.success(this.translate.instant(successKey)); },
      error: (error) => this.showError(error),
    });
  }

  private apply(result: AssessmentResult): void {
    this.result.set(result);
    const content = this.parseContent(result.resultJson);
    this.aiSuggestion.set(this.parseJson(result.aiSuggestionJson));
    this.form.patchValue({
      ...content,
      masteredPoints: content.masteredPoints.join('\n'),
      improvementPoints: content.improvementPoints.join('\n'),
      supportNeeds: content.supportNeeds.join('\n'),
      alternatives: content.alternatives.join('\n'),
      confidence: result.confidence ?? 'Medium',
      correctionReason: result.correctionReason ?? '',
    }, { emitEvent: false });
    this.editable() ? this.form.enable({ emitEvent: false }) : this.form.disable({ emitEvent: false });
    if (this.canValidate()) this.form.controls.correctionReason.enable({ emitEvent: false });
  }

  private toContent(): AssessmentResultContent {
    const value = this.form.getRawValue();
    return {
      summary: value.summary.trim(),
      masteredPoints: this.lines(value.masteredPoints),
      improvementPoints: this.lines(value.improvementPoints),
      supportNeeds: this.lines(value.supportNeeds),
      theoryHours: value.theoryHours,
      practicalHoursMin: value.practicalHoursMin,
      practicalHoursMax: value.practicalHoursMax,
      simulatorHours: value.simulatorHours,
      roadHours: value.roadHours,
      intermediateAssessments: value.intermediateAssessments,
      languageSupportRequired: value.languageSupportRequired,
      adaptedEquipmentRequired: value.adaptedEquipmentRequired,
      recommendedDeliveryMode: value.recommendedDeliveryMode.trim(),
      recommendedTraining: value.recommendedTraining.trim(),
      alternatives: this.lines(value.alternatives),
      prospectComment: value.prospectComment.trim(),
    };
  }

  private parseContent(value: string | null): AssessmentResultContent {
    const parsed = this.parseJson(value);
    return parsed && typeof parsed === 'object' ? { ...EMPTY_RESULT, ...parsed as AssessmentResultContent } : { ...EMPTY_RESULT };
  }

  private parseJson(value: string | null): unknown | null {
    if (!value) return null;
    try { return JSON.parse(value); } catch { return null; }
  }

  private lines(value: string): string[] { return value.split('\n').map((item) => item.trim()).filter(Boolean); }
  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error)) this.toast.error(this.translate.instant('errors.title'), message);
  }
}
