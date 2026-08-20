import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { API_CONFIG, ApiConfig } from '../../../core/config/api-config';
import {
  AddAvailabilityExceptionRequest,
  AddAvailabilityExceptionResult,
  AddAvailabilityRuleRequest,
  AvailabilityPlan,
  Booking,
  CalendarResource,
  BookingConflictCheck,
  BookingRescheduleImpact,
  BookingRescheduleRequest,
  BookingCancellationPreview,
  BookingCancellation,
  BookingAttendance,
  BookingAttendanceRequest,
  OverrideBookingAttendanceRequest,
  PreviewBookingCancellationRequest,
  CancelBookingRequest,
  OverrideCancelBookingRequest,
  CapacityForecast,
  CapacityScenarioRequest,
  CapacityScenarioResponse,
  CreateAvailabilityPlanRequest,
  CreateBookingRequest,
  CreateRecurrenceSeriesRequest,
  ChangeFutureRecurrenceRuleRequest,
  CreatedBookingResponse,
  SchedulingConflict,
  SchedulingConflictScan,
  ResolveSchedulingConflictRequest,
  OverrideSchedulingConflictRequest,
  RecurrencePreview,
  RecurrenceSeries,
  SlotSearchRequest,
  SlotSearchResponse,
  UpdateAvailabilityPreferencesRequest,
  CreateWaitingListEntryRequest,
  UpdateWaitingListPreferencesRequest,
  WaitingListEntry,
  WaitingListMatchCandidate,
  InstructorReplacementSuggestion,
  InstructorReplacementSuggestionRequest,
  InstructorReplacementRequest,
  InstructorReplacementPreview,
  InstructorReplacementApplyResult,
  VehicleReplacementSuggestion,
  VehicleReplacementSuggestionRequest,
  VehicleReplacementRequest,
  VehicleReplacementPreview,
  VehicleReplacementApplyResult,
  EvaluateTravelRequest,
  TravelEvaluationResponse,
} from '../models/scheduling.models';

@Injectable({ providedIn: 'root' })
export class SchedulingApiService {
  private readonly http = inject(HttpClient);
  private readonly api = inject<ApiConfig>(API_CONFIG);
  private readonly baseUrl = `${this.api.baseUrl.replace(/\/$/, '')}/scheduling`;

  getBookings(fromUtc: string, toUtc: string): Observable<readonly Booking[]> {
    const params = new HttpParams().set('fromUtc', fromUtc).set('toUtc', toUtc);
    return this.http.get<readonly Booking[]>(`${this.baseUrl}/bookings`, { params });
  }

  getCalendarData(
    fromUtc: string,
    toUtc: string,
  ): Observable<{
    bookings: readonly Booking[];
    resources: readonly CalendarResource[];
    errors: readonly HttpErrorResponse[];
  }> {
    const errors: HttpErrorResponse[] = [];
    return forkJoin({
      bookings: this.getBookings(fromUtc, toUtc).pipe(
        catchError((error: HttpErrorResponse) => {
          errors.push(error);
          return of([] as readonly Booking[]);
        }),
      ),
      resources: this.getResources().pipe(
        catchError((error: HttpErrorResponse) => {
          errors.push(error);
          return of([] as readonly CalendarResource[]);
        }),
      ),
    }).pipe(map((value) => ({ ...value, errors })));
  }

