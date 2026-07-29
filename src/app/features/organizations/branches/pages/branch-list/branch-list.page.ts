import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  ActivatedRoute,
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
  BranchesListStore,
} from '../../data-access/branches-list.store';

import {
  BranchStatus,
} from '../../models/branch-status';

import {
  BranchTypeName,
} from '../../models/branch-type';

import {
  BranchSortDirection,
  BranchSortField,
} from '../../models/get-branches-parameters';

import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsPageChange,
  DriveOsPaginatorComponent,
  DriveOsSpinnerComponent,
  DriveOsTableDirective,
} from '../../../../../shared/ui';

@Component({
  selector:
    'driveos-branch-list-page',

  standalone: true,

  providers: [
    BranchesListStore,
  ],

  imports: [
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
    './branch-list.page.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BranchListPage {
  readonly store =
    inject(BranchesListStore);

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly destroyRef =
    inject(DestroyRef);

  readonly organizationId =
    this.route.snapshot.paramMap.get(
      'organizationId',
    ) ?? '';

  readonly createBranchLink =
    computed(() => [
      '/organizations',
      this.organizationId,
      'branches',
      'create',
    ]);

  readonly organizationLink =
    computed(() => [
      '/organizations',
      this.organizationId,
    ]);

  readonly searchControl =
    new FormControl(
      '',
      {
        nonNullable: true,
      },
    );

  constructor() {
    if (this.organizationId) {
      this.store.initialize(
        this.organizationId,
      );
    }

    this.searchControl
      .valueChanges
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
    field: BranchSortField,
  ): void {
    const current =
      this.store.parameters();

    const nextDirection:
      BranchSortDirection =
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
    field: BranchSortField,
  ): string {
    const parameters =
      this.store.parameters();

    if (
      parameters.sortBy !== field
    ) {
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

  openBranch(
    branchId: string,
  ): void {
    void this.router.navigate([
      '/organizations',
      this.organizationId,
      'branches',
      branchId,
    ]);
  }

  branchTypeKey(
    branchType: BranchTypeName,
  ): string {
    const keys:
      Record<
        BranchTypeName,
        string
      > = {
      Headquarters:
        'organizations.branches.types.headquarters',

      DrivingSchoolAgency:
        'organizations.branches.types.drivingSchoolAgency',

      TrainingSite:
        'organizations.branches.types.trainingSite',

      AdministrativeOffice:
        'organizations.branches.types.administrativeOffice',

      ExaminationSupportSite:
        'organizations.branches.types.examinationSupportSite',

      VirtualBranch:
        'organizations.branches.types.virtualBranch',

      Other:
        'organizations.branches.types.other',
    };

    return (
      keys[branchType] ??
      'organizations.branches.types.unknown'
    );
  }

  branchStatusKey(
    status: BranchStatus,
  ): string {
    return [
      'organizations.branches.statuses',
      status.charAt(0)
        .toLowerCase() +
        status.slice(1),
    ].join('.');
  }

  statusVariant(
    status: BranchStatus,
  ): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
        return 'success';

      case 'Draft':
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
