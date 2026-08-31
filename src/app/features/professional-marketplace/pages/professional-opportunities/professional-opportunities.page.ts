import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { ProfessionalOpportunityDrawerComponent } from '../../components/professional-opportunity-drawer/professional-opportunity-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ProfessionalOpportunity } from '../../models/professional-opportunity.model';

type OpportunityTab = 'active' | 'drafts' | 'closed';

@Component({
  selector: 'driveos-professional-opportunities-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsPageShellComponent, ProfessionalOpportunityDrawerComponent],
  templateUrl: './professional-opportunities.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalOpportunitiesPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly authService = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<readonly ProfessionalOpportunity[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly activeTab = signal<OpportunityTab>('active');
  readonly drawerOpen = signal(false);
  readonly selected = signal<ProfessionalOpportunity | null>(null);
  readonly organizationId = computed(() => this.authService.user()?.organizationId ?? '');
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.opportunities.create),
  );

  readonly visibleItems = computed(() =>
    this.items().filter((item) => {
      const tab = this.activeTab();
      if (tab === 'active') return item.status === 'Published' || item.status === 'Paused';
      if (tab === 'drafts') return item.status === 'Draft';
      return item.status === 'Filled' || item.status === 'Expired' || item.status === 'Cancelled';
    }),
  );
  readonly counts = computed(() => ({
    active: this.items().filter((x) => x.status === 'Published' || x.status === 'Paused').length,
    drafts: this.items().filter((x) => x.status === 'Draft').length,
    closed: this.items().filter(
      (x) => x.status === 'Filled' || x.status === 'Expired' || x.status === 'Cancelled',
    ).length,
  }));

  constructor() {
    this.load();
  }
  setTab(tab: OpportunityTab): void {
    this.activeTab.set(tab);
  }
  openCreate(): void {
    this.selected.set(null);
    this.drawerOpen.set(true);
  }
  openDetail(item: ProfessionalOpportunity): void {
    this.selected.set(item);
    this.drawerOpen.set(true);
  }
  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.selected.set(null);
  }

  load(): void {
    const organizationId = this.organizationId();
    if (!organizationId) {
      this.loadError.set(true);
      return;
    }
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .listProfessionalOpportunities(organizationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  budget(item: ProfessionalOpportunity): string {
    if (item.budgetMin === null && item.budgetMax === null) return '—';
    return `${item.budgetMin ?? '—'} – ${item.budgetMax ?? '—'} ${item.currency ?? ''}/${item.budgetUnit ?? ''}`;
  }
}
