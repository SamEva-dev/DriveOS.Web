import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClosureReadiness, OrganizationClosure } from '../models/organization-closure.model';

@Injectable({ providedIn: 'root' })
export class OrganizationClosureApiService {
  private readonly http = inject(HttpClient);
  list(organizationId: string): Observable<readonly OrganizationClosure[]> {
    return this.http.get<readonly OrganizationClosure[]>(
      `/api/organizations/${organizationId}/closures`,
    );
  }
  readiness(closureId: string): Observable<ClosureReadiness> {
    return this.http.get<ClosureReadiness>(`/api/organization-closures/${closureId}/readiness`);
  }
  create(organizationId: string, body: unknown): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`/api/organizations/${organizationId}/closures`, body);
  }
  action(closureId: string, action: string, body: unknown = {}): Observable<void> {
    return this.http.post<void>(`/api/organization-closures/${closureId}/${action}`, body);
  }
}
