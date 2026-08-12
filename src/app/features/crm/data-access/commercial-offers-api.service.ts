import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { CommercialOffer, CreateCommercialOfferVariantRequest, GenerateCommercialOfferRequest, OfferInteractionType, SendCommercialOfferRequest, SendCommercialOfferResponse } from '../models/commercial-offer.model';

@Injectable({ providedIn: 'root' })
export class CommercialOffersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.apiConfig.baseUrl}/crm`;

  generate(leadId: string, request: GenerateCommercialOfferRequest): Observable<{ offerId: string }> {
    return this.http.post<{ offerId: string }>(`${this.baseUrl}/leads/${leadId}/offers`, request);
  }

  getByLead(leadId: string): Observable<CommercialOffer[]> {
    return this.http.get<CommercialOffer[]>(`${this.baseUrl}/leads/${leadId}/offers`);
  }

  getById(offerId: string): Observable<CommercialOffer> {
    return this.http.get<CommercialOffer>(`${this.baseUrl}/offers/${offerId}`);
  }

  createVariant(offerId: string, request: CreateCommercialOfferVariantRequest): Observable<{ offerId: string }> {
    return this.http.post<{ offerId: string }>(`${this.baseUrl}/offers/${offerId}/variants`, request);
  }

  submitForReview(offerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/submit-for-review`, {});
  }

  approve(offerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/approve`, {});
  }

  send(offerId: string, request: SendCommercialOfferRequest): Observable<SendCommercialOfferResponse> {
    return this.http.post<SendCommercialOfferResponse>(`${this.baseUrl}/offers/${offerId}/send`, request);
  }

  recordExchange(offerId: string, type: OfferInteractionType, summary: string, metadataJson: string | null = null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/exchanges`, { type, summary, metadataJson });
  }

  scheduleFollowUp(offerId: string, nextFollowUpAtUtc: string, note: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/follow-up`, { nextFollowUpAtUtc, note });
  }

  withdraw(offerId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/withdraw`, { reason });
  }

  markAccepted(offerId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/mark-accepted`, {});
  }

  markRejected(offerId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/offers/${offerId}/mark-rejected`, { reason });
  }
}
