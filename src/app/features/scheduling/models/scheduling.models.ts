export interface CalendarResource {
  readonly id: string;
  readonly branchId: string | null;
  readonly resourceType: string | number;
  readonly externalResourceId: string;
  readonly displayName: string;
  readonly capacity: number;
  readonly timeZoneId: string;
  readonly status: string;
  readonly restrictionReason: string | null;
  readonly unavailabilityReason: string | null;
}

export interface BookingResource {
  readonly id: string;
  readonly calendarResourceId: string;
  readonly quantity: number;
}
export interface BookingParticipant {
  readonly id: string;
  readonly participantType: number;
  readonly externalParticipantId: string;
}
export interface BookingRescheduleHistory {
  readonly id: string;
  readonly operationId: string;
  readonly previousStartAtUtc: string;
  readonly previousEndAtUtc: string;
  readonly newStartAtUtc: string;
  readonly newEndAtUtc: string;
  readonly previousBranchId: string | null;
  readonly newBranchId: string | null;
  readonly previousStatus: number;
  readonly reason: string;
  readonly resourcesChanged: boolean;
  readonly previousResourceFingerprint: string;
  readonly newResourceFingerprint: string;
  readonly occurredAtUtc: string;
}

export interface BookingInstructorReplacementHistory {
  readonly id: string;
  readonly operationId: string;
  readonly previousInstructorId: string;
  readonly replacementInstructorId: string;
  readonly previousResourceId: string;
  readonly replacementResourceId: string;
  readonly mode: number;
  readonly reason: string;
  readonly occurredAtUtc: string;
  readonly accessExpiresAtUtc: string | null;
}

export interface BookingAttendance {
  readonly id: string;
  readonly operationId: string;
  readonly supersedesAttendanceId: string | null;
  readonly status: number;
  readonly recordedAtUtc: string;
  readonly recordedBy: string;
  readonly arrivalTimeUtc: string | null;
  readonly departureTimeUtc: string | null;
  readonly delayMinutes: number;
  readonly reason: string | null;
  readonly evidenceDocumentId: string | null;
  readonly chargeDecision: number;
  readonly creditDecision: number;
  readonly followUpAction: number;
  readonly overrideApplied: boolean;
  readonly overrideReason: string | null;
}

export interface BookingAttendanceRequest {
  readonly operationId: string;
  readonly status: number;
  readonly arrivalTimeUtc: string | null;
  readonly departureTimeUtc: string | null;
  readonly delayMinutes: number;
  readonly reason: string | null;
  readonly evidenceDocumentId: string | null;
  readonly followUpAction: number;
}

export interface OverrideBookingAttendanceRequest extends BookingAttendanceRequest {
  readonly overrideReason: string;
}

export interface Booking {
  readonly id: string;
  readonly branchId: string | null;
  readonly bookingType: number;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly title: string;
  readonly trainingPathId: string | null;
  readonly trainingCategory: string | null;
  readonly objectives: string | null;
  readonly meetingPoint: string | null;
  readonly pricingReference: string | null;
  readonly trainingCreditAccountId: string | null;
  readonly creditQuantity: number | null;
  readonly creditReservationStatus: number;
  readonly creditReservationReference: string | null;
  readonly notes: string | null;
  readonly notificationPolicy: number;
  readonly holdExpiresAtUtc: string | null;
  readonly status: number;
  readonly resources: readonly BookingResource[];
  readonly participants: readonly BookingParticipant[];
  readonly rescheduleHistory: readonly BookingRescheduleHistory[];
  readonly cancellation?: BookingCancellation | null;
  readonly attendance?: BookingAttendance | null;
  readonly attendanceHistory?: readonly BookingAttendance[];
  readonly instructorReplacementHistory?: readonly BookingInstructorReplacementHistory[];
}

export interface SchedulingConflict {
  readonly id: string;
  readonly bookingId: string;
  readonly calendarResourceId: string | null;
  readonly conflictingBookingId: string | null;
  readonly type: number;
  readonly priority: number;
  readonly status: number;
  readonly causeKey: string;
  readonly details: string | null;
  readonly suggestedActions: readonly number[];
  readonly detectedAtUtc: string;
  readonly resolution: number | null;
  readonly resolutionReason: string | null;
  readonly resolvedByUserId: string | null;
  readonly overrideReason: string | null;
  readonly overrideRisk: string | null;
  readonly overrideApprovedByUserId: string | null;
  readonly overrideExpiresAtUtc: string | null;
}

