import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../../core/config/api-config';
import {
  OrganizationRepresentative,
  OrganizationRepresentativeListItem,
  OrganizationRepresentativeStatus,
} from '../models/organization-representative.model';
import {
  CreateOrganizationRepresentativeRequest,
  EndOrganizationRepresentativeRequest,
  ReasonedRevisionRequest,
  RevisionRequest,
  UpdateOrganizationRepresentativeAuthorityRequest,
} from '../models/organization-representative.requests';
@Injectable({ providedIn: 'root' })
export class OrganizationRepresentativesApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject<ApiConfig>(API_CONFIG);
  getAll(
    org: string,
    status: OrganizationRepresentativeStatus | null,
  ): Observable<readonly OrganizationRepresentativeListItem[]> {
    let p = new HttpParams();
    if (status !== null) p = p.set('status', String(status));
    return this.http.get<readonly OrganizationRepresentativeListItem[]>(this.base(org), {
      params: p,
    });
  }
  getById(org: string, id: string): Observable<OrganizationRepresentative> {
    return this.http.get<OrganizationRepresentative>(`${this.base(org)}/${id}`);
  }
  create(
    org: string,
    r: CreateOrganizationRepresentativeRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(this.base(org), r);
  }
  updateAuthority(
    org: string,
    id: string,
    r: UpdateOrganizationRepresentativeAuthorityRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.base(org)}/${id}/authority`, r);
  }
  activate(org: string, id: string, r: RevisionRequest): Observable<void> {
    return this.http.post<void>(`${this.base(org)}/${id}/activate`, r);
  }
  suspend(org: string, id: string, r: ReasonedRevisionRequest): Observable<void> {
    return this.http.post<void>(`${this.base(org)}/${id}/suspend`, r);
  }
  reactivate(org: string, id: string, r: ReasonedRevisionRequest): Observable<void> {
    return this.http.post<void>(`${this.base(org)}/${id}/reactivate`, r);
  }
  end(org: string, id: string, r: EndOrganizationRepresentativeRequest): Observable<void> {
    return this.http.post<void>(`${this.base(org)}/${id}/end`, r);
  }
  setPrimaryOwner(org: string, id: string, r: RevisionRequest): Observable<void> {
    return this.http.post<void>(`${this.base(org)}/${id}/set-primary-owner`, r);
  }
  private base(org: string) {
    return `${this.api.baseUrl}/organizations/${org}/representatives`;
  }
}
