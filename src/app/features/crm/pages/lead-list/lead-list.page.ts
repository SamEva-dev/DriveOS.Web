import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import {
  DriveOsBadgeComponent, DriveOsBadgeVariant, DriveOsButtonComponent,
  DriveOsEmptyStateComponent, DriveOsInputDirective, DriveOsPageChange,
  DriveOsPaginatorComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsTableDirective,
} from '../../../../shared/ui';
import { LeadsListStore } from '../../data-access/leads-list.store';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { LeadSortField, SortDirection } from '../../models/get-leads-parameters';
import { LeadSourceType, LeadStatus } from '../../models/lead.model';

@Component({
  selector: 'driveos-lead-list-page',
  standalone: true,
  providers: [LeadsListStore],
  imports: [DatePipe, ReactiveFormsModule, TranslatePipe, DriveOsBadgeComponent,
    DriveOsButtonComponent, DriveOsEmptyStateComponent, DriveOsInputDirective,
    DriveOsPaginatorComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsTableDirective],
  templateUrl: './lead-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadListPage {
  readonly store = inject(LeadsListStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authorization = inject(AuthorizationService);
  private readonly formBuilder = inject(FormBuilder);

  readonly canCreate = computed(() => this.authorization.hasPermission(CRM_PERMISSIONS.leads.create));
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filters = this.formBuilder.nonNullable.group({
    status: ['' as LeadStatus | ''],
    sourceType: ['' as LeadSourceType | ''],
    unassignedOnly: [false],
  });

  constructor() {
    this.searchControl.valueChanges.pipe(debounceTime(350), distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.store.setSearch(value));
    this.filters.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) =>
      this.store.setFilters(value.status ?? '', value.sourceType ?? '', value.unassignedOnly ?? false));
  }

  createLead(): void { void this.router.navigate(['/crm/leads/new']); }
  openLead(leadId: string): void { void this.router.navigate(['/crm/leads', leadId]); }
  onPageChange(event: DriveOsPageChange): void { this.store.setPage(event.pageNumber, event.pageSize); }

  toggleSorting(field: LeadSortField): void {
    const current = this.store.parameters();
    const direction: SortDirection = current.sortBy === field && current.sortDirection === 'asc' ? 'desc' : 'asc';
    this.store.setSorting(field, direction);
  }

  statusKey(status: LeadStatus): string { return `crm.leads.statuses.${status}`; }
  sourceKey(source: LeadSourceType): string { return `crm.leads.sources.${source}`; }
  statusVariant(status: LeadStatus): DriveOsBadgeVariant {
    if (status === 'Won') return 'success';
    if (status === 'Lost') return 'danger';
    if (status === 'Dormant') return 'warning';
    return status === 'New' ? 'info' : 'neutral';
  }
}
