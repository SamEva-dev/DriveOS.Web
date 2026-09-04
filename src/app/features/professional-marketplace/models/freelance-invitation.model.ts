export interface CreateFreelanceInvitationRequest {
  branchId: string | null;
  missionId: string | null;
  professionalProfileId: string | null;
  invitedUserId: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  expirationDate: string;
}

export interface CreateFreelanceInvitationResponse {
  id: string;
}

export interface SendFreelanceInvitationResponse {
  invitationId: string;
  secureUrl: string;
  expirationDate: string;
}

export interface PublicFreelanceInvitation {
  invitationId: string;
  organizationId: string;
  branchId: string | null;
  missionId: string | null;
  message: string | null;
  expirationDate: string;
  status: string;
  authenticationRequired: boolean;
}

export interface FreelanceInvitationAcceptance {
  invitationId: string;
  acceptedByUserId: string;
  professionalProfileId: string | null;
  professionalProfileRequired: boolean;
}
