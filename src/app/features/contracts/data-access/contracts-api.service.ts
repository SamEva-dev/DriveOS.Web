import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { ActivateTrainingContractResponse, ApplyContractAmendmentResponse, CompleteTrainingContractRequest, CompleteTrainingContractResponse, ExpireTrainingContractResponse, CreateContractAmendmentRequest, GeneratedTrainingContract, RecordTrainingContractSignatureRequest, RecordTrainingContractSignatureResponse, SaveTrainingContractSignatoryRequest, SendTrainingContractForSignatureResponse, SuspendTrainingContractRequest, SuspendTrainingContractResponse, TerminateTrainingContractRequest, TerminateTrainingContractResponse, TrainingContractDetail, TrainingContractListItem, ContractDocument, PagedResult, SearchTrainingContractsParameters, TrainingContractHistory } from '../models/training-contract.models';

@Injectable({ providedIn: 'root' })
export class ContractsApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/contracts/training`;

  getTrainingContracts(studentId?: string): Observable<readonly TrainingContractListItem[]> {
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;
    return this.http.get<readonly TrainingContractListItem[]>(this.baseUrl, { params });
  }

  getTrainingContract(contractId: string): Observable<TrainingContractDetail> {
    return this.http.get<TrainingContractDetail>(`${this.baseUrl}/${contractId}`);
  }

  searchTrainingContracts(parameters: SearchTrainingContractsParameters = {}): Observable<PagedResult<TrainingContractListItem>> {
    let params = new HttpParams()
      .set('pageNumber', parameters.pageNumber ?? 1)
      .set('pageSize', parameters.pageSize ?? 20)
      .set('sortBy', parameters.sortBy ?? 'CreatedAt')
      .set('sortDirection', parameters.sortDirection ?? 'Descending');

    const optional: Record<string, string | null | undefined> = {
      search: parameters.search,
      studentId: parameters.studentId,
      branchId: parameters.branchId,
      status: parameters.status,
      startsFrom: parameters.startsFrom,
      startsTo: parameters.startsTo,
      endsFrom: parameters.endsFrom,
      endsTo: parameters.endsTo,
    };
    for (const [key, value] of Object.entries(optional)) {
      if (value) params = params.set(key, value);
    }

    return this.http.get<PagedResult<TrainingContractListItem>>(`${this.baseUrl}/search`, { params });
  }

  getTrainingContractHistory(contractId: string): Observable<TrainingContractHistory> {
    return this.http.get<TrainingContractHistory>(`${this.baseUrl}/${contractId}/history`);
  }

  addSignatory(contractId: string, request: SaveTrainingContractSignatoryRequest): Observable<string> {
    return this.http.post<string>(`${this.baseUrl}/${contractId}/signatories`, request);
  }

  updateSignatory(contractId: string, signatoryId: string, request: Omit<SaveTrainingContractSignatoryRequest, 'kind' | 'personId' | 'representedOrganizationId'>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${contractId}/signatories/${signatoryId}`, request);
  }

  removeSignatory(contractId: string, signatoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${contractId}/signatories/${signatoryId}`);
  }

  decideSignatoryAuthority(contractId: string, signatoryId: string, approved: boolean, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${contractId}/signatories/${signatoryId}/authority`, { approved, reason: reason || null });
  }

  generateTrainingContract(contractId: string): Observable<GeneratedTrainingContract> {
    return this.http.post<GeneratedTrainingContract>(`${this.baseUrl}/${contractId}/generate`, {});
  }

  recordSignature(contractId: string, signatureProcessId: string, request: RecordTrainingContractSignatureRequest): Observable<RecordTrainingContractSignatureResponse> {
    return this.http.post<RecordTrainingContractSignatureResponse>(
      `${this.baseUrl}/${contractId}/signature-processes/${signatureProcessId}/signatures`,
      request,
    );
  }

  activateTrainingContract(contractId: string): Observable<ActivateTrainingContractResponse> {
    return this.http.post<ActivateTrainingContractResponse>(`${this.baseUrl}/${contractId}/activate`, {});
  }

  suspendTrainingContract(contractId: string, request: SuspendTrainingContractRequest): Observable<SuspendTrainingContractResponse> {
    return this.http.post<SuspendTrainingContractResponse>(`${this.baseUrl}/${contractId}/suspend`, request);
  }

  terminateTrainingContract(contractId: string, request: TerminateTrainingContractRequest): Observable<TerminateTrainingContractResponse> {
    return this.http.post<TerminateTrainingContractResponse>(`${this.baseUrl}/${contractId}/terminate`, request);
  }

  completeTrainingContract(contractId: string, request: CompleteTrainingContractRequest): Observable<CompleteTrainingContractResponse> {
    return this.http.post<CompleteTrainingContractResponse>(`${this.baseUrl}/${contractId}/complete`, request);
  }

  expireTrainingContract(contractId: string): Observable<ExpireTrainingContractResponse> {
    return this.http.post<ExpireTrainingContractResponse>(`${this.baseUrl}/${contractId}/expire`, {});
  }

  createAmendment(contractId: string, request: CreateContractAmendmentRequest): Observable<{ amendmentId: string; amendmentNumber: number; status: string }> {
    return this.http.post<{ amendmentId: string; amendmentNumber: number; status: string }>(`${this.baseUrl}/${contractId}/amendments`, request);
  }

  recordAmendmentSignedProof(contractId: string, amendmentId: string, request: { signedDocumentReference: string; documentSha256: string; signedAtUtc: string }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${contractId}/amendments/${amendmentId}/signed-proof`, request);
  }

  applyAmendment(contractId: string, amendmentId: string): Observable<ApplyContractAmendmentResponse> {
    return this.http.post<ApplyContractAmendmentResponse>(`${this.baseUrl}/${contractId}/amendments/${amendmentId}/apply`, {});
  }

  cancelAmendment(contractId: string, amendmentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${contractId}/amendments/${amendmentId}/cancel`, { reason });
  }

  getContractDocuments(contractId: string): Observable<readonly ContractDocument[]> {
    return this.http.get<readonly ContractDocument[]>(`${this.baseUrl}/${contractId}/documents`);
  }

  uploadContractDocument(contractId: string, formData: FormData): Observable<ContractDocument> {
    return this.http.post<ContractDocument>(`${this.baseUrl}/${contractId}/documents`, formData);
  }

  addContractDocumentVersion(contractId: string, documentId: string, file: File): Observable<ContractDocument> {
    const formData = new FormData(); formData.append('file', file);
    return this.http.post<ContractDocument>(`${this.baseUrl}/${contractId}/documents/${documentId}/versions`, formData);
  }

  archiveContractDocument(contractId: string, documentId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${contractId}/documents/${documentId}/archive`, {});
  }

  sendForSignature(contractId: string): Observable<SendTrainingContractForSignatureResponse> {
    return this.http.post<SendTrainingContractForSignatureResponse>(`${this.baseUrl}/${contractId}/send-for-signature`, {});
  }
}
