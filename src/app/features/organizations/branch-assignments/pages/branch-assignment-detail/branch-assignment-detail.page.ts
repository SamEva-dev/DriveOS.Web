import {
  DatePipe,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink,
} from '@angular/router';

import {
  TranslatePipe,
  TranslateService,
} from '@ngx-translate/core';

import {
  finalize,
} from 'rxjs';

import {
  AuthorizationService,
} from '../../../../../core/auth/authorization.service';

import {
  AuthUsersApiService,
} from '../../../../../core/auth/data-access/auth-users-api.service';

import {
  AuthUser,
} from '../../../../../core/auth/models/auth-user.model';

import {
  ApiErrorService,
} from '../../../../../core/errors/api-error.service';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';

import {
  BranchAssignmentStatusDialogComponent,
} from '../../components/branch-assignment-status-dialog/branch-assignment-status-dialog.component';

import {
  BranchAssignmentSummaryComponent,
} from '../../components/branch-assignment-summary/branch-assignment-summary.component';

import {
  BranchAssignmentTimelineComponent,
} from '../../components/branch-assignment-timeline/branch-assignment-timeline.component';

import {
  BranchAssignmentUserCardComponent,
} from '../../components/branch-assignment-user-card/branch-assignment-user-card.component';

import {
  BranchUserAssignmentsApiService,
} from '../../data-access/branch-user-assignments-api.service';

import {
  BRANCH_ASSIGNMENT_PERMISSIONS,
} from '../../domain/branch-assignment-permissions';

import {
  buildBranchAssignmentTimeline,
} from '../../domain/branch-assignment-timeline';

import {
  BranchAssignmentLifecycleAction,
} from '../../models/branch-assignment-lifecycle-action';

import {
  BranchAssignmentTimelineItem,
} from '../../models/branch-assignment-timeline-item';

import {
  BranchUserAssignment,
} from '../../models/branch-user-assignment.model';

@Component({
  selector:
    'app-branch-assignment-detail-page',

  standalone:
    true,

  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    BranchAssignmentStatusDialogComponent,
    BranchAssignmentSummaryComponent,
    BranchAssignmentTimelineComponent,
    BranchAssignmentUserCardComponent,
  ],

  templateUrl:
    './branch-assignment-detail.page.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class
  BranchAssignmentDetailPage
  implements OnInit {
  private readonly route =
    inject(
      ActivatedRoute,
    );

  private readonly api =
    inject(
      BranchUserAssignmentsApiService,
    );

  private readonly authUsersApi =
    inject(
      AuthUsersApiService,
    );

  private readonly authorization =
    inject(
      AuthorizationService,
    );

  private readonly apiError =
    inject(
      ApiErrorService,
    );

  private readonly toast =
    inject(
      DriveOsToastService,
    );

  private readonly translate =
    inject(
      TranslateService,
    );

  readonly organizationId =
    this.route.snapshot.paramMap
      .get(
        'organizationId',
      ) ?? '';

  readonly assignmentId =
    this.route.snapshot.paramMap
      .get(
        'assignmentId',
      ) ?? '';

  readonly assignment =
    signal<
      BranchUserAssignment | null
    >(null);

  readonly user =
    signal<AuthUser | null>(
      null,
    );

  readonly loading =
    signal(true);

  readonly actionLoading =
    signal(false);

  readonly assignmentErrors =
    signal<
      readonly string[]
    >([]);

  readonly userErrors =
    signal<
      readonly string[]
    >([]);

  readonly timeline =
    computed<
      readonly BranchAssignmentTimelineItem[]
    >(() => {
      const assignment =
        this.assignment();

      return assignment
        ? buildBranchAssignmentTimeline(
            assignment,
          )
        : [];
    });

  readonly teamLink =
    computed(() => {
      const assignment =
        this.assignment();

      return assignment
        ? [
            '/organizations',
            this.organizationId,
            'branches',
            assignment.branchId,
            'team',
          ]
        : [
            '/organizations',
            this.organizationId,
          ];
    });

  readonly branchLink =
    computed(() => {
      const assignment =
        this.assignment();

      return assignment
        ? [
            '/organizations',
            this.organizationId,
            'branches',
            assignment.branchId,
          ]
        : [
            '/organizations',
            this.organizationId,
          ];
    });

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

  @ViewChild(
    BranchAssignmentStatusDialogComponent,
  )
  private statusDialog?:
    BranchAssignmentStatusDialogComponent;

  ngOnInit(): void {
    this.load();
  }

  reload(): void {
    this.load();
  }

  openAction(
    action:
      BranchAssignmentLifecycleAction,
  ): void {
    const assignment =
      this.assignment();

    if (!assignment) {
      return;
    }

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
    const request = {
      reason:
        event.reason,
    };

    const operation =
      event.action === 'suspend'
        ? this.api.suspend(
            this.organizationId,
            event.assignmentId,
            request,
          )
        : event.action === 'reactivate'
          ? this.api.reactivate(
              this.organizationId,
              event.assignmentId,
              request,
            )
          : this.api.end(
              this.organizationId,
              event.assignmentId,
              request,
            );

    this.actionLoading.set(
      true,
    );

    operation
      .pipe(
        finalize(() => {
          this.actionLoading.set(
            false,
          );
        }),
      )
      .subscribe({
        next: () => {
          this.statusDialog?.close();

          this.toast.success(
            this.translate.instant(
              this.getSuccessTitleKey(
                event.action,
              ),
            ),
          );

          this.load();
        },

        error: error => {
          const messages =
            this.apiError.getMessages(
              error,
            );

          this.toast.error(
            this.translate.instant(
              'organizations.branchAssignments.statusChangeErrorTitle',
            ),
            messages.join(
              '\n',
            ),
          );
        },
      });
  }

  private load(): void {
    this.loading.set(
      true,
    );

    this.assignmentErrors.set(
      [],
    );

    this.userErrors.set(
      [],
    );

    this.api
      .getById(
        this.organizationId,
        this.assignmentId,
      )
      .subscribe({
        next: assignment => {
          this.assignment.set(
            assignment,
          );

          this.loadUser(
            assignment.userId,
          );
        },

        error: error => {
          this.loading.set(
            false,
          );

          this.assignment.set(
            null,
          );

          this.assignmentErrors.set(
            this.apiError
              .getMessages(
                error,
              ),
          );
        },
      });
  }

  private loadUser(
    userId:
      string,
  ): void {
    this.authUsersApi
      .getById(
        userId,
      )
      .pipe(
        finalize(() => {
          this.loading.set(
            false,
          );
        }),
      )
      .subscribe({
        next: user => {
          this.user.set(
            user,
          );
        },

        error: error => {
          this.user.set(
            null,
          );

          this.userErrors.set(
            this.apiError
              .getMessages(
                error,
              ),
          );
        },
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
