import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {
  ProfessionalComplianceCredential,
  ProfessionalComplianceDocument,
  ProfessionalComplianceResponse,
} from '../../models/professional-compliance.model';

type Drawer = 'document' | 'credential' | 'documentReview' | 'credentialReview' | null;
@Component({
  selector: 'driveos-professional-compliance-panel',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './professional-compliance-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalCompliancePanelComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  readonly profileId = input.required<string>();
  readonly statusChanged = output<string>();
  readonly data = signal<ProfessionalComplianceResponse | null>(null);
  readonly loading = signal(false);
  readonly actionErrors = signal<readonly string[]>([]);
  readonly drawer = signal<Drawer>(null);
  readonly selectedDocument = signal<ProfessionalComplianceDocument | null>(null);
  readonly selectedCredential = signal<ProfessionalComplianceCredential | null>(null);
  readonly rejecting = signal(false);
  documentReferenceId = '';
  documentTypeCode = '';
  countryCode = 'FR';
  mandatory = true;
  issueDate = '';
  expirationDate = '';
  credentialTypeCode = '';
  issuingAuthority = '';
  referenceNumber = '';
  validFrom = '';
  validUntil = '';
  categoryCodes = 'B';
  evidenceDocumentId = '';
  rejectionReason = '';
  readonly canManage = computed(() =>
    this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.compliance.manage),
  );
  readonly canVerify = computed(() =>
    this.auth.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.compliance.verify),
  );
  constructor() {
    queueMicrotask(() => this.load());
  }
  load() {
    this.loading.set(true);
    this.actionErrors.set([]);
    this.api.getProfessionalCompliance(this.profileId()).subscribe({
      next: (x) => {
        this.data.set(x);
        this.statusChanged.emit(x.status);
        this.loading.set(false);
      },
      error: (e) => {
        this.actionErrors.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }
  openDocument() {
    this.reset();
    this.drawer.set('document');
  }
  openCredential() {
    this.reset();
    this.drawer.set('credential');
  }
  reviewDocument(x: ProfessionalComplianceDocument) {
    this.selectedDocument.set(x);
    this.rejectionReason = '';
    this.rejecting.set(false);
    this.drawer.set('documentReview');
  }
  reviewCredential(x: ProfessionalComplianceCredential) {
    this.selectedCredential.set(x);
    this.rejectionReason = '';
    this.rejecting.set(false);
    this.drawer.set('credentialReview');
  }
  close() {
    if (this.loading()) return;
    this.drawer.set(null);
    this.reset();
  }
  saveDocument() {
    if (!this.documentReferenceId.trim() || !this.documentTypeCode.trim()) return;
    this.loading.set(true);
    this.api
      .registerProfessionalDocument(this.profileId(), {
        documentReferenceId: this.documentReferenceId.trim(),
        documentTypeCode: this.documentTypeCode.trim().toUpperCase(),
        countryCode: this.countryCode.trim().toUpperCase(),
        mandatory: this.mandatory,
        issueDate: this.issueDate || null,
        expirationDate: this.expirationDate || null,
      })
      .subscribe({
        next: (r) =>
          this.api
            .submitProfessionalDocument(r.id)
            .subscribe({ next: () => this.afterAction(), error: (e) => this.fail(e) }),
        error: (e) => this.fail(e),
      });
  }
  saveCredential() {
    if (!this.credentialTypeCode.trim() || !this.issuingAuthority.trim() || !this.validFrom) return;
    this.loading.set(true);
    this.api
      .registerProfessionalCredential(this.profileId(), {
        credentialTypeCode: this.credentialTypeCode.trim().toUpperCase(),
        countryCode: this.countryCode.trim().toUpperCase(),
        issuingAuthority: this.issuingAuthority.trim(),
        referenceNumber: this.referenceNumber.trim() || null,
        validFrom: this.validFrom,
        validUntil: this.validUntil || null,
        categoryCodes: this.categoryCodes
          .split(',')
          .map((x) => x.trim().toUpperCase())
          .filter(Boolean),
        evidenceDocumentId: this.evidenceDocumentId.trim() || null,
      })
      .subscribe({ next: () => this.afterAction(), error: (e) => this.fail(e) });
  }
  approveDocument() {
    const x = this.selectedDocument();
    if (!x) return;
    this.loading.set(true);
    this.api
      .approveProfessionalDocument(x.id)
      .subscribe({ next: () => this.reevaluate(), error: (e) => this.fail(e) });
  }
  rejectDocument() {
    const x = this.selectedDocument();
    if (!x || !this.rejectionReason.trim()) return;
    this.loading.set(true);
    this.api
      .rejectProfessionalDocument(x.id, this.rejectionReason.trim())
      .subscribe({ next: () => this.reevaluate(), error: (e) => this.fail(e) });
  }
  verifyCredential() {
    const x = this.selectedCredential();
    if (!x) return;
    this.loading.set(true);
    this.api
      .verifyProfessionalCredential(x.id)
      .subscribe({ next: () => this.reevaluate(), error: (e) => this.fail(e) });
  }
  rejectCredential() {
    const x = this.selectedCredential();
    if (!x || !this.rejectionReason.trim()) return;
    this.loading.set(true);
    this.api
      .rejectProfessionalCredential(x.id, this.rejectionReason.trim())
      .subscribe({ next: () => this.reevaluate(), error: (e) => this.fail(e) });
  }
  reevaluate() {
    this.api
      .reevaluateProfessionalCompliance(this.profileId())
      .subscribe({ next: () => this.afterAction(), error: (e) => this.fail(e) });
  }
  badge(status: string) {
    return status === 'Valid' || status === 'Verified'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'Rejected' || status === 'Expired'
        ? 'bg-red-100 text-red-800'
        : 'bg-amber-100 text-amber-800';
  }
  private afterAction() {
    this.drawer.set(null);
    this.loading.set(false);
    this.reset();
    this.load();
  }
  private fail(e: unknown) {
    this.actionErrors.set(this.errors.getMessages(e));
    this.loading.set(false);
  }
  private reset() {
    this.selectedDocument.set(null);
    this.selectedCredential.set(null);
    this.documentReferenceId = '';
    this.documentTypeCode = '';
    this.countryCode = 'FR';
    this.mandatory = true;
    this.issueDate = '';
    this.expirationDate = '';
    this.credentialTypeCode = '';
    this.issuingAuthority = '';
    this.referenceNumber = '';
    this.validFrom = '';
    this.validUntil = '';
    this.categoryCodes = 'B';
    this.evidenceDocumentId = '';
    this.rejectionReason = '';
    this.rejecting.set(false);
  }
}
