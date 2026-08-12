export type OfferLineType =
  | 'RegistrationFee' | 'TheoryTraining' | 'PracticalLesson' | 'SimulatorLesson'
  | 'InitialAssessment' | 'PedagogicalReview' | 'ExamSupport' | 'VehicleExamRental'
  | 'DigitalAccess' | 'AdministrativeService' | 'PartnerTraining' | 'Other';

export type OfferPriceSource =
  | 'StandardCatalog' | 'BranchCatalog' | 'NegotiatedPrice'
  | 'Campaign' | 'PartnerAgreement' | 'ManualOverride';

export interface CommercialOfferLineDraft {
  type: OfferLineType;
  serviceId: string | null;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  mandatory: boolean;
  priceSource: OfferPriceSource;
  manualOverrideReason: string | null;
}

export interface GenerateCommercialOfferRequest {
  assessmentSessionId: string;
  branchId: string | null;
  trainingCode: string;
  currency: string;
  validUntilUtc: string;
  estimatedFundingAmount: number;
  financingNotes: string | null;
  conditions: string | null;
  internalNotes: string | null;
  lines: CommercialOfferLineDraft[];
}

export interface CreateCommercialOfferVariantRequest {
  trainingCode: string;
  validUntilUtc: string;
  estimatedFundingAmount: number;
  financingNotes: string | null;
  conditions: string | null;
  internalNotes: string | null;
  lines: CommercialOfferLineDraft[];
}

export interface CommercialOfferLine extends CommercialOfferLineDraft {
  id: string;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CommercialOffer {
  id: string;
  leadId: string;
  assessmentSessionId: string;
  assessmentRevision: number;
  branchId: string | null;
  version: number;
  trainingCode: string;
  catalogAmount: number;
  discountAmount: number;
  taxAmount: number;
  amount: number;
  estimatedFundingAmount: number;
  prospectRemainingAmount: number;
  currency: string;
  validUntilUtc: string;
  financingNotes: string | null;
  conditions: string | null;
  status: string;
  lines: CommercialOfferLine[];
  deliveryStatus: string | null;
  deliveryChannel: string | null;
  deliveryLanguage: string | null;
  sentAtUtc: string | null;
  secureLinkExpiresAtUtc: string | null;
  secureLinkRevokedAtUtc: string | null;
  deliveryAttemptCount: number;
  viewedAtUtc: string | null;
  lastViewedAtUtc: string | null;
  viewCount: number;
  lastContactAtUtc: string | null;
  nextFollowUpAtUtc: string | null;
  interactions: OfferInteraction[];
}

export type OfferInteractionType = 'Created' | 'Sent' | 'Viewed' | 'QuestionReceived'
  | 'ModificationRequested' | 'FollowUpScheduled' | 'FollowUpCompleted'
  | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Expired' | 'VersionCreated';

export interface OfferInteraction {
  id: string;
  type: OfferInteractionType;
  occurredAtUtc: string;
  actorUserId: string | null;
  summary: string | null;
  metadataJson: string | null;
}

export type OfferDeliveryChannel = 'Email' | 'SmsLink' | 'StudentPortal' | 'GuardianPortal' | 'Printed' | 'SecureLink';
export type OfferRecipientType = 'Prospect' | 'LegalRepresentative' | 'Payer' | 'Company' | 'Funder';

export interface SendCommercialOfferRequest {
  channel: OfferDeliveryChannel;
  recipients: Array<{ type: OfferRecipientType; displayName: string; address: string }>;
  subject: string;
  message: string;
  language: string;
  documentReference: string;
  attachmentReferences: string[];
  secureLinkLifetimeHours: number;
}

export interface SendCommercialOfferResponse {
  offerId: string;
  offerStatus: string;
  deliveryStatus: string;
  secureLinkToken: string | null;
  secureLinkExpiresAtUtc: string | null;
}
