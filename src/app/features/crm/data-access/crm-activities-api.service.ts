import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import { ActivityFilters, CreateCrmActivityRequest, CrmActivity, CrmActivityPage,
  ImportCrmActivityRequest, ImportCrmActivityResult } from '../models/crm-activity.model';
@Injectable({providedIn:'root'}) export class CrmActivitiesApiService {
  private readonly http=inject(HttpClient); private readonly config=inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl=`${this.config.baseUrl}/crm`;
  getPage(f:ActivityFilters):Observable<CrmActivityPage>{let p=new HttpParams().set('pageNumber',f.pageNumber).set('pageSize',f.pageSize)
    .set('unattachedOnly',f.unattachedOnly).set('importedOnly',f.importedOnly).set('syncErrorsOnly',f.syncErrorsOnly)
    .set('duplicatesOnly',f.duplicatesOnly).set('regularizationOnly',f.regularizationOnly).set('unfollowedOnly',f.unfollowedOnly);
    for(const [k,v] of Object.entries({search:f.search,type:f.type,advisorUserId:f.advisorUserId,leadId:f.leadId,fromUtc:f.fromUtc,toUtc:f.toUtc}))if(v)p=p.set(k,v);
    return this.http.get<CrmActivityPage>(`${this.baseUrl}/activities/page`,{params:p});}
  getRecent(limit=200):Observable<CrmActivity[]>{return this.http.get<CrmActivity[]>(`${this.baseUrl}/activities`,{params:{limit}});}
  getByLead(id:string):Observable<CrmActivity[]>{return this.http.get<CrmActivity[]>(`${this.baseUrl}/leads/${id}/activities`);}
  create(leadId:string|null,r:CreateCrmActivityRequest):Observable<{activityId:string}>{return this.http.post<{activityId:string}>(leadId?`${this.baseUrl}/leads/${leadId}/activities`:`${this.baseUrl}/activities`,r);}
  importActivity(request:ImportCrmActivityRequest):Observable<ImportCrmActivityResult>{return this.http.post<ImportCrmActivityResult>(`${this.baseUrl}/activities/import`,request);}
  attach(id:string,leadId:string):Observable<void>{return this.http.post<void>(`${this.baseUrl}/activities/${id}/attach`,{leadId});}
  invalidate(id:string,reason:string):Observable<void>{return this.http.post<void>(`${this.baseUrl}/activities/${id}/invalidate`,{reason});}
  retrySync(id:string):Observable<void>{return this.http.post<void>(`${this.baseUrl}/activities/${id}/sync/retry`,{});}
  abandonSync(id:string):Observable<void>{return this.http.post<void>(`${this.baseUrl}/activities/${id}/sync/abandon`,{});}
  uploadAttachment(id:string,file:File):Observable<void>{const body=new FormData();body.append('file',file,file.name);return this.http.post<void>(`${this.baseUrl}/activities/${id}/attachment`,body);}
  downloadAttachment(id:string):Observable<Blob>{return this.http.get(`${this.baseUrl}/activities/${id}/attachment`,{responseType:'blob'});}
  deleteAttachment(id:string):Observable<void>{return this.http.delete<void>(`${this.baseUrl}/activities/${id}/attachment`);}
}
