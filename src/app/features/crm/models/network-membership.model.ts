export interface NetworkMember {
  readonly membershipId: string;
  readonly organizationId: string;
  readonly legalName: string;
  readonly countryCode: string;
  readonly status: string;
  readonly joinedAtUtc: string;
}

export interface NetworkMemberCandidate {
  readonly organizationId: string;
  readonly legalName: string;
  readonly countryCode: string;
  readonly status: string;
  readonly alreadyAssignedToNetwork: boolean;
}

export interface AddNetworkMemberRequest {
  readonly memberOrganizationId: string;
}
