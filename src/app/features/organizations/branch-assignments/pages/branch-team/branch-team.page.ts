import {
  CommonModule,
  DatePipe,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  TranslatePipe,
  TranslateService,
} from '@ngx-translate/core';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs';

import {
  AuthorizationService,
} from '../../../../../core/auth/authorization.service';

import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsInputDirective,
  DriveOsPaginatorComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';

import {
  BranchAssignmentStatusDialogComponent,
} from '../../components/branch-assignment-status-dialog/branch-assignment-status-dialog.component';

import {
  BRANCH_ASSIGNMENT_PERMISSIONS,
} from '../../domain/branch-assignment-permissions';

import {
  BRANCH_ASSIGNMENT_ROLE_OPTIONS,
  BranchAssignmentRoleName,
  branchAssignmentRoleLabelKey,
} from '../../models/branch-assignment-role';

import {
  BRANCH_ASSIGNMENT_TYPE_OPTIONS,
  BranchAssignmentTypeName,
  branchAssignmentTypeLabelKey,
} from '../../models/branch-assignment-type';

import {
  BranchAssignmentLifecycleAction,
} from '../../models/branch-assignment-lifecycle-action';

import {
  BranchUserAssignment,
} from '../../models/branch-user-assignment.model';

import {
  BRANCH_USER_ASSIGNMENT_STATUSES,
  BranchUserAssignmentStatus,
  branchUserAssignmentStatusLabelKey,
} from '../../models/branch-user-assignment-status';

import {
  BranchTeamStore,
} from '../../data-access/branch-team.store';

