import {
  HttpClient,
} from '@angular/common/http';

import {
  Injectable,
  inject,
} from '@angular/core';

import {
  Observable,
} from 'rxjs';

import {
  API_CONFIG,
  ApiConfig,
} from '../../../core/config/api-config';

import {
  ChangeOrganizationStatusRequest,
} from '../models/change-organization-status-request';

import {
  CreateOrganizationRequest,
} from '../models/create-organization-request';

import {
  CreateOrganizationResponse,
} from '../models/create-organization-response';

import {
  OrganizationStatusActionCode,
} from '../models/organization-status-action';

import {
  OrganizationStatusHistoryItem,
} from '../models/organization-status-history-item';

import {
  Organization,
} from '../models/organization.model';

@Injectable({
  providedIn: 'root',
})
export class OrganizationsApiService {
  private readonly http =
    inject(HttpClient);

  private readonly apiConfig =
    inject<ApiConfig>(API_CONFIG);

  private readonly baseUrl =
    `${this.apiConfig.baseUrl}/organizations`;

  create(
    request: CreateOrganizationRequest,
  ): Observable<CreateOrganizationResponse> {
    return this.http
      .post<CreateOrganizationResponse>(
        this.baseUrl,
        request,
      );
  }

  getById(
    organizationId: string,
  ): Observable<Organization> {
    return this.http.get<Organization>(
      `${this.baseUrl}/${organizationId}`,
    );
  }

  getStatusHistory(
    organizationId: string,
  ): Observable<
    readonly OrganizationStatusHistoryItem[]
  > {
    return this.http.get<
      readonly OrganizationStatusHistoryItem[]
    >(
      `${this.baseUrl}/${organizationId}/status-history`,
    );
  }

  changeStatus(
    organizationId: string,
    action: OrganizationStatusActionCode,
    request: ChangeOrganizationStatusRequest,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/${organizationId}/${this.resolveActionPath(action)}`,
      request,
    );
  }

  private resolveActionPath(
    action: OrganizationStatusActionCode,
  ): string {
    switch (action) {
      case 'submitForActivation':
        return 'submit-for-activation';

      case 'activate':
        return 'activate';

      case 'restrict':
        return 'restrict';

      case 'suspend':
        return 'suspend';

      case 'reactivate':
        return 'reactivate';

      case 'close':
        return 'close';
    }
  }
}
