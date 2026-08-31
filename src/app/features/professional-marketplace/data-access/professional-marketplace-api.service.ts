import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { MarketplaceDashboard } from '../models/marketplace-dashboard.model';
import {
  ProfessionalSearchPage,
  ProfessionalSearchParameters,
} from '../models/professional-search.model';
import { ProfessionalProfile } from '../models/professional-profile.model';
import {
  CreateFreelanceInvitationRequest,
  CreateFreelanceInvitationResponse,
  SendFreelanceInvitationResponse,
} from '../models/freelance-invitation.model';
import {
  ProfessionalComplianceResponse,
  RegisterProfessionalCredentialRequest,
  RegisterProfessionalDocumentRequest,
} from '../models/professional-compliance.model';
import {
  CreateProfessionalOpportunityRequest,
  ProfessionalOpportunity,
} from '../models/professional-opportunity.model';
import { ProfessionalMatchResult } from '../models/professional-matching.model';
import { ProfessionalApplication } from '../models/professional-application.model';
import {
  CreateProfessionalProposalRequest,
  ProfessionalProposal,
} from '../models/professional-proposal.model';
import {
  CreateProfessionalCommercialOfferRequest,
  ProfessionalCommercialOffer,
  ProfessionalCommercialOfferTerms,
} from '../models/professional-commercial-offer.model';
import {
  CreateProfessionalServiceContractRequest,
  ExternalAccessPreparationResult,
  ProfessionalEngagement,
  ProfessionalSchedulingPreparationResult,
  ProfessionalServiceContractSnapshot,
  RecordProfessionalServiceContractSignatureRequest,
} from '../models/professional-engagement.model';
import {
  CreateProfessionalMissionRequest,
  ProfessionalMission,
} from '../models/professional-mission.model';
import {
  AssignProfessionalStudentRequest,
  ProfessionalStudentAssignment,
} from '../models/professional-student-assignment.model';
import {
  CreateExternalAccessGrantRequest,
  ExternalAccessGrant,
} from '../models/external-access-grant.model';
import { ServiceEntry } from '../models/service-entry.model';
import {
  CreateMyServiceStatementRequest,
  ServiceStatement,
} from '../models/service-statement.model';
import {
  ServiceDispute,
  ServiceDisputeParty,
  ServiceDisputeResolutionOutcome,
} from '../models/service-dispute.model';
import {
  CreateProfessionalInvoiceRequest,
  ManualSupplierPaymentRequest,
  ProfessionalInvoice,
  ProfessionalInvoiceFinanceSnapshot,
  ScheduleSupplierPaymentRequest,
  SupplierPaymentFailedRequest,
  SupplierPaymentPaidRequest,
  SupplierPaymentRefundRequest,
} from '../models/professional-invoice.model';
import { MarketplaceConversationThread } from '../models/marketplace-conversation.model';
import {
  CreateProfessionalReviewRequest,
  ProfessionalReputation,
  ProfessionalReviewModeration,
} from '../models/professional-review.model';

