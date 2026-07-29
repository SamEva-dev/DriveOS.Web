import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';

import {
  TranslatePipe,
} from '@ngx-translate/core';


import {
  DatePipe,
} from '@angular/common';


import { OrganizationsListStore } from '../../data-access/organizations-list.store';
import { SortDirection, OrganizationSortField } from '../../models/get-organizations-parameters';
import { DriveOsBadgeComponent, DriveOsBadgeVariant, DriveOsButtonComponent, DriveOsCardComponent, DriveOsEmptyStateComponent, DriveOsInputDirective, DriveOsPageChange, DriveOsPaginatorComponent, DriveOsSpinnerComponent, DriveOsTableDirective } from '../../../../shared/ui';



@Component({
  selector:
    'driveos-organization-list-page',

  standalone: true,

  providers: [
    OrganizationsListStore,
  ],

  imports: [
    DatePipe,
  ReactiveFormsModule,
  RouterLink,
  TranslatePipe,

  DriveOsBadgeComponent,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsPaginatorComponent,
  DriveOsSpinnerComponent,
  DriveOsTableDirective,
  ],

  templateUrl:
    './organization-list.page.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OrganizationListPage {
  readonly store =
    inject(OrganizationsListStore);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly searchControl =
    new FormControl(
      '',
      {
        nonNullable: true,
      },
    );

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe(search =>
        this.store.setSearch(search),
      );
  }

  onPageChange(
    event: DriveOsPageChange,
  ): void {
    this.store.setPage(
      event.pageNumber,
      event.pageSize,
    );
  }

  toggleSorting(
    field: OrganizationSortField,
  ): void {
    const current =
      this.store.parameters();

    const nextDirection:
      SortDirection =
        current.sortBy === field &&
        current.sortDirection === 'asc'
          ? 'desc'
          : 'asc';

    this.store.setSorting(
      field,
      nextDirection,
    );
  }

  sortingIcon(
    field: OrganizationSortField,
  ): string {
    const parameters =
      this.store.parameters();

    if (parameters.sortBy !== field) {
      return [
        'ph',
        'ph-arrows-down-up',
        'text-slate-300',
        'dark:text-slate-600',
      ].join(' ');
    }

    return parameters.sortDirection ===
      'asc'
        ? [
            'ph-bold',
            'ph-arrow-up',
            'text-blue-800',
            'dark:text-blue-300',
          ].join(' ')
        : [
            'ph-bold',
            'ph-arrow-down',
            'text-blue-800',
            'dark:text-blue-300',
          ].join(' ');
  }

  openOrganization(
    organizationId: string,
  ): void {
    void this.router.navigate([
      '/organizations',
      organizationId,
    ]);
  }

  organizationTypeKey(
    type: string,
  ): string {
    const keys:
      Record<string, string> = {
      DrivingSchool:
        'organizations.types.drivingSchool',

      DrivingSchoolNetwork:
        'organizations.types.drivingSchoolNetwork',

      TrainingCenter:
        'organizations.types.trainingCenter',

      IndependentInstructorBusiness:
        'organizations.types.independentInstructorBusiness',

      VehicleProvider:
        'organizations.types.vehicleProvider',

      FundingOrganization:
        'organizations.types.fundingOrganization',

      PartnerOrganization:
        'organizations.types.partnerOrganization',

      PlatformOperator:
        'organizations.types.platformOperator',
    };

    return (
      keys[type] ??
      'organizations.types.unknown'
    );
  }

  organizationStatusKey(
    status: string,
  ): string {
    return `organizations.statuses.${status
      .charAt(0)
      .toLowerCase()}${status.slice(1)}`;
  }

  statusVariant(
    status: string,
  ): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
        return 'success';

      case 'Draft':
      case 'PendingActivation':
        return 'info';

      case 'Restricted':
        return 'warning';

      case 'Suspended':
      case 'Closed':
        return 'danger';

      default:
        return 'neutral';
    }
  }
}
