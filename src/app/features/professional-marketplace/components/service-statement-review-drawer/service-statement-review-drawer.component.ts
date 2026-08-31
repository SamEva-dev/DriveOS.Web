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
import { ServiceStatement, ServiceStatementLine } from '../../models/service-statement.model';
import { ServiceDispute } from '../../models/service-dispute.model';
import { ServiceDisputeDrawerComponent } from '../service-dispute-drawer/service-dispute-drawer.component';

type ReviewAction = 'rejectStatement' | 'rejectLine' | 'disputeLine' | null;
type DisputeReason =
  | 'Duration'
  | 'Rate'
  | 'Absence'
  | 'Expenses'
  | 'ServiceQuality'
  | 'ServiceNotPerformed'
  | 'Duplicate'
  | 'IncorrectStudent'
  | 'NonCompliantVehicle'
  | 'Other';
@Component({
  selector: 'driveos-service-statement-review-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent, ServiceDisputeDrawerComponent],
  templateUrl: './service-statement-review-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStatementReviewDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly organizationId = input.required<string>();
  readonly statementId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ServiceStatement | null>(null);
  readonly disputes = signal<readonly ServiceDispute[]>([]);
  readonly disputeDrawerOpen = signal(false);
  readonly selectedDisputeId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<'summary' | 'lines' | 'history'>('summary');
  readonly formErrors = signal<readonly string[]>([]);
  readonly action = signal<ReviewAction>(null);
  readonly selectedLine = signal<ServiceStatementLine | null>(null);
  reason = '';
  description = '';
  disputeReason: DisputeReason = 'Duration';
  private loadedId: string | null = null;
  readonly canManage = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.manage),
  );
  readonly canApproveStatement = computed(() =>
    this.authorization.hasPermission(
      PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.approve,
    ),
  );
  readonly canRejectStatement = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceStatements.reject),
  );
  readonly canApproveLine = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceEntries.approve),
  );
  readonly canRejectLine = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.serviceEntries.reject),
  );
  readonly canDisputeLine = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.disputes.open),
  );
  readonly pendingLines = computed(
    () => this.item()?.lines.filter((x) => x.entryStatus === 'Submitted').length ?? 0,
  );
  readonly disputeReasons: readonly DisputeReason[] = [
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
  constructor() {
    effect(() => {
      const open = this.open(),
        id = this.statementId();
      if (open && id && id !== this.loadedId) {
        this.loadedId = id;
        this.load();
      }
      if (!open) {
        this.loadedId = null;
        this.item.set(null);
        this.action.set(null);
        this.selectedLine.set(null);
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
  startReview() {
    this.run(() =>
      this.api.startServiceStatementReview(this.organizationId(), this.statementId()!),
    );
  }
  approveAll() {
    this.run(() => this.api.approveServiceStatement(this.organizationId(), this.statementId()!));
  }
  beginRejectStatement() {
    this.action.set('rejectStatement');
    this.reason = '';
    this.formErrors.set([]);
  }
  beginRejectLine(line: ServiceStatementLine) {
    this.selectedLine.set(line);
    this.action.set('rejectLine');
    this.reason = '';
    this.formErrors.set([]);
  }
  beginDispute(line: ServiceStatementLine) {
    this.selectedLine.set(line);
    this.action.set('disputeLine');
    this.disputeReason = 'Duration';
    this.description = '';
    this.formErrors.set([]);
  }
  cancelAction() {
    this.action.set(null);
    this.selectedLine.set(null);
    this.reason = '';
    this.description = '';
  }
  openDisputeDrawer(id: string) {
    this.selectedDisputeId.set(id);
    this.disputeDrawerOpen.set(true);
  }
  closeDisputeDrawer() {
    this.disputeDrawerOpen.set(false);
    this.selectedDisputeId.set(null);
  }
  disputeForEntry(entryId: string) {
    return this.disputes().find((x) => x.serviceEntryId === entryId) ?? null;
  }
  approveLine(line: ServiceStatementLine) {
    this.run(() => this.api.approveServiceEntry(this.organizationId(), line.serviceEntryId), true);
  }
  confirmAction() {
    const a = this.action(),
      line = this.selectedLine();
    if (a === 'rejectStatement') {
      if (this.reason.trim().length < 2) return this.invalidReason();
      this.run(() =>
        this.api.rejectServiceStatement(
          this.organizationId(),
          this.statementId()!,
          this.reason.trim(),
        ),
      );
      return;
    }
    if (a === 'rejectLine' && line) {
      if (this.reason.trim().length < 2) return this.invalidReason();
      this.run(
        () =>
          this.api.rejectServiceEntry(
            this.organizationId(),
            line.serviceEntryId,
            this.reason.trim(),
          ),
        true,
      );
      return;
    }
    if (a === 'disputeLine' && line) {
      if (this.description.trim().length < 2) {
        this.formErrors.set([
          this.translate.instant('professionalMarketplace.serviceReview.errors.description'),
        ]);
        return;
      }
      if (this.busy()) return;
      this.busy.set(true);
      this.api
        .openServiceEntryDispute(
          this.organizationId(),
          line.serviceEntryId,
          this.disputeReason,
          this.description.trim(),
        )
        .subscribe({
          next: (r) => {
            this.busy.set(false);
            this.action.set(null);
            this.selectedLine.set(null);
            this.openDisputeDrawer(r.id);
            this.changed.emit();
            this.refreshAndLoad();
          },
          error: (e) => {
            this.busy.set(false);
            this.formErrors.set(this.errors.getMessages(e));
          },
        });
    }
  }
  private invalidReason() {
    this.formErrors.set([
      this.translate.instant('professionalMarketplace.serviceReview.errors.reason'),
    ]);
  }
  load() {
    const id = this.statementId();
    if (!id) return;
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getOrganizationServiceStatement(this.organizationId(), id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.api.listOrganizationDisputes(this.organizationId()).subscribe({
          next: (d) => {
            const ids = new Set(x.lines.map((l) => l.serviceEntryId));
            this.disputes.set(d.filter((z) => ids.has(z.serviceEntryId)));
            this.loading.set(false);
          },
          error: (e) => {
            this.loading.set(false);
            this.formErrors.set(this.errors.getMessages(e));
          },
        });
      },
      error: (e) => {
        this.loading.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  private refreshAndLoad() {
    this.api
      .refreshServiceStatement(this.organizationId(), this.statementId()!)
      .subscribe({
        next: () => this.load(),
        error: (e) => this.formErrors.set(this.errors.getMessages(e)),
      });
  }
  private run(factory: () => any, refreshAfter = false) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        const done = () => {
          this.busy.set(false);
          this.action.set(null);
          this.selectedLine.set(null);
          this.changed.emit();
          this.load();
        };
        if (refreshAfter)
          this.api.refreshServiceStatement(this.organizationId(), this.statementId()!).subscribe({
            next: done,
            error: (e) => {
              this.busy.set(false);
              this.formErrors.set(this.errors.getMessages(e));
            },
          });
        else done();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