@Injectable({ providedIn: 'root' })
export class ProfessionalMarketplaceApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly apiRoot = this.config.baseUrl.replace(/\/$/, '');
  private readonly baseUrl = `${this.apiRoot}/professional-marketplace`;
  private readonly financeBaseUrl = `${this.apiRoot}/finance`;

  getOrganizationDashboard(
    organizationId: string,
    from?: string | null,
    to?: string | null,
  ): Observable<MarketplaceDashboard> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MarketplaceDashboard>(
      `${this.baseUrl}/organizations/${organizationId}/dashboard`,
      { params },
    );
  }
  getOrganizationAnalytics(
    organizationId: string,
    from?: string | null,
    to?: string | null,
  ): Observable<MarketplaceDashboard> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MarketplaceDashboard>(
      `${this.baseUrl}/organizations/${organizationId}/analytics`,
      { params },
    );
  }

  getMyProfessionalDashboard(
    from?: string | null,
    to?: string | null,
  ): Observable<MarketplaceDashboard> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<MarketplaceDashboard>(`${this.baseUrl}/me/dashboard`, { params });
  }

  getProfessionalProfile(profileId: string): Observable<ProfessionalProfile> {
    return this.http.get<ProfessionalProfile>(`${this.baseUrl}/profiles/${profileId}`);
  }

  searchProfessionals(query: ProfessionalSearchParameters): Observable<ProfessionalSearchPage> {
    let params = new HttpParams();
    const values: Record<string, string | number | boolean | null | undefined> = {
      countryCode: query.countryCode,
      teachingCategoryCode: query.teachingCategoryCode,
      languageCode: query.languageCode,
      specializationCode: query.specializationCode,
      areaCode: query.areaCode,
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radiusKm,
      availableOnDate: query.availableOnDate,
      availableFrom: query.availableFrom,
      availableTo: query.availableTo,
      maximumRateAmount: query.maximumRateAmount,
      currency: query.currency,
      rateUnit: query.rateUnit,
      verifiedOnly: query.verifiedOnly ?? true,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value !== null && value !== undefined && value !== '')
        params = params.set(key, String(value));
    }
    return this.http.get<ProfessionalSearchPage>(`${this.baseUrl}/search/professionals`, {
      params,
    });
  }

  createFreelanceInvitation(
    organizationId: string,
    request: CreateFreelanceInvitationRequest,
  ): Observable<CreateFreelanceInvitationResponse> {
    return this.http.post<CreateFreelanceInvitationResponse>(
      `${this.baseUrl}/organizations/${organizationId}/invitations`,
      request,
    );
  }

  sendFreelanceInvitation(
    organizationId: string,
    invitationId: string,
    publicBaseUrl: string,
  ): Observable<SendFreelanceInvitationResponse> {
    return this.http.post<SendFreelanceInvitationResponse>(
      `${this.baseUrl}/organizations/${organizationId}/invitations/${invitationId}/send`,
      { publicBaseUrl },
    );
  }

  getProfessionalCompliance(profileId: string): Observable<ProfessionalComplianceResponse> {
    return this.http.get<ProfessionalComplianceResponse>(
      `${this.baseUrl}/profiles/${profileId}/compliance`,
    );
  }
  registerProfessionalDocument(
    profileId: string,
    request: RegisterProfessionalDocumentRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/profiles/${profileId}/documents`,
      request,
    );
  }
  submitProfessionalDocument(documentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/documents/${documentId}/submit`, {});
  }
  approveProfessionalDocument(documentId: string, method: string = 'Manual'): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/documents/${documentId}/approve`, { method });
  }
  rejectProfessionalDocument(documentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/documents/${documentId}/reject`, { reason });
  }
  registerProfessionalCredential(
    profileId: string,
    request: RegisterProfessionalCredentialRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/profiles/${profileId}/credentials`,
      request,
    );
  }
  verifyProfessionalCredential(credentialId: string, method: string = 'Manual'): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/credentials/${credentialId}/verify`, { method });
  }
  rejectProfessionalCredential(credentialId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/credentials/${credentialId}/reject`, { reason });
  }
  reevaluateProfessionalCompliance(profileId: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/profiles/${profileId}/compliance/reevaluate`, {});
  }

  listProfessionalOpportunities(
    organizationId: string,
  ): Observable<readonly ProfessionalOpportunity[]> {
    return this.http.get<readonly ProfessionalOpportunity[]>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities`,
    );
  }

  getProfessionalOpportunity(
    organizationId: string,
    opportunityId: string,
  ): Observable<ProfessionalOpportunity> {
    return this.http.get<ProfessionalOpportunity>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}`,
    );
  }

  createProfessionalOpportunity(
    organizationId: string,
    request: CreateProfessionalOpportunityRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities`,
      request,
    );
  }

  publishProfessionalOpportunity(organizationId: string, opportunityId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/publish`,
      {},
    );
  }

  pauseProfessionalOpportunity(organizationId: string, opportunityId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/pause`,
      {},
    );
  }

  fillProfessionalOpportunity(organizationId: string, opportunityId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/fill`,
      {},
    );
  }

  cancelProfessionalOpportunity(
    organizationId: string,
    opportunityId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/cancel`,
      { reason },
    );
  }

  matchProfessionalsForOpportunity(
    organizationId: string,
    opportunityId: string,
    limit: number = 20,
  ): Observable<readonly ProfessionalMatchResult[]> {
    return this.http.get<readonly ProfessionalMatchResult[]>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/matches`,
      { params: new HttpParams().set('limit', String(limit)) },
    );
  }

  listProfessionalApplications(
    organizationId: string,
    opportunityId: string,
  ): Observable<readonly ProfessionalApplication[]> {
    return this.http.get<readonly ProfessionalApplication[]>(
      `${this.baseUrl}/organizations/${organizationId}/opportunities/${opportunityId}/applications`,
    );
  }
  reviewProfessionalApplication(organizationId: string, applicationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/applications/${applicationId}/review`,
      {},
    );
  }
  shortlistProfessionalApplication(
    organizationId: string,
    applicationId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/applications/${applicationId}/shortlist`,
      {},
    );
  }
  acceptProfessionalApplication(organizationId: string, applicationId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/applications/${applicationId}/accept`,
      {},
    );
  }
  rejectProfessionalApplication(
    organizationId: string,
    applicationId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/applications/${applicationId}/reject`,
      { reason },
    );
  }

  listProfessionalProposals(
    organizationId: string,
    profileId: string,
    opportunityId?: string | null,
  ): Observable<readonly ProfessionalProposal[]> {
    let params = new HttpParams();
    if (opportunityId) params = params.set('opportunityId', opportunityId);
    return this.http.get<readonly ProfessionalProposal[]>(
      `${this.baseUrl}/organizations/${organizationId}/profiles/${profileId}/proposals`,
      { params },
    );
  }
  createProfessionalProposal(
    organizationId: string,
    profileId: string,
    request: CreateProfessionalProposalRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/profiles/${profileId}/proposals`,
      request,
    );
  }
  acceptProfessionalProposal(profileId: string, proposalId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/proposals/${proposalId}/accept`,
      {},
    );
  }
  rejectProfessionalProposal(
    profileId: string,
    proposalId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/proposals/${proposalId}/reject`,
      { reason },
    );
  }
  counterProfessionalProposal(
    profileId: string,
    proposalId: string,
    proposedRate: number,
    currency: string,
    rateUnit: string,
    negotiable: boolean,
    message: string | null,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/proposals/${proposalId}/counter`,
      { proposedRate, currency, rateUnit, negotiable, message },
    );
  }
  withdrawProfessionalProposal(
    organizationId: string,
    proposalId: string,
    reason: string | null,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/proposals/${proposalId}/withdraw`,
      { reason },
    );
  }

  listProfessionalCommercialOffers(
    organizationId: string,
    profileId: string,
    applicationId?: string | null,
    proposalId?: string | null,
    opportunityId?: string | null,
  ): Observable<readonly ProfessionalCommercialOffer[]> {
    let params = new HttpParams();
    if (applicationId) params = params.set('applicationId', applicationId);
    if (proposalId) params = params.set('proposalId', proposalId);
    if (opportunityId) params = params.set('opportunityId', opportunityId);
    return this.http.get<readonly ProfessionalCommercialOffer[]>(
      `${this.baseUrl}/organizations/${organizationId}/profiles/${profileId}/commercial-offers`,
      { params },
    );
  }
  createProfessionalCommercialOffer(
    organizationId: string,
    request: CreateProfessionalCommercialOfferRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers`,
      request,
    );
  }
  reviseProfessionalCommercialOffer(
    organizationId: string,
    offerId: string,
    terms: ProfessionalCommercialOfferTerms,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers/${offerId}`,
      { terms },
    );
  }
  sendProfessionalCommercialOffer(organizationId: string, offerId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers/${offerId}/send`,
      {},
    );
  }
  acceptProfessionalCommercialOfferByOrganization(
    organizationId: string,
    offerId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers/${offerId}/accept`,
      {},
    );
  }
  finalizeProfessionalCommercialOffer(organizationId: string, offerId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers/${offerId}/finalize`,
      {},
    );
  }
  cancelProfessionalCommercialOffer(
    organizationId: string,
    offerId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/commercial-offers/${offerId}/cancel`,
      { reason },
    );
  }

  listProfessionalEngagements(
    organizationId: string,
    profileId: string,
    commercialOfferId?: string | null,
  ): Observable<readonly ProfessionalEngagement[]> {
    let params = new HttpParams();
    if (commercialOfferId) params = params.set('commercialOfferId', commercialOfferId);
    return this.http.get<readonly ProfessionalEngagement[]>(
      `${this.baseUrl}/organizations/${organizationId}/profiles/${profileId}/engagements`,
      { params },
    );
  }
  getProfessionalEngagement(
    organizationId: string,
    engagementId: string,
  ): Observable<ProfessionalEngagement> {
    return this.http.get<ProfessionalEngagement>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}`,
    );
  }
  createProfessionalEngagement(
    organizationId: string,
    commercialOfferId: string,
    branchId: string | null,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/engagements`,
      { commercialOfferId, branchId },
    );
  }
  prepareEngagementCompliance(organizationId: string, engagementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/prepare-compliance`,
      {},
    );
  }
  prepareEngagementContract(
    organizationId: string,
    engagementId: string,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/prepare-contract`,
      {},
    );
  }
  prepareEngagementAccess(
    organizationId: string,
    engagementId: string,
  ): Observable<ExternalAccessPreparationResult> {
    return this.http.post<ExternalAccessPreparationResult>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/prepare-access`,
      {},
    );
  }
  prepareEngagementScheduling(
    organizationId: string,
    engagementId: string,
  ): Observable<ProfessionalSchedulingPreparationResult> {
    return this.http.post<ProfessionalSchedulingPreparationResult>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/prepare-scheduling`,
      {},
    );
  }
  markEngagementInternalApproval(
    organizationId: string,
    engagementId: string,
    completed: boolean,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/preparation`,
      { step: 5, completed },
    );
  }
  activateProfessionalEngagement(organizationId: string, engagementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/activate`,
      {},
    );
  }
  suspendProfessionalEngagement(
    organizationId: string,
    engagementId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/suspend`,
      { reason },
    );
  }
  resumeProfessionalEngagement(organizationId: string, engagementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/resume`,
      {},
    );
  }
  completeProfessionalEngagement(
    organizationId: string,
    engagementId: string,
  ): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/complete`,
      {},
    );
  }
  terminateProfessionalEngagement(
    organizationId: string,
    engagementId: string,
    reason: string,
  ): Observable<unknown> {
    return this.http.post(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/terminate`,
      { reason },
    );
  }
  getProfessionalServiceContract(
    organizationId: string,
    engagementId: string,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.get<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract`,
    );
  }
  createProfessionalServiceContract(
    organizationId: string,
    engagementId: string,
    request: CreateProfessionalServiceContractRequest,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract`,
      request,
    );
  }
  generateProfessionalServiceContract(
    organizationId: string,
    engagementId: string,
    documentReference: string,
    documentSha256: string,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract/generate`,
      { documentReference, documentSha256 },
    );
  }
  reviseProfessionalServiceContract(
    organizationId: string,
    engagementId: string,
    documentReference: string,
    documentSha256: string,
    reason: string,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract/revise`,
      { documentReference, documentSha256, reason },
    );
  }
  sendProfessionalServiceContractForSignature(
    organizationId: string,
    engagementId: string,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract/send-for-signature`,
      {},
    );
  }
  recordProfessionalServiceContractSignature(
    organizationId: string,
    engagementId: string,
    request: RecordProfessionalServiceContractSignatureRequest,
  ): Observable<ProfessionalServiceContractSnapshot> {
    return this.http.post<ProfessionalServiceContractSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract/signatures`,
      request,
    );
  }
  terminateProfessionalServiceContract(
    organizationId: string,
    engagementId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/contract/terminate`,
      { reason },
    );
  }

  listProfessionalMissions(
    organizationId: string,
    engagementId: string,
  ): Observable<readonly ProfessionalMission[]> {
    return this.http.get<readonly ProfessionalMission[]>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/missions`,
    );
  }
  getProfessionalMission(
    organizationId: string,
    missionId: string,
  ): Observable<ProfessionalMission> {
    return this.http.get<ProfessionalMission>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}`,
    );
  }
  createProfessionalMission(
    organizationId: string,
    engagementId: string,
    request: CreateProfessionalMissionRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/missions`,
      request,
    );
  }
  updateProfessionalMission(
    organizationId: string,
    missionId: string,
    request: CreateProfessionalMissionRequest,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}`,
      request,
    );
  }
  proposeProfessionalMission(organizationId: string, missionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/propose`,
      {},
    );
  }
  acceptProfessionalMission(profileId: string, missionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/missions/${missionId}/accept`,
      {},
    );
  }
  declineProfessionalMission(
    profileId: string,
    missionId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/missions/${missionId}/decline`,
      { reason },
    );
  }
  activateProfessionalMission(organizationId: string, missionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/activate`,
      {},
    );
  }
  pauseProfessionalMission(
    organizationId: string,
    missionId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/pause`,
      { reason },
    );
  }
  resumeProfessionalMission(organizationId: string, missionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/resume`,
      {},
    );
  }
  completeProfessionalMission(organizationId: string, missionId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/complete`,
      {},
    );
  }
  cancelProfessionalMission(
    organizationId: string,
    missionId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/cancel`,
      { reason },
    );
  }

  listProfessionalStudentAssignments(
    organizationId: string,
    missionId: string,
  ): Observable<readonly ProfessionalStudentAssignment[]> {
    return this.http.get<readonly ProfessionalStudentAssignment[]>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/student-assignments`,
    );
  }
  assignProfessionalStudent(
    organizationId: string,
    missionId: string,
    request: AssignProfessionalStudentRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/missions/${missionId}/student-assignments`,
      request,
    );
  }
  revokeProfessionalStudentAssignment(
    organizationId: string,
    assignmentId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/student-assignments/${assignmentId}/revoke`,
      { reason },
    );
  }

  listExternalAccessGrants(
    organizationId: string,
    engagementId: string,
  ): Observable<readonly ExternalAccessGrant[]> {
    return this.http.get<readonly ExternalAccessGrant[]>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/access-grants`,
    );
  }
  createExternalAccessGrant(
    organizationId: string,
    engagementId: string,
    request: CreateExternalAccessGrantRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/access-grants`,
      request,
    );
  }
  revokeExternalAccessGrant(
    organizationId: string,
    grantId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/access-grants/${grantId}/revoke`,
      { reason },
    );
  }

  getMyProfessionalProfile(): Observable<ProfessionalProfile> {
    return this.http.get<ProfessionalProfile>(`${this.baseUrl}/me/profile`);
  }
  listMyProfessionalMissions(): Observable<readonly ProfessionalMission[]> {
    return this.http.get<readonly ProfessionalMission[]>(`${this.baseUrl}/me/missions`);
  }
  getMyProfessionalMission(missionId: string): Observable<ProfessionalMission> {
    return this.http.get<ProfessionalMission>(`${this.baseUrl}/me/missions/${missionId}`);
  }
  acceptMyProfessionalMission(missionId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/missions/${missionId}/accept`, {});
  }
  declineMyProfessionalMission(missionId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/missions/${missionId}/decline`, { reason });
  }
  listMyProfessionalStudentAssignments(): Observable<readonly ProfessionalStudentAssignment[]> {
    return this.http.get<readonly ProfessionalStudentAssignment[]>(
      `${this.baseUrl}/me/student-assignments`,
    );
  }
  listMyProfessionalMissionStudentAssignments(
    missionId: string,
  ): Observable<readonly ProfessionalStudentAssignment[]> {
    return this.http.get<readonly ProfessionalStudentAssignment[]>(
      `${this.baseUrl}/me/missions/${missionId}/student-assignments`,
    );
  }

  listMyProfessionalServiceEntries(): Observable<readonly ServiceEntry[]> {
    return this.http.get<readonly ServiceEntry[]>(`${this.baseUrl}/me/service-entries`);
  }
  listMyProfessionalMissionServiceEntries(missionId: string): Observable<readonly ServiceEntry[]> {
    return this.http.get<readonly ServiceEntry[]>(
      `${this.baseUrl}/me/missions/${missionId}/service-entries`,
    );
  }
  getMyProfessionalServiceEntry(entryId: string): Observable<ServiceEntry> {
    return this.http.get<ServiceEntry>(`${this.baseUrl}/me/service-entries/${entryId}`);
  }
  submitMyProfessionalServiceEntry(entryId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/service-entries/${entryId}/submit`, {});
  }
  listOrganizationServiceStatements(
    organizationId: string,
    engagementId: string,
  ): Observable<readonly ServiceStatement[]> {
    return this.http.get<readonly ServiceStatement[]>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/service-statements`,
    );
  }
  getOrganizationServiceStatement(
    organizationId: string,
    statementId: string,
  ): Observable<ServiceStatement> {
    return this.http.get<ServiceStatement>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}`,
    );
  }
  startServiceStatementReview(organizationId: string, statementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}/review`,
      {},
    );
  }
  refreshServiceStatement(organizationId: string, statementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}/refresh`,
      {},
    );
  }
  approveServiceStatement(organizationId: string, statementId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}/approve`,
      {},
    );
  }
  rejectServiceStatement(
    organizationId: string,
    statementId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}/reject`,
      { reason },
    );
  }
  approveServiceEntry(organizationId: string, entryId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-entries/${entryId}/approve`,
      {},
    );
  }
  rejectServiceEntry(organizationId: string, entryId: string, reason: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/service-entries/${entryId}/reject`,
      { reason },
    );
  }
  openServiceEntryDispute(
    organizationId: string,
    entryId: string,
    reason: string,
    description: string,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/service-entries/${entryId}/disputes`,
      { reason, description, evidence: [] },
    );
  }

  listMyProfessionalServiceStatements(): Observable<readonly ServiceStatement[]> {
    return this.http.get<readonly ServiceStatement[]>(`${this.baseUrl}/me/service-statements`);
  }
  listMyProfessionalEngagementServiceStatements(
    engagementId: string,
  ): Observable<readonly ServiceStatement[]> {
    return this.http.get<readonly ServiceStatement[]>(
      `${this.baseUrl}/me/engagements/${engagementId}/service-statements`,
    );
  }
  getMyProfessionalServiceStatement(statementId: string): Observable<ServiceStatement> {
    return this.http.get<ServiceStatement>(`${this.baseUrl}/me/service-statements/${statementId}`);
  }
  createMyProfessionalServiceStatement(
    engagementId: string,
    request: CreateMyServiceStatementRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/me/engagements/${engagementId}/service-statements`,
      request,
    );
  }
  submitMyProfessionalServiceStatement(statementId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/service-statements/${statementId}/submit`, {});
  }

  listOrganizationDisputes(organizationId: string): Observable<readonly ServiceDispute[]> {
    return this.http.get<readonly ServiceDispute[]>(
      `${this.baseUrl}/organizations/${organizationId}/disputes`,
    );
  }
  getOrganizationDispute(organizationId: string, disputeId: string): Observable<ServiceDispute> {
    return this.http.get<ServiceDispute>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}`,
    );
  }
  addOrganizationDisputeMessage(
    organizationId: string,
    disputeId: string,
    message: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}/messages`,
      { message },
    );
  }
  addOrganizationDisputeEvidence(
    organizationId: string,
    disputeId: string,
    documentReferenceId: string,
    label: string,
    note: string | null,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}/evidence`,
      { documentReferenceId, label, note },
    );
  }
  waitOrganizationDisputeFor(
    organizationId: string,
    disputeId: string,
    party: ServiceDisputeParty,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}/wait-for/${party}`,
      {},
    );
  }
  resolveOrganizationDispute(
    organizationId: string,
    disputeId: string,
    outcome: ServiceDisputeResolutionOutcome,
    resolution: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}/resolve`,
      { outcome, resolution },
    );
  }
  escalateOrganizationDispute(
    organizationId: string,
    disputeId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/disputes/${disputeId}/escalate`,
      { reason },
    );
  }

  listMyDisputes(): Observable<readonly ServiceDispute[]> {
    return this.http.get<readonly ServiceDispute[]>(`${this.baseUrl}/me/disputes`);
  }
  getMyDispute(disputeId: string): Observable<ServiceDispute> {
    return this.http.get<ServiceDispute>(`${this.baseUrl}/me/disputes/${disputeId}`);
  }
  openMyServiceEntryDispute(
    entryId: string,
    reason: string,
    description: string,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/me/service-entries/${entryId}/disputes`,
      { reason, description, evidence: [] },
    );
  }
  addMyDisputeMessage(disputeId: string, message: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/disputes/${disputeId}/messages`, { message });
  }
  addMyDisputeEvidence(
    disputeId: string,
    documentReferenceId: string,
    label: string,
    note: string | null,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/disputes/${disputeId}/evidence`, {
      documentReferenceId,
      label,
      note,
    });
  }
  waitMyDisputeFor(disputeId: string, party: ServiceDisputeParty): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/disputes/${disputeId}/wait-for/${party}`, {});
  }
  escalateMyDispute(disputeId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/me/disputes/${disputeId}/escalate`, { reason });
  }

  listOrganizationProfessionalInvoices(
    organizationId: string,
    engagementId: string,
  ): Observable<readonly ProfessionalInvoice[]> {
    return this.http.get<readonly ProfessionalInvoice[]>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/invoices`,
    );
  }
  getOrganizationProfessionalInvoice(
    organizationId: string,
    invoiceId: string,
  ): Observable<ProfessionalInvoice> {
    return this.http.get<ProfessionalInvoice>(
      `${this.baseUrl}/organizations/${organizationId}/invoices/${invoiceId}`,
    );
  }
  createOrganizationProfessionalInvoice(
    organizationId: string,
    statementId: string,
    request: CreateProfessionalInvoiceRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/service-statements/${statementId}/invoices`,
      request,
    );
  }
  updateOrganizationProfessionalInvoice(
    organizationId: string,
    invoiceId: string,
    request: CreateProfessionalInvoiceRequest,
  ): Observable<void> {
    return this.http.put<void>(
      `${this.baseUrl}/organizations/${organizationId}/invoices/${invoiceId}`,
      request,
    );
  }
  validateOrganizationProfessionalInvoice(
    organizationId: string,
    invoiceId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/invoices/${invoiceId}/validate`,
      {},
    );
  }
  requestOrganizationProfessionalInvoiceFinance(
    organizationId: string,
    invoiceId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/invoices/${invoiceId}/request-finance`,
      {},
    );
  }
  syncOrganizationProfessionalInvoiceFinance(
    organizationId: string,
    invoiceId: string,
  ): Observable<ProfessionalInvoiceFinanceSnapshot> {
    return this.http.post<ProfessionalInvoiceFinanceSnapshot>(
      `${this.baseUrl}/organizations/${organizationId}/invoices/${invoiceId}/sync-finance`,
      {},
    );
  }

  approveSupplierInvoiceOperational(
    organizationId: string,
    supplierInvoiceId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/approve-operational`,
      {},
    );
  }
  approveSupplierInvoiceFinancial(
    organizationId: string,
    supplierInvoiceId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/approve-financial`,
      {},
    );
  }
  scheduleSupplierPayment(
    organizationId: string,
    supplierInvoiceId: string,
    request: ScheduleSupplierPaymentRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/payment-attempts`,
      request,
    );
  }
  recordManualSupplierPayment(
    organizationId: string,
    supplierInvoiceId: string,
    request: ManualSupplierPaymentRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/manual-payment`,
      request,
    );
  }
  markSupplierPaymentProcessing(
    organizationId: string,
    supplierInvoiceId: string,
    attemptId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/payment-attempts/${attemptId}/processing`,
      {},
    );
  }
  markSupplierPaymentPaid(
    organizationId: string,
    supplierInvoiceId: string,
    attemptId: string,
    request: SupplierPaymentPaidRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/payment-attempts/${attemptId}/paid`,
      request,
    );
  }
  markSupplierPaymentFailed(
    organizationId: string,
    supplierInvoiceId: string,
    attemptId: string,
    request: SupplierPaymentFailedRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/payment-attempts/${attemptId}/failed`,
      request,
    );
  }
  cancelSupplierPayment(
    organizationId: string,
    supplierInvoiceId: string,
    attemptId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/payment-attempts/${attemptId}/cancel`,
      {},
    );
  }
  refundSupplierPayment(
    organizationId: string,
    supplierInvoiceId: string,
    request: SupplierPaymentRefundRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.financeBaseUrl}/organizations/${organizationId}/supplier-invoices/${supplierInvoiceId}/refunds`,
      request,
    );
  }

  ensureMarketplaceEngagementConversation(
    organizationId: string,
    engagementId: string,
    professionalProfileId: string,
  ): Observable<{ readonly conversationId: string }> {
    return this.http.post<{ readonly conversationId: string }>(
      `${this.baseUrl}/organizations/${organizationId}/messages/conversations`,
      { contextType: 5, contextId: engagementId, professionalProfileId },
    );
  }
  getMarketplaceConversationThread(
    organizationId: string,
    conversationId: string,
    take = 100,
  ): Observable<MarketplaceConversationThread> {
    return this.http.get<MarketplaceConversationThread>(
      `${this.baseUrl}/organizations/${organizationId}/messages/conversations/${conversationId}`,
      { params: new HttpParams().set('take', String(take)) },
    );
  }
  sendMarketplaceConversationMessage(
    organizationId: string,
    conversationId: string,
    body: string,
    attachmentDocumentIds: readonly string[] = [],
  ): Observable<{ readonly messageId: string }> {
    return this.http.post<{ readonly messageId: string }>(
      `${this.baseUrl}/organizations/${organizationId}/messages/conversations/${conversationId}`,
      { body, attachmentDocumentIds },
    );
  }
  markMarketplaceConversationRead(
    organizationId: string,
    conversationId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/organizations/${organizationId}/messages/conversations/${conversationId}/read`,
      {},
    );
  }

  getProfessionalReputation(profileId: string): Observable<ProfessionalReputation> {
    return this.http.get<ProfessionalReputation>(`${this.baseUrl}/profiles/${profileId}/reviews`);
  }
  createProfessionalReview(
    organizationId: string,
    engagementId: string,
    request: CreateProfessionalReviewRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/engagements/${engagementId}/reviews`,
      request,
    );
  }
  respondProfessionalReview(
    profileId: string,
    reviewId: string,
    response: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/profiles/${profileId}/reviews/${reviewId}/respond`,
      { response },
    );
  }
  reportProfessionalReview(
    organizationId: string,
    reviewId: string,
    reasonCode: string,
    details: string | null,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/organizations/${organizationId}/reviews/${reviewId}/report`,
      { reasonCode, details },
    );
  }
  getProfessionalReviewModeration(profileId: string): Observable<ProfessionalReviewModeration> {
    return this.http.get<ProfessionalReviewModeration>(
      `${this.baseUrl}/moderation/profiles/${profileId}/reviews`,
    );
  }
  hideProfessionalReview(reviewId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/moderation/reviews/${reviewId}/hide`, { reason });
  }
  restoreProfessionalReview(reviewId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/moderation/reviews/${reviewId}/restore`, {});
  }
  resolveProfessionalReviewReport(reportId: string, resolution: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/moderation/review-reports/${reportId}/resolve`, {
      resolution,
    });
  }
}
