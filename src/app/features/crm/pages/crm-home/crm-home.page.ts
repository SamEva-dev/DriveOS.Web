import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { CrmDashboardApiService } from '../../data-access/crm-dashboard-api.service';
import { NetworkMembershipApiService } from '../../data-access/network-membership-api.service';
import { CrmDashboard } from '../../models/crm-dashboard.model';
import { NetworkMember, NetworkMemberCandidate } from '../../models/network-membership.model';

type DashboardScope = 'branch' | 'organization' | 'network';
type PipelineView = 'funnel' | 'table';
type DashboardDiagnosticState = 'nominal' | 'empty' | 'partialData' | 'restrictedFinancial'
  | 'activeFilters' | 'integrationIncident' | 'loading' | 'widgetError';

interface DashboardTab<T extends string> {
  readonly id: T;
  readonly labelKey: string;
  readonly permission: string;
}

@Component({
  selector: 'driveos-crm-home-page',
  standalone: true,
  imports: [DriveOsPageShellComponent, RouterLink, TranslatePipe, DatePipe],
  templateUrl: './crm-home.page.html',
  styleUrl: './crm-home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrmHomePage {
  private readonly authorization = inject(AuthorizationService);
  private readonly dashboardApi = inject(CrmDashboardApiService);
  private readonly networkMembershipApi = inject(NetworkMembershipApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly scopeTabs: readonly DashboardTab<DashboardScope>[] = [
    { id: 'branch', labelKey: 'crm.dashboard.scopes.branch', permission: CRM_PERMISSIONS.dashboard.scopes.branch },
    { id: 'organization', labelKey: 'crm.dashboard.scopes.organization', permission: CRM_PERMISSIONS.dashboard.scopes.organization },
    { id: 'network', labelKey: 'crm.dashboard.scopes.network', permission: CRM_PERMISSIONS.dashboard.scopes.network },
  ];

  private readonly diagnosticTabs: readonly DashboardTab<DashboardDiagnosticState>[] = [
    { id: 'nominal', labelKey: 'crm.dashboard.tabs.nominal', permission: CRM_PERMISSIONS.dashboard.tabs.nominal },
    { id: 'empty', labelKey: 'crm.dashboard.tabs.empty', permission: CRM_PERMISSIONS.dashboard.tabs.empty },
    { id: 'partialData', labelKey: 'crm.dashboard.tabs.partialData', permission: CRM_PERMISSIONS.dashboard.tabs.partialData },
    { id: 'restrictedFinancial', labelKey: 'crm.dashboard.tabs.restrictedFinancial', permission: CRM_PERMISSIONS.dashboard.tabs.restrictedFinancial },
    { id: 'activeFilters', labelKey: 'crm.dashboard.tabs.activeFilters', permission: CRM_PERMISSIONS.dashboard.tabs.activeFilters },
    { id: 'integrationIncident', labelKey: 'crm.dashboard.tabs.integrationIncident', permission: CRM_PERMISSIONS.dashboard.tabs.integrationIncident },
    { id: 'loading', labelKey: 'crm.dashboard.tabs.loading', permission: CRM_PERMISSIONS.dashboard.tabs.loading },
    { id: 'widgetError', labelKey: 'crm.dashboard.tabs.widgetError', permission: CRM_PERMISSIONS.dashboard.tabs.widgetError },
  ];

  readonly visibleScopeTabs = computed(() => {
    this.authorization.permissions();
    return this.scopeTabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly visibleDiagnosticTabs = computed(() => {
    this.authorization.permissions();
    return this.diagnosticTabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly diagnosticTabsVisible = signal(sessionStorage.getItem('driveos.crm.dashboard.diagnostics.visible') !== 'false');
  readonly selectedDiagnosticState = signal<DashboardDiagnosticState>('nominal');
  readonly selectedScope = signal<DashboardScope>('organization');
  readonly dashboard = signal<CrmDashboard | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly pipelineView = signal<PipelineView>('funnel');
  readonly selectedBranchId = signal<string | null>(null);
  readonly networkMembers = signal<readonly NetworkMember[]>([]);
  readonly networkCandidates = signal<readonly NetworkMemberCandidate[]>([]);
  readonly networkMembersLoading = signal(false);
  readonly networkMembersError = signal(false);
  readonly networkMutationInProgress = signal<string | null>(null);
  readonly networkMutationError = signal(false);
  readonly selectedCandidateId = signal('');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly advisorId = signal('');
  readonly source = signal('');
  readonly status = signal('');
  readonly lastRefreshAt = signal<Date | null>(null);
  readonly sources = ['Website', 'DriveOsForm', 'PhoneCall', 'WalkIn', 'Referral', 'SocialMedia', 'AdvertisingCampaign', 'PartnerDrivingSchool', 'FreelanceInstructor', 'ExternalImport', 'Other'] as const;
  readonly statuses = ['New', 'Contacted', 'Qualified', 'AssessmentScheduled', 'OfferSent', 'Negotiation', 'Won', 'Lost', 'Dormant', 'NotEligible', 'OutOfScope', 'Duplicate', 'TransferredToPartner', 'NoResponse', 'CancelledByLead', 'ConvertedElsewhere'] as const;
  readonly canCreateLead = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.leads.create));
  readonly canCreateActivity = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.activities.create));
  readonly canReadFinancial = computed(() =>
    this.authorization.hasPermission(CRM_PERMISSIONS.dashboard.financialRead),
  );
  readonly canReadNetworkMembers = computed(() =>
    this.authorization.hasPermission(CRM_PERMISSIONS.networks.read),
  );
  readonly canManageNetworkMembers = computed(() =>
    this.authorization.hasPermission(CRM_PERMISSIONS.networks.manage),
  );
  readonly availableNetworkCandidates = computed(() =>
    this.networkCandidates().filter((candidate) => !candidate.alreadyAssignedToNetwork),
  );

  readonly kpis = [
    'newLeads', 'toContact', 'overdueFollowUps', 'upcomingAppointments',
    'pendingOffers', 'conversionRate', 'firstContactDelay', 'pipelineValue',
    'unassignedLeads', 'expiringOpportunities',
  ] as const;

  readonly kpiValues = computed(() => {
    const value = this.dashboard()?.kpis;
    return value ? {
      newLeads: `${value.newLeads}`,
      toContact: `${value.toContact}`,
      overdueFollowUps: `${value.overdueFollowUps}`,
      upcomingAppointments: value.upcomingAppointments === null ? '—' : `${value.upcomingAppointments}`,
      pendingOffers: `${value.pendingOffers}`,
      conversionRate: `${value.conversionRate}%`,
      firstContactDelay: value.firstContactDelayHours === null ? '—' : `${value.firstContactDelayHours} h`,
      pipelineValue: value.pipelineValue === null || !value.pipelineCurrency
        ? '—' : this.formatMoney(value.pipelineValue, value.pipelineCurrency),
      unassignedLeads: `${value.unassignedLeads}`,
      expiringOpportunities: value.expiringOpportunities === null ? '—' : `${value.expiringOpportunities}`,
    } : null;
  });

  readonly viewLoading = computed(() => this.loading() || this.selectedDiagnosticState() === 'loading');
  readonly isEmpty = computed(() => this.selectedDiagnosticState() === 'empty' || (!this.viewLoading() && !this.loadError()
    && (this.dashboard()?.kpis.newLeads ?? 0) === 0
    && (this.dashboard()?.pipeline.reduce((sum, item) => sum + item.count, 0) ?? 0) === 0));
  readonly isPartial = computed(() => this.selectedDiagnosticState() === 'partialData'
    || (this.dashboard()?.unavailableWidgets.length ?? 0) > 0);
  readonly hasActiveFilters = computed(() => this.selectedDiagnosticState() === 'activeFilters'
    || !!(this.fromDate() || this.toDate() || this.advisorId() || this.source() || this.status()));
  readonly hasIntegrationIncident = computed(() => this.selectedDiagnosticState() === 'integrationIncident');
  readonly hasWidgetError = computed(() => this.selectedDiagnosticState() === 'widgetError');
  readonly isFinancialRestricted = computed(() => !this.canReadFinancial()
    || this.selectedDiagnosticState() === 'restrictedFinancial');
  readonly maxSourceCount = computed(() => Math.max(
    1,
    ...(this.dashboard()?.sources ?? []).map((source) => source.count),
  ));

  constructor() {
    this.loadDashboard();
    const refreshTimer = window.setInterval(() => this.refresh(), 120_000);
    this.destroyRef.onDestroy(() => window.clearInterval(refreshTimer));
  }
  selectScope(scope: DashboardScope): void {
    this.selectedScope.set(scope);
    if (scope === 'organization') {
      this.selectedBranchId.set(null);
      this.loadDashboard('organization');
      return;
    }
    if (scope === 'branch') {
      const branches = this.dashboard()?.availableBranches ?? [];
      const branchId = this.selectedBranchId()
        ?? branches.find((branch) => branch.isPrimary)?.id
        ?? branches[0]?.id
        ?? null;
      this.selectedBranchId.set(branchId);
      if (branchId) this.loadDashboard('branch', branchId);
      else { this.loading.set(false); this.loadError.set(false); }
      return;
    }
    this.selectedBranchId.set(null);
    this.loadDashboard('network');
    if (this.canReadNetworkMembers()) this.loadNetworkMembers();
  }

  selectBranch(branchId: string): void {
    if (!branchId) return;
    this.selectedBranchId.set(branchId);
    this.loadDashboard('branch', branchId);
  }

  selectNetworkCandidate(organizationId: string): void {
    this.selectedCandidateId.set(organizationId);
    this.networkMutationError.set(false);
  }

  addNetworkMember(): void {
    const organizationId = this.selectedCandidateId();
    if (!organizationId || !this.canManageNetworkMembers()) return;

    this.networkMutationInProgress.set(organizationId);
    this.networkMutationError.set(false);
    this.networkMembershipApi.addMember(organizationId).subscribe({
      next: () => {
        this.selectedCandidateId.set('');
        this.networkMutationInProgress.set(null);
        this.loadNetworkMembers();
        this.loadDashboard('network');
      },
      error: () => {
        this.networkMutationInProgress.set(null);
        this.networkMutationError.set(true);
      },
    });
  }

  removeNetworkMember(member: NetworkMember): void {
    if (!this.canManageNetworkMembers()) return;

    this.networkMutationInProgress.set(member.organizationId);
    this.networkMutationError.set(false);
    this.networkMembershipApi.removeMember(member.organizationId).subscribe({
      next: () => {
        this.networkMutationInProgress.set(null);
        this.loadNetworkMembers();
        this.loadDashboard('network');
      },
      error: () => {
        this.networkMutationInProgress.set(null);
        this.networkMutationError.set(true);
      },
    });
  }

  retry(): void { this.refresh(); }
  refresh(): void { this.loadDashboard(this.selectedScope(), this.selectedBranchId() ?? undefined); }
  applyFilters(): void { this.refresh(); }
  clearFilters(): void {
    this.fromDate.set(''); this.toDate.set(''); this.advisorId.set('');
    this.source.set(''); this.status.set(''); this.refresh();
  }
  updateFilter(target: 'from' | 'to' | 'advisor' | 'source' | 'status', value: string): void {
    ({ from: this.fromDate, to: this.toDate, advisor: this.advisorId,
      source: this.source, status: this.status }[target]).set(value);
  }

  selectPipelineView(view: PipelineView): void { this.pipelineView.set(view); }

  selectDiagnosticState(state: DashboardDiagnosticState): void {
    if (!this.visibleDiagnosticTabs().some((tab) => tab.id === state)) return;
    this.selectedDiagnosticState.set(state);
  }

  toggleDiagnosticTabs(): void {
    const visible = !this.diagnosticTabsVisible();
    this.diagnosticTabsVisible.set(visible);
    sessionStorage.setItem('driveos.crm.dashboard.diagnostics.visible', `${visible}`);
  }

  sourceWidth(count: number): number {
    return Math.max(4, Math.round(count * 100 / this.maxSourceCount()));
  }

  conversionRate(converted: number, total: number): number {
    return total === 0 ? 0 : Math.round(converted * 1000 / total) / 10;
  }

  branchName(branchId: string | null): string | null {
    if (!branchId) return null;
    return this.dashboard()?.availableBranches.find((branch) => branch.id === branchId)?.name
      ?? branchId;
  }

  isFinancialKpi(kpi: (typeof this.kpis)[number]): boolean {
    return kpi === 'pipelineValue' || kpi === 'pendingOffers' || kpi === 'expiringOpportunities';
  }

  isFinancialHidden(kpi: (typeof this.kpis)[number]): boolean {
    return this.isFinancialKpi(kpi)
      && (!this.canReadFinancial() || this.selectedDiagnosticState() === 'restrictedFinancial');
  }

  priorityLabel(kind: string, fallback: string): string {
    const known = ['LeadToContact', 'OverdueTask', 'OfferExpiring', 'AssessmentToValidate', 'ConversionFailed', 'DormantToWake'];
    return known.includes(kind) ? `crm.dashboard.priorityKinds.${kind}` : fallback;
  }

  private formatMoney(amount: number, currency: string): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  }

  private loadDashboard(scope: DashboardScope = 'organization', branchId?: string): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.dashboardApi.get(scope, branchId, {
      fromUtc: this.fromDate() ? new Date(`${this.fromDate()}T00:00:00`).toISOString() : undefined,
      toUtc: this.toDate() ? new Date(`${this.toDate()}T23:59:59.999`).toISOString() : undefined,
      assignedAdvisorId: this.advisorId() || undefined,
      source: this.source() || undefined,
      status: this.status() || undefined,
    }).subscribe({
      next: (dashboard) => { this.dashboard.set(dashboard); this.loading.set(false); this.lastRefreshAt.set(new Date()); },
      error: () => { this.dashboard.set(null); this.loading.set(false); this.loadError.set(true); },
    });
  }

  private loadNetworkMembers(): void {
    this.networkMembersLoading.set(true);
    this.networkMembersError.set(false);

    this.networkMembershipApi.getMembers().subscribe({
      next: (members) => {
        this.networkMembers.set(members);
        this.networkMembershipApi.getCandidates().subscribe({
          next: (candidates) => {
            this.networkCandidates.set(candidates);
            this.networkMembersLoading.set(false);
          },
          error: () => {
            this.networkCandidates.set([]);
            this.networkMembersLoading.set(false);
            this.networkMembersError.set(true);
          },
        });
      },
      error: () => {
        this.networkMembers.set([]);
        this.networkCandidates.set([]);
        this.networkMembersLoading.set(false);
        this.networkMembersError.set(true);
      },
    });
  }
}
