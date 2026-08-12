import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent, DriveOsCardComponent, DriveOsInputDirective,
  DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsToastService } from '../../../../shared/ui';
import { AssessmentSessionsApiService } from '../../data-access/assessment-sessions-api.service';
import { CommercialOffersApiService } from '../../data-access/commercial-offers-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { AssessmentResult } from '../../models/assessment-result.model';
import { CommercialOffer, CommercialOfferLineDraft, OfferLineType, OfferPriceSource } from '../../models/commercial-offer.model';

@Component({
  selector: 'driveos-offer-create-page', standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, DriveOsButtonComponent,
    DriveOsCardComponent, DriveOsInputDirective, DriveOsSpinnerComponent, DriveOsStateBannerComponent],
  templateUrl: './offer-create.page.html', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferCreatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessments = inject(AssessmentSessionsApiService);
  private readonly offers = inject(CommercialOffersApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly step = signal(0);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadFailed = signal(false);
  readonly result = signal<AssessmentResult | null>(null);
  readonly preview = signal<CommercialOffer | null>(null);
  readonly canCreate = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.create));
  readonly steps = ['training', 'services', 'options', 'pricing', 'funding', 'conditions', 'preview'];
  readonly lineTypes: OfferLineType[] = ['RegistrationFee', 'TheoryTraining', 'PracticalLesson',
    'SimulatorLesson', 'InitialAssessment', 'PedagogicalReview', 'ExamSupport', 'VehicleExamRental',
    'DigitalAccess', 'AdministrativeService', 'PartnerTraining', 'Other'];
  readonly priceSources: OfferPriceSource[] = ['StandardCatalog', 'BranchCatalog', 'NegotiatedPrice',
    'Campaign', 'PartnerAgreement', 'ManualOverride'];

  readonly form = this.fb.nonNullable.group({
    trainingCode: ['', [Validators.required, Validators.maxLength(100)]],
    branchId: [''], currency: ['EUR', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    validUntil: ['', Validators.required], estimatedFundingAmount: [0, Validators.min(0)],
    financingNotes: ['', Validators.maxLength(4000)], conditions: ['', Validators.maxLength(8000)],
    internalNotes: ['', Validators.maxLength(8000)], lines: this.fb.array<any>([]),
  });

  private readonly leadId = this.route.snapshot.paramMap.get('leadId');
  private readonly appointmentId = this.route.snapshot.queryParamMap.get('assessmentId');

  constructor() {
    if (!this.leadId || !this.appointmentId) { this.loading.set(false); this.loadFailed.set(true); return; }
    if (!this.canCreate()) { this.loading.set(false); return; }
    this.assessments.getResult(this.appointmentId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => {
        if (!['Validated', 'Shared'].includes(result.status) || result.leadId !== this.leadId) {
          this.loadFailed.set(true);
        } else {
          this.result.set(result);
          this.seedFromAssessment(result);
        }
        this.loading.set(false);
      },
      error: (error) => { this.loading.set(false); this.loadFailed.set(true); this.showError(error); },
    });
  }

  get lines(): FormArray { return this.form.controls.lines; }

  addLine(type: OfferLineType = 'PracticalLesson'): void {
    this.lines.push(this.fb.nonNullable.group({
      type: [type, Validators.required], serviceId: [''], description: ['', [Validators.required, Validators.maxLength(500)]],
      quantity: [1, [Validators.required, Validators.min(0.01)]], unit: ['unit', Validators.required],
      unitPrice: [0, [Validators.required, Validators.min(0)]], discountAmount: [0, Validators.min(0)],
      taxRate: [0, [Validators.min(0), Validators.max(100)]], mandatory: [false],
      priceSource: ['StandardCatalog' as OfferPriceSource, Validators.required], manualOverrideReason: [''],
    }));
  }

  removeLine(index: number): void { if (!this.lines.at(index).value.mandatory) this.lines.removeAt(index); }
  previous(): void { this.step.update((value) => Math.max(0, value - 1)); }
  next(): void { if (this.step() < this.steps.length - 1) this.step.update((value) => value + 1); }
  back(): void { void this.router.navigate(['/crm/assessments', this.appointmentId, 'result']); }

  catalogAmount(): number { return this.lineValues().reduce((sum, line) => sum + line.quantity * line.unitPrice, 0); }
  discountAmount(): number { return this.lineValues().reduce((sum, line) => sum + line.discountAmount, 0); }
  taxAmount(): number { return this.lineValues().reduce((sum, line) => {
    const net = Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
    return sum + net * line.taxRate / 100;
  }, 0); }
  totalAmount(): number { return Math.max(0, this.catalogAmount() - this.discountAmount()) + this.taxAmount(); }
  remainingAmount(): number { return Math.max(0, this.totalAmount() - Number(this.form.controls.estimatedFundingAmount.value)); }

  generate(): void {
    const result = this.result();
    if (!result || !this.leadId || !this.canCreate() || this.form.invalid || !this.lines.length || !this.manualReasonsValid()) {
      this.form.markAllAsTouched(); return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.offers.generate(this.leadId, {
      assessmentSessionId: result.sessionId, branchId: value.branchId.trim() || null,
      trainingCode: value.trainingCode.trim(), currency: value.currency.trim().toUpperCase(),
      validUntilUtc: new Date(`${value.validUntil}T23:59:59`).toISOString(),
      estimatedFundingAmount: Number(value.estimatedFundingAmount), financingNotes: value.financingNotes.trim() || null,
      conditions: value.conditions.trim() || null, internalNotes: value.internalNotes.trim() || null,
      lines: this.lineValues(),
    }).pipe(
      switchMap(({ offerId }) => this.offers.getById(offerId)),
      finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (offer) => { this.preview.set(offer); this.toast.success(this.translate.instant('crm.offers.messages.created')); },
      error: (error) => this.showError(error),
    });
  }

  private seedFromAssessment(result: AssessmentResult): void {
    const content = this.parseJson(result.resultJson) as Record<string, unknown> | null;
    this.form.patchValue({ trainingCode: String(content?.['recommendedTraining'] ?? ''),
      validUntil: this.dateInDays(30) });
    this.addLine('InitialAssessment');
    this.lines.at(0).patchValue({ description: this.translate.instant('crm.offers.defaults.assessment'), mandatory: true });
    const hours = Number(content?.['practicalHoursMin'] ?? 0);
    if (hours > 0) {
      this.addLine('PracticalLesson');
      this.lines.at(1).patchValue({ description: this.translate.instant('crm.offers.defaults.practical'), quantity: hours, unit: 'hour', mandatory: true });
    }
  }

  private lineValues(): CommercialOfferLineDraft[] {
    return this.lines.getRawValue().map((line: any) => ({ ...line, serviceId: line.serviceId.trim() || null,
      description: line.description.trim(), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice),
      discountAmount: Number(line.discountAmount), taxRate: Number(line.taxRate),
      manualOverrideReason: line.manualOverrideReason.trim() || null }));
  }
  private manualReasonsValid(): boolean { return this.lineValues().every((line) => line.priceSource !== 'ManualOverride' || !!line.manualOverrideReason); }
  private dateInDays(days: number): string { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
  private parseJson(value: string | null): unknown | null { if (!value) return null; try { return JSON.parse(value); } catch { return null; } }
  private showError(error: HttpErrorResponse): void { for (const message of this.errors.getMessages(error)) this.toast.error(this.translate.instant('errors.title'), message); }
}
