import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ProfessionalApplication } from '../../models/professional-application.model';
import {
  ProfessionalCommercialOffer,
  ProfessionalCommercialOfferTerms,
} from '../../models/professional-commercial-offer.model';
import { ProfessionalProposal } from '../../models/professional-proposal.model';

@Component({
  selector: 'driveos-professional-commercial-offer-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent, DatePipe, NgTemplateOutlet],
  templateUrl: './professional-commercial-offer-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalCommercialOfferDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);

  readonly open = input(false);
  readonly offer = input<ProfessionalCommercialOffer | null>(null);
  readonly application = input<ProfessionalApplication | null>(null);
  readonly sourceProposal = input<ProfessionalProposal | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();

  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly tab = signal<'terms' | 'history'>('terms');
  readonly editMode = signal(false);
  readonly cancelMode = signal(false);

  startsOn = '';
  endsOn = '';
  engagementType = 'HourlyService';
  vehicleProvisionMode = 'Either';
  estimatedMinutes: number | null = null;
  rateAmount: number | null = null;
  currency = 'EUR';
  rateUnit = 'Hour';
  mileageRate: number | null = null;
  vehicleAllowance: number | null = null;
  minimumGuaranteedAmount: number | null = null;
  teachingCategoryCodes = '';
  clauseCodes = '';
  cancelReason = '';

  readonly createMode = computed(() => !this.offer());
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.create),
  );
  readonly canRevise = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.counter),
  );
  readonly canAccept = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.accept),
  );
  readonly canWithdraw = computed(() =>
    this.authorization.hasPermission(
      PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.withdraw,
    ),
  );

  private prepared = false;
  constructor() {
    effect(() => {
      const opened = this.open(),
        offer = this.offer(),
        app = this.application(),
        proposal = this.sourceProposal();
      if (opened && !this.prepared) {
        this.prepared = true;
        if (offer) this.loadTerms(offer.terms);
        else this.prepareCreate(app, proposal);
      }
      if (!opened) this.prepared = false;
    });
  }
  selectTab(t: 'terms' | 'history') {
    this.tab.set(t);
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  beginEdit() {
    const o = this.offer();
    if (!o) return;
    this.loadTerms(o.terms);
    this.editMode.set(true);
    this.cancelMode.set(false);
    this.formErrors.set([]);
  }
  cancelEdit() {
    this.editMode.set(false);
    this.formErrors.set([]);
  }
  beginCancel() {
    this.cancelMode.set(true);
    this.editMode.set(false);
    this.cancelReason = '';
    this.formErrors.set([]);
  }
  cancelCancellation() {
    this.cancelMode.set(false);
    this.cancelReason = '';
  }

  create() {
    const org = this.organizationId(),
      a = this.application(),
      p = this.sourceProposal();
    if (!org || !a || !this.canCreate()) return;
    const sourceProposal = p?.status === 'Accepted' ? p : null;
    if (!sourceProposal && a.status !== 'Accepted') {
      this.formErrors.set([
        this.translate.instant(
          'professionalMarketplace.commercialOffers.errors.acceptedSourceRequired',
        ),
      ]);
      return;
    }
    const terms = this.buildTerms();
    if (!terms) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api
      .createProfessionalCommercialOffer(org, {
        professionalProfileId: a.professionalProfileId,
        applicationId: sourceProposal ? null : a.id,
        proposalId: sourceProposal?.id ?? null,
        opportunityId: a.opportunityId,
        terms,
      })
      .subscribe({ next: () => this.done(), error: (e) => this.fail(e) });
  }
  revise() {
    const org = this.organizationId(),
      o = this.offer();
    if (!org || !o || !this.canRevise()) return;
    const terms = this.buildTerms();
    if (!terms) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api
      .reviseProfessionalCommercialOffer(org, o.id, terms)
      .subscribe({ next: () => this.done(), error: (e) => this.fail(e) });
  }
  send() {
    const org = this.organizationId(),
      o = this.offer();
    if (org && o) this.mutate(this.api.sendProfessionalCommercialOffer(org, o.id));
  }
  acceptByOrganization() {
    const org = this.organizationId(),
      o = this.offer();
    if (org && o) this.mutate(this.api.acceptProfessionalCommercialOfferByOrganization(org, o.id));
  }
  finalize() {
    const org = this.organizationId(),
      o = this.offer();
    if (org && o) this.mutate(this.api.finalizeProfessionalCommercialOffer(org, o.id));
  }
  cancelOffer() {
    const org = this.organizationId(),
      o = this.offer(),
      reason = this.cancelReason.trim();
    if (!org || !o || reason.length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.commercialOffers.errors.cancelReason'),
      ]);
      return;
    }
    this.mutate(this.api.cancelProfessionalCommercialOffer(org, o.id, reason));
  }
  private mutate(r: any) {
    this.busy.set(true);
    this.formErrors.set([]);
    r.subscribe({ next: () => this.done(), error: (e: unknown) => this.fail(e) });
  }
  private done() {
    this.busy.set(false);
    this.editMode.set(false);
    this.cancelMode.set(false);
    this.changed.emit();
    this.closeRequested.emit();
  }
  private fail(e: unknown) {
    this.formErrors.set(this.errors.getMessages(e));
    this.busy.set(false);
  }
  private prepareCreate(a: ProfessionalApplication | null, p: ProfessionalProposal | null) {
    const accepted = p?.status === 'Accepted' ? p : null;
    this.startsOn = accepted?.startsOn ?? a?.availableFrom ?? this.datePlus(1);
    this.endsOn = accepted?.endsOn ?? a?.availableUntil ?? this.datePlus(30);
    this.engagementType = accepted?.engagementType ?? 'HourlyService';
    this.vehicleProvisionMode = accepted?.vehicleProvisionMode ?? 'Either';
    this.rateAmount = accepted?.proposedRate ?? a?.proposedRate ?? null;
    this.currency = accepted?.currency ?? a?.currency ?? 'EUR';
    this.rateUnit = accepted?.rateUnit ?? a?.rateUnit ?? 'Hour';
    this.teachingCategoryCodes = (
      accepted?.teachingCategoryCodes ??
      a?.teachingCategoryCodes ??
      []
    ).join(', ');
    this.estimatedMinutes = null;
    this.mileageRate = null;
    this.vehicleAllowance = null;
    this.minimumGuaranteedAmount = null;
    this.clauseCodes = '';
    this.formErrors.set([]);
    this.tab.set('terms');
    this.editMode.set(false);
    this.cancelMode.set(false);
  }
  private loadTerms(t: ProfessionalCommercialOfferTerms) {
    this.startsOn = t.startsOn;
    this.endsOn = t.endsOn;
    this.engagementType = t.engagementType;
    this.vehicleProvisionMode = t.vehicleProvisionMode;
    this.estimatedMinutes = t.estimatedMinutes;
    this.rateAmount = t.rateAmount;
    this.currency = t.currency ?? 'EUR';
    this.rateUnit = t.rateUnit ?? 'Hour';
    this.mileageRate = t.mileageRate;
    this.vehicleAllowance = t.vehicleAllowance;
    this.minimumGuaranteedAmount = t.minimumGuaranteedAmount;
    this.teachingCategoryCodes = t.teachingCategoryCodes.join(', ');
    this.clauseCodes = t.clauseCodes.join(', ');
  }
  private buildTerms(): ProfessionalCommercialOfferTerms | null {
    const categories = this.list(this.teachingCategoryCodes);
    if (!this.startsOn || !this.endsOn || categories.length === 0 || this.endsOn < this.startsOn) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.commercialOffers.errors.invalidTerms'),
      ]);
      return null;
    }
    return {
      startsOn: this.startsOn,
      endsOn: this.endsOn,
      teachingCategoryCodes: categories,
      engagementType: this.engagementType,
      vehicleProvisionMode: this.vehicleProvisionMode,
      estimatedMinutes: this.estimatedMinutes,
      rateAmount: this.rateAmount,
      currency: this.rateAmount === null ? null : this.currency.trim().toUpperCase(),
      rateUnit: this.rateAmount === null ? null : this.rateUnit,
      mileageRate: this.mileageRate,
      vehicleAllowance: this.vehicleAllowance,
      minimumGuaranteedAmount: this.minimumGuaranteedAmount,
      clauseCodes: this.list(this.clauseCodes),
    };
  }
  private list(v: string) {
    return [
      ...new Set(
        v
          .split(',')
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean),
      ),
    ];
  }
  private datePlus(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
