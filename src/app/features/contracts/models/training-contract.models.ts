export interface TrainingContractListItem {
  id: string;
  contractNumber: string;
  studentId: string;
  branchId: string;
  currentVersionNumber: number;
  status: string;
  startDate: string;
  endDate: string | null;
  totalAmount: number;
  currency: string;
  trainingCode: string;
  createdAtUtc: string;
}

export interface TrainingContractParty {
  kind: string;
  personId: string | null;
  organizationId: string | null;
  displayName: string;
  legalReference: string | null;
}

export interface TrainingContractSignatory {
  id: string;
  kind: string;
  personId: string;
  representedOrganizationId: string | null;
  displayName: string;
  signingOrder: number;
  isRequired: boolean;
  authorityReference: string | null;
  authorityStatus: string;
  authorityVerifiedByUserId: string | null;
  authorityVerifiedAtUtc: string | null;
  authorityRejectionReason: string | null;
  status: string;
}

export interface SaveTrainingContractSignatoryRequest {
  kind: string;
  personId: string;
  representedOrganizationId: string | null;
  displayName: string;
  signingOrder: number;
  isRequired: boolean;
  authorityReference: string | null;
}

export interface SignatureEvidence {
  id: string;
  signatoryId: string;
  personId: string;
  documentSha256: string;
  signatureMethod: string;
  authenticationMethod: string;
  provider: string;
  providerSignatureReference: string;
  certificateReference: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  signedAtUtc: string;
  receivedAtUtc: string;
  recordedByUserId: string;
}

export interface SignatureProcessRecipient {
  signatoryId: string;
  kind: string;
  personId: string;
  representedOrganizationId: string | null;
  displayName: string;
  signingOrder: number;
  isRequired: boolean;
  hasSigned: boolean;
}

export interface SignatureProcess {
  id: string;
  contractVersionNumber: number;
  documentSha256: string;
  signatureOrder: string;
  status: string;
  requestedAtUtc: string;
  requestedByUserId: string;
  completedAtUtc: string | null;
  recipients: readonly SignatureProcessRecipient[];
  evidence: readonly SignatureEvidence[];
}

export interface RecordTrainingContractSignatureRequest {
  signatoryId: string;
  documentSha256: string;
  signatureMethod: string;
  authenticationMethod: string;
  provider: string;
  providerSignatureReference: string;
  certificateReference: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  signedAtUtc: string;
}

export interface RecordTrainingContractSignatureResponse {
  evidenceId: string;
  signatoryId: string;
  processStatus: string;
  contractStatus: string;
  signedAtUtc: string;
}

export interface TrainingContractTerms {
  trainingCode: string;
  practicalHours: number;
  servicesSnapshot: string;
  paymentScheduleSnapshot: string;
  cancellationTerms: string;
  bookingRules: string;
  studentObligations: string;
  providerObligations: string;
  examPresentationTerms: string;
  dataProcessingTerms: string;
}

export interface TrainingContractVersion {
  id: string;
  versionNumber: number;
  sourceOfferId: string;
  sourceOfferVersion: number;
  startDate: string;
  endDate: string | null;
  totalAmount: number;
  currency: string;
  revisionReason: string | null;
  createdByUserId: string | null;
  createdAtUtc: string;
}

export interface ContractAmendment {
  id: string;
  amendmentNumber: number;
  baseContractVersionNumber: number;
  reason: string;
  effectiveDate: string;
  startDate: string;
  endDate: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  signedDocumentReference: string | null;
  signedDocumentSha256: string | null;
  signedAtUtc: string | null;
  appliedAtUtc: string | null;
  cancellationReason: string | null;
  createdAtUtc: string;
}

export interface CreateContractAmendmentRequest {
  reason: string;
  effectiveDate: string;
  startDate: string;
  endDate: string | null;
  totalAmount: number;
  currency: string;
  practicalHours: number;
  servicesSnapshot: string;
  paymentScheduleSnapshot: string;
  cancellationTerms: string;
  bookingRules: string;
  studentObligations: string;
  providerObligations: string;
  examPresentationTerms: string;
  dataProcessingTerms: string;
}

export interface ApplyContractAmendmentResponse {
  amendmentId: string;
  newContractVersionNumber: number;
  contractStatus: string;
  amendmentStatus: string;
}

