import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from '../config/api-config';
import {
  CommunicationNotification,
  NotificationPreference,
} from './communication-notification.model';

@Injectable({ providedIn: 'root' })
export class CommunicationNotificationService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/communication/notifications`;

  list(take = 100, unreadOnly = false): Observable<readonly CommunicationNotification[]> {
    const params = new HttpParams().set('take', take).set('unreadOnly', unreadOnly);
    return this.http.get<readonly CommunicationNotification[]>(this.baseUrl, { params });
  }
  unreadCount(): Observable<{ readonly count: number }> {
    return this.http.get<{ readonly count: number }>(`${this.baseUrl}/unread-count`);
  }
  markRead(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/read`, {});
  }
  dismiss(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${id}/dismiss`, {});
  }
  getPreferences(): Observable<readonly NotificationPreference[]> {
    return this.http.get<readonly NotificationPreference[]>(`${this.baseUrl}/preferences`);
  }
  updatePreference(
    category: string,
    inAppEnabled: boolean,
    emailEnabled: boolean,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/preferences/${encodeURIComponent(category)}`, {
      inAppEnabled,
      emailEnabled,
    });
  }
}