  createBooking(
    request: CreateBookingRequest,
    idempotencyKey: string,
  ): Observable<CreatedBookingResponse> {
    return this.http.post<CreatedBookingResponse>(`${this.baseUrl}/bookings`, request, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  holdBookingSlot(bookingId: string, durationMinutes = 5): Observable<BookingConflictCheck> {
    return this.http.post<BookingConflictCheck>(`${this.baseUrl}/bookings/${bookingId}/hold`, {
      durationMinutes,
    });
  }

  checkBookingConflicts(bookingId: string): Observable<BookingConflictCheck> {
    return this.http.post<BookingConflictCheck>(
      `${this.baseUrl}/bookings/${bookingId}/conflicts`,
      {},
    );
  }

  reserveBooking(bookingId: string): Observable<BookingConflictCheck> {
    return this.http.post<BookingConflictCheck>(
      `${this.baseUrl}/bookings/${bookingId}/reserve`,
      {},
    );
  }

  confirmBooking(bookingId: string): Observable<BookingConflictCheck> {
    return this.http.post<BookingConflictCheck>(
      `${this.baseUrl}/bookings/${bookingId}/confirm`,
      {},
    );
  }

  searchSlots(request: SlotSearchRequest): Observable<SlotSearchResponse> {
    return this.http.post<SlotSearchResponse>(`${this.baseUrl}/slot-search`, request);
  }

  getRecurrences(): Observable<readonly RecurrenceSeries[]> {
    return this.http.get<readonly RecurrenceSeries[]>(`${this.baseUrl}/recurrences`);
  }

  getRecurrence(seriesId: string): Observable<RecurrenceSeries> {
    return this.http.get<RecurrenceSeries>(`${this.baseUrl}/recurrences/${seriesId}`);
  }

  previewRecurrence(seriesId: string): Observable<RecurrencePreview> {
    return this.http.get<RecurrencePreview>(`${this.baseUrl}/recurrences/${seriesId}/preview`);
  }

  createRecurrence(request: CreateRecurrenceSeriesRequest): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(`${this.baseUrl}/recurrences`, request);
  }

  generateRecurrence(seriesId: string): Observable<{ readonly generated: number }> {
    return this.http.post<{ readonly generated: number }>(
      `${this.baseUrl}/recurrences/${seriesId}/generate`,
      {},
    );
  }

  cancelRecurrenceOccurrence(
    seriesId: string,
    occurrenceId: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/recurrences/${seriesId}/occurrences/${occurrenceId}/cancel`,
      { reason },
    );
  }

  rescheduleRecurrenceOccurrence(
    seriesId: string,
    occurrenceId: string,
    startAtUtc: string,
    endAtUtc: string,
    reason: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/recurrences/${seriesId}/occurrences/${occurrenceId}/reschedule`,
      { startAtUtc, endAtUtc, reason },
    );
  }

