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
import { ProfessionalServiceContractSnapshot } from '../../models/professional-engagement.model';

@Component({
  selector: 'driveos-professional-service-contract-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './professional-service-contract-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalServiceContractDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly engagementId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ProfessionalServiceContractSnapshot | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly tab = signal<'summary' | 'signatories' | 'versions'>('summary');
  readonly mode = signal<'create' | 'generate' | 'revise' | 'signature' | 'terminate' | null>(null);
  contractNumber = '';
  contractType = 'SERVICE';
  signatureOrder: 1 | 2 = 1;
  signatories = [this.blankSignatory(), this.blankSignatory(2)];
  documentReference = '';
  documentSha256 = '';
  reason = '';
  signaturePersonId = '';
  signatureMethod = 'Electronic';
  authenticationMethod = 'AuthenticatedSession';
  provider = 'DriveOS';
  providerReference = '';
  certificateReference = '';
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly canRead = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.read),
  );
  readonly canManage = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.manage),
  );
  readonly canGenerate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.generate),
  );
  readonly canSend = computed(() =>
    this.authorization.hasPermission(
      PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.sendForSignature,
    ),
  );
  readonly canTerminate = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.contracts.terminate),
  );
  private loadedId: string | null = null;
  constructor() {
    effect(() => {
      const opened = this.open(),
        id = this.engagementId();
      if (opened && id && id !== this.loadedId) {
        this.loadedId = id;
        this.load();
      }
      if (!opened) {
        this.loadedId = null;
        this.item.set(null);
        this.tab.set('summary');
        this.mode.set(null);
      }
    });
  }
  selectTab(v: 'summary' | 'signatories' | 'versions') {
    this.tab.set(v);
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  load() {
    const org = this.organizationId(),
      id = this.engagementId();
    if (!org || !id || !this.canRead()) return;
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getProfessionalServiceContract(org, id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        if (e?.status === 404) {
          this.item.set(null);
          return;
        }
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  begin(v: 'create' | 'generate' | 'revise' | 'signature' | 'terminate') {
    this.mode.set(v);
    this.formErrors.set([]);
    this.reason = '';
    if (v === 'signature') {
      const next = this.item()?.signatories.find((x) => x.isRequired && !x.signedAtUtc);
      this.signaturePersonId = next?.personId ?? '';
      this.documentSha256 = this.item()?.documentSha256 ?? '';
    }
    if (v === 'revise') {
      this.documentReference = '';
      this.documentSha256 = '';
    }
  }
  cancelMode() {
    this.mode.set(null);
    this.formErrors.set([]);
  }
  addSignatory() {
    this.signatories = [...this.signatories, this.blankSignatory(this.signatories.length + 1)];
  }
  removeSignatory(index: number) {
    if (this.signatories.length <= 2) return;
    this.signatories = this.signatories
      .filter((_, i) => i !== index)
      .map((x, i) => ({ ...x, signingOrder: i + 1 }));
  }
  submitCreate() {
    if (
      !this.contractNumber.trim() ||
      !this.contractType.trim() ||
      this.signatories.length < 2 ||
      this.signatories.some((x) => !x.personId.trim() || !x.role.trim())
    ) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceContract.errors.required'),
      ]);
      return;
    }
    this.run(() =>
      this.api.createProfessionalServiceContract(this.organizationId(), this.engagementId()!, {
        contractNumber: this.contractNumber.trim(),
        contractType: this.contractType.trim(),
        signatureOrder: this.signatureOrder,
        signatories: this.signatories.map((x) => ({
          ...x,
          personId: x.personId.trim(),
          role: x.role.trim(),
        })),
      }),
    );
  }
  submitGenerate() {
    if (!this.validDocument()) return;
    this.run(() =>
      this.api.generateProfessionalServiceContract(
        this.organizationId(),
        this.engagementId()!,
        this.documentReference.trim(),
        this.documentSha256.trim(),
      ),
    );
  }
  submitRevise() {
    if (!this.validDocument() || this.reason.trim().length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceContract.errors.revision'),
      ]);
      return;
    }
    this.run(() =>
      this.api.reviseProfessionalServiceContract(
        this.organizationId(),
        this.engagementId()!,
        this.documentReference.trim(),
        this.documentSha256.trim(),
        this.reason.trim(),
      ),
    );
  }
  send() {
    this.run(() =>
      this.api.sendProfessionalServiceContractForSignature(
        this.organizationId(),
        this.engagementId()!,
      ),
    );
  }
  submitSignature() {
    if (
      !this.signaturePersonId ||
      !this.documentSha256 ||
      !this.signatureMethod.trim() ||
      !this.authenticationMethod.trim() ||
      !this.provider.trim() ||
      !this.providerReference.trim()
    ) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceContract.errors.required'),
      ]);
      return;
    }
    this.run(() =>
      this.api.recordProfessionalServiceContractSignature(
        this.organizationId(),
        this.engagementId()!,
        {
          signatoryPersonId: this.signaturePersonId,
          documentSha256: this.documentSha256,
          signatureMethod: this.signatureMethod.trim(),
          authenticationMethod: this.authenticationMethod.trim(),
          provider: this.provider.trim(),
          providerReference: this.providerReference.trim(),
          certificateReference: this.certificateReference.trim() || null,
          ipAddress: null,
          signedAtUtc: new Date().toISOString(),
        },
      ),
    );
  }
  submitTerminate() {
    if (this.reason.trim().length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceContract.errors.reason'),
      ]);
      return;
    }
    this.run(() =>
      this.api.terminateProfessionalServiceContract(
        this.organizationId(),
        this.engagementId()!,
        this.reason.trim(),
      ),
    );
  }
  private validDocument() {
    if (
      this.documentReference.trim().length < 2 ||
      !/^[0-9a-fA-F]{64}$/.test(this.documentSha256.trim())
    ) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.serviceContract.errors.document'),
      ]);
      return false;
    }
    return true;
  }
  private run(factory: () => any) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: (x: unknown) => {
        if (x && typeof x === 'object' && 'contractId' in (x as object))
          this.item.set(x as ProfessionalServiceContractSnapshot);
        this.busy.set(false);
        this.mode.set(null);
        this.changed.emit();
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  private blankSignatory(order = 1) {
    return {
      personId: '',
      role: order === 1 ? 'FREELANCE' : 'CLIENT_REPRESENTATIVE',
      signingOrder: order,
      isRequired: true,
    };
  }
}
