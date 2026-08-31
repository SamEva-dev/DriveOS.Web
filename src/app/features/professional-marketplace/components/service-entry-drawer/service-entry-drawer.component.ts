import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ServiceEntry } from '../../models/service-entry.model';
import { ServiceDisputeReason } from '../../models/service-dispute.model';
import { ServiceDisputeDrawerComponent } from '../service-dispute-drawer/service-dispute-drawer.component';
@Component({
  selector: 'driveos-service-entry-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent, ServiceDisputeDrawerComponent],
  templateUrl: './service-entry-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceEntryDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly entryId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ServiceEntry | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<'summary' | 'amounts' | 'history'>('summary');
  readonly formErrors = signal<readonly string[]>([]);
  readonly canSubmit = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceEntries.submit),
  );
  readonly canOpenDispute = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.disputes.open),
  );
  readonly openingDispute = signal(false);
  readonly disputeDrawerOpen = signal(false);
  readonly disputeId = signal<string | null>(null);
  disputeReason: ServiceDisputeReason = 'Duration';
  disputeDescription = '';
  readonly disputeReasons: readonly ServiceDisputeReason[] = [
    'Duration',
    'Rate',
    'Absence',
    'Expenses',
    'ServiceQuality',
    'ServiceNotPerformed',
    'Duplicate',
    'IncorrectStudent',
    'NonCompliantVehicle',
    'Other',
  ];
  private loaded: string | null = null;
  constructor() {
    effect(() => {
      const open = this.open(),
        id = this.entryId();
      if (open && id && id !== this.loaded) {
        this.loaded = id;
        this.load(id);
      }
      if (!open) {
        this.loaded = null;
        this.item.set(null);
        this.tab.set('summary');
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  beginDispute() {
    this.openingDispute.set(true);
    this.disputeReason = 'Duration';
    this.disputeDescription = '';
    this.formErrors.set([]);
  }
  cancelDispute() {
    this.openingDispute.set(false);
  }
  closeDisputeDrawer() {
    this.disputeDrawerOpen.set(false);
    this.disputeId.set(null);
  }
  confirmDispute() {
    const id = this.entryId();
    if (!id) return;
    if (this.disputeDescription.trim().length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceReview.errors.description'),
      ]);
      return;
    }
    this.busy.set(true);
    this.api
      .openMyServiceEntryDispute(id, this.disputeReason, this.disputeDescription.trim())
      .subscribe({
        next: (r) => {
          this.busy.set(false);
          this.openingDispute.set(false);
          this.disputeId.set(r.id);
          this.disputeDrawerOpen.set(true);
          this.changed.emit();
          this.load(id);
        },
        error: (e) => {
          this.busy.set(false);
          this.formErrors.set(this.errors.getMessages(e));
        },
      });
  }
  selectTab(v: 'summary' | 'amounts' | 'history') {
    this.tab.set(v);
  }
  submit() {
    const id = this.entryId();
    if (!id) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api.submitMyProfessionalServiceEntry(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
        this.load(id);
      },
      error: (e) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  private load(id: string) {
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getMyProfessionalServiceEntry(id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }
}
