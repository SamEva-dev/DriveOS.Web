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
import { forkJoin } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { ServiceEntryDrawerComponent } from '../../components/service-entry-drawer/service-entry-drawer.component';
import { ServiceStatementDrawerComponent } from '../../components/service-statement-drawer/service-statement-drawer.component';
import { ServiceDisputeDrawerComponent } from '../../components/service-dispute-drawer/service-dispute-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ServiceEntry } from '../../models/service-entry.model';
import { ServiceStatement } from '../../models/service-statement.model';
import { ServiceDispute } from '../../models/service-dispute.model';
type PageTab = 'entries' | 'statements' | 'disputes';
type EntryTab = 'toSubmit' | 'review' | 'closed';
@Component({
  selector: 'driveos-my-professional-service-entries-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DriveOsPageShellComponent,
    ServiceEntryDrawerComponent,
    ServiceStatementDrawerComponent,
    ServiceDisputeDrawerComponent,
  ],
  templateUrl: './my-professional-service-entries.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfessionalServiceEntriesPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authorization = inject(AuthorizationService);
  readonly items = signal<readonly ServiceEntry[]>([]);
  readonly statements = signal<readonly ServiceStatement[]>([]);
  readonly disputes = signal<readonly ServiceDispute[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly pageTab = signal<PageTab>('entries');
  readonly activeTab = signal<EntryTab>('toSubmit');
  readonly drawerOpen = signal(false);
  readonly selected = signal<ServiceEntry | null>(null);
  readonly statementDrawerOpen = signal(false);
  readonly selectedStatement = signal<ServiceStatement | null>(null);
  readonly disputeDrawerOpen = signal(false);
  readonly selectedDispute = signal<ServiceDispute | null>(null);
  readonly query = signal('');
  readonly canSubmitStatement = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.submit),
  );
  readonly counts = computed(() => ({
    toSubmit: this.items().filter((x) => x.status === 'Recorded').length,
    review: this.items().filter((x) => x.status === 'Submitted' || x.status === 'Disputed').length,
    closed: this.items().filter((x) => x.status === 'Approved' || x.status === 'Rejected').length,
  }));
  readonly visible = computed(() => {
    const tab = this.activeTab(),
      q = this.query().trim().toLowerCase();
    return this.items().filter((x) => {
      const status =
        tab === 'toSubmit'
          ? x.status === 'Recorded'
          : tab === 'review'
            ? x.status === 'Submitted' || x.status === 'Disputed'
            : x.status === 'Approved' || x.status === 'Rejected';
      if (!status) return false;
      return (
        !q || (x.serviceCode + ' ' + x.description + ' ' + x.serviceDate).toLowerCase().includes(q)
      );
    });
  });
  readonly visibleStatements = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.statements().filter(
      (x) =>
        !q ||
        (x.periodStart + ' ' + x.periodEnd + ' ' + x.status + ' ' + x.totalAmount)
          .toLowerCase()
          .includes(q),
    );
  });
  readonly visibleDisputes = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.disputes().filter(
      (x) =>
        !q ||
        (x.reason + ' ' + x.description + ' ' + x.status + ' ' + x.serviceEntryId)
          .toLowerCase()
          .includes(q),
    );
  });
  constructor() {
    this.load();
  }
  setPageTab(v: PageTab) {
    this.pageTab.set(v);
  }
  setTab(v: EntryTab) {
    this.activeTab.set(v);
  }
  setQuery(v: string) {
    this.query.set(v);
  }
  openDetail(x: ServiceEntry) {
    this.selected.set(x);
    this.drawerOpen.set(true);
  }
  closeDrawer() {
    this.drawerOpen.set(false);
    this.selected.set(null);
  }
  openStatement(x?: ServiceStatement) {
    this.selectedStatement.set(x ?? null);
    this.statementDrawerOpen.set(true);
  }
  closeStatement() {
    this.statementDrawerOpen.set(false);
    this.selectedStatement.set(null);
  }
  openDispute(x: ServiceDispute) {
    this.selectedDispute.set(x);
    this.disputeDrawerOpen.set(true);
  }
  closeDispute() {
    this.disputeDrawerOpen.set(false);
    this.selectedDispute.set(null);
  }
  load() {
    this.loading.set(true);
    this.loadError.set(false);
    forkJoin({
      entries: this.api.listMyProfessionalServiceEntries(),
      statements: this.api.listMyProfessionalServiceStatements(),
      disputes: this.api.listMyDisputes(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (x) => {
          this.items.set(x.entries);
          this.statements.set(x.statements);
          this.disputes.set(x.disputes);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }
}
