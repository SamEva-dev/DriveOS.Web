import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { forkJoin, finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';
import { CommercialOffersApiService } from '../../data-access/commercial-offers-api.service';
import { ConvertLeadResponse, LeadsApiService } from '../../data-access/leads-api.service';
import { CommercialOffer } from '../../models/commercial-offer.model';
import { LeadDetails } from '../../models/lead.model';

@Component({
  selector: 'driveos-lead-convert-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './lead-convert.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadConvertPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leads = inject(LeadsApiService);
  private readonly offersApi = inject(CommercialOffersApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errors = inject(ApiErrorService);
  private readonly toast = inject(DriveOsToastService);
  private readonly translate = inject(TranslateService);
  readonly leadId = this.route.snapshot.paramMap.get('leadId') ?? '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly step = signal(0);
  readonly lead = signal<LeadDetails | null>(null);
  readonly offers = signal<CommercialOffer[]>([]);
  readonly result = signal<ConvertLeadResponse | null>(null);
  readonly steps = [
    'identity',
    'organization',
    'training',
    'relations',
    'documents',
    'offer',
    'confirmation',
  ];
  readonly form = this.fb.nonNullable.group({
    identityVerified: [false, Validators.requiredTrue],
    duplicateCheckCompleted: [false, Validators.requiredTrue],
    consentsVerified: [false, Validators.requiredTrue],
    branchId: ['', Validators.required],
    responsibleUserId: ['', Validators.required],
    trainingCode: ['', [Validators.required, Validators.maxLength(100)]],
    guardianSummary: ['', Validators.maxLength(2000)],
    payerSummary: ['', Validators.maxLength(2000)],
    requiredDocumentCodes: [''],
    acceptedOfferId: ['', Validators.required],
  });

  constructor() {
    if (!this.leadId) {
      this.loading.set(false);
      return;
    }
    forkJoin({
      lead: this.leads.getById(this.leadId),
      offers: this.offersApi.getByLead(this.leadId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ lead, offers }) => {
          this.lead.set(lead);
          this.offers.set(offers.filter((x) => x.status === 'Accepted'));
          this.form.patchValue({
            branchId: lead.branchId ?? '',
            responsibleUserId: lead.assignedAdvisorId ?? '',
            trainingCode: lead.qualification?.licenseCategory ?? lead.licenseCategory,
            acceptedOfferId: offers.find((x) => x.status === 'Accepted')?.id ?? '',
          });
          this.loading.set(false);
        },
        error: (e) => {
          this.loading.set(false);
          this.showError(e);
        },
      });
  }

  previous(): void {
    this.step.update((x) => Math.max(0, x - 1));
  }
  next(): void {
    this.step.update((x) => Math.min(this.steps.length - 1, x + 1));
  }
  cancel(): void {
    void this.router.navigate(['/crm/leads', this.leadId]);
  }
  submit(): void {
    if (this.form.invalid || !this.leadId) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.leads
      .convert(this.leadId, {
        ...v,
        guardianSummary: v.guardianSummary.trim() || null,
        payerSummary: v.payerSummary.trim() || null,
        requiredDocumentCodes: v.requiredDocumentCodes
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (value) => {
          this.result.set(value);
          this.toast.success(this.translate.instant('crm.conversion.requested'));
        },
        error: (e) => this.showError(e),
      });
  }
  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error))
      this.toast.error(this.translate.instant('errors.title'), message);
  }
}
