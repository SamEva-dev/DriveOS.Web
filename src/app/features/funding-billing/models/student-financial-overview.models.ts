export interface StudentFinancialOverview {
  billingAccountId: string;
  studentId: string;
  currency: string;
  accountStatus: string;
  totals: StudentFinancialTotals;
  alerts: StudentFinancialAlerts;
  nextInstallment: StudentFinancialNextInstallment | null;
  recentInvoices: readonly StudentFinancialInvoiceSummary[];
  recentPayments: readonly StudentFinancialPaymentSummary[];
  fundingPlans: readonly StudentFinancialFundingPlanSummary[];
  billingParties: readonly StudentFinancialBillingPartySummary[];
  trainingCredits: readonly StudentFinancialCreditSummary[];
  recentRefunds: readonly StudentFinancialRefundSummary[];
  recentCreditNotes: readonly StudentFinancialCreditNoteSummary[];
}
export interface StudentFinancialTotals { totalInvoiced: number; totalPaid: number; totalRefunded: number; totalCredited: number; creditBalance: number; outstandingBalance: number; overdueAmount: number; unallocatedPayments: number; approvedFunding: number; plannedFunding: number; availableTrainingCredits: number; }
export interface StudentFinancialAlerts { overdueInvoiceCount: number; overdueInstallmentCount: number; pendingReminderCount: number; failedPaymentCount: number; pendingFundingDecisionCount: number; expiringCreditAccountCount: number; pendingRefundCount: number; hasFinancialBlock: boolean; }
export interface StudentFinancialNextInstallment { id: string; dueDate: string; expectedAmount: number; paidAmount: number; remainingAmount: number; status: string; }
export interface StudentFinancialInvoiceSummary { id: string; number: string | null; issueDate: string | null; dueDate: string | null; status: string; totalAmount: number; paidAmount: number; creditedAmount: number; remainingAmount: number; }
export interface StudentFinancialPaymentSummary { id: string; amount: number; allocatedAmount: number; unallocatedAmount: number; refundedAmount: number; status: string; paymentMethod: string; paidAtUtc: string | null; }
export interface StudentFinancialFundingPlanSummary { id: string; contractId: string; totalCost: number; studentContribution: number; requestedFundingAmount: number; approvedFundingAmount: number; status: string; }
export interface StudentFinancialBillingPartySummary { id: string; personId: string | null; organizationId: string | null; role: string; maximumAmount: number | null; priority: number; isPrimary: boolean; status: string; effectiveFrom: string; effectiveTo: string | null; }
export interface StudentFinancialCreditSummary { id: string; creditType: string; purchased: number; reserved: number; consumed: number; adjustments: number; available: number; expirationDate: string | null; status: string; }
export interface StudentFinancialRefundSummary { id: string; paymentId: string; amount: number; status: string; requestedAtUtc: string; completedAtUtc: string | null; }
export interface StudentFinancialCreditNoteSummary { id: string; invoiceId: string; number: string | null; issueDate: string | null; amount: number; status: string; }
