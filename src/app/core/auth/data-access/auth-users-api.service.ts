import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthApiConfig, AUTH_API_CONFIG } from '../auth-api-config';
import { AuthUser } from '../models/auth-user.model';
import { AuthUsersPage } from '../models/auth-users-page';
import { GetAuthUsersParameters } from '../models/get-auth-users-parameters';

@Injectable({
  providedIn: 'root',
})
export class AuthUsersApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<AuthApiConfig>(AUTH_API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/api`;

  getUsers(parameters: GetAuthUsersParameters): Observable<AuthUsersPage> {
    let params = new HttpParams()
      .set('page', parameters.page)
      .set('pageSize', parameters.pageSize)
      .set('organizationId', parameters.organizationId)
      .set('clientId', this.config.clientId);

    const search = parameters.search.trim();

    if (search) {
      params = params.set('search', search);
    }

    if (parameters.isActive !== null) {
      params = params.set('isActive', parameters.isActive);
    }

    if (parameters.role) {
      params = params.set('role', parameters.role);
    }

    return this.http.get<AuthUsersPage>(`${this.baseUrl}/users`, {
      params,
    });
  }

  getById(userId: string): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/users/${userId}`);
  }
}
