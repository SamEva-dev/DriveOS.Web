import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
} from '../../../../shared/ui';
import { CommercialOffersApiService } from '../../data-access/commercial-offers-api.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { CommercialOffer, OfferInteractionType } from '../../models/commercial-offer.model';

@Component({
  selector: 'driveos-offer-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './offer-detail.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CommercialOffersApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly offerId = this.route.snapshot.paramMap.get('offerId')!;

  readonly offer = signal<CommercialOffer | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly failed = signal(false);
  readonly exchangeTypes: OfferInteractionType[] = [
    'QuestionReceived',
    'ModificationRequested',
    'FollowUpCompleted',
  ];
  readonly canCreateActivity = computed(() =>
    this.auth.hasPermission(CRM_PERMISSIONS.activities.create),
  );
  readonly canRevise = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.revise));
  readonly canWithdraw = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.withdraw));
  readonly canMarkAccepted = computed(() =>
    this.auth.hasPermission(CRM_PERMISSIONS.offers.markAccepted),
  );
  readonly canMarkRejected = computed(() =>
    this.auth.hasPermission(CRM_PERMISSIONS.offers.markRejected),
  );
  readonly exchangeForm = this.fb.nonNullable.group({
    type: ['QuestionReceived' as OfferInteractionType],
    summary: ['', Validators.required],
  });
  readonly followUpForm = this.fb.nonNullable.group({
    nextFollowUpAtUtc: ['', Validators.required],
    note: [''],
  });
  readonly decisionForm = this.fb.nonNullable.group({ reason: ['', Validators.required] });

  constructor() {
    this.load();
  }

  addExchange(): void {
    const v = this.exchangeForm.getRawValue();
    this.mutate(this.api.recordExchange(this.offerId, v.type, v.summary.trim()));
  }
  scheduleFollowUp(): void {
    const v = this.followUpForm.getRawValue();
    this.mutate(
      this.api.scheduleFollowUp(
        this.offerId,
        new Date(v.nextFollowUpAtUtc).toISOString(),
        v.note.trim() || null,
      ),
    );
  }
  accept(): void {
    this.mutate(this.api.markAccepted(this.offerId));
  }
  reject(): void {
    if (this.decisionForm.invalid) return;
    this.mutate(
      this.api.markRejected(this.offerId, this.decisionForm.controls.reason.value.trim()),
    );
  }
  withdraw(): void {
    if (this.decisionForm.invalid) return;
    this.mutate(this.api.withdraw(this.offerId, this.decisionForm.controls.reason.value.trim()));
  }
  revise(): void {
    const leadId = this.offer()?.leadId;
    if (leadId)
      void this.router.navigate(['/crm/leads', leadId, 'offers', 'compare'], {
        queryParams: { sourceOfferId: this.offerId },
      });
  }
  send(): void {
    void this.router.navigate(['/crm/offers', this.offerId, 'send']);
  }

  private load(): void {
    this.api
      .getById(this.offerId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => {
          this.offer.set(value);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  private mutate(operation: ReturnType<CommercialOffersApiService['markAccepted']>): void {
    this.saving.set(true);
    operation
      .pipe(
        switchMap(() => this.api.getById(this.offerId)),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.offer.set(value));
  }
}
