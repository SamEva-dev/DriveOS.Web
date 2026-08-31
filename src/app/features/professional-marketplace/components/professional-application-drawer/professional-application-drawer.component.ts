import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { ProfessionalProposal } from '../../models/professional-proposal.model';
import { ProfessionalCommercialOffer } from '../../models/professional-commercial-offer.model';
import { ProfessionalEngagement } from '../../models/professional-engagement.model';
import { ProfessionalProposalDrawerComponent } from '../professional-proposal-drawer/professional-proposal-drawer.component';
import { ProfessionalCommercialOfferDrawerComponent } from '../professional-commercial-offer-drawer/professional-commercial-offer-drawer.component';
import { ProfessionalEngagementDrawerComponent } from '../professional-engagement-drawer/professional-engagement-drawer.component';

@Component({
  selector: 'driveos-professional-application-drawer',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    DriveOsDrawerComponent,
    ProfessionalProposalDrawerComponent,
    ProfessionalCommercialOfferDrawerComponent,
    ProfessionalEngagementDrawerComponent,
  ],
  templateUrl: './professional-application-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalApplicationDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly application = input<ProfessionalApplication | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly rejectMode = signal(false);
  rejectReason = '';
  readonly detailTab = signal<'application' | 'negotiation' | 'commercialOffer' | 'engagement'>(
    'application',
  );
  readonly proposals = signal<readonly ProfessionalProposal[]>([]);
  readonly proposalsLoading = signal(false);
  readonly proposalsLoaded = signal(false);
  readonly proposalsError = signal(false);
  readonly selectedProposal = signal<ProfessionalProposal | null>(null);
  readonly proposalDrawerOpen = signal(false);
  readonly commercialOffers = signal<readonly ProfessionalCommercialOffer[]>([]);
  readonly commercialOffersLoading = signal(false);
  readonly commercialOffersLoaded = signal(false);
  readonly commercialOffersError = signal(false);
  readonly selectedCommercialOffer = signal<ProfessionalCommercialOffer | null>(null);
  readonly commercialOfferDrawerOpen = signal(false);
  readonly engagements = signal<readonly ProfessionalEngagement[]>([]);
  readonly engagementsLoading = signal(false);
  readonly engagementsLoaded = signal(false);
  readonly engagementDrawerOpen = signal(false);
  readonly selectedEngagementId = signal<string | null>(null);
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly canReadProposals = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.read),
  );
  readonly canCreateProposal = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.create),
  );
  readonly canReadCommercialOffers = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.read),
  );
  readonly canCreateCommercialOffer = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.commercialOffers.create),
  );
  readonly canReadEngagements = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.read),
  );
  readonly canCreateEngagement = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.manage),
  );
  readonly canReview = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.applications.review),
  );
  readonly canShortlist = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.applications.shortlist),
  );
  readonly canAccept = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.applications.accept),
  );
  readonly canReject = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.applications.reject),
  );
  setDetailTab(tab: 'application' | 'negotiation' | 'commercialOffer' | 'engagement') {
    this.detailTab.set(tab);
    if (tab === 'negotiation' && !this.proposalsLoaded() && !this.proposalsLoading())
      this.loadProposals();
    if (tab === 'commercialOffer') {
      if (!this.proposalsLoaded() && this.canReadProposals()) this.loadProposals();
      if (!this.commercialOffersLoaded() && !this.commercialOffersLoading())
        this.loadCommercialOffers();
    }
    if (tab === 'engagement') {
      if (!this.commercialOffersLoaded() && this.canReadCommercialOffers())
        this.loadCommercialOffers();
      if (!this.engagementsLoaded() && !this.engagementsLoading()) this.loadEngagements();
    }
  }
  loadProposals(force = false) {
    const a = this.application(),
      org = this.organizationId();
    if (!a || !org || !this.canReadProposals()) return;
    if (this.proposalsLoaded() && !force) return;
    this.proposalsLoading.set(true);
    this.proposalsError.set(false);
    this.api.listProfessionalProposals(org, a.professionalProfileId, a.opportunityId).subscribe({
      next: (x) => {
        this.proposals.set(x);
        this.proposalsLoaded.set(true);
        this.proposalsLoading.set(false);
      },
      error: () => {
        this.proposalsError.set(true);
        this.proposalsLoading.set(false);
      },
    });
  }
  loadCommercialOffers(force = false) {
    const a = this.application(),
      org = this.organizationId();
    if (!a || !org || !this.canReadCommercialOffers()) return;
    if (this.commercialOffersLoaded() && !force) return;
    this.commercialOffersLoading.set(true);
    this.commercialOffersError.set(false);
    this.api
      .listProfessionalCommercialOffers(org, a.professionalProfileId, null, null, a.opportunityId)
      .subscribe({
        next: (x) => {
          this.commercialOffers.set(x);
          this.commercialOffersLoaded.set(true);
          this.commercialOffersLoading.set(false);
        },
        error: () => {
          this.commercialOffersError.set(true);
          this.commercialOffersLoading.set(false);
        },
      });
  }

  loadEngagements(force = false) {
    const a = this.application(),
      org = this.organizationId();
    if (!a || !org || !this.canReadEngagements()) return;
    if (this.engagementsLoaded() && !force) return;
    this.engagementsLoading.set(true);
    this.api.listProfessionalEngagements(org, a.professionalProfileId).subscribe({
      next: (x) => {
        this.engagements.set(
          x.filter(
            (e) =>
              this.commercialOffers().some((o) => o.id === e.commercialOfferId) ||
              this.commercialOffers().length === 0,
          ),
        );
        this.engagementsLoaded.set(true);
        this.engagementsLoading.set(false);
      },
      error: () => {
        this.engagementsLoading.set(false);
      },
    });
  }
  readonly finalizedOffer = computed(
    () => this.commercialOffers().find((o) => o.status === 'Finalized') ?? null,
  );
  createEngagement() {
    const org = this.organizationId(),
      offer = this.finalizedOffer();
    if (!org || !offer || !this.canCreateEngagement()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api.createProfessionalEngagement(org, offer.id, null).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.loadEngagements(true);
        this.selectedEngagementId.set(r.id);
        this.engagementDrawerOpen.set(true);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.busy.set(false);
      },
    });
  }
  openEngagement(e: ProfessionalEngagement) {
    this.selectedEngagementId.set(e.id);
    this.engagementDrawerOpen.set(true);
  }
  closeEngagement() {
    this.engagementDrawerOpen.set(false);
    this.selectedEngagementId.set(null);
  }
  engagementChanged() {
    this.loadEngagements(true);
  }
  readonly acceptedProposal = computed(
    () => this.proposals().find((p) => p.status === 'Accepted') ?? null,
  );
  openCommercialOffer(o: ProfessionalCommercialOffer) {
    this.selectedCommercialOffer.set(o);
    this.commercialOfferDrawerOpen.set(true);
  }
  createCommercialOffer() {
    this.selectedCommercialOffer.set(null);
    this.commercialOfferDrawerOpen.set(true);
  }
  closeCommercialOffer() {
    this.commercialOfferDrawerOpen.set(false);
    this.selectedCommercialOffer.set(null);
  }
  commercialOfferChanged() {
    this.loadCommercialOffers(true);
  }
  openProposal(p: ProfessionalProposal) {
    this.selectedProposal.set(p);
    this.proposalDrawerOpen.set(true);
  }
  createProposal() {
    this.selectedProposal.set(null);
    this.proposalDrawerOpen.set(true);
    queueMicrotask(() => {});
  }
  closeProposal() {
    this.proposalDrawerOpen.set(false);
    this.selectedProposal.set(null);
  }
  proposalChanged() {
    this.loadProposals(true);
  }
  close() {
    if (!this.busy()) {
      this.detailTab.set('application');
      this.proposalsLoaded.set(false);
      this.proposals.set([]);
      this.commercialOffersLoaded.set(false);
      this.commercialOffers.set([]);
      this.engagementsLoaded.set(false);
      this.engagements.set([]);
      this.closeRequested.emit();
    }
  }
  requestReject() {
    this.rejectMode.set(true);
    this.rejectReason = '';
    this.formErrors.set([]);
  }
  cancelReject() {
    this.rejectMode.set(false);
    this.rejectReason = '';
  }
  review() {
    this.mutate('review');
  }
  shortlist() {
    this.mutate('shortlist');
  }
  accept() {
    this.mutate('accept');
  }
  reject() {
    if (!this.rejectReason.trim()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.applications.errors.rejectReason'),
      ]);
      return;
    }
    this.mutate('reject', this.rejectReason.trim());
  }
  private mutate(action: 'review' | 'shortlist' | 'accept' | 'reject', reason?: string) {
    const x = this.application(),
      org = this.organizationId();
    if (!x || !org) return;
    this.busy.set(true);
    this.formErrors.set([]);
    const r =
      action === 'review'
        ? this.api.reviewProfessionalApplication(org, x.id)
        : action === 'shortlist'
          ? this.api.shortlistProfessionalApplication(org, x.id)
          : action === 'accept'
            ? this.api.acceptProfessionalApplication(org, x.id)
            : this.api.rejectProfessionalApplication(org, x.id, reason!);
    r.subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
        this.closeRequested.emit();
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.busy.set(false);
      },
    });
  }
}
