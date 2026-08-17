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
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize, switchMap } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
} from '../../../../shared/ui';
import { CommercialOffersApiService } from '../../data-access/commercial-offers-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { CommercialOffer, CommercialOfferLineDraft } from '../../models/commercial-offer.model';

@Component({
  selector: 'driveos-offer-compare-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './offer-compare.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferComparePage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(CommercialOffersApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly failed = signal(false);
  readonly offers = signal<CommercialOffer[]>([]);
  readonly selectedId = signal('');
  readonly selected = computed(() => this.offers().find((x) => x.id === this.selectedId()) ?? null);
  readonly canRead = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.read));
  readonly canCreate = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.offers.create));
  private readonly leadId = this.route.snapshot.paramMap.get('leadId');

  constructor() {
    if (!this.leadId || !this.canRead()) {
      this.loading.set(false);
      return;
    }
    this.load();
  }

  select(id: string): void {
    this.selectedId.set(id);
  }
  line(offer: CommercialOffer, type: string): string {
    const values = offer.lines.filter((x) => x.type === type);
    return values.length ? values.map((x) => `${x.quantity} ${x.unit}`).join(', ') : '—';
  }
  optionalLines(offer: CommercialOffer) {
    return offer.lines.filter((x) => !x.mandatory);
  }
  updateQuantity(lineId: string, quantity: number): void {
    const offer = this.selected();
    const line = offer?.lines.find((x) => x.id === lineId);
    if (line) {
      line.quantity = Math.max(0.01, Number(quantity));
      this.offers.update((items) => [...items]);
    }
  }
  updateDiscount(lineId: string, discount: number): void {
    const offer = this.selected();
    const line = offer?.lines.find((x) => x.id === lineId);
    if (line) {
      line.discountAmount = Math.max(0, Number(discount));
      this.offers.update((items) => [...items]);
    }
  }
  removeOptional(lineId: string): void {
    const offer = this.selected();
    if (!offer) return;
    offer.lines = offer.lines.filter((x) => x.id !== lineId || x.mandatory);
    this.offers.update((items) => [...items]);
  }
  calculatedTotal(offer: CommercialOffer): number {
    return offer.lines.reduce((sum, line) => {
      const net = Math.max(0, line.quantity * line.unitPrice - line.discountAmount);
      return sum + net + (net * line.taxRate) / 100;
    }, 0);
  }
  saveVariant(): void {
    const source = this.selected();
    if (!source || !this.canCreate()) return;
    const lines: CommercialOfferLineDraft[] = source.lines.map(
      ({ id: _id, netAmount: _n, taxAmount: _t, totalAmount: _total, ...line }) => line,
    );
    this.saving.set(true);
    this.api
      .createVariant(source.id, {
        trainingCode: source.trainingCode,
        validUntilUtc: source.validUntilUtc,
        estimatedFundingAmount: Math.min(
          source.estimatedFundingAmount,
          this.calculatedTotal(source),
        ),
        financingNotes: source.financingNotes,
        conditions: source.conditions,
        internalNotes: null,
        lines,
      })
      .pipe(
        switchMap(() => this.api.getByLead(this.leadId!)),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (offers) => this.applyOffers(offers),
        error: () => this.failed.set(true),
      });
  }
  private load(): void {
    this.api
      .getByLead(this.leadId!)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (offers) => this.applyOffers(offers),
        error: () => this.failed.set(true),
      });
  }
  private applyOffers(offers: CommercialOffer[]): void {
    this.offers.set(offers);
    if (!this.selectedId() && offers.length) this.selectedId.set(offers[0].id);
  }
}
