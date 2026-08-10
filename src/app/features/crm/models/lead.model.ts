export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'AssessmentScheduled'
  | 'OfferSent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'Dormant';

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
}

export interface LeadDetails extends LeadListItem {
  organizationId: string;
  preferredLocation: string | null;
  sourceDetail: string | null;
  createdByUserId: string | null;
  lastModifiedAtUtc: string | null;
  lastModifiedByUserId: string | null;
}
