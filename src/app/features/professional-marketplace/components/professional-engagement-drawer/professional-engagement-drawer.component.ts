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
import { ProfessionalEngagement } from '../../models/professional-engagement.model';
import { ProfessionalServiceContractDrawerComponent } from '../professional-service-contract-drawer/professional-service-contract-drawer.component';
import { ProfessionalMissionDrawerComponent } from '../professional-mission-drawer/professional-mission-drawer.component';
import { ProfessionalMission } from '../../models/professional-mission.model';
import { ExternalAccessGrant } from '../../models/external-access-grant.model';
import { ExternalAccessGrantDrawerComponent } from '../external-access-grant-drawer/external-access-grant-drawer.component';
import { ServiceStatement } from '../../models/service-statement.model';
import { ServiceStatementReviewDrawerComponent } from '../service-statement-review-drawer/service-statement-review-drawer.component';
import { ServiceDispute } from '../../models/service-dispute.model';
import { ServiceDisputeDrawerComponent } from '../service-dispute-drawer/service-dispute-drawer.component';
import { ProfessionalInvoice } from '../../models/professional-invoice.model';
import { ProfessionalInvoiceDrawerComponent } from '../professional-invoice-drawer/professional-invoice-drawer.component';
import { MarketplaceMessagesPanelComponent } from '../marketplace-messages-panel/marketplace-messages-panel.component';

