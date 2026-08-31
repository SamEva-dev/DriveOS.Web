export interface MarketplaceDashboardKpis {
  readonly activeEngagements: number;
  readonly activeMissions: number;
  readonly pendingServiceEntries: number;
  readonly disputedServiceEntries: number;
  readonly pendingStatements: number;
  readonly pendingInvoices: number;
  readonly scheduledPayments: number;
  readonly failedPayments: number;
  readonly paidInvoices: number;
  readonly openReviewReports: number;
  readonly expiringCredentials: number;
  readonly averageValidationDelayHours: number | null;
  readonly averagePaymentDelayHours: number | null;
}

export interface MarketplaceDashboardAdvancedKpis {
  readonly invitationsSent: number;
  readonly invitationsAccepted: number;
  readonly invitationsActivated: number;
  readonly invitationAcceptanceRatePercent: number | null;
  readonly invitationToActivationRatePercent: number | null;
  readonly applicationsDecided: number;
  readonly applicationsAccepted: number;
  readonly applicationAcceptanceRatePercent: number | null;
  readonly completeProfiles: number;
  readonly profilesInScope: number;
  readonly profileCompletionRatePercent: number | null;
  readonly averageDocumentValidationDelayHours: number | null;
  readonly contractPreparedEngagements: number;
  readonly plannedHours: number;
  readonly realizedHours: number;
  readonly cancelledMissions: number;
  readonly occupancyRatePercent: number | null;
  readonly studentsHandled: number;
  readonly reviewedServiceEntries: number;
  readonly serviceEntriesValidatedWithoutCorrection: number;
  readonly firstPassValidationRatePercent: number | null;
  readonly overdueInvoices: number;
  readonly openDisputes: number;
  readonly averageHourlyCost: number | null;
  readonly costCurrency: string | null;
  readonly initialIntegrationsCompleted: number;
  readonly reliableRelationships: number;
  readonly averageInvitationToActivationDelayHours: number | null;
  readonly signedContractRatePercent: number | null;
  readonly missionCancellationRatePercent: number | null;
  readonly invoicedAmount: number | null;
  readonly invoicedCurrency: string | null;
  readonly disputeRatePercent: number | null;
}

export interface MarketplaceDashboardAlert {
  readonly code: string;
  readonly severity: string;
  readonly messageKey: string;
  readonly entityId: string | null;
  readonly entityType: string | null;
  readonly dueDate: string | null;
}

export interface MarketplaceDashboard {
  readonly kpis: MarketplaceDashboardKpis;
  readonly alerts: readonly MarketplaceDashboardAlert[];
  readonly advanced: MarketplaceDashboardAdvancedKpis | null;
}
