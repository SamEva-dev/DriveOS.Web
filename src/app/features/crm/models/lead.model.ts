export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'AssessmentScheduled'
  | 'OfferSent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Dormant'
  | 'NotEligible'
  | 'OutOfScope'
  | 'Duplicate'
  | 'TransferredToPartner'
  | 'NoResponse'
  | 'CancelledByLead'
  | 'ConvertedElsewhere';

export type LeadClosureReason = 'PriceTooHigh' | 'FinancingRejected' | 'DelayTooLong'
  | 'TrainingUnavailable' | 'AreaNotCovered' | 'CompetitorChosen' | 'Unavailable'
  | 'ProjectPostponed' | 'NoResponse' | 'EligibilityConditionNotMet' | 'Duplicate'
  | 'PartnerReferral' | 'CancelledByLead' | 'ConvertedElsewhere' | 'Other';

export type LeadSourceType =
  | 'Website'
  | 'DriveOsForm'
  | 'PhoneCall'
  | 'WalkIn'
  | 'Referral'
  | 'SocialMedia'
  | 'AdvertisingCampaign'
  | 'PartnerDrivingSchool'
  | 'FreelanceInstructor'
  | 'ExternalImport'
  | 'Other';

export type TransmissionPreference = 'Unspecified' | 'Manual' | 'Automatic';
export type FinancingOption = 'Unknown' | 'SelfFunded' | 'CPF' | 'Employer' | 'PublicFunding' | 'Installments' | 'Other';

export interface LeadQualification {
  need: string;
  licenseCategory: string;
  availability: string;
  targetDate: string | null;
  financing: FinancingOption;
  notes: string | null;
}

export interface LeadListItem {
  id: string;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseCategory: string;
  transmission: TransmissionPreference;
  sourceType: LeadSourceType;
  assignedAdvisorId: string | null;
  status: LeadStatus;
  createdAtUtc: string;
  lastModifiedAtUtc?: string | null;
  lastActivityAtUtc?: string | null;
  nextActionTitle?: string | null;
  nextActionDueAtUtc?: string | null;
  isNextActionOverdue?: boolean;
  hasPotentialDuplicate?: boolean;
}

export interface LeadDetails extends LeadListItem {
  organizationId: string;
  preferredLocation: string | null;
  sourceDetail: string | null;
  createdByUserId: string | null;
  lastModifiedAtUtc: string | null;
  lastModifiedByUserId: string | null;
  qualification: LeadQualification | null;
  convertedPersonId: string | null;
  draftEnrollmentId: string | null;
  convertedAtUtc: string | null;
  closureReason: LeadClosureReason | null;
  closureComment: string | null;
  closedAtUtc: string | null;
  resumeAtUtc: string | null;
  dormancyResponsibleUserId: string | null;
  dormancyCampaignCode: string | null;
  referredPartnerName: string | null;
  sharedDataDescription: string | null;
  referralConsentCollectedAtUtc: string | null;
  reopenedAtUtc: string | null;
  automaticFollowUpsEnabled: boolean;
}
