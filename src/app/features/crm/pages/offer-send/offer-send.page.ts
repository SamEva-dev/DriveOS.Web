import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { CommercialOffersApiService } from '../../data-access/commercial-offers-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import {
  CommercialOffer,
  OfferDeliveryChannel,
  OfferRecipientType,
  SendCommercialOfferResponse,
} from '../../models/commercial-offer.model';

type OfferRecipientForm = FormGroup<{
  type: FormControl<OfferRecipientType>;
  displayName: FormControl<string>;
  address: FormControl<string>;
}>;

@Component({
  selector: 'driveos-offer-send-page',
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
  templateUrl: './offer-send.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferSendPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(CommercialOffersApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly offer = signal<CommercialOffer | null>(null);
  readonly result = signal<SendCommercialOfferResponse | null>(null);
  readonly loadFailed = signal(false);
  readonly canSend = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.send));
  readonly canSubmit = computed(() =>
    this.auth.hasPermission(CRM_PERMISSIONS.offers.submitForApproval),
  );
  readonly canApprove = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.approve));
  readonly channels: OfferDeliveryChannel[] = [
    'Email',
    'SmsLink',
    'StudentPortal',
    'GuardianPortal',
    'Printed',
    'SecureLink',
  ];
  readonly recipientTypes: OfferRecipientType[] = [
    'Prospect',
    'LegalRepresentative',
    'Payer',
    'Company',
    'Funder',
  ];

  readonly form = this.fb.nonNullable.group({
    channel: ['Email' as OfferDeliveryChannel, Validators.required],
    subject: ['', [Validators.required, Validators.maxLength(250)]],
    message: ['', [Validators.required, Validators.maxLength(8000)]],
    language: ['fr', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
    documentReference: ['', [Validators.required, Validators.maxLength(500)]],
    attachmentReferences: [''],
    secureLinkLifetimeHours: [168, [Validators.required, Validators.min(1), Validators.max(720)]],
    recipients: this.fb.array<OfferRecipientForm>([]),
  });

  private readonly offerId = this.route.snapshot.paramMap.get('offerId');

  constructor() {
    this.addRecipient();
    if (!this.offerId) {
      this.loading.set(false);
      this.loadFailed.set(true);
      return;
    }
    this.load();
  }

  get recipients(): FormArray<OfferRecipientForm> {
    return this.form.controls.recipients;
  }

  addRecipient(): void {
    this.recipients.push(
      this.fb.nonNullable.group({
        type: ['Prospect' as OfferRecipientType, Validators.required],
        displayName: ['', [Validators.required, Validators.maxLength(200)]],
        address: ['', [Validators.required, Validators.maxLength(320)]],
      }),
    );
  }

  removeRecipient(index: number): void {
    if (this.recipients.length > 1) this.recipients.removeAt(index);
  }

  submitForReview(): void {
    this.changeStatus(() => this.api.submitForReview(this.offerId!));
  }
  approve(): void {
    this.changeStatus(() => this.api.approve(this.offerId!));
  }

  send(): void {
    if (
      !this.offerId ||
      !this.canSend() ||
      !['Approved', 'Sent'].includes(this.offer()?.status ?? '') ||
      this.form.invalid
    ) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api
      .send(this.offerId, {
        channel: value.channel,
        recipients: value.recipients,
        subject: value.subject.trim(),
        message: value.message.trim(),
        language: value.language.trim(),
        documentReference: value.documentReference.trim(),
        attachmentReferences: value.attachmentReferences
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
        secureLinkLifetimeHours: Number(value.secureLinkLifetimeHours),
      })
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.result.set(response);
          this.load();
          this.toast.success(this.translate.instant('crm.offers.send.messages.prepared'));
        },
        error: (error) => this.showError(error),
      });
  }

  back(): void {
    const leadId = this.offer()?.leadId;
    void this.router.navigate(leadId ? ['/crm/leads', leadId, 'offers', 'compare'] : ['/crm']);
  }

  private load(): void {
    this.api
      .getById(this.offerId!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (offer) => {
          this.offer.set(offer);
          this.form.patchValue({
            subject: this.translate.instant('crm.offers.send.defaultSubject', {
              version: offer.version,
            }),
            message: this.translate.instant('crm.offers.send.defaultMessage', {
              date: new Date(offer.validUntilUtc).toLocaleDateString(),
            }),
            documentReference: `offers/${offer.id}/v${offer.version}.pdf`,
          });
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.showError(error);
        },
      });
  }

  private changeStatus(
    operation: () => ReturnType<CommercialOffersApiService['submitForReview']>,
  ): void {
    this.saving.set(true);
    operation()
      .pipe(
        switchMap(() => this.api.getById(this.offerId!)),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (offer) => this.offer.set(offer),
        error: (error) => this.showError(error),
      });
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error))
      this.toast.error(this.translate.instant('errors.title'), message);
  }
}
