import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsEmptyStateComponent,
  DriveOsSpinnerComponent,
  DriveOsToastService,
} from '../../../../../shared/ui';
import { OrganizationActivationReadinessApiService } from '../../data-access/organization-activation-readiness-api.service';
import {
  OrganizationActivationReadiness,
  OrganizationActivationRequirement,
} from '../../models/organization-activation-readiness.model';

interface RequirementNavigation {
  readonly routerLink: readonly string[];
  readonly labelKey: string;
  readonly requiredPermission: string;
}

@Component({
  selector: 'driveos-organization-activation-readiness-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './organization-activation-readiness.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationActivationReadinessPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(OrganizationActivationReadinessApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly organizationId = this.route.snapshot.paramMap.get('organizationId');
  readonly readiness = signal<OrganizationActivationReadiness | null>(null);
  readonly isLoading = signal(true);

  readonly satisfiedCount = computed(
    () => this.readiness()?.requirements.filter((item) => item.isSatisfied).length ?? 0,
  );

  readonly totalCount = computed(() => this.readiness()?.requirements.length ?? 0);

  constructor() {
    if (!this.organizationId) {
      this.isLoading.set(false);
      void this.router.navigate(['/organizations']);
      return;
    }

    this.load();
  }

  reload(): void {
    this.load();
  }

  navigationFor(requirement: OrganizationActivationRequirement): RequirementNavigation | null {
    if (!this.organizationId || requirement.isSatisfied) {
      return null;
    }

    const base = ['/organizations', this.organizationId];

    switch (requirement.code) {
      case 'organization.legal-profile':
        return {
          routerLink: [...base, 'legal-profile'],
          labelKey: 'organizations.activationReadiness.actions.openLegalProfile',
          requiredPermission: 'OrganizationLegalProfiles.Read',
        };

      case 'organization.primary-owner':
      case 'organization.active-owner':
        return {
          routerLink: [...base, 'representatives'],
          labelKey: 'organizations.activationReadiness.actions.openRepresentatives',
          requiredPermission: 'OrganizationRepresentatives.Read',
        };

      case 'organization.active-subscription':
        return {
          routerLink: [...base, 'subscription'],
          labelKey: 'organizations.activationReadiness.actions.openSubscription',
          requiredPermission: 'OrganizationSubscriptions.Read',
        };

      case 'organization.operational-settings':
        return {
          routerLink: [...base, 'settings'],
          labelKey: 'organizations.activationReadiness.actions.openConfigurations',
          requiredPermission: 'OrganizationSettings.Read',
        };

      case 'organization.primary-branch':
      case 'organization.primary-branch-manager':
        return {
          routerLink: [...base, 'branches'],
          labelKey: 'organizations.activationReadiness.actions.openBranches',
          requiredPermission: 'Branches.Read',
        };

      default:
        return null;
    }
  }

  canNavigateTo(navigation: RequirementNavigation): boolean {
    return this.authorization.hasPermission(navigation.requiredPermission);
  }

  trackRequirement(_: number, requirement: OrganizationActivationRequirement): string {
    return requirement.code;
  }

  private load(): void {
    if (!this.organizationId) {
      return;
    }

    this.isLoading.set(true);

    this.api
      .get(this.organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.readiness.set(result);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          for (const message of this.apiErrorService.getMessages(error)) {
            this.toast.error(this.translate.instant('errors.title'), message);
          }
        },
      });
  }
}
