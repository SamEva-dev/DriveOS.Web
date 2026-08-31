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
import {
  FINANCE_SUPPLIER_INVOICE_PERMISSIONS,
  PROFESSIONAL_MARKETPLACE_PERMISSIONS,
} from '../../domain/professional-marketplace-permissions';
import {
  ProfessionalInvoice,
  ProfessionalInvoiceFinanceSnapshot,
  ProfessionalInvoicePaymentTimelineItem,
} from '../../models/professional-invoice.model';
import {
  SupplierPaymentAction,
  SupplierPaymentActionDrawerComponent,
} from '../supplier-payment-action-drawer/supplier-payment-action-drawer.component';
import { ServiceStatement } from '../../models/service-statement.model';

@Component({
  selector: 'driveos-professional-invoice-drawer',
  standalone: true,
  imports: [
    FormsModule,
    TranslatePipe,
    DriveOsDrawerComponent,
    SupplierPaymentActionDrawerComponent,
  ],
  templateUrl: './professional-invoice-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalInvoiceDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly organizationId = input.required<string>();
  readonly invoiceId = input<string | null>(null);
  readonly statements = input<readonly ServiceStatement[]>([]);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ProfessionalInvoice | null>(null);
  readonly finance = signal<ProfessionalInvoiceFinanceSnapshot | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<'summary' | 'finance' | 'payments' | 'history'>('summary');
  readonly formErrors = signal<readonly string[]>([]);
  readonly canRequest = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.invoices.request),
  );
  readonly canReadPayments = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.payments.read),
  );
  readonly canApproveOperational = computed(() =>
    this.authorization.hasPermission(FINANCE_SUPPLIER_INVOICE_PERMISSIONS.approveOperational),
  );
  readonly canApproveFinancial = computed(() =>
    this.authorization.hasPermission(FINANCE_SUPPLIER_INVOICE_PERMISSIONS.approveFinancial),
  );
  readonly canSchedulePayment = computed(() =>
    this.authorization.hasPermission(FINANCE_SUPPLIER_INVOICE_PERMISSIONS.schedulePayment),
  );
  readonly canRecordManualPayment = computed(() =>
    this.authorization.hasPermission(FINANCE_SUPPLIER_INVOICE_PERMISSIONS.recordManualPayment),
  );
  readonly canRefundPayment = computed(() =>
    this.authorization.hasPermission(FINANCE_SUPPLIER_INVOICE_PERMISSIONS.refundPayment),
  );
  readonly paymentActionOpen = signal(false);
  readonly paymentAction = signal<SupplierPaymentAction>('schedule');
  readonly selectedAttempt = signal<ProfessionalInvoicePaymentTimelineItem | null>(null);
  statementId = '';
  issueDate = '';
  dueDate = '';
  taxAmount = 0;
  invoiceNumber = '';
  bankReference = '';
  private loadedId: string | undefined;
  readonly approvedStatements = computed(() =>
    this.statements().filter(
      (x) => (x.status === 'Approved' || x.status === 'PartiallyApproved') && x.approvedAmount > 0,
    ),
  );
  constructor() {
    effect(() => {
      const opened = this.open(),
        id = this.invoiceId();
      if (opened && id !== this.loadedId) {
        this.loadedId = id ?? '';
        id ? this.load() : this.resetCreate();
      }
      if (!opened) {
        this.loadedId = undefined;
        this.item.set(null);
        this.finance.set(null);
        this.tab.set('summary');
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  selectTab(v: 'summary' | 'finance' | 'payments' | 'history') {
    this.tab.set(v);
    const x = this.item();
    if ((v === 'finance' || v === 'payments') && x?.status === 'Requested' && !this.finance())
      this.syncFinance();
  }
  private resetCreate() {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    this.statementId = this.approvedStatements()[0]?.id ?? '';
    this.issueDate = now.toISOString().slice(0, 10);
    this.dueDate = due.toISOString().slice(0, 10);
    this.taxAmount = 0;
    this.invoiceNumber = '';
    this.bankReference = '';
    this.formErrors.set([]);
  }
  create() {
    if (!this.statementId) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.invoices.errors.statementRequired'),
      ]);
      return;
    }
    this.run(
      () =>
        this.api.createOrganizationProfessionalInvoice(this.organizationId(), this.statementId, {
          mode: 'SelfBilling',
          issueDate: this.issueDate,
          dueDate: this.dueDate,
          taxAmount: Number(this.taxAmount) || 0,
          invoiceNumber: this.invoiceNumber.trim() || null,
          bankReference: this.bankReference.trim() || null,
        }),
      true,
    );
  }
  update() {
    const x = this.item();
    if (!x) return;
    this.run(() =>
      this.api.updateOrganizationProfessionalInvoice(this.organizationId(), x.id, {
        mode: x.mode,
        issueDate: this.issueDate,
        dueDate: this.dueDate,
        taxAmount: Number(this.taxAmount) || 0,
        invoiceNumber: this.invoiceNumber.trim() || null,
        bankReference: this.bankReference.trim() || null,
      }),
    );
  }
  validate() {
    const x = this.item();
    if (x)
      this.run(() => this.api.validateOrganizationProfessionalInvoice(this.organizationId(), x.id));
  }
  requestFinance() {
    const x = this.item();
    if (x)
      this.run(() =>
        this.api.requestOrganizationProfessionalInvoiceFinance(this.organizationId(), x.id),
      );
  }
  syncFinance() {
    const x = this.item();
    if (!x || this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    this.api.syncOrganizationProfessionalInvoiceFinance(this.organizationId(), x.id).subscribe({
      next: (s) => {
        this.finance.set(s);
        this.busy.set(false);
        this.changed.emit();
        this.load();
      },
      error: (e) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }

  openPaymentAction(
    action: SupplierPaymentAction,
    attempt: ProfessionalInvoicePaymentTimelineItem | null = null,
  ) {
    this.paymentAction.set(action);
    this.selectedAttempt.set(attempt);
    this.paymentActionOpen.set(true);
  }
  closePaymentAction() {
    this.paymentActionOpen.set(false);
    this.selectedAttempt.set(null);
  }
  approveOperational() {
    const f = this.finance();
    if (f)
      this.runFinance(() =>
        this.api.approveSupplierInvoiceOperational(this.organizationId(), f.supplierInvoiceId),
      );
  }
  approveFinancial() {
    const f = this.finance();
    if (f)
      this.runFinance(() =>
        this.api.approveSupplierInvoiceFinancial(this.organizationId(), f.supplierInvoiceId),
      );
  }
  markProcessing(p: ProfessionalInvoicePaymentTimelineItem) {
    const f = this.finance();
    if (f)
      this.runFinance(() =>
        this.api.markSupplierPaymentProcessing(
          this.organizationId(),
          f.supplierInvoiceId,
          p.attemptId,
        ),
      );
  }
  cancelPayment(p: ProfessionalInvoicePaymentTimelineItem) {
    const f = this.finance();
    if (f)
      this.runFinance(() =>
        this.api.cancelSupplierPayment(this.organizationId(), f.supplierInvoiceId, p.attemptId),
      );
  }
  paymentChanged() {
    this.closePaymentAction();
    this.syncFinance();
  }
  private runFinance(factory: () => any) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.syncFinance();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }

  private load() {
    const id = this.invoiceId();
    if (!id) return;
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getOrganizationProfessionalInvoice(this.organizationId(), id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.issueDate = x.issueDate;
        this.dueDate = x.dueDate;
        this.taxAmount = x.taxAmount;
        this.invoiceNumber = x.invoiceNumber ?? '';
        this.bankReference = x.bankReference ?? '';
        this.loading.set(false);
      },
      error: (e) => {
        this.loading.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
  private run(factory: () => any, created = false) {
    if (this.busy()) return;
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: (r: any) => {
        this.busy.set(false);
        this.changed.emit();
        if (created && r?.id) {
          this.loadedId = r.id;
          this.api.getOrganizationProfessionalInvoice(this.organizationId(), r.id).subscribe({
            next: (x) => {
              this.item.set(x);
              this.issueDate = x.issueDate;
              this.dueDate = x.dueDate;
              this.taxAmount = x.taxAmount;
              this.invoiceNumber = x.invoiceNumber ?? '';
              this.bankReference = x.bankReference ?? '';
            },
            error: (e) => this.formErrors.set(this.errors.getMessages(e)),
          });
        } else this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