export interface SchedulingConflictScan {
  readonly bookingId: string;
  readonly openConflicts: number;
  readonly criticalConflicts: number;
  readonly conflicts: readonly SchedulingConflict[];
}

export interface ResolveSchedulingConflictRequest {
  readonly resolution: number;
  readonly reason: string;
}
export interface OverrideSchedulingConflictRequest {
  readonly reason: string;
  readonly risk: string;
  readonly expiresAtUtc: string;
}

export interface WaitingListProposal {
  readonly id: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly branchId: string | null;
  readonly instructorId: string | null;
  readonly proposedAtUtc: string;
  readonly expiresAtUtc: string;
  readonly status: number;
  readonly heldUntilUtc: string | null;
  readonly decidedAtUtc: string | null;
  readonly decisionReason: string | null;
  readonly fulfilledBookingId: string | null;
}

export interface WaitingListEntry {
  readonly id: string;
  readonly studentId: string;
  readonly requestedSessionType: number;
  readonly preferredFromUtc: string;
  readonly preferredToUtc: string;
  readonly durationMinutes: number;
  readonly preferredBranchId: string | null;
  readonly preferredInstructorId: string | null;
  readonly basePriorityScore: number;
  readonly effectivePriorityScore: number;
  readonly priorityExplanation: string;
  readonly reason: string;
  readonly createdAtUtc: string;
  readonly expiresAtUtc: string;
  readonly status: number;
  readonly proposals: readonly WaitingListProposal[];
}

export interface WaitingListPriorityRequest {
  readonly examAtUtc: string | null;
  readonly hasNoFutureSession: boolean;
  readonly interruptionDays: number;
  readonly pedagogicalUrgencyLevel: number;
  readonly schoolCancellation: boolean;
  readonly limitedAvailability: boolean;
  readonly regulatoryPriority: boolean;
  readonly commercialPriority: boolean;
  readonly manualAdjustment: number;
  readonly manualAdjustmentReason: string | null;
}

export interface CreateWaitingListEntryRequest {
  readonly studentId: string;
  readonly requestedSessionType: number;
  readonly preferredFromUtc: string;
  readonly preferredToUtc: string;
  readonly durationMinutes: number;
  readonly preferredBranchId: string | null;
  readonly preferredInstructorId: string | null;
  readonly priority: WaitingListPriorityRequest;
  readonly reason: string;
  readonly expiresAtUtc: string;
}

export interface UpdateWaitingListPreferencesRequest {
  readonly preferredFromUtc: string;
  readonly preferredToUtc: string;
  readonly preferredBranchId: string | null;
  readonly preferredInstructorId: string | null;
  readonly expiresAtUtc: string;
}

export interface WaitingListMatchCandidate {
  readonly entryId: string;
  readonly studentId: string;
  readonly basePriorityScore: number;
  readonly effectivePriorityScore: number;
  readonly priorityExplanation: string;
  readonly createdAtUtc: string;
  readonly matchExplanation: string;
}

export interface CapacitySummary {
  readonly theoreticalHours: number;
  readonly netAvailableHours: number;
  readonly committedHours: number;
  readonly estimatedDemandHours: number;
  readonly netCapacityHours: number;
  readonly uncoveredDemandHours: number;
  readonly saturationRatePercent: number;
  readonly waitingListCount: number;
  readonly waitingListHours: number;
  readonly estimatedInstructorNeed: number;
  readonly estimatedVehicleNeed: number;
  readonly averageSlotLeadTimeHours: number | null;
}

export interface CapacityDimension {
  readonly dimensionKey: string;
  readonly label: string;
  readonly theoreticalHours: number;
  readonly netAvailableHours: number;
  readonly committedHours: number;
  readonly netCapacityHours: number;
  readonly saturationRatePercent: number;
}

export interface CapacityDaily {
  readonly date: string;
  readonly netAvailableHours: number;
  readonly committedHours: number;
  readonly estimatedDemandHours: number;
  readonly saturationRatePercent: number;
  readonly waitingListCount: number;
}

