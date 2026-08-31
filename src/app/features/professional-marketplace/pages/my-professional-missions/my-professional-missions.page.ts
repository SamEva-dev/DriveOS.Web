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
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { MyProfessionalMissionDrawerComponent } from '../../components/my-professional-mission-drawer/my-professional-mission-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { ProfessionalMission } from '../../models/professional-mission.model';
import { ProfessionalProfile } from '../../models/professional-profile.model';
type MissionTab = 'pending' | 'active' | 'closed';
@Component({
  selector: 'driveos-my-professional-missions-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsPageShellComponent, MyProfessionalMissionDrawerComponent],
  templateUrl: './my-professional-missions.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfessionalMissionsPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly profile = signal<ProfessionalProfile | null>(null);
  readonly items = signal<readonly ProfessionalMission[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly activeTab = signal<MissionTab>('pending');
  readonly drawerOpen = signal(false);
  readonly selected = signal<ProfessionalMission | null>(null);
  readonly counts = computed(() => ({
    pending: this.items().filter((x) => x.status === 'Proposed').length,
    active: this.items().filter(
      (x) => x.status === 'Accepted' || x.status === 'Active' || x.status === 'Paused',
    ).length,
    closed: this.items().filter(
      (x) => x.status === 'Completed' || x.status === 'Cancelled' || x.status === 'Declined',
    ).length,
  }));
  readonly visibleItems = computed(() =>
    this.items().filter((x) =>
      this.activeTab() === 'pending'
        ? x.status === 'Proposed'
        : this.activeTab() === 'active'
          ? x.status === 'Accepted' || x.status === 'Active' || x.status === 'Paused'
          : x.status === 'Completed' || x.status === 'Cancelled' || x.status === 'Declined',
    ),
  );
  constructor() {
    this.load();
  }
  setTab(v: MissionTab) {
    this.activeTab.set(v);
  }
  openDetail(x: ProfessionalMission) {
    this.selected.set(x);
    this.drawerOpen.set(true);
  }
  closeDrawer() {
    this.drawerOpen.set(false);
    this.selected.set(null);
  }
  load() {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .getMyProfessionalProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (p) => this.profile.set(p), error: () => this.profile.set(null) });
    this.api
      .listMyProfessionalMissions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (x) => {
          this.items.set(x);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }
}