  changeFutureRecurrenceRule(
    seriesId: string,
    request: ChangeFutureRecurrenceRuleRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/recurrences/${seriesId}/future-rule`, request);
  }

  cancelRecurrenceSeries(seriesId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recurrences/${seriesId}/cancel`, { reason });
  }

  getConflicts(
    status?: number | null,
    priority?: number | null,
    bookingId?: string | null,
  ): Observable<readonly SchedulingConflict[]> {
    let params = new HttpParams();
    if (status != null) params = params.set('status', status);
    if (priority != null) params = params.set('priority', priority);
    if (bookingId) params = params.set('bookingId', bookingId);
    return this.http.get<readonly SchedulingConflict[]>(`${this.baseUrl}/conflicts`, { params });
  }

  getConflict(conflictId: string): Observable<SchedulingConflict> {
    return this.http.get<SchedulingConflict>(`${this.baseUrl}/conflicts/${conflictId}`);
  }

  refreshConflicts(bookingId: string): Observable<SchedulingConflictScan> {
    return this.http.post<SchedulingConflictScan>(
      `${this.baseUrl}/conflicts/scan/${bookingId}`,
      {},
    );
  }

  resolveConflict(conflictId: string, request: ResolveSchedulingConflictRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/conflicts/${conflictId}/resolve`, request);
  }

  overrideConflict(
    conflictId: string,
    request: OverrideSchedulingConflictRequest,
  ): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/conflicts/${conflictId}/override`, request);
  }

  getBooking(bookingId: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.baseUrl}/bookings/${bookingId}`);
  }

  previewBookingReschedule(
    bookingId: string,
    request: BookingRescheduleRequest,
  ): Observable<BookingRescheduleImpact> {
    return this.http.post<BookingRescheduleImpact>(
      `${this.baseUrl}/bookings/${bookingId}/reschedule/preview`,
      request,
    );
  }

  rescheduleBooking(
    bookingId: string,
    request: BookingRescheduleRequest,
  ): Observable<BookingRescheduleImpact> {
    return this.http.post<BookingRescheduleImpact>(
      `${this.baseUrl}/bookings/${bookingId}/reschedule`,
      request,
    );
  }

  previewBookingCancellation(
    bookingId: string,
    request: PreviewBookingCancellationRequest,
  ): Observable<BookingCancellationPreview> {
    return this.http.post<BookingCancellationPreview>(
      `${this.baseUrl}/bookings/${bookingId}/cancel/preview`,
      request,
    );
  }

  cancelBooking(bookingId: string, request: CancelBookingRequest): Observable<BookingCancellation> {
    return this.http.post<BookingCancellation>(
      `${this.baseUrl}/bookings/${bookingId}/cancel`,
      request,
    );
  }

  overrideCancelBooking(
    bookingId: string,
    request: OverrideCancelBookingRequest,
  ): Observable<BookingCancellation> {
    return this.http.post<BookingCancellation>(
      `${this.baseUrl}/bookings/${bookingId}/cancel/override`,
      request,
    );
  }

  recordBookingAttendance(
    bookingId: string,
    request: BookingAttendanceRequest,
  ): Observable<BookingAttendance> {
    return this.http.post<BookingAttendance>(
      `${this.baseUrl}/bookings/${bookingId}/attendance`,
      request,
    );
  }

  correctBookingAttendance(
    bookingId: string,
    request: BookingAttendanceRequest,
  ): Observable<BookingAttendance> {
    return this.http.post<BookingAttendance>(
      `${this.baseUrl}/bookings/${bookingId}/attendance/correct`,
      request,
    );
  }

  overrideBookingAttendance(
    bookingId: string,
    request: OverrideBookingAttendanceRequest,
  ): Observable<BookingAttendance> {
    return this.http.post<BookingAttendance>(
      `${this.baseUrl}/bookings/${bookingId}/attendance/override`,
      request,
    );
  }

  getWaitingList(
    status?: number | null,
    studentId?: string | null,
  ): Observable<readonly WaitingListEntry[]> {
    let params = new HttpParams();
    if (status != null) params = params.set('status', status);
    if (studentId) params = params.set('studentId', studentId);
    return this.http.get<readonly WaitingListEntry[]>(`${this.baseUrl}/waiting-list`, { params });
  }

  getWaitingListEntry(entryId: string): Observable<WaitingListEntry> {
    return this.http.get<WaitingListEntry>(`${this.baseUrl}/waiting-list/${entryId}`);
  }

  createWaitingListEntry(
    request: CreateWaitingListEntryRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(`${this.baseUrl}/waiting-list`, request);
  }

  updateWaitingListPreferences(
    entryId: string,
    request: UpdateWaitingListPreferencesRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/waiting-list/${entryId}/preferences`, request);
  }

  matchWaitingList(request: {
    readonly startAtUtc: string;
    readonly endAtUtc: string;
    readonly branchId: string | null;
    readonly instructorId: string | null;
    readonly maxResults?: number;
  }): Observable<readonly WaitingListMatchCandidate[]> {
    return this.http.post<readonly WaitingListMatchCandidate[]>(
      `${this.baseUrl}/waiting-list/match`,
      request,
    );
  }

  proposeWaitingListSlot(
    entryId: string,
    request: {
      readonly startAtUtc: string;
      readonly endAtUtc: string;
      readonly branchId: string | null;
      readonly instructorId: string | null;
      readonly expiresAtUtc: string;
    },
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/waiting-list/${entryId}/proposals`,
      request,
    );
  }

  holdWaitingListProposal(
    entryId: string,
    proposalId: string,
    request: { readonly heldUntilUtc: string },
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/waiting-list/${entryId}/proposals/${proposalId}/hold`,
      request,
    );
  }

  acceptWaitingListProposal(entryId: string, proposalId: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/waiting-list/${entryId}/proposals/${proposalId}/accept`,
      {},
    );
  }

  fulfillWaitingListEntry(
    entryId: string,
    proposalId: string,
    bookingId: string,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/waiting-list/${entryId}/proposals/${proposalId}/fulfill`,
      { bookingId },
    );
  }

  declineWaitingListProposal(
    entryId: string,
    proposalId: string,
    reason: string | null,
  ): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/waiting-list/${entryId}/proposals/${proposalId}/decline`,
      { reason },
    );
  }

  cancelWaitingListEntry(entryId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/waiting-list/${entryId}/cancel`, { reason });
  }

  suggestInstructorReplacements(
    request: InstructorReplacementSuggestionRequest,
  ): Observable<readonly InstructorReplacementSuggestion[]> {
    return this.http.post<readonly InstructorReplacementSuggestion[]>(
      `${this.baseUrl}/replacements/instructor/suggestions`,
      request,
    );
  }

  previewInstructorReplacement(
    request: InstructorReplacementRequest,
  ): Observable<InstructorReplacementPreview> {
    return this.http.post<InstructorReplacementPreview>(
      `${this.baseUrl}/replacements/instructor/preview`,
      request,
    );
  }

  applyInstructorReplacement(
    request: InstructorReplacementRequest,
  ): Observable<InstructorReplacementApplyResult> {
    return this.http.post<InstructorReplacementApplyResult>(
      `${this.baseUrl}/replacements/instructor/apply`,
      request,
    );
  }

  suggestVehicleReplacements(
    request: VehicleReplacementSuggestionRequest,
  ): Observable<readonly VehicleReplacementSuggestion[]> {
    return this.http.post<readonly VehicleReplacementSuggestion[]>(
      `${this.baseUrl}/replacements/vehicle/suggestions`,
      request,
    );
  }

  previewVehicleReplacement(
    request: VehicleReplacementRequest,
  ): Observable<VehicleReplacementPreview> {
    return this.http.post<VehicleReplacementPreview>(
      `${this.baseUrl}/replacements/vehicle/preview`,
      request,
    );
  }

  applyVehicleReplacement(
    request: VehicleReplacementRequest,
  ): Observable<VehicleReplacementApplyResult> {
    return this.http.post<VehicleReplacementApplyResult>(
      `${this.baseUrl}/replacements/vehicle/apply`,
      request,
    );
  }

  evaluateTravel(request: EvaluateTravelRequest): Observable<TravelEvaluationResponse> {
    return this.http.post<TravelEvaluationResponse>(`${this.baseUrl}/travel/evaluate`, request);
  }

  getResources(): Observable<readonly CalendarResource[]> {
    return this.http.get<readonly CalendarResource[]>(`${this.baseUrl}/resources`);
  }

  getAvailabilityPlans(resourceId: string): Observable<readonly AvailabilityPlan[]> {
    return this.http.get<readonly AvailabilityPlan[]>(
      `${this.baseUrl}/resources/${resourceId}/availability-plans`,
    );
  }

  createAvailabilityPlan(
    resourceId: string,
    request: CreateAvailabilityPlanRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/resources/${resourceId}/availability-plans`,
      request,
    );
  }

  addAvailabilityRule(
    planId: string,
    request: AddAvailabilityRuleRequest,
  ): Observable<{ readonly id: string }> {
    return this.http.post<{ readonly id: string }>(
      `${this.baseUrl}/availability-plans/${planId}/rules`,
      request,
    );
  }

  removeAvailabilityRule(planId: string, ruleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/availability-plans/${planId}/rules/${ruleId}`);
  }

  addAvailabilityException(
    planId: string,
    request: AddAvailabilityExceptionRequest,
  ): Observable<AddAvailabilityExceptionResult> {
    return this.http.post<AddAvailabilityExceptionResult>(
      `${this.baseUrl}/availability-plans/${planId}/exceptions`,
      request,
    );
  }

  removeAvailabilityException(planId: string, exceptionId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/availability-plans/${planId}/exceptions/${exceptionId}`,
    );
  }

  updateAvailabilityPreferences(
    planId: string,
    request: UpdateAvailabilityPreferencesRequest,
  ): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/availability-plans/${planId}/preferences`, request);
  }

  activateAvailabilityPlan(planId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/availability-plans/${planId}/activate`, {});
  }

  archiveAvailabilityPlan(planId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/availability-plans/${planId}/archive`, {});
  }

  getCapacityForecast(
    horizon = 1,
    branchId?: string | null,
    useForecastPermission = false,
  ): Observable<CapacityForecast> {
    let params = new HttpParams().set('horizon', horizon);
    if (branchId) params = params.set('branchId', branchId);
    const path = useForecastPermission ? 'capacity/forecast' : 'capacity';
    return this.http.get<CapacityForecast>(`${this.baseUrl}/${path}`, { params });
  }

  simulateCapacityScenario(request: CapacityScenarioRequest): Observable<CapacityScenarioResponse> {
    return this.http.post<CapacityScenarioResponse>(`${this.baseUrl}/capacity/scenarios`, request);
  }
}