export interface CapacityForecast {
  readonly horizon: number;
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly generatedAtUtc: string;
  readonly confidence: number;
  readonly assumptions: readonly string[];
  readonly summary: CapacitySummary;
  readonly byBranch: readonly CapacityDimension[];
  readonly byResourceType: readonly CapacityDimension[];
  readonly byResource: readonly CapacityDimension[];
  readonly daily: readonly CapacityDaily[];
}

export interface CapacityScenarioRequest {
  readonly horizon: number;
  readonly scenarioType: number;
  readonly branchId: string | null;
  readonly quantity: number;
  readonly additionalHoursPerResourcePerWeek: number;
  readonly assumptionLabel: string;
}

export interface CapacityScenarioResponse {
  readonly baseline: CapacityForecast;
  readonly simulatedSummary: CapacitySummary;
  readonly addedNetCapacityHours: number;
  readonly saturationDeltaPercent: number;
  readonly assumptions: readonly string[];
  readonly applied: boolean;
}

export interface SchedulingDashboardData {
  readonly bookings: readonly Booking[];
  readonly conflicts: readonly SchedulingConflict[];
  readonly waitingList: readonly WaitingListEntry[];
  readonly resources: readonly CalendarResource[];
  readonly capacity: CapacityForecast | null;
  readonly failedSlices: readonly string[];
}

export interface CreateBookingResourceRequest {
  readonly calendarResourceId: string;
  readonly quantity: number;
}
export interface CreateBookingParticipantRequest {
  readonly participantType: number;
  readonly externalParticipantId: string;
}
export interface CreateBookingRequest {
  readonly branchId: string | null;
  readonly bookingType: number;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly title: string;
  readonly trainingPathId: string | null;
  readonly trainingCategory: string | null;
  readonly objectives: string | null;
  readonly meetingPoint: string | null;
  readonly pricingReference: string | null;
  readonly creditReservation: {
    readonly trainingCreditAccountId: string;
    readonly quantity: number;
  } | null;
  readonly notes: string | null;
  readonly notificationPolicy: number;
  readonly resources: readonly CreateBookingResourceRequest[];
  readonly participants: readonly CreateBookingParticipantRequest[];
}
export interface CreatedBookingResponse {
  readonly id: string;
}
export interface BookingConflictItem {
  readonly type: number;
  readonly calendarResourceId: string;
  readonly conflictingBookingId: string | null;
  readonly requestedQuantity: number;
  readonly availableCapacity: number;
  readonly reason: string | null;
}
export interface BookingConflictCheck {
  readonly bookingId: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly isConflictFree: boolean;
  readonly conflicts: readonly BookingConflictItem[];
}

export interface BookingRescheduleResourceRequest {
  readonly calendarResourceId: string;
  readonly quantity: number;
}
export interface BookingRescheduleRequest {
  readonly operationId: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly branchId: string | null;
  readonly resources: readonly BookingRescheduleResourceRequest[] | null;
  readonly reason: string;
}
export interface BookingRescheduleImpactItem {
  readonly code: string;
  readonly state: string;
  readonly messageKey: string;
}
export interface BookingRescheduleImpact {
  readonly bookingId: string;
  readonly operationId: string;
  readonly alreadyApplied: boolean;
  readonly previousStartAtUtc: string;
  readonly previousEndAtUtc: string;
  readonly newStartAtUtc: string;
  readonly newEndAtUtc: string;
  readonly previousBranchId: string | null;
  readonly newBranchId: string | null;
  readonly resourcesChanged: boolean;
  readonly canConfirm: boolean;
  readonly conflictCheck: BookingConflictCheck;
  readonly impacts: readonly BookingRescheduleImpactItem[];
}

export interface BookingCancellationPreview {
  readonly bookingId: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly initiator: number;
  readonly reasonCode: number;
  readonly noticeDurationMinutes: number;
  readonly policyCode: string;
  readonly policyVersion: number;
  readonly policyExplanationKey: string;
  readonly creditDecision: number;
  readonly feeDecision: number;
  readonly replacementRequired: boolean;
}

export interface BookingCancellation {
  readonly id: string;
  readonly operationId: string;
  readonly initiator: number;
  readonly initiatorId: string | null;
  readonly reasonCode: number;
  readonly reasonDetails: string | null;
  readonly cancelledAtUtc: string;
  readonly noticeDurationMinutes: number;
  readonly policyCode: string;
  readonly policyVersion: number;
  readonly policyExplanationKey: string;
  readonly creditDecision: number;
  readonly feeDecision: number;
  readonly notificationDecision: number;
  readonly replacementRequired: boolean;
  readonly overrideApplied: boolean;
  readonly overrideReason: string | null;
}

