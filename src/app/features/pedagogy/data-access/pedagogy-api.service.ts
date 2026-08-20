import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  CurriculumDetail,
  CurriculumListItem,
  CreateCurriculumRequest,
  CreateLicenseCategoryRequest,
  LicenseCategoryListItem,
} from '../models/curriculum.models';
import { StudentPedagogyOverview } from '../models/student-pedagogy-overview.models';
@Injectable({ providedIn: 'root' })
export class PedagogyApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly base = `${this.config.baseUrl}/pedagogy`;
  listLicenseCategories(): Observable<LicenseCategoryListItem[]> {
    return this.http.get<LicenseCategoryListItem[]>(`${this.base}/license-categories`);
  }
  createLicenseCategory(r: CreateLicenseCategoryRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.base}/license-categories`, r);
  }
  activateLicenseCategory(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/license-categories/${id}/activate`, {});
  }
  listCurricula(): Observable<CurriculumListItem[]> {
    return this.http.get<CurriculumListItem[]>(`${this.base}/curricula`);
  }
  getCurriculum(id: string): Observable<CurriculumDetail> {
    return this.http.get<CurriculumDetail>(`${this.base}/curricula/${id}`);
  }
  createCurriculum(r: CreateCurriculumRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.base}/curricula`, r);
  }
  createVersion(
    id: string,
    r: { effectiveFrom: string; effectiveTo?: string | null; changeSummary?: string | null },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.base}/curricula/${id}/versions`, r);
  }
  addModule(
    id: string,
    versionId: string,
    r: { code: string; name: string; description?: string | null; order: number },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.base}/curricula/${id}/versions/${versionId}/modules`,
      r,
    );
  }
  addCompetency(
    id: string,
    versionId: string,
    moduleId: string,
    r: {
      code: string;
      name: string;
      description?: string | null;
      learningObjective: string;
      order: number;
      isRequired: boolean;
    },
  ): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(
      `${this.base}/curricula/${id}/versions/${versionId}/modules/${moduleId}/competencies`,
      r,
    );
  }
  publishVersion(id: string, versionId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/curricula/${id}/versions/${versionId}/publish`, {});
  }
  getStudentPedagogyOverview(
    studentId: string,
    trainingPathId?: string | null,
  ): Observable<StudentPedagogyOverview> {
    const params = trainingPathId ? { trainingPathId } : undefined;
    return this.http.get<StudentPedagogyOverview>(`${this.base}/students/${studentId}/overview`, {
      params,
    });
  }
}
