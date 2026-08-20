import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { AuthorizationService } from '../../../core/auth/authorization.service';
import { SCHEDULING_PERMISSIONS } from '../domain/scheduling-permissions';
import { CapacityForecast, SchedulingDashboardData } from '../models/scheduling.models';
import { SchedulingApiService } from './scheduling-api.service';

interface Slice<T> {
  readonly data: T;
  readonly error: HttpErrorResponse | null;
}

@Injectable({ providedIn: 'root' })
export class SchedulingDashboardService {
  private readonly api = inject(SchedulingApiService);
  private readonly authorization = inject(AuthorizationService);

  load() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const safe = <T>(source: Observable<T>, fallback: T): Observable<Slice<T>> =>
      source.pipe(
        map((data): Slice<T> => ({ data, error: null })),
        catchError((error: HttpErrorResponse) => of<Slice<T>>({ data: fallback, error })),
      );
    const skipped = <T>(fallback: T): Observable<Slice<T>> => of({ data: fallback, error: null });

    return forkJoin({
      bookings: this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.read)
        ? safe(this.api.getBookings(start.toISOString(), end.toISOString()), [])
        : skipped([]),
      conflicts: this.authorization.hasPermission(SCHEDULING_PERMISSIONS.conflicts.read)
        ? safe(this.api.getConflicts(), [])
        : skipped([]),
      waitingList: this.authorization.hasPermission(SCHEDULING_PERMISSIONS.waitingList.read)
        ? safe(this.api.getWaitingList(), [])
        : skipped([]),
      resources: this.authorization.hasPermission(SCHEDULING_PERMISSIONS.resources.read)
        ? safe(this.api.getResources(), [])
        : skipped([]),
      capacity: this.authorization.hasPermission(SCHEDULING_PERMISSIONS.capacity.read)
        ? safe<CapacityForecast | null>(this.api.getCapacityForecast(1), null)
        : skipped<CapacityForecast | null>(null),
    }).pipe(
      map((result): { data: SchedulingDashboardData; errors: readonly HttpErrorResponse[] } => {
        const failedSlices = Object.entries(result)
          .filter(([, value]) => value.error)
          .map(([key]) => key);
        const errors = Object.values(result)
          .map((value) => value.error)
          .filter((error): error is HttpErrorResponse => error !== null);

        return {
          data: {
            bookings: result.bookings.data,
            conflicts: result.conflicts.data,
            waitingList: result.waitingList.data,
            resources: result.resources.data,
            capacity: result.capacity.data,
            failedSlices,
          },
          errors,
        };
      }),
    );
  }
}