export interface PreviewBookingCancellationRequest {
  readonly initiator: number;
  readonly initiatorId: string | null;
  readonly reasonCode: number;
  readonly reasonDetails: string | null;
}

export interface CancelBookingRequest extends PreviewBookingCancellationRequest {
  readonly operationId: string;
  readonly notificationDecision: number;
}

export interface OverrideCancelBookingRequest extends CancelBookingRequest {
  readonly overrideReason: string;
}

export interface SlotSearchRequest {
  readonly studentId: string;
  readonly bookingType: number;
  readonly durationMinutes: number;
  readonly fromUtc: string;
  readonly toUtc: string;
  readonly branchId: string | null;
  readonly preferredInstructorId: string | null;
  readonly preferredVehicleId: string | null;
  readonly requireVehicle: boolean;
  readonly requireRoom: boolean;
  readonly stepMinutes: number;
  readonly maxSuggestions: number;
  readonly trainingCategory?: string | null;
  readonly preferContinuity?: boolean;
}
export interface SlotSearchSuggestion {
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly branchId: string | null;
  readonly instructorId: string | null;
  readonly instructorCalendarResourceId: string | null;
  readonly instructorDisplayName: string | null;
  readonly vehicleId: string | null;
  readonly vehicleCalendarResourceId: string | null;
  readonly vehicleDisplayName: string | null;
  readonly roomCalendarResourceId: string | null;
  readonly roomDisplayName: string | null;
  readonly qualificationVerified: boolean;
  readonly hasStudentContinuity: boolean;
  readonly instructorScheduledMinutes: number;
  readonly vehicleScheduledMinutes: number;
  readonly score: number;
  readonly compatibility: string;
  readonly reasons: readonly string[];
  readonly externalReviews: readonly string[];
}
export interface SlotSearchResponse {
  readonly searchedFromUtc: string;
  readonly searchedToUtc: string;
  readonly durationMinutes: number;
  readonly evaluatedCandidates: number;
  readonly suggestions: readonly SlotSearchSuggestion[];
  readonly warnings: readonly string[];
}

export interface BookingCreatePreset {
  readonly studentCalendarResourceId: string;
  readonly bookingType: number;
  readonly durationMinutes: number;
  readonly startAtUtc: string;
  readonly instructorCalendarResourceId: string | null;
  readonly vehicleCalendarResourceId: string | null;
  readonly roomCalendarResourceId: string | null;
  readonly branchId: string | null;
  readonly objective?: string | null;
  readonly trainingCategory?: string | null;
}

export interface AvailabilityRule {
  readonly id: string;
  readonly dayOfWeek: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
  readonly type: string;
  readonly source: string;
  readonly priority: number;
  readonly branchId: string | null;
  readonly trainingCategory: string | null;
  readonly serviceArea: string | null;
}

export interface AvailabilityException {
  readonly id: string;
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly type: string;
  readonly source: string;
  readonly priority: number;
  readonly capacity: number | null;
  readonly reason: string | null;
}

export interface AvailabilityPreferences {
  readonly preferredMeetingPoint: string | null;
  readonly maximumTravelDistanceKm: number | null;
  readonly minimumNoticeMinutes: number | null;
  readonly trainingFrequencyPerWeek: number | null;
  readonly preferredInstructorId: string | null;
  readonly intensiveRhythm: boolean;
  readonly oneTimeGeolocationAllowed: boolean;
}

export interface AvailabilityPlan {
  readonly id: string;
  readonly calendarResourceId: string;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly status: string;
  readonly rules: readonly AvailabilityRule[];
  readonly exceptions: readonly AvailabilityException[];
  readonly preferences: AvailabilityPreferences;
  readonly createdAtUtc: string;
  readonly lastModifiedAtUtc: string | null;
}

