export type ServiceStatementStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'PartiallyApproved'
  | 'Rejected'
  | 'Disputed'
  | 'Invoiced';
export interface ServiceStatementLine {
  readonly serviceEntryId: string;
  readonly serviceDate: string;
  readonly serviceCode: string;
  readonly quantityMinutes: number;
  readonly unitRate: number;
  readonly currency: string;
  readonly totalAmount: number;
  readonly description: string;
  readonly entryStatus: string;
}
export interface ServiceStatement {
  readonly id: string;
  readonly engagementId: string;
  readonly professionalProfileId: string;
  readonly clientOrganizationId: string;
  readonly providerOrganizationId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly currency: string;
  readonly totalAmount: number;
  readonly approvedAmount: number;
  readonly disputedAmount: number;
  readonly status: ServiceStatementStatus;
  readonly submittedAtUtc: string | null;
  readonly reviewedAtUtc: string | null;
  readonly reviewedByUserId: string | null;
  readonly rejectionReason: string | null;
  readonly createdAtUtc: string;
  readonly lines: readonly ServiceStatementLine[];
}
export interface CreateMyServiceStatementRequest {
  readonly periodStart: string;
  readonly periodEnd: string;
}