@Component({
  selector: 'driveos-professional-engagement-drawer',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    DriveOsDrawerComponent,
    ProfessionalServiceContractDrawerComponent,
    ProfessionalMissionDrawerComponent,
    ExternalAccessGrantDrawerComponent,
    ServiceStatementReviewDrawerComponent,
    ServiceDisputeDrawerComponent,
    ProfessionalInvoiceDrawerComponent,
    MarketplaceMessagesPanelComponent,
  ],
  templateUrl: './professional-engagement-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalEngagementDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly engagementId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ProfessionalEngagement | null>(null);
  readonly invoices = signal<readonly ProfessionalInvoice[]>([]);
  readonly billingLoading = signal(false);
  readonly billingSubTab = signal<'invoices' | 'payments'>('invoices');
  readonly invoiceDrawerOpen = signal(false);
  readonly selectedInvoiceId = signal<string | null>(null);
  readonly serviceStatements = signal<readonly ServiceStatement[]>([]);
  readonly serviceDisputes = signal<readonly ServiceDispute[]>([]);
  readonly servicesSubTab = signal<'statements' | 'disputes'>('statements');
  readonly disputeDrawerOpen = signal(false);
  readonly selectedDisputeId = signal<string | null>(null);
  readonly statementsLoading = signal(false);
  readonly statementDrawerOpen = signal(false);
  readonly selectedStatementId = signal<string | null>(null);
  readonly accessGrants = signal<readonly ExternalAccessGrant[]>([]);
  readonly accessLoading = signal(false);
  readonly accessGrantDrawerOpen = signal(false);
  readonly selectedAccessGrant = signal<ExternalAccessGrant | null>(null);
  readonly contractDrawerOpen = signal(false);
  readonly missions = signal<readonly ProfessionalMission[]>([]);
  readonly missionsLoading = signal(false);
  readonly missionDrawerOpen = signal(false);
  readonly selectedMissionId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly tab = signal<
    | 'summary'
    | 'preparation'
    | 'contract'
    | 'access'
    | 'missions'
    | 'services'
    | 'billing'
    | 'messages'
  >('summary');
  readonly actionMode = signal<'suspend' | 'terminate' | null>(null);
  reason = '';
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly canPrepareCompliance = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.compliance.verify),
  );
  readonly canPrepareContract = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.read),
  );
  readonly canPrepareAccess = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.accessGrants.manage),
  );
  readonly canReadAccess = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.accessGrants.read),
  );
  readonly canCreateAccess = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.accessGrants.manage),
  );
  readonly canManage = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.manage),
  );
  readonly canActivate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.activate),
  );
  readonly canSuspend = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.suspend),
  );
  readonly canResume = computed(
    () =>
      this.authorization.hasPermission(
        PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.reactivate,
      ) ||
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.manage),
  );
  readonly canTerminate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.relationships.terminate),
  );
  readonly canReadMissions = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.missions.read),
  );
  readonly canCreateMission = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.missions.create),
  );
  readonly canReadServices = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.read),
  );
  readonly canReadDisputes = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.disputes.read),
  );
  readonly canReadBilling = computed(
    () =>
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invoices.read) ||
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.payments.read),
  );
  readonly canReadMessages = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.messages.read),
  );
  readonly canReadPayments = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.payments.read),
  );
  readonly canRequestInvoice = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invoices.request),
  );
  private loadedId: string | null = null;
  constructor() {
    effect(() => {
      const opened = this.open(),
        id = this.engagementId();
      if (opened && id && id !== this.loadedId) {
        this.loadedId = id;
        this.load();
      }
      if (!opened) {
        this.loadedId = null;
        this.item.set(null);
        this.missions.set([]);
        this.accessGrants.set([]);
        this.serviceStatements.set([]);
        this.serviceDisputes.set([]);
        this.invoices.set([]);
        this.servicesSubTab.set('statements');
        this.billingSubTab.set('invoices');
        this.tab.set('summary');
      }
    });
  }
  selectTab(
    v:
      | 'summary'
      | 'preparation'
      | 'contract'
      | 'access'
      | 'missions'
      | 'services'
      | 'billing'
      | 'messages',
  ) {
    this.tab.set(v);
    if (v === 'missions') this.loadMissions();
    if (v === 'services') this.loadServices();
    if (v === 'access') {
      this.loadAccessGrants();
      if (this.canCreateAccess()) this.loadMissions();
    }
    if (v === 'billing') this.loadBilling();
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  openContract() {
    this.contractDrawerOpen.set(true);
  }

  openNewInvoice() {
    this.selectedInvoiceId.set(null);
    this.invoiceDrawerOpen.set(true);
  }
  openInvoice(id: string) {
    this.selectedInvoiceId.set(id);
    this.invoiceDrawerOpen.set(true);
  }
  closeInvoice() {
    this.invoiceDrawerOpen.set(false);
    this.selectedInvoiceId.set(null);
  }
  invoiceChanged() {
    this.changed.emit();
    this.loadBilling();
    this.loadServices();
  }
  selectBillingSubTab(v: 'invoices' | 'payments') {
    this.billingSubTab.set(v);
  }
  loadBilling() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canReadBilling()) return;
    this.billingLoading.set(true);
    this.api.listOrganizationProfessionalInvoices(org, id).subscribe({
      next: (x) => {
        this.invoices.set(x);
        this.billingLoading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.billingLoading.set(false);
      },
    });
    if (this.serviceStatements().length === 0) this.loadServiceStatements();
  }

  openStatement(id: string) {
    this.selectedStatementId.set(id);
    this.statementDrawerOpen.set(true);
  }
  closeStatement() {
    this.statementDrawerOpen.set(false);
    this.selectedStatementId.set(null);
  }
  statementChanged() {
    this.changed.emit();
    this.loadServices();
  }
  loadServices() {
    this.loadServiceStatements();
    this.loadServiceDisputes();
  }
  selectServicesSubTab(v: 'statements' | 'disputes') {
    this.servicesSubTab.set(v);
  }
  openServiceDispute(id: string) {
    this.selectedDisputeId.set(id);
    this.disputeDrawerOpen.set(true);
  }
  closeServiceDispute() {
    this.disputeDrawerOpen.set(false);
    this.selectedDisputeId.set(null);
  }
  serviceDisputeChanged() {
    this.changed.emit();
    this.loadServices();
  }
  loadServiceStatements() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canReadServices()) return;
    this.statementsLoading.set(true);
    this.api.listOrganizationServiceStatements(org, id).subscribe({
      next: (x) => {
        this.serviceStatements.set(x);
        this.statementsLoading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.statementsLoading.set(false);
      },
    });
  }
  loadServiceDisputes() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canReadDisputes()) return;
    this.api
      .listOrganizationDisputes(org)
      .subscribe({
        next: (x) => this.serviceDisputes.set(x.filter((d) => d.engagementId === id)),
        error: (e) => this.formErrors.set(this.errors.getMessages(e)),
      });
  }

  openNewAccessGrant() {
    this.selectedAccessGrant.set(null);
    this.accessGrantDrawerOpen.set(true);
  }
  openAccessGrant(grant: ExternalAccessGrant) {
    this.selectedAccessGrant.set(grant);
    this.accessGrantDrawerOpen.set(true);
  }
  closeAccessGrant() {
    this.accessGrantDrawerOpen.set(false);
    this.selectedAccessGrant.set(null);
  }
  accessGrantChanged() {
    this.changed.emit();
    this.loadAccessGrants();
    this.load();
  }
  loadAccessGrants() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canReadAccess()) return;
    this.accessLoading.set(true);
    this.api.listExternalAccessGrants(org, id).subscribe({
      next: (x) => {
        this.accessGrants.set(x);
        this.accessLoading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.accessLoading.set(false);
      },
    });
  }
  activeAccessCount() {
    return this.accessGrants().filter((x) => x.status === 'Active').length;
  }
  closeContract() {
    this.contractDrawerOpen.set(false);
  }
  openNewMission() {
    this.selectedMissionId.set(null);
    this.missionDrawerOpen.set(true);
  }
  openMission(id: string) {
    this.selectedMissionId.set(id);
    this.missionDrawerOpen.set(true);
  }
  closeMission() {
    this.missionDrawerOpen.set(false);
  }
  missionChanged() {
    this.changed.emit();
    this.loadMissions();
  }
  loadMissions() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canReadMissions()) return;
    this.missionsLoading.set(true);
    this.api.listProfessionalMissions(org, id).subscribe({
      next: (x) => {
        this.missions.set(x);
        this.missionsLoading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.missionsLoading.set(false);
      },
    });
  }
  contractChanged() {
    this.changed.emit();
    this.load();
  }
  load() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id) return;
    this.loading.set(true);
    this.api.getProfessionalEngagement(org, id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }
  prepareCompliance() {
    this.run(() =>
      this.api.prepareEngagementCompliance(this.organizationId(), this.engagementId()!),
    );
  }
  prepareContract() {
    this.run(() => this.api.prepareEngagementContract(this.organizationId(), this.engagementId()!));
  }
  prepareAccess() {
    this.run(
      () => this.api.prepareEngagementAccess(this.organizationId(), this.engagementId()!),
      true,
    );
  }
  prepareScheduling() {
    this.run(() =>
      this.api.prepareEngagementScheduling(this.organizationId(), this.engagementId()!),
    );
  }
  approveInternal() {
    this.run(() =>
      this.api.markEngagementInternalApproval(this.organizationId(), this.engagementId()!, true),
    );
  }
  activate() {
    this.run(() =>
      this.api.activateProfessionalEngagement(this.organizationId(), this.engagementId()!),
    );
  }
  resume() {
    this.run(() =>
      this.api.resumeProfessionalEngagement(this.organizationId(), this.engagementId()!),
    );
  }
  complete() {
    this.run(() =>
      this.api.completeProfessionalEngagement(this.organizationId(), this.engagementId()!),
    );
  }
  begin(mode: 'suspend' | 'terminate') {
    this.actionMode.set(mode);
    this.reason = '';
    this.formErrors.set([]);
  }
  cancelAction() {
    this.actionMode.set(null);
    this.reason = '';
  }
  confirmReason() {
    const mode = this.actionMode(),
      r = this.reason.trim();
    if (!mode || r.length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.engagements.errors.reason'),
      ]);
      return;
    }
    this.run(() =>
      mode === 'suspend'
        ? this.api.suspendProfessionalEngagement(this.organizationId(), this.engagementId()!, r)
        : this.api.terminateProfessionalEngagement(this.organizationId(), this.engagementId()!, r),
    );
  }
  private run(factory: () => any, refreshAccess = false) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.actionMode.set(null);
        this.changed.emit();
        this.load();
        if (refreshAccess) this.loadAccessGrants();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  preparedCount(x: ProfessionalEngagement) {
    return [
      x.compliancePrepared,
      x.contractPrepared,
      x.accessPrepared,
      x.schedulingPrepared,
      x.internalApprovalPrepared,
    ].filter(Boolean).length;
  }
}
