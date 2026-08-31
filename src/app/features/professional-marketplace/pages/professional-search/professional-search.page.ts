import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { FreelanceInvitationDrawerComponent } from '../../components/freelance-invitation-drawer/freelance-invitation-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import {
  ProfessionalRateUnit,
  ProfessionalSearchResult,
} from '../../models/professional-search.model';

@Component({
  selector: 'driveos-professional-search-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsPageShellComponent,
    FreelanceInvitationDrawerComponent,
  ],
  templateUrl: './professional-search.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalSearchPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authorization = inject(AuthorizationService);

  readonly items = signal<readonly ProfessionalSearchResult[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly invitationDrawerOpen = signal(false);
  readonly invitationProfileId = signal<string | null>(null);
  readonly invitationProfileLabel = signal<string | null>(null);
  readonly canInvite = computed(
    () =>
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.create) &&
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invitations.send),
  );

  countryCode = '';
  teachingCategoryCode = '';
  languageCode = '';
  specializationCode = '';
  areaCode = '';
  latitude: number | null = null;
  longitude: number | null = null;
  radiusKm: number | null = null;
  availableOnDate = '';
  availableFrom = '';
  availableTo = '';
  maximumRateAmount: number | null = null;
  currency = 'EUR';
  rateUnit: ProfessionalRateUnit | '' = '';
  verifiedOnly = true;

  readonly rateUnits: readonly ProfessionalRateUnit[] = [
    'Hour',
    'HalfDay',
    'Day',
    'Session',
    'Mission',
  ];

  constructor() {
    this.search();
  }

  search(page = 1): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .searchProfessionals({
        countryCode: this.countryCode || null,
        teachingCategoryCode: this.teachingCategoryCode || null,
        languageCode: this.languageCode || null,
        specializationCode: this.specializationCode || null,
        areaCode: this.areaCode || null,
        latitude: this.latitude,
        longitude: this.longitude,
        radiusKm: this.radiusKm,
        availableOnDate: this.availableOnDate || null,
        availableFrom: this.availableFrom || null,
        availableTo: this.availableTo || null,
        maximumRateAmount: this.maximumRateAmount,
        currency: this.currency || null,
        rateUnit: this.rateUnit || null,
        verifiedOnly: this.verifiedOnly,
        page,
        pageSize: this.pageSize,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.total.set(result.total);
          this.page.set(result.page);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  reset(): void {
    this.countryCode = '';
    this.teachingCategoryCode = '';
    this.languageCode = '';
    this.specializationCode = '';
    this.areaCode = '';
    this.latitude = null;
    this.longitude = null;
    this.radiusKm = null;
    this.availableOnDate = '';
    this.availableFrom = '';
    this.availableTo = '';
    this.maximumRateAmount = null;
    this.currency = 'EUR';
    this.rateUnit = '';
    this.verifiedOnly = true;
    this.search();
  }

  openInvitation(item?: ProfessionalSearchResult): void {
    this.invitationProfileId.set(item?.profileId ?? null);
    this.invitationProfileLabel.set(item?.headline ?? null);
    this.invitationDrawerOpen.set(true);
  }

  closeInvitation(): void {
    this.invitationDrawerOpen.set(false);
    this.invitationProfileId.set(null);
    this.invitationProfileLabel.set(null);
  }

  previousPage(): void {
    if (this.page() > 1) this.search(this.page() - 1);
  }
  nextPage(): void {
    if (this.page() * this.pageSize < this.total()) this.search(this.page() + 1);
  }
}
