import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  CreateFleetVehicleRequest,
  FleetVehicle,
  UpdateFleetVehicleComplianceRequest,
} from '../models/fleet-vehicle.model';

@Injectable({ providedIn: 'root' })
export class FleetApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.config.baseUrl.replace(/\/$/, '')}/fleet/vehicles`;

  getVehicles(): Observable<readonly FleetVehicle[]> {
    return this.http.get<readonly FleetVehicle[]>(`${this.baseUrl}/`);
  }

  createVehicle(request: CreateFleetVehicleRequest): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(`${this.baseUrl}/`, request);
  }

  updateCompliance(vehicleId: string, request: UpdateFleetVehicleComplianceRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${vehicleId}/compliance`, request);
  }

  recordOdometer(vehicleId: string, odometerKilometers: number, recordedAtUtc: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${vehicleId}/odometer`, {
      odometerKilometers,
      recordedAtUtc,
    });
  }
}
