import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { ExamsApiService } from '../../data-access/exams-api.service';
import { EXAMS_PERMISSIONS } from '../../domain/exams-permissions';
import {
  ExamCenter,
  ExamPlace,
  ExamPlaceWatch,
  ExamPlaceWatchScan,
  ExamProviderCatalog,
  ExamProviderConnection,
} from '../../models/exams.models';

type PlacesTab = 'availability' | 'watches' | 'providers';
type PlaceDrawer = 'center' | 'place' | 'watch' | 'connection' | 'sync' | 'import' | null;
@Component({
  selector: 'driveos-exams-places-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
  ],
  templateUrl: './exams-places.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsPlacesPage {
  private readonly api = inject(ExamsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly centers = signal<readonly ExamCenter[]>([]);
  readonly places = signal<readonly ExamPlace[]>([]);
  readonly watches = signal<readonly ExamPlaceWatch[]>([]);
  readonly scans = signal<readonly ExamPlaceWatchScan[]>([]);
  readonly providers = signal<readonly ExamProviderCatalog[]>([]);
  readonly connections = signal<readonly ExamProviderConnection[]>([]);
  readonly messages = signal<readonly string[]>([]);
  readonly lastSync = signal<unknown | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly activeTab = signal<PlacesTab>('availability');
  readonly drawerMode = signal<PlaceDrawer>(null);
  readonly selectedWatchId = signal<string | null>(null);
  fromUtc = this.localInput(new Date());
  toUtc = this.localInput(new Date(Date.now() + 30 * 86400000));
  licenseCategory = '';
  centerForm = {
    name: '',
    countryCode: 'FR',
    timeZoneId: 'Europe/Paris',
    administrativeAreaCode: '',
    address: '',
    externalProviderCode: '',
    externalCenterId: '',
  };
  placeForm = {
    examCenterId: '',
    examType: 'Practical',
    licenseCategory: 'B',
    startsAtUtc: '',
    endsAtUtc: '',
    timeZoneId: 'Europe/Paris',
    source: 'Manual',
    providerCode: 'Manual',
    externalPlaceId: '',
  };
  watchForm = {
    providerCode: '',
    countryCode: 'FR',
    administrativeAreaCode: '',
    examCategory: 'B',
    windowFromUtc: this.localInput(new Date()),
    windowToUtc: this.localInput(new Date(Date.now() + 30 * 86400000)),
    checkIntervalMinutes: 60,
    centerExternalIds: '',
  };
  connectionForm = {
    providerCode: '',
    displayName: '',
    countryCode: 'FR',
    kind: 'Api',
    authenticationMode: 'ApiKey',
    baseUrl: '',
    credentialReference: '',
    requestsPerMinute: 60,
  };
  syncForm = {
    providerCode: '',
    countryCode: 'FR',
    administrativeAreaCode: '',
    examCategory: 'B',
    fromUtc: this.localInput(new Date()),
    toUtc: this.localInput(new Date(Date.now() + 30 * 86400000)),
    centerExternalIds: '',
  };
  importProviderCode = '';
  importRowsJson = '[]';
  readonly canManage = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.places.manage));
  readonly canImport = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.places.import));
  readonly canWatch = computed(() => this.auth.hasPermission(EXAMS_PERMISSIONS.places.watch));
  readonly canProviders = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.providers.manage),
  );
  constructor() {
    this.loadAvailability();
    if (this.canWatch()) this.loadWatches();
    if (this.canProviders()) this.loadProviders();
  }
  loadAvailability(): void {
    this.loading.set(true);
    this.messages.set([]);
    this.api.getCenters().subscribe({
      next: (c) => {
        this.centers.set(c);
        this.loadPlaces();
      },
      error: (e) => this.fail(e),
    });
  }
  private loadPlaces(): void {
    this.api
      .getPlaces({
        fromUtc: new Date(this.fromUtc).toISOString(),
        toUtc: new Date(this.toUtc).toISOString(),
        licenseCategory: this.licenseCategory.trim() || undefined,
      })
      .subscribe({
        next: (p) => {
          this.places.set(p);
          this.loading.set(false);
        },
        error: (e) => this.fail(e),
      });
  }
  loadWatches(): void {
    if (!this.canWatch()) return;
    this.api
      .getPlaceWatches()
      .subscribe({ next: (v) => this.watches.set(v), error: (e) => this.fail(e) });
  }
  loadProviders(): void {
    if (!this.canProviders()) return;
    this.api
      .getProviders()
      .subscribe({ next: (v) => this.providers.set(v), error: (e) => this.fail(e) });
    this.api
      .getProviderConnections()
      .subscribe({ next: (v) => this.connections.set(v), error: (e) => this.fail(e) });
  }
  selectWatch(id: string): void {
    this.selectedWatchId.set(id);
    this.api
      .getPlaceWatchScans(id)
      .subscribe({ next: (v) => this.scans.set(v), error: (e) => this.fail(e) });
  }
  open(mode: Exclude<PlaceDrawer, null>): void {
    this.drawerMode.set(mode);
  }
  close(): void {
    this.drawerMode.set(null);
  }
  createCenter(): void {
    this.saving.set(true);
    const f = this.centerForm;
    this.api
      .createCenter({
        name: f.name.trim(),
        countryCode: f.countryCode.trim(),
        timeZoneId: f.timeZoneId.trim(),
        administrativeAreaCode: f.administrativeAreaCode.trim() || null,
        address: f.address.trim() || null,
        externalProviderCode: f.externalProviderCode.trim() || null,
        externalCenterId: f.externalCenterId.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.loadAvailability();
        },
        error: (e) => this.fail(e, true),
      });
  }
  createPlace(): void {
    this.saving.set(true);
    const f = this.placeForm;
    this.api
      .createPlace({
        examCenterId: f.examCenterId,
        examType: f.examType,
        licenseCategory: f.licenseCategory,
        startsAtUtc: new Date(f.startsAtUtc).toISOString(),
        endsAtUtc: new Date(f.endsAtUtc).toISOString(),
        timeZoneId: f.timeZoneId,
        source: f.source,
        providerCode: f.providerCode,
        externalPlaceId: f.externalPlaceId.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.loadAvailability();
        },
        error: (e) => this.fail(e, true),
      });
  }
  createWatch(): void {
    this.saving.set(true);
    const f = this.watchForm;
    this.api
      .createPlaceWatch({
        providerCode: f.providerCode.trim(),
        countryCode: f.countryCode.trim(),
        administrativeAreaCode: f.administrativeAreaCode.trim() || null,
        examCategory: f.examCategory.trim() || null,
        windowFromUtc: new Date(f.windowFromUtc).toISOString(),
        windowToUtc: new Date(f.windowToUtc).toISOString(),
        checkIntervalMinutes: Number(f.checkIntervalMinutes),
        centerExternalIds: f.centerExternalIds
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.loadWatches();
        },
        error: (e) => this.fail(e, true),
      });
  }
  watchAction(id: string, action: 'pause' | 'resume' | 'scan'): void {
    this.api.placeWatchAction(id, action).subscribe({
      next: () => {
        this.loadWatches();
        if (action === 'scan') this.selectWatch(id);
      },
      error: (e) => this.fail(e),
    });
  }

  synchronizePlaces(): void {
    this.saving.set(true);
    const f = this.syncForm;
    this.api
      .synchronizePlaces({
        providerCode: f.providerCode.trim(),
        countryCode: f.countryCode.trim(),
        administrativeAreaCode: f.administrativeAreaCode.trim() || null,
        examCategory: f.examCategory.trim() || null,
        fromUtc: new Date(f.fromUtc).toISOString(),
        toUtc: new Date(f.toUtc).toISOString(),
        centerExternalIds: f.centerExternalIds
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: (v) => {
          this.lastSync.set(v);
          this.saving.set(false);
          this.close();
          this.loadAvailability();
        },
        error: (e) => this.fail(e, true),
      });
  }
  importPlaces(): void {
    let rows: unknown[];
    try {
      const parsed = JSON.parse(this.importRowsJson);
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.messages.set([this.translate.instant('errors.exams.places.invalidImportJson')]);
      return;
    }
    this.saving.set(true);
    this.api.importPlaces({ providerCode: this.importProviderCode.trim(), rows }).subscribe({
      next: (v) => {
        this.lastSync.set(v);
        this.saving.set(false);
        this.close();
        this.loadAvailability();
      },
      error: (e) => this.fail(e, true),
    });
  }
  createConnection(): void {
    this.saving.set(true);
    const f = this.connectionForm;
    this.api
      .createProviderConnection({
        providerCode: f.providerCode.trim(),
        displayName: f.displayName.trim(),
        countryCode: f.countryCode.trim(),
        kind: f.kind,
        authenticationMode: f.authenticationMode,
        baseUrl: f.baseUrl.trim() || null,
        credentialReference: f.credentialReference.trim() || null,
        requestsPerMinute: Number(f.requestsPerMinute),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.loadProviders();
        },
        error: (e) => this.fail(e, true),
      });
  }
  connectionAction(id: string, action: 'test' | 'suspend' | 'revoke'): void {
    this.api
      .providerConnectionAction(id, action)
      .subscribe({ next: () => this.loadProviders(), error: (e) => this.fail(e) });
  }
  private fail(e: HttpErrorResponse, saving = false): void {
    this.messages.set(this.errors.getMessages(e));
    this.loading.set(false);
    if (saving) this.saving.set(false);
  }
  private localInput(d: Date): string {
    const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return z.toISOString().slice(0, 16);
  }
}
