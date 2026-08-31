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
import {
  ServiceDispute,
  ServiceDisputeParty,
  ServiceDisputeResolutionOutcome,
} from '../../models/service-dispute.model';

type Mode = 'school' | 'freelance';
type Tab = 'summary' | 'discussion' | 'evidence' | 'history';
type Action = 'message' | 'evidence' | 'wait' | 'resolve' | 'escalate' | null;
@Component({
  selector: 'driveos-service-dispute-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './service-dispute-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDisputeDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly mode = input<Mode>('school');
  readonly organizationId = input<string | null>(null);
  readonly disputeId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ServiceDispute | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<Tab>('summary');
  readonly action = signal<Action>(null);
  readonly formErrors = signal<readonly string[]>([]);
  message = '';
  documentReferenceId = '';
  evidenceLabel = '';
  evidenceNote = '';
  waitingFor: ServiceDisputeParty = 'Freelance';
  resolutionOutcome: ServiceDisputeResolutionOutcome = 'ApproveServiceEntry';
  resolution = '';
  escalationReason = '';
  private loaded: string | null = null;
  readonly canManage = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.disputes.manage),
  );
  readonly canResolve = computed(
    () =>
      this.mode() === 'school' &&
      this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.disputes.resolve),
  );
  readonly isClosed = computed(() => ['Resolved', 'Rejected'].includes(this.item()?.status ?? ''));
  constructor() {
    effect(() => {
      const id = this.disputeId(),
        open = this.open();
      if (open && id && id !== this.loaded) {
        this.loaded = id;
        this.load();
      }
      if (!open) {
        this.loaded = null;
        this.item.set(null);
        this.tab.set('summary');
        this.action.set(null);
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  selectTab(v: Tab) {
    this.tab.set(v);
  }
  begin(a: Action) {
    this.action.set(a);
    this.formErrors.set([]);
    this.message = '';
    this.documentReferenceId = '';
    this.evidenceLabel = '';
    this.evidenceNote = '';
    this.resolution = '';
    this.escalationReason = '';
    this.waitingFor = this.mode() === 'school' ? 'Freelance' : 'School';
  }
  cancel() {
    this.action.set(null);
  }
  confirm() {
    const id = this.disputeId();
    if (!id) return;
    const a = this.action();
    if (a === 'message') {
      if (!this.message.trim()) return this.invalid('message');
      this.run(() =>
        this.mode() === 'school'
          ? this.api.addOrganizationDisputeMessage(this.organizationId()!, id, this.message.trim())
          : this.api.addMyDisputeMessage(id, this.message.trim()),
      );
      return;
    }
    if (a === 'evidence') {
      if (!this.isGuid(this.documentReferenceId) || !this.evidenceLabel.trim())
        return this.invalid('evidence');
      this.run(() =>
        this.mode() === 'school'
          ? this.api.addOrganizationDisputeEvidence(
              this.organizationId()!,
              id,
              this.documentReferenceId,
              this.evidenceLabel.trim(),
              this.evidenceNote.trim() || null,
            )
          : this.api.addMyDisputeEvidence(
              id,
              this.documentReferenceId,
              this.evidenceLabel.trim(),
              this.evidenceNote.trim() || null,
            ),
      );
      return;
    }
    if (a === 'wait') {
      this.run(() =>
        this.mode() === 'school'
          ? this.api.waitOrganizationDisputeFor(this.organizationId()!, id, this.waitingFor)
          : this.api.waitMyDisputeFor(id, this.waitingFor),
      );
      return;
    }
    if (a === 'resolve') {
      if (this.resolution.trim().length < 2) return this.invalid('resolution');
      this.run(() =>
        this.api.resolveOrganizationDispute(
          this.organizationId()!,
          id,
          this.resolutionOutcome,
          this.resolution.trim(),
        ),
      );
      return;
    }
    if (a === 'escalate') {
      if (this.escalationReason.trim().length < 2) return this.invalid('escalation');
      this.run(() =>
        this.mode() === 'school'
          ? this.api.escalateOrganizationDispute(
              this.organizationId()!,
              id,
              this.escalationReason.trim(),
            )
          : this.api.escalateMyDispute(id, this.escalationReason.trim()),
      );
    }
  }
  private invalid(key: string) {
    this.formErrors.set([this.translate.instant('professionalMarketplace.disputes.errors.' + key)]);
  }
  private isGuid(v: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v.trim(),
    );
  }
  private load() {
    const id = this.disputeId();
    if (!id) return;
    this.loading.set(true);
    this.formErrors.set([]);
    const req =
      this.mode() === 'school'
        ? this.api.getOrganizationDispute(this.organizationId()!, id)
        : this.api.getMyDispute(id);
    req.subscribe({
      next: (x) => {
        this.item.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  private run(factory: () => any) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.action.set(null);
        this.changed.emit();
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