@Component({
  selector:
    'app-branch-team-page',

  standalone:
    true,

  imports: [
    CommonModule,
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
    BranchAssignmentStatusDialogComponent,
  ],

  providers: [
    BranchTeamStore,
  ],

  templateUrl:
    './branch-team.page.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BranchTeamPage
  implements
    OnInit,
    OnDestroy {
  private readonly route =
    inject(
      ActivatedRoute,
    );

  private readonly authorization =
    inject(
      AuthorizationService,
    );

  private readonly toast =
    inject(
      DriveOsToastService,
    );

  private readonly translate =
    inject(
      TranslateService,
    );

  private readonly destroy$ =
    new Subject<void>();

  readonly store =
    inject(
      BranchTeamStore,
    );

  readonly organizationId =
    this.route.snapshot.paramMap
      .get(
        'organizationId',
      ) ?? '';

  readonly branchId =
    this.route.snapshot.paramMap
      .get(
        'branchId',
      ) ?? '';

  readonly searchControl =
    new FormControl(
      '',
      {
        nonNullable:
          true,
      },
    );

  readonly statusControl =
    new FormControl<
      BranchUserAssignmentStatus | ''
    >(
      '',
      {
        nonNullable:
          true,
      },
    );

  readonly roleControl =
    new FormControl<
      BranchAssignmentRoleName | ''
    >(
      '',
      {
        nonNullable:
          true,
      },
    );

  readonly typeControl =
    new FormControl<
      BranchAssignmentTypeName | ''
    >(
      '',
      {
        nonNullable:
          true,
      },
    );

  readonly statusOptions =
    BRANCH_USER_ASSIGNMENT_STATUSES;

  readonly roleOptions =
    BRANCH_ASSIGNMENT_ROLE_OPTIONS;

  readonly typeOptions =
    BRANCH_ASSIGNMENT_TYPE_OPTIONS;

  readonly canCreate =
    computed(
      () =>
        this.authorization
          .hasPermission(
            BRANCH_ASSIGNMENT_PERMISSIONS
              .create,
          ),
    );

  readonly canSuspend =
    computed(
      () =>
        this.authorization
          .hasPermission(
            BRANCH_ASSIGNMENT_PERMISSIONS
              .suspend,
          ),
    );

  readonly canReactivate =
    computed(
      () =>
        this.authorization
          .hasPermission(
            BRANCH_ASSIGNMENT_PERMISSIONS
              .reactivate,
          ),
    );

  readonly canEnd =
    computed(
      () =>
        this.authorization
          .hasPermission(
            BRANCH_ASSIGNMENT_PERMISSIONS
              .end,
          ),
    );

  readonly createLink =
    computed(
      () => [
        '/organizations',
        this.organizationId,
        'branches',
        this.branchId,
        'team',
        'create',
      ],
    );

  readonly branchLink =
    computed(
      () => [
        '/organizations',
        this.organizationId,
        'branches',
        this.branchId,
      ],
    );

  @ViewChild(
    BranchAssignmentStatusDialogComponent,
  )
  private statusDialog?:
    BranchAssignmentStatusDialogComponent;

  ngOnInit(): void {
    this.store.initialize(
      this.organizationId,
      this.branchId,
    );

    this.searchControl
      .valueChanges
      .pipe(
        debounceTime(
          350,
        ),
        distinctUntilChanged(),
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(
        search => {
          this.applyFilters({
            search,
          });
        },
      );

    this.statusControl
      .valueChanges
      .pipe(
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(
        status => {
          this.applyFilters({
            status:
              status || null,
          });
        },
      );

    this.roleControl
      .valueChanges
      .pipe(
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(
        role => {
          this.applyFilters({
            role:
              role || null,
          });
        },
      );

    this.typeControl
      .valueChanges
      .pipe(
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(
        assignmentType => {
          this.applyFilters({
            assignmentType:
              assignmentType ||
              null,
          });
        },
      );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  resetFilters(): void {
    this.searchControl.setValue(
      '',
      {
        emitEvent:
          false,
      },
    );

    this.statusControl.setValue(
      '',
      {
        emitEvent:
          false,
      },
    );

    this.roleControl.setValue(
      '',
      {
        emitEvent:
          false,
      },
    );

    this.typeControl.setValue(
      '',
      {
        emitEvent:
          false,
      },
    );

    this.store.setFilters({
      search:
        '',

      status:
        null,

      role:
        null,

      assignmentType:
        null,

      pageNumber:
        1,
    });
  }

  openAction(
    assignment:
      BranchUserAssignment,
    action:
      BranchAssignmentLifecycleAction,
  ): void {
    this.statusDialog?.open(
      assignment.id,
      action,
    );
  }

  executeAction(
    event: {
      assignmentId:
        string;

      action:
        BranchAssignmentLifecycleAction;

      reason:
        string;
    },
  ): void {
    this.store.executeAction(
      event.assignmentId,
      event.action,
      event.reason,
      () => {
        this.statusDialog?.close();

        this.toast.success(
          this.translate.instant(
            this.getSuccessTitleKey(
              event.action,
            ),
          ),
        );
      },
      messages => {
        this.toast.error(
          this.translate.instant(
            'organizations.branchAssignments.statusChangeErrorTitle',
          ),
          messages.join(
            '\n',
          ),
        );
      },
    );
  }

  onPageChange(
    event: {
      pageNumber:
        number;

      pageSize:
        number;
    },
  ): void {
    this.store.changePage(
      event.pageNumber,
      event.pageSize,
    );
  }

  statusLabelKey(
    status:
      BranchUserAssignmentStatus,
  ): string {
    return branchUserAssignmentStatusLabelKey(
      status,
    );
  }

  roleLabelKey(
    role:
      BranchAssignmentRoleName,
  ): string {
    return branchAssignmentRoleLabelKey(
      role,
    );
  }

  typeLabelKey(
    assignmentType:
      BranchAssignmentTypeName,
  ): string {
    return branchAssignmentTypeLabelKey(
      assignmentType,
    );
  }

  badgeVariant(
    status:
      BranchUserAssignmentStatus,
  ): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
        return 'success';

      case 'Suspended':
        return 'warning';

      case 'Ended':
        return 'neutral';
    }
  }

  canShowActions(
    assignment:
      BranchUserAssignment,
  ): boolean {
    return (
      (
        assignment.status ===
          'Active' &&
        (
          this.canSuspend() ||
          this.canEnd()
        )
      ) ||
      (
        assignment.status ===
          'Suspended' &&
        (
          this.canReactivate() ||
          this.canEnd()
        )
      )
    );
  }

  private applyFilters(
    filters: {
      search?:
        string;

      status?:
        BranchUserAssignmentStatus | null;

      role?:
        BranchAssignmentRoleName | null;

      assignmentType?:
        BranchAssignmentTypeName | null;
    },
  ): void {
    this.store.setFilters({
      ...filters,
      pageNumber:
        1,
    });
  }

  private getSuccessTitleKey(
    action:
      BranchAssignmentLifecycleAction,
  ): string {
    switch (action) {
      case 'suspend':
        return 'organizations.branchAssignments.suspendSuccessTitle';

      case 'reactivate':
        return 'organizations.branchAssignments.reactivateSuccessTitle';

      case 'end':
        return 'organizations.branchAssignments.endSuccessTitle';
    }
  }
}
