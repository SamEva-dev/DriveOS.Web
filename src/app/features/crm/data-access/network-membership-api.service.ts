import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  AddNetworkMemberRequest,
  NetworkMember,
  NetworkMemberCandidate,
} from '../models/network-membership.model';

@Injectable({ providedIn: 'root' })
export class NetworkMembershipApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly endpoint = `${this.config.baseUrl}/networks/current/members`;

  getMembers(): Observable<readonly NetworkMember[]> {
    return this.http.get<readonly NetworkMember[]>(this.endpoint);
  }

  getCandidates(): Observable<readonly NetworkMemberCandidate[]> {
    return this.http.get<readonly NetworkMemberCandidate[]>(`${this.endpoint}/candidates`);
  }

  addMember(memberOrganizationId: string): Observable<NetworkMember> {
    const request: AddNetworkMemberRequest = { memberOrganizationId };
    return this.http.post<NetworkMember>(this.endpoint, request);
  }

  removeMember(memberOrganizationId: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${memberOrganizationId}`);
  }
}