export interface CreateAvailabilityPlanRequest {
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
}
export interface AddAvailabilityRuleRequest {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly capacity: number;
  readonly type: number;
  readonly source: number;
  readonly priority: number;
  readonly branchId: string | null;
  readonly trainingCategory: string | null;
  readonly serviceArea: string | null;
}
export interface AddAvailabilityExceptionRequest {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly type: number;
  readonly capacity: number | null;
  readonly reason: string | null;
  readonly source: number | null;
  readonly priority: number | null;
}
export interface AddAvailabilityExceptionResult {
  readonly availabilityExceptionId: string;
  readonly source: string;
  readonly impactedBookings: readonly {
    readonly bookingId: string;
    readonly startAtUtc: string;
    readonly endAtUtc: string;
    readonly status: string;
  }[];
}
export interface UpdateAvailabilityPreferencesRequest {
  readonly preferredMeetingPoint: string | null;
  readonly maximumTravelDistanceKm: number | null;
  readonly minimumNoticeMinutes: number | null;
  readonly trainingFrequencyPerWeek: number | null;
  readonly preferredInstructorId: string | null;
  readonly intensiveRhythm: boolean;
  readonly oneTimeGeolocationAllowed: boolean;
}

export interface RecurrenceResource {
  readonly id: string;
  readonly calendarResourceId: string;
  readonly quantity: number;
}

export interface RecurrenceOccurrence {
  readonly id: string;
  readonly scheduledDate: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly status: string;
  readonly exceptionReason: string | null;
  readonly revision: number;
}

export interface RecurrenceSeries {
  readonly id: string;
  readonly organizationId: string;
  readonly branchId: string | null;
  readonly targetType: string;
  readonly frequency: string;
  readonly interval: number;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly occurrenceCount: number | null;
  readonly daysOfWeek: readonly number[];
  readonly localTime: string;
  readonly durationMinutes: number;
  readonly timeZoneId: string;
  readonly title: string;
  readonly resourceSelectionPolicy: string;
  readonly revision: number;
  readonly isCancelled: boolean;
  readonly resources: readonly RecurrenceResource[];
  readonly occurrences: readonly RecurrenceOccurrence[];
}

export interface RecurrenceOccurrencePreview {
  readonly occurrenceId: string;
  readonly startAtUtc: string;
  readonly endAtUtc: string;
  readonly status: string;
  readonly exceptionReason: string | null;
  readonly isConflictFree: boolean;
  readonly conflictCodes: readonly string[];
}

export interface RecurrencePreview {
  readonly seriesId: string;
  readonly totalOccurrences: number;
  readonly confirmableOccurrences: number;
  readonly conflictingOccurrences: number;
  readonly exceptionOccurrences: number;
  readonly occurrences: readonly RecurrenceOccurrencePreview[];
}

export interface CreateRecurrenceSeriesRequest {
  readonly branchId: string | null;
  readonly targetType: number;
  readonly frequency: number;
  readonly interval: number;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly occurrenceCount: number | null;
  readonly daysOfWeek: readonly number[];
  readonly localTime: string;
  readonly durationMinutes: number;
  readonly timeZoneId: string;
  readonly title: string;
  readonly resourceSelectionPolicy: number;
  readonly resources: readonly { readonly calendarResourceId: string; readonly quantity: number }[];
}

export interface ChangeFutureRecurrenceRuleRequest {
  readonly applyFrom: string;
  readonly frequency: number;
  readonly interval: number;
  readonly endDate: string | null;
  readonly occurrenceCount: number | null;
  readonly daysOfWeek: readonly number[];
  readonly localTime: string;
  readonly durationMinutes: number;
}

export interface InstructorReplacementSuggestion {
  readonly instructorId: string;
  readonly calendarResourceId: string;
  readonly displayName: string;
  readonly branchId: string | null;
  readonly qualificationVerified: boolean;
  readonly isAvailableForAllBookings: boolean;
  readonly hasStudentContinuity: boolean;
  readonly loadPercentage: number | null;
  readonly compatibleBookingCount: number;
  readonly targetBookingCount: number;
  readonly score: number;
  readonly factors: readonly string[];
  readonly externalReviews: readonly string[];
}

export interface InstructorReplacementSuggestionRequest {
  readonly previousInstructorId: string;
  readonly bookingIds: readonly string[];
  readonly trainingCategory: string;
}

export interface InstructorReplacementRequest {
  readonly operationId: string;
  readonly previousInstructorId: string;
  readonly replacementInstructorId: string;
  readonly mode: number;
  readonly bookingIds: readonly string[];
  readonly trainingCategory: string;
  readonly reason: string;
  readonly accessExpiresAtUtc: string | null;
}

