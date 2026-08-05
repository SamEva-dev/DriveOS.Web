import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { finalize } from 'rxjs';

import { AuthUser } from '../../../../../core/auth/models/auth-user.model';

import { ApiErrorService } from '../../../../../core/errors/api-error.service';

import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsInputDirective,
  DriveOsToastService,
} from '../../../../../shared/ui';

import { AuthUserSelectorComponent } from '../../components/auth-user-selector/auth-user-selector.component';

import { BranchUserAssignmentsApiService } from '../../data-access/branch-user-assignments-api.service';

import {
  BRANCH_ASSIGNMENT_ROLE_OPTIONS,
  BranchAssignmentRole,
} from '../../models/branch-assignment-role';

import {
  BRANCH_ASSIGNMENT_TYPE_OPTIONS,
  BranchAssignmentType,
} from '../../models/branch-assignment-type';
import { CommonModule } from '@angular/common';

import { AuthorizationService } from '../../../../../core/auth/authorization.service';

import { BRANCH_ASSIGNMENT_PERMISSIONS } from '../../domain/branch-assignment-permissions';

interface BranchAssignmentCreateForm {
  readonly role: FormControl<BranchAssignmentRole | null>;

  readonly assignmentType: FormControl<BranchAssignmentType | null>;

  readonly plannedEndDate: FormControl<string>;
}

@Component({
  selector: 'app-branch-assignment-create-page',

  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsInputDirective,
    AuthUserSelectorComponent,
  ],

  templateUrl: './branch-assignment-create.page.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAssignmentCreatePage {
  private readonly authorization = inject(AuthorizationService);
  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly api = inject(BranchUserAssignmentsApiService);

  private readonly apiError = inject(ApiErrorService);

  private readonly toast = inject(DriveOsToastService);

  private readonly translate = inject(TranslateService);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId') ?? '';

  readonly branchId = this.route.snapshot.paramMap.get('branchId') ?? '';

  readonly selectedUser = signal<AuthUser | null>(null);

  readonly submitting = signal(false);

  readonly serverErrors = signal<readonly string[]>([]);

  readonly roleOptions = BRANCH_ASSIGNMENT_ROLE_OPTIONS;

  readonly typeOptions = BRANCH_ASSIGNMENT_TYPE_OPTIONS;

  readonly form = new FormGroup<BranchAssignmentCreateForm>({
    role: new FormControl<BranchAssignmentRole | null>(null, {
      validators: [Validators.required],
    }),

    assignmentType: new FormControl<BranchAssignmentType | null>(null, {
      validators: [Validators.required],
    }),

    plannedEndDate: new FormControl('', {
      nonNullable: true,
    }),
  });

  readonly teamLink = computed(() => [
    '/organizations',
    this.organizationId,
    'branches',
    this.branchId,
    'team',
  ]);

  constructor() {
    if (!this.authorization.hasPermission(BRANCH_ASSIGNMENT_PERMISSIONS.create)) {
      void this.router.navigate(this.teamLink());
    }
  }

  requiresPlannedEnd(): boolean {
    const type = this.form.controls.assignmentType.value;

    return type === BranchAssignmentType.Temporary || type === BranchAssignmentType.Replacement;
  }

  onUserSelected(user: AuthUser | null): void {
    this.selectedUser.set(user);
  }

  submit(): void {
    this.form.markAllAsTouched();

    const user = this.selectedUser();

    if (!user) {
      this.serverErrors.set([this.translate.instant('errors.branchAssignments.userId.empty')]);

      return;
    }

    if (this.form.invalid) {
      return;
    }

    const rawValue = this.form.getRawValue();

    if (this.requiresPlannedEnd() && !rawValue.plannedEndDate) {
      this.form.controls.plannedEndDate.setErrors({
        required: true,
      });

      return;
    }

    const plannedEndAtUtc = this.toUtcEndOfDay(rawValue.plannedEndDate);

    if (plannedEndAtUtc && new Date(plannedEndAtUtc).getTime() <= Date.now()) {
      this.form.controls.plannedEndDate.setErrors({
        future: true,
      });

      return;
    }

    this.submitting.set(true);

    this.serverErrors.set([]);

    this.api
      .create(this.organizationId, this.branchId, {
        userId: user.id,

        role: rawValue.role!,

        assignmentType: rawValue.assignmentType!,

        plannedEndAtUtc,
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.toast.success(
            this.translate.instant('organizations.branchAssignments.createSuccessTitle'),
            this.translate.instant('organizations.branchAssignments.createSuccessDescription'),
          );

          void this.router.navigate(this.teamLink());
        },

        error: (error) => {
          const messages = this.apiError.getMessages(error);

          this.serverErrors.set(messages);

          this.toast.error(
            this.translate.instant('organizations.branchAssignments.createErrorTitle'),
            messages.join('\n'),
          );
        },
      });
  }

  private toUtcEndOfDay(dateValue: string): string | null {
    if (!dateValue) {
      return null;
    }

    const localDate = new Date(`${dateValue}T23:59:59.999`);

    return localDate.toISOString();
  }
}
