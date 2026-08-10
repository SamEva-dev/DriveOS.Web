import { LeadSourceType, TransmissionPreference } from './lead.model';

export interface CreateLeadRequest {
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  licenseCategory: string;
  transmission: TransmissionPreference;
  preferredLocation: string | null;
  sourceType: LeadSourceType;
  sourceDetail: string | null;
  assignedAdvisorId: string | null;
}

export interface CreateLeadResponse {
  leadId: string;
}