export interface TrainingContractDetail extends TrainingContractListItem {
  organizationId: string;
  sourceOfferId: string;
  sourceOfferVersion: number;
  terms: TrainingContractTerms;
  parties: readonly TrainingContractParty[];
  versions: readonly TrainingContractVersion[];
  signatories: readonly TrainingContractSignatory[];
  amendments: readonly ContractAmendment[];
  currentSignatureProcess: SignatureProcess | null;
  generatedDocumentFileName: string | null;
  generatedDocumentContentType: string | null;
  generatedDocumentSha256: string | null;
  generatedDocumentVersionNumber: number | null;
  generatedAtUtc: string | null;
  generatedByUserId: string | null;
  createdByUserId: string | null;
  lastModifiedAtUtc: string | null;
  lastModifiedByUserId: string | null;
  activatedAtUtc: string | null;
  activatedByUserId: string | null;
  suspensionReason: string | null;
  suspensionEffectiveDate: string | null;
  suspensionExpectedResumeDate: string | null;
  suspendedAtUtc: string | null;
  suspendedByUserId: string | null;
  terminationReason: string | null;
  terminationEffectiveDate: string | null;
  terminatedAtUtc: string | null;
  terminatedByUserId: string | null;
  completionNote: string | null;
  completionEffectiveDate: string | null;
  completedAtUtc: string | null;
  completedByUserId: string | null;
  expirationEffectiveDate: string | null;
  expiredAtUtc: string | null;
  expiredByUserId: string | null;
}

export interface SuspendTrainingContractRequest {
  reason: string;
  effectiveDate: string;
  expectedResumeDate: string | null;
}

export interface SuspendTrainingContractResponse {
  contractId: string;
  status: string;
  effectiveDate: string;
  expectedResumeDate: string | null;
  suspendedAtUtc: string;
}

export interface TerminateTrainingContractRequest {
  reason: string;
  effectiveDate: string;
}

export interface TerminateTrainingContractResponse {
  contractId: string;
  status: string;
  effectiveDate: string;
  terminatedAtUtc: string;
}

export interface CompleteTrainingContractRequest {
  note: string;
  effectiveDate: string;
}
export interface CompleteTrainingContractResponse {
  contractId: string;
  status: string;
  effectiveDate: string;
  completedAtUtc: string;
}
export interface ExpireTrainingContractResponse {
  contractId: string;
  status: string;
  effectiveDate: string;
  expiredAtUtc: string;
}

export interface ActivateTrainingContractResponse {
  contractId: string;
  status: string;
  activatedAtUtc: string;
}

export interface GeneratedTrainingContract {
  contractId: string;
  versionNumber: number;
  fileName: string;
  contentType: string;
  sha256: string;
  generatedAtUtc: string;
}

export interface SendTrainingContractForSignatureResponse {
  signatureProcessId: string;
  status: string;
  requestedAtUtc: string;
}

export interface ContractDocumentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  uploadedByUserId: string;
  uploadedAtUtc: string;
}
export interface ContractDocument {
  id: string;
  contractId: string;
  contractVersionNumber: number;
  documentType: string;
  title: string;
  visibility: string;
  retainUntil: string | null;
  retentionLegalBasis: string | null;
  status: string;
  currentVersionNumber: number;
  createdAtUtc: string;
  createdByUserId: string | null;
  archivedAtUtc: string | null;
  archivedByUserId: string | null;
  versions: readonly ContractDocumentVersion[];
}

export interface PagedResult<T> {
  items: readonly T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SearchTrainingContractsParameters {
  pageNumber?: number;
  pageSize?: number;
  search?: string | null;
  studentId?: string | null;
  branchId?: string | null;
  status?: string | null;
  startsFrom?: string | null;
  startsTo?: string | null;
  endsFrom?: string | null;
  endsTo?: string | null;
  sortBy?: 'CreatedAt' | 'ContractNumber' | 'StartDate' | 'EndDate' | 'Status' | 'TotalAmount';
  sortDirection?: 'Ascending' | 'Descending';
}

export interface ContractAuditEntry {
  eventId: string;
  contractId: string;
  aggregateType: string;
  aggregateId: string;
  action: string;
  actorUserId: string | null;
  occurredAtUtc: string;
  detailsJson: string | null;
}

export interface TrainingContractHistory {
  contractId: string;
  contractNumber: string;
  currentStatus: string;
  currentVersionNumber: number;
  versions: readonly TrainingContractVersion[];
  amendments: readonly ContractAmendment[];
  documents: readonly ContractDocument[];
  currentSignatureProcess: SignatureProcess | null;
  audit: readonly ContractAuditEntry[];
}
