import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsButtonComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsPageChange,
  DriveOsPaginatorComponent,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
  DriveOsTableDirective,
} from '../../../../shared/ui';
import { LeadsListStore } from '../../data-access/leads-list.store';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { LeadSortField, SortDirection } from '../../models/get-leads-parameters';
import { LeadListItem, LeadSourceType, LeadStatus } from '../../models/lead.model';

type LeadListState =
  | 'nominal'
  | 'empty'
  | 'noResults'
  | 'loading'
  | 'error'
  | 'partialData'
  | 'readOnly'
  | 'limitedPermission'
  | 'duplicates'
  | 'staleData';

interface StateTab {
  readonly id: LeadListState;
  readonly permission: string;
}

@Component({
  selector: 'driveos-lead-list-page',
  standalone: true,
  providers: [LeadsListStore],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsButtonComponent,
    DriveOsEmptyStateComponent,
    DriveOsInputDirective,
    DriveOsPaginatorComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    DriveOsTableDirective,
  ],
  templateUrl: './lead-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadListPage {
  readonly store = inject(LeadsListStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authorization = inject(AuthorizationService);
  private readonly leadsApi = inject(LeadsApiService);
  private readonly formBuilder = inject(FormBuilder);

  private readonly stateTabs: readonly StateTab[] = [
    { id: 'nominal', permission: CRM_PERMISSIONS.leads.tabs.nominal },
    { id: 'empty', permission: CRM_PERMISSIONS.leads.tabs.empty },
    { id: 'noResults', permission: CRM_PERMISSIONS.leads.tabs.noResults },
    { id: 'loading', permission: CRM_PERMISSIONS.leads.tabs.loading },
    { id: 'error', permission: CRM_PERMISSIONS.leads.tabs.error },
    { id: 'partialData', permission: CRM_PERMISSIONS.leads.tabs.partialData },
    { id: 'readOnly', permission: CRM_PERMISSIONS.leads.tabs.readOnly },
    { id: 'limitedPermission', permission: CRM_PERMISSIONS.leads.tabs.limitedPermission },
    { id: 'duplicates', permission: CRM_PERMISSIONS.leads.tabs.duplicates },
    { id: 'staleData', permission: CRM_PERMISSIONS.leads.tabs.staleData },
  ];

  readonly visibleStateTabs = computed(() => {
    this.authorization.permissions();
    return this.stateTabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly selectedState = signal<LeadListState>('nominal');
  readonly stateTabsVisible = signal(
    sessionStorage.getItem('driveos.crm.leads.states.visible') !== 'false',
  );
  readonly advancedFiltersOpen = signal(false);
  readonly exportInProgress = signal(false);
  readonly exportError = signal(false);
  readonly canExport = computed(() =>
    this.authorization.hasPermission(CRM_PERMISSIONS.leads.export),
  );
  readonly canCreate = computed(
    () =>
      this.authorization.hasPermission(CRM_PERMISSIONS.leads.create) &&
      this.selectedState() !== 'readOnly' &&
      this.selectedState() !== 'limitedPermission',
  );
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filters = this.formBuilder.nonNullable.group({
    status: ['' as LeadStatus | ''],
    sourceType: ['' as LeadSourceType | ''],
    branchId: [''],
    assignedAdvisorId: [''],
    unassignedOnly: [false],
  });
  readonly selectedLeadIds = signal<readonly string[]>([]);
  readonly statuses: readonly LeadStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'AssessmentScheduled',
    'OfferSent',
    'Negotiation',
    'Won',
    'Lost',
    'Dormant',
    'NotEligible',
    'OutOfScope',
    'Duplicate',
    'TransferredToPartner',
    'NoResponse',
    'CancelledByLead',
    'ConvertedElsewhere',
  ];
  readonly sources: readonly LeadSourceType[] = [
    'Website',
    'DriveOsForm',
    'PhoneCall',
    'WalkIn',
    'Referral',
    'SocialMedia',
    'AdvertisingCampaign',
    'PartnerDrivingSchool',
    'FreelanceInstructor',
    'ExternalImport',
    'Other',
  ];
  readonly viewLoading = computed(
    () => this.store.isLoading() || this.selectedState() === 'loading',
  );
  readonly viewError = computed(() => !!this.store.error() || this.selectedState() === 'error');
  readonly displayedLeads = computed<readonly LeadListItem[]>(() =>
    ['empty', 'noResults'].includes(this.selectedState()) ? [] : this.store.leads(),
  );
  readonly activeFilterCount = computed(
    () =>
      Object.values(this.filters.getRawValue()).filter((value) => value !== '' && value !== false)
        .length,
  );

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setSearch(value));
    this.filters.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) =>
        this.store.setFilters(
          value.status ?? '',
          value.sourceType ?? '',
          value.unassignedOnly ?? false,
          value.branchId ?? '',
          value.assignedAdvisorId ?? '',
        ),
      );
  }

  createLead(): void {
    void this.router.navigate(['/crm/leads/new']);
  }
  openLead(leadId: string): void {
    void this.router.navigate(['/crm/leads', leadId]);
  }
  onPageChange(event: DriveOsPageChange): void {
    this.store.setPage(event.pageNumber, event.pageSize);
  }
  selectState(state: LeadListState): void {
    if (this.visibleStateTabs().some((tab) => tab.id === state)) this.selectedState.set(state);
  }
  toggleStateTabs(): void {
    const visible = !this.stateTabsVisible();
    this.stateTabsVisible.set(visible);
    sessionStorage.setItem('driveos.crm.leads.states.visible', `${visible}`);
  }
  toggleAdvancedFilters(): void {
    this.advancedFiltersOpen.update((value) => !value);
  }
  clearFilters(): void {
    this.filters.reset();
    this.searchControl.setValue('');
  }
  exportCsv(): void {
    if (!this.canExport() || this.exportInProgress()) return;
    this.exportInProgress.set(true);
    this.exportError.set(false);
    this.leadsApi.exportCsv(this.store.parameters()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `driveos-prospects-${new Date().toISOString().slice(0, 10)}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.exportInProgress.set(false);
      },
      error: () => {
        this.exportInProgress.set(false);
        this.exportError.set(true);
      },
    });
  }
  toggleLeadSelection(id: string, checked: boolean): void {
    this.selectedLeadIds.update((ids) =>
      checked ? [...new Set([...ids, id])] : ids.filter((x) => x !== id),
    );
  }
  toggleAll(checked: boolean): void {
    this.selectedLeadIds.set(checked ? this.displayedLeads().map((lead) => lead.id) : []);
  }
  isSelected(id: string): boolean {
    return this.selectedLeadIds().includes(id);
  }
  toggleSorting(field: LeadSortField): void {
    const current = this.store.parameters();
    const direction: SortDirection =
      current.sortBy === field && current.sortDirection === 'asc' ? 'desc' : 'asc';
    this.store.setSorting(field, direction);
  }
  statusKey(status: LeadStatus): string {
    return `crm.leads.statuses.${status}`;
  }
  sourceKey(source: LeadSourceType): string {
    return `crm.leads.sources.${source}`;
  }
  statusVariant(status: LeadStatus): DriveOsBadgeVariant {
    if (status === 'Won') return 'success';
    if (
      ['Lost', 'NotEligible', 'OutOfScope', 'CancelledByLead', 'ConvertedElsewhere'].includes(
        status,
      )
    )
      return 'danger';
    if (status === 'Dormant' || status === 'NoResponse') return 'warning';
    return status === 'New' ? 'info' : 'neutral';
  }
}
