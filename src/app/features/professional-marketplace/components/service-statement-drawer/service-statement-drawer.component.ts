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
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ServiceEntry } from '../../models/service-entry.model';
import { ServiceStatement } from '../../models/service-statement.model';
@Component({
  selector: 'driveos-service-statement-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './service-statement-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStatementDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  readonly open = input(false);
  readonly statementId = input<string | null>(null);
  readonly serviceEntries = input<readonly ServiceEntry[]>([]);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ServiceStatement | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<'summary' | 'lines' | 'history'>('summary');
  readonly formErrors = signal<readonly string[]>([]);
  readonly canSubmit = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.submit),
  );
  readonly createMode = computed(() => !this.statementId());
  engagementId = '';
  periodStart = '';
  periodEnd = '';
  private loaded: string | null | undefined = undefined;
  readonly engagementOptions = computed(() =>
    Array.from(new Set(this.serviceEntries().map((x) => x.engagementId))),
  );
  readonly previewLines = computed(() =>
    this.serviceEntries().filter(
      (x) =>
        x.engagementId === this.engagementId &&
        (!this.periodStart || x.serviceDate >= this.periodStart) &&
        (!this.periodEnd || x.serviceDate <= this.periodEnd),
    ),
  );
  readonly previewTotal = computed(() =>
    this.previewLines().reduce((a, x) => a + x.totalAmount, 0),
  );
  readonly hasRecorded = computed(() => this.previewLines().some((x) => x.status === 'Recorded'));
  readonly previewCurrency = computed(() =>
    Array.from(new Set(this.previewLines().map((x) => x.currency))).join(', '),
  );
  constructor() {
    effect(() => {
      const open = this.open(),
        id = this.statementId();
      if (open && id && id !== this.loaded) {
        this.loaded = id;
        this.load(id);
      }
      if (open && !id && this.loaded !== null) {
        this.loaded = null;
        this.resetCreate();
      }
      if (!open) {
        this.loaded = undefined;
        this.item.set(null);
        this.tab.set('summary');
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  selectTab(v: 'summary' | 'lines' | 'history') {
    this.tab.set(v);
  }
  create() {
    if (!this.engagementId || !this.periodStart || !this.periodEnd) {
      this.formErrors.set(['professionalMarketplace.serviceStatements.errors.required']);
      return;
    }
    this.busy.set(true);
    this.formErrors.set([]);
    this.api
      .createMyProfessionalServiceStatement(this.engagementId, {
        periodStart: this.periodStart,
        periodEnd: this.periodEnd,
      })
      .subscribe({
        next: (r) => {
          this.busy.set(false);
          this.changed.emit();
          this.loaded = r.id;
          this.load(r.id);
        },
        error: (e) => {
          this.busy.set(false);
          this.formErrors.set(this.errors.getMessages(e));
        },
      });
  }
  submit() {
    const id = this.statementId() ?? this.item()?.id;
    if (!id) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api.submitMyProfessionalServiceStatement(id).subscribe({
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
  private resetCreate() {
    this.item.set(null);
    this.formErrors.set([]);
    this.tab.set('summary');
    const entries = this.serviceEntries();
    this.engagementId = entries[0]?.engagementId ?? '';
    this.periodStart = entries.length ? entries.map((x) => x.serviceDate).sort()[0] : '';
    this.periodEnd = entries.length
      ? (entries
          .map((x) => x.serviceDate)
          .sort()
          .at(-1) ?? '')
      : '';
  }
  private load(id: string) {
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getMyProfessionalServiceStatement(id).subscribe({
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
