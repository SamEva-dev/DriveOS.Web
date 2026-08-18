import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { StudentFinancialOverview } from '../models/student-financial-overview.models';

@Injectable({ providedIn: 'root' })
export class FundingBillingApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl}/finance/students`;

  getStudentFinancialOverview(studentId: string): Observable<StudentFinancialOverview> {
    return this.http.get<StudentFinancialOverview>(`${this.baseUrl}/${studentId}/overview`);
  }
}
