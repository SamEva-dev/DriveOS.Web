export type ProfessionalInvoiceMode = 'FreelanceIssued' | 'SelfBilling';
export type ProfessionalInvoiceStatus = 'Draft' | 'Validated' | 'Requested' | 'Cancelled';
export type ProfessionalInvoicePaymentStatus =
  | 'Pending'
  | 'Scheduled'
  | 'Processing'
  | 'Paid'
  | 'PartiallyPaid'
  | 'Failed'
  | 'Overdue'
  | 'Cancelled'
  | 'Refunded';

export interface ProfessionalInvoice {
  readonly id: string;
  readonly engagementId: string;
  readonly professionalProfileId: string;
  readonly serviceStatementId: string;
  readonly providerOrganizationId: string;
  readonly clientOrganizationId: string;
  readonly mode: ProfessionalInvoiceMode;
  readonly invoiceNumber: string | null;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly total: number;
  readonly bankReference: string | null;
  readonly status: ProfessionalInvoiceStatus;
  readonly paymentStatus: ProfessionalInvoicePaymentStatus;
  readonly financeSupplierInvoiceId: string | null;
  readonly financeSupplierInvoiceStatus: string | null;
  readonly financeStatusSyncedAtUtc: string | null;
  readonly validatedAtUtc: string | null;
  readonly validatedByUserId: string | null;
  readonly requestedAtUtc: string | null;
  readonly createdAtUtc: string;
}

export interface ProfessionalInvoicePaymentTimelineItem {
  readonly attemptId: string;
  readonly status: string;
  readonly amount: number;
  readonly settledAmount: number | null;
  readonly currency: string;
  readonly paymentMethod: string;
  readonly scheduledDate: string;
  readonly settledOn: string | null;
  readonly createdAtUtc: string;
  readonly processingAtUtc: string | null;
  readonly paidAtUtc: string | null;
  readonly failedAtUtc: string | null;
  readonly cancelledAtUtc: string | null;
  readonly providerReference: string | null;
  readonly failureReason: string | null;
  readonly reconciliationStatus: string;
  readonly reconciliationDifference: number | null;
  readonly batchId: string | null;
  readonly isManual: boolean;
}
export interface ProfessionalInvoiceFinanceSnapshot {
  readonly supplierInvoiceId: string;
  readonly status: string;
  readonly settlementStatus: string;
  readonly totalAmount: number;
  readonly paidAmount: number;
  readonly refundedAmount: number;
  readonly remainingAmount: number;
  readonly currency: string;
  readonly dueDate: string;
  readonly latestPaymentStatus: string | null;
  readonly paymentTimeline: readonly ProfessionalInvoicePaymentTimelineItem[];
}
export interface CreateProfessionalInvoiceRequest {
  readonly mode: ProfessionalInvoiceMode;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly taxAmount: number;
  readonly invoiceNumber: string | null;
  readonly bankReference: string | null;
}

export interface ScheduleSupplierPaymentRequest {
  readonly amount: number | null;
  readonly scheduledDate: string;
  readonly paymentMethod: string;
  readonly bankReference: string | null;
}
export interface ManualSupplierPaymentRequest {
  readonly amount: number;
  readonly paidOn: string;
  readonly paymentMethod: string;
  readonly bankReference: string | null;
  readonly providerReference: string | null;
}
export interface SupplierPaymentPaidRequest {
  readonly settledAmount: number | null;
  readonly settledOn: string | null;
  readonly providerReference: string | null;
}
export interface SupplierPaymentFailedRequest {
  readonly reason: string;
}
export interface SupplierPaymentRefundRequest {
  readonly amount: number;
  readonly reason: string;
  readonly method: string;
  readonly providerReference: string | null;
}
