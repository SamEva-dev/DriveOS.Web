import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { FreelanceInvitationDrawerComponent } from '../../components/freelance-invitation-drawer/freelance-invitation-drawer.component';
import { ProfessionalCompliancePanelComponent } from '../../components/professional-compliance-panel/professional-compliance-panel.component';
import { ProfessionalReviewsPanelComponent } from '../../components/professional-reviews-panel/professional-reviews-panel.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ProfessionalProfile } from '../../models/professional-profile.model';

type ProfileTab =
  | 'overview'
  | 'profile'
  | 'capabilities'
  | 'availability'
  | 'areas'
  | 'rates'
  | 'compliance'
  | 'missions'
  | 'students'
  | 'services'
  | 'invoices'
  | 'reviews';

@Component({
  selector: 'driveos-professional-profile-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    DriveOsPageShellComponent,
    FreelanceInvitationDrawerComponent,
    ProfessionalCompliancePanelComponent,
    ProfessionalReviewsPanelComponent,
  ],
  templateUrl: './professional-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalProfilePage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly profile = signal<ProfessionalProfile | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly activeTab = signal<ProfileTab>('overview');
  readonly profileId = this.route.snapshot.paramMap.get('profileId') ?? '';
  readonly invitationDrawerOpen = signal(false);
  readonly canInvite = computed(
    () =>
      this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.create) &&
      this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.send),
  );

  readonly tabs = computed(() =>
    [
      { id: 'overview' as const, key: 'overview', visible: true },
      {
        id: 'profile' as const,
        key: 'profile',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.profiles.read),
      },
      {
        id: 'capabilities' as const,
        key: 'capabilities',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.profiles.read),
      },
      {
        id: 'availability' as const,
        key: 'availability',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.profiles.read),
      },
      {
        id: 'areas' as const,
        key: 'areas',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.profiles.read),
      },
      {
        id: 'rates' as const,
        key: 'rates',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.profiles.read),
      },
      {
        id: 'compliance' as const,
        key: 'compliance',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.compliance.read),
      },
      {
        id: 'missions' as const,
        key: 'missions',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.missions.read),
      },
      {
        id: 'students' as const,
        key: 'students',
        visible: this.auth.hasPermission(
          PROFESSIONAL_MARKETPLACE_PERMISSIONS.studentAssignments.read,
        ),
      },
      {
        id: 'services' as const,
        key: 'services',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceEntries.read),
      },
      {
        id: 'invoices' as const,
        key: 'invoices',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invoices.read),
      },
      {
        id: 'reviews' as const,
        key: 'reviews',
        visible: this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.reviews.read),
      },
    ].filter((x) => x.visible),
  );

  constructor() {
    this.load();
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }
  openInvitation(): void {
    this.invitationDrawerOpen.set(true);
  }
  closeInvitation(): void {
    this.invitationDrawerOpen.set(false);
  }

  load(): void {
    if (!this.profileId) {
      this.loadError.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getProfessionalProfile(this.profileId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  displayName(profile: ProfessionalProfile): string {
    return profile.tradeName || profile.legalName || profile.headline || '—';
  }

  availabilityDay(day: string | number): string {
    return String(day);
  }
}
