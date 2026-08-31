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
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ProfessionalApplication } from '../../models/professional-application.model';
import { ProfessionalProposal } from '../../models/professional-proposal.model';

@Component({
  selector: 'driveos-professional-proposal-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './professional-proposal-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalProposalDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly proposal = input<ProfessionalProposal | null>(null);
  readonly application = input<ProfessionalApplication | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly tab = signal<'terms' | 'history'>('terms');
  readonly actionMode = signal<'none' | 'reject' | 'counter' | 'withdraw'>('none');
  subject = '';
  message = '';
  startsOn = '';
  endsOn = '';
  engagementType = 'HourlyService';
  vehicleProvisionMode = 'Either';
  proposedRate: number | null = null;
  currency = 'EUR';
  rateUnit = 'Hour';
  negotiable = true;
  expiresOn = '';
  reason = '';
  counterRate: number | null = null;
  counterCurrency = 'EUR';
  counterRateUnit = 'Hour';
  counterNegotiable = true;
  counterMessage = '';
  private createPrepared = false;
  constructor() {
    effect(() => {
      const isOpen = this.open(),
        isCreate = this.createMode(),
        app = this.application();
      if (isOpen && isCreate && app && !this.createPrepared) {
        this.createPrepared = true;
        this.prepareCreate();
      }
      if (!isOpen) this.createPrepared = false;
    });
  }
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly createMode = computed(() => !this.proposal());
  readonly canCreate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.create),
  );
  readonly canCounter = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.counter),
  );
  readonly canAccept = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.accept),
  );
  readonly canReject = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.reject),
  );
  readonly canWithdraw = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.proposals.withdraw),
  );
  prepareCreate(): void {
    const a = this.application();
    if (!a) return;
    this.subject = this.translate.instant(
      'professionalMarketplace.proposals.create.defaultSubject',
      { name: a.displayName },
    );
    this.message = '';
    this.startsOn = a.availableFrom ?? this.datePlus(1);
    this.endsOn = a.availableUntil ?? this.datePlus(30);
    this.proposedRate = a.proposedRate;
    this.currency = a.currency ?? 'EUR';
    this.rateUnit = a.rateUnit ?? 'Hour';
    this.negotiable = a.negotiable;
    this.expiresOn = this.datePlus(7);
    this.formErrors.set([]);
    this.tab.set('terms');
    this.actionMode.set('none');
  }
  selectTab(t: 'terms' | 'history') {
    this.tab.set(t);
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  create(): void {
    const a = this.application(),
      org = this.organizationId();
    if (!a || !org || !this.canCreate()) return;
    if (!this.subject.trim() || !this.startsOn || !this.endsOn || !this.expiresOn) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.proposals.errors.required'),
      ]);
      return;
    }
    this.busy.set(true);
    this.formErrors.set([]);
    this.api
      .createProfessionalProposal(org, a.professionalProfileId, {
        branchId: null,
        opportunityId: a.opportunityId,
        subject: this.subject.trim(),
        message: this.message.trim(),
        startsOn: this.startsOn,
        endsOn: this.endsOn,
        teachingCategoryCodes: a.teachingCategoryCodes,
        engagementType: this.engagementType,
        vehicleProvisionMode: this.vehicleProvisionMode,
        proposedRate: this.proposedRate,
        currency: this.proposedRate === null ? null : this.currency.trim().toUpperCase(),
        rateUnit: this.proposedRate === null ? null : this.rateUnit,
        negotiable: this.negotiable,
        expiresAtUtc: new Date(this.expiresOn + 'T23:59:59').toISOString(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.changed.emit();
          this.closeRequested.emit();
        },
        error: (e) => {
          this.formErrors.set(this.errors.getMessages(e));
          this.busy.set(false);
        },
      });
  }
  begin(mode: 'reject' | 'counter' | 'withdraw') {
    this.actionMode.set(mode);
    this.reason = '';
    const p = this.proposal();
    this.counterRate = p?.proposedRate ?? null;
    this.counterCurrency = p?.currency ?? 'EUR';
    this.counterRateUnit = p?.rateUnit ?? 'Hour';
    this.counterNegotiable = p?.negotiable ?? true;
    this.counterMessage = p?.message ?? '';
    this.formErrors.set([]);
  }
  cancelAction() {
    this.actionMode.set('none');
  }
  accept() {
    const p = this.proposal();
    if (!p) return;
    this.mutate(this.api.acceptProfessionalProposal(p.professionalProfileId, p.id));
  }
  reject() {
    const p = this.proposal();
    if (!p || !this.reason.trim()) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.proposals.errors.reason'),
      ]);
      return;
    }
    this.mutate(
      this.api.rejectProfessionalProposal(p.professionalProfileId, p.id, this.reason.trim()),
    );
  }
  withdraw() {
    const p = this.proposal(),
      org = this.organizationId();
    if (!p || !org) return;
    this.mutate(this.api.withdrawProfessionalProposal(org, p.id, this.reason.trim() || null));
  }
  counter() {
    const p = this.proposal();
    if (!p || this.counterRate === null || this.counterRate < 0) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.proposals.errors.rate'),
      ]);
      return;
    }
    this.mutate(
      this.api.counterProfessionalProposal(
        p.professionalProfileId,
        p.id,
        this.counterRate,
        this.counterCurrency.trim().toUpperCase(),
        this.counterRateUnit,
        this.counterNegotiable,
        this.counterMessage.trim() || null,
      ),
    );
  }
  private mutate(request: any) {
    this.busy.set(true);
    this.formErrors.set([]);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
        this.closeRequested.emit();
      },
      error: (e: unknown) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.busy.set(false);
      },
    });
  }
  private datePlus(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
}
