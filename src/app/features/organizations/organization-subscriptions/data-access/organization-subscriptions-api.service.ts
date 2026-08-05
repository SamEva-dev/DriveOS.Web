import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import { OrganizationSubscription } from '../models/organization-subscription.model';
import {
  CancelOrganizationSubscriptionRequest,
  ChangeOrganizationSubscriptionPlanRequest,
  ChangeOrganizationSubscriptionStatusRequest,
  CreateOrganizationSubscriptionRequest,
} from '../models/organization-subscription.requests';

export type OrganizationSubscriptionStatusAction =
  'activate' | 'mark-past-due' | 'restrict' | 'suspend' | 'expire';

@Injectable({ providedIn: 'root' })
export class OrganizationSubscriptionsApiService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

  get(organizationId: string): Observable<OrganizationSubscription> {
    return this.http.get<OrganizationSubscription>(this.url(organizationId));
  }

  create(
    organizationId: string,
    request: CreateOrganizationSubscriptionRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.url(organizationId), request);
  }

  changePlan(
    organizationId: string,
    request: ChangeOrganizationSubscriptionPlanRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.url(organizationId)}/change-plan`, request);
  }

  changeStatus(
    organizationId: string,
    action: OrganizationSubscriptionStatusAction,
    request: ChangeOrganizationSubscriptionStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.url(organizationId)}/${action}`, request);
  }

  cancel(organizationId: string, request: CancelOrganizationSubscriptionRequest): Observable<void> {
    return this.http.post<void>(`${this.url(organizationId)}/cancel`, request);
  }

  checkEntitlement(
    organizationId: string,
    code: string,
  ): Observable<{ entitlementCode: string; isGranted: boolean }> {
    return this.http.get<{ entitlementCode: string; isGranted: boolean }>(
      `${this.url(organizationId)}/entitlements/${encodeURIComponent(code)}`,
    );
  }

  checkLimit(
    organizationId: string,
    code: string,
    currentUsage: number,
    requestedIncrease: number,
  ): Observable<unknown> {
    const params = new HttpParams()
      .set('currentUsage', currentUsage)
      .set('requestedIncrease', requestedIncrease);
    return this.http.get(`${this.url(organizationId)}/limits/${encodeURIComponent(code)}`, {
      params,
    });
  }

  private url(organizationId: string): string {
    return `${this.apiConfig.baseUrl}/organizations/${organizationId}/subscription`;
  }
}