export interface InstructorReplacementPreview {
  readonly operationId: string;
  readonly previousInstructorId: string;
  readonly replacementInstructorId: string;
  readonly mode: number;
  readonly bookingIds: readonly string[];
  readonly studentIds: readonly string[];
  readonly canConfirm: boolean;
  readonly blockingReasons: readonly string[];
  readonly externalReviews: readonly string[];
}

export interface InstructorReplacementApplyResult {
  readonly operationId: string;
  readonly replacedBookingCount: number;
  readonly bookingIds: readonly string[];
  readonly studentIds: readonly string[];
}

export interface VehicleReplacementRequirements {
  readonly trainingCategory: string;
  readonly transmissionType: string | null;
  readonly dualControlRequired: boolean;
  readonly requiredAdaptations: readonly string[];
  readonly energyType: string | null;
}

export interface VehicleReplacementSuggestion {
  readonly vehicleId: string;
  readonly calendarResourceId: string;
  readonly displayName: string;
  readonly branchId: string | null;
  readonly isAvailableForAllBookings: boolean;
  readonly technicalCompatibilityVerified: boolean;
  readonly insuranceVerified: boolean;
  readonly maintenanceVerified: boolean;
  readonly locationVerified: boolean;
  readonly ownershipVerified: boolean;
  readonly compatibleBookingCount: number;
  readonly targetBookingCount: number;
  readonly score: number;
  readonly factors: readonly string[];
  readonly blockingReasons: readonly string[];
  readonly externalReviews: readonly string[];
}

export interface VehicleReplacementSuggestionRequest {
  readonly previousVehicleId: string;
  readonly bookingIds: readonly string[];
  readonly requirements: VehicleReplacementRequirements;
}

export interface VehicleReplacementRequest {
  readonly operationId: string;
  readonly previousVehicleId: string;
  readonly replacementVehicleId: string;
  readonly mode: number;
  readonly bookingIds: readonly string[];
  readonly requirements: VehicleReplacementRequirements;
  readonly reason: string;
}

export interface VehicleReplacementPreview {
  readonly operationId: string;
  readonly previousVehicleId: string;
  readonly replacementVehicleId: string;
  readonly mode: number;
  readonly bookingIds: readonly string[];
  readonly canConfirm: boolean;
  readonly blockingReasons: readonly string[];
  readonly externalReviews: readonly string[];
}

export interface VehicleReplacementApplyResult {
  readonly operationId: string;
  readonly replacedBookingCount: number;
  readonly bookingIds: readonly string[];
}

export type TravelLocationMode = 1 | 2 | 3 | 4 | 5;
export type TravelTransportMode = 1 | 2 | 3 | 4 | 99;
export type TravelTimeSource = 1 | 2;

export interface TravelLocationRequest {
  readonly mode: TravelLocationMode;
  readonly label: string;
  readonly address: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly purpose: string | null;
  readonly capturedAtUtc: string | null;
  readonly expiresAtUtc: string | null;
}

export interface EvaluateTravelRequest {
  readonly origin: TravelLocationRequest;
  readonly destination: TravelLocationRequest;
  readonly previousPlannedEndUtc: string;
  readonly previousActualEndUtc: string | null;
  readonly nextPlannedStartUtc: string;
  readonly nextActualStartUtc: string | null;
  readonly requiredBufferMinutes: number | null;
  readonly transportMode: TravelTransportMode;
  readonly manualEstimatedDurationMinutes: number | null;
  readonly manualDistanceKilometers: number | null;
  readonly manualTrafficContext: string | null;
}

export interface TravelEvaluationResponse {
  readonly originLabel: string;
  readonly destinationLabel: string;
  readonly departureTimeUtc: string;
  readonly arrivalDeadlineUtc: string;
  readonly departureTimeSource: TravelTimeSource;
  readonly arrivalTimeSource: TravelTimeSource;
  readonly availableMinutes: number;
  readonly estimatedDurationMinutes: number;
  readonly requiredBufferMinutes: number;
  readonly requiredTotalMinutes: number;
  readonly marginMinutes: number;
  readonly isFeasible: boolean;
  readonly distanceKilometers: number | null;
  readonly trafficContext: string;
  readonly routeSource: string;
  readonly preciseLocationPersisted: boolean;
  readonly privacyNotice: string;
}
