import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FundingBillingApiService } from '../../data-access/funding-billing-api.service';
import { StudentFinancialOverview } from '../../models/student-financial-overview.models';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { DriveOsStatusBadgeComponent, DriveOsStatusTone } from '../../../../shared/ui/status-badge/driveos-status-badge.component';

type FinanceSection = 'overview' | 'invoices' | 'payments' | 'funding' | 'credits' | 'adjustments';

@Component({
  selector: 'driveos-student-finance-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, DriveOsEmptyStateComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsStatusBadgeComponent],
  templateUrl: './student-finance.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentFinancePage {
  private readonly api = inject(FundingBillingApiService);
  private readonly route = inject(ActivatedRoute);
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly data = signal<StudentFinancialOverview | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly section = signal<FinanceSection>('overview');
  readonly sections: readonly FinanceSection[] = ['overview', 'invoices', 'payments', 'funding', 'credits', 'adjustments'];
  readonly alertCount = computed(() => {
    const a = this.data()?.alerts;
    return a ? a.overdueInvoiceCount + a.overdueInstallmentCount + a.failedPaymentCount + a.pendingFundingDecisionCount + a.pendingRefundCount : 0;
  });

  constructor() { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(false);
    this.api.getStudentFinancialOverview(this.studentId).subscribe({
      next: (value) => { this.data.set(value); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  money(value: number, currency?: string): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || this.data()?.currency || 'EUR' }).format(value ?? 0);
  }

  statusTone(status: string): DriveOsStatusTone {
    const value = status.toLowerCase();
    if (['paid', 'approved', 'active', 'completed', 'issued'].includes(value)) return 'success';
    if (['overdue', 'failed', 'rejected', 'cancelled'].includes(value)) return 'danger';
    if (['pending', 'processing', 'partiallypaid', 'partiallyapproved', 'requested'].includes(value)) return 'warning';
    return 'neutral';
  }
}
