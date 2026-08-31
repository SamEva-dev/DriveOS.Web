import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import {
  ProfessionalInvoiceFinanceSnapshot,
  ProfessionalInvoicePaymentTimelineItem,
} from '../../models/professional-invoice.model';

export type SupplierPaymentAction = 'schedule' | 'manual' | 'paid' | 'failed' | 'refund';
@Component({
  selector: 'driveos-supplier-payment-action-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './supplier-payment-action-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupplierPaymentActionDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  readonly open = input(false);
  readonly organizationId = input.required<string>();
  readonly finance = input.required<ProfessionalInvoiceFinanceSnapshot>();
  readonly action = input.required<SupplierPaymentAction>();
  readonly attempt = input<ProfessionalInvoicePaymentTimelineItem | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly busy = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  amount: number | null = null;
  date = '';
  paymentMethod = 'BankTransfer';
  bankReference = '';
  providerReference = '';
  reason = '';
  constructor() {
    effect(() => {
      if (this.open()) {
        const f = this.finance();
        this.amount =
          this.action() === 'refund'
            ? Math.max(0, f.paidAmount - f.refundedAmount)
            : this.action() === 'paid' && this.attempt()
              ? this.attempt()!.amount
              : f.remainingAmount;
        this.date = new Date().toISOString().slice(0, 10);
        this.paymentMethod = this.attempt()?.paymentMethod || 'BankTransfer';
        this.bankReference = '';
        this.providerReference = '';
        this.reason = '';
        this.formErrors.set([]);
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  submit() {
    if (this.busy()) return;
    const f = this.finance();
    const a = this.action();
    let req: any;
    if (
      (a === 'schedule' || a === 'manual' || a === 'refund') &&
      (!this.amount || this.amount <= 0)
    ) {
      this.formErrors.set([
        'professionalMarketplace.invoices.paymentActions.errors.amountRequired',
      ]);
      return;
    }
    if ((a === 'failed' || a === 'refund') && this.reason.trim().length < 2) {
      this.formErrors.set([
        'professionalMarketplace.invoices.paymentActions.errors.reasonRequired',
      ]);
      return;
    }
    if (a === 'schedule')
      req = this.api.scheduleSupplierPayment(this.organizationId(), f.supplierInvoiceId, {
        amount: this.amount,
        scheduledDate: this.date,
        paymentMethod: this.paymentMethod,
        bankReference: this.bankReference.trim() || null,
      });
    else if (a === 'manual')
      req = this.api.recordManualSupplierPayment(this.organizationId(), f.supplierInvoiceId, {
        amount: Number(this.amount),
        paidOn: this.date,
        paymentMethod: this.paymentMethod,
        bankReference: this.bankReference.trim() || null,
        providerReference: this.providerReference.trim() || null,
      });
    else if (a === 'paid') {
      const p = this.attempt();
      if (!p) return;
      req = this.api.markSupplierPaymentPaid(
        this.organizationId(),
        f.supplierInvoiceId,
        p.attemptId,
        {
          settledAmount: this.amount,
          settledOn: this.date || null,
          providerReference: this.providerReference.trim() || null,
        },
      );
    } else if (a === 'failed') {
      const p = this.attempt();
      if (!p) return;
      req = this.api.markSupplierPaymentFailed(
        this.organizationId(),
        f.supplierInvoiceId,
        p.attemptId,
        { reason: this.reason.trim() },
      );
    } else
      req = this.api.refundSupplierPayment(this.organizationId(), f.supplierInvoiceId, {
        amount: Number(this.amount),
        reason: this.reason.trim(),
        method: this.paymentMethod,
        providerReference: this.providerReference.trim() || null,
      });
    this.busy.set(true);
    this.formErrors.set([]);
    req.subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
        this.closeRequested.emit();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
