export interface ProfessionalComplianceDocument {
  readonly id: string;
  readonly documentReferenceId: string;
  readonly documentTypeCode: string;
  readonly countryCode: string;
  readonly mandatory: boolean;
  readonly issueDate: string | null;
  readonly expirationDate: string | null;
  readonly status: string;
  readonly verificationMethod: string | null;
  readonly verifiedAtUtc: string | null;
  readonly verifiedByUserId: string | null;
  readonly rejectionReason: string | null;
  readonly supersededById: string | null;
}
export interface ProfessionalComplianceCredential {
  readonly id: string;
  readonly credentialTypeCode: string;
  readonly countryCode: string;
  readonly issuingAuthority: string;
  readonly referenceNumber: string | null;
  readonly validFrom: string;
  readonly validUntil: string | null;
  readonly categoryCodes: readonly string[];
  readonly evidenceDocumentId: string | null;
  readonly status: string;
  readonly verificationMethod: string | null;
  readonly verifiedAtUtc: string | null;
  readonly verifiedByUserId: string | null;
  readonly rejectionReason: string | null;
}
export interface ProfessionalComplianceResponse {
  readonly profileId: string;
  readonly status: string;
  readonly documents: readonly ProfessionalComplianceDocument[];
  readonly credentials: readonly ProfessionalComplianceCredential[];
}
export interface RegisterProfessionalDocumentRequest {
  readonly documentReferenceId: string;
  readonly documentTypeCode: string;
  readonly countryCode: string;
  readonly mandatory: boolean;
  readonly issueDate: string | null;
  readonly expirationDate: string | null;
}
export interface RegisterProfessionalCredentialRequest {
  readonly credentialTypeCode: string;
  readonly countryCode: string;
  readonly issuingAuthority: string;
  readonly referenceNumber: string | null;
  readonly validFrom: string;
  readonly validUntil: string | null;
  readonly categoryCodes: readonly string[];
  readonly evidenceDocumentId: string | null;
}
