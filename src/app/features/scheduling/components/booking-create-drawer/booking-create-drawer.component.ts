import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  BookingConflictCheck,
  BookingCreatePreset,
  CalendarResource,
  CreateBookingRequest,
  SlotSearchSuggestion,
} from '../../models/scheduling.models';

type BookingCreateMode = 'draft' | 'hold' | 'reserve' | 'confirm';

interface StepDefinition {
  readonly id: number;
  readonly key: string;
  readonly icon: string;
}

@Component({
  selector: 'driveos-booking-create-drawer',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './booking-create-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingCreateDrawerComponent {
  private readonly api = inject(SchedulingApiService);
  private readonly authorization = inject(AuthorizationService);
  private readonly apiErrors = inject(ApiErrorService);

  readonly open = input(false);
  readonly resources = input<readonly CalendarResource[]>([]);
  readonly preset = input<BookingCreatePreset | null>(null);
  readonly closeRequested = output<void>();
  readonly bookingCreated = output<string>();

  readonly step = signal(1);
  readonly submitting = signal(false);
  readonly searching = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly conflictCheck = signal<BookingConflictCheck | null>(null);
  readonly suggestions = signal<readonly SlotSearchSuggestion[]>([]);
  readonly slotSearchWarnings = signal<readonly string[]>([]);
  private readonly creationIdempotencyKey = signal<string | null>(null);

  readonly studentResourceId = signal('');
  readonly bookingType = signal(1);
  readonly title = signal('');
  readonly trainingCategory = signal('');
  readonly objective = signal('');
  readonly date = signal(this.toDateInput(new Date()));
  readonly startTime = signal('09:00');
  readonly durationMinutes = signal(60);
  readonly instructorResourceId = signal('');
  readonly vehicleResourceId = signal('');
  readonly roomResourceId = signal('');
  readonly branchId = signal('');
  readonly meetingPoint = signal('');
  readonly notifyParticipants = signal(true);

  readonly canReserve = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.reserve),
  );
  readonly canConfirm = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.bookings.confirm),
  );
  readonly canSearchSlots = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.slotSearch),
  );

  readonly steps: readonly StepDefinition[] = [
    { id: 1, key: 'studentType', icon: 'ph ph-student' },
    { id: 2, key: 'objectives', icon: 'ph ph-target' },
    { id: 3, key: 'dateDuration', icon: 'ph ph-clock' },
    { id: 4, key: 'instructor', icon: 'ph ph-chalkboard-teacher' },
    { id: 5, key: 'resource', icon: 'ph ph-car-profile' },
    { id: 6, key: 'location', icon: 'ph ph-map-pin' },
    { id: 7, key: 'finance', icon: 'ph ph-wallet' },
    { id: 8, key: 'confirmation', icon: 'ph ph-check-circle' },
  ];

  readonly students = computed(() => this.byType('1'));
  readonly instructors = computed(() => this.byType('2'));
  readonly vehicles = computed(() =>
    this.resources().filter((x) => ['3', '8'].includes(this.resourceTypeCode(x.resourceType))),
  );
  readonly rooms = computed(() => this.byType('4'));
  readonly branches = computed(() => this.byType('5'));

  readonly selectedStudent = computed(() => this.findResource(this.studentResourceId()));
  readonly selectedInstructor = computed(() => this.findResource(this.instructorResourceId()));
  readonly selectedVehicle = computed(() => this.findResource(this.vehicleResourceId()));
  readonly selectedRoom = computed(() => this.findResource(this.roomResourceId()));

  readonly startAtUtc = computed(() => this.combineDateTime(this.date(), this.startTime()));
  readonly endAtUtc = computed(() => {
    const start = this.startAtUtc();
    return start ? new Date(start.getTime() + this.durationMinutes() * 60_000) : null;
  });

  readonly progress = computed(() => Math.round((this.step() / this.steps.length) * 100));
  readonly canGoNext = computed(() => this.validateStep(this.step()));
  constructor() {
    effect(() => {
      const preset = this.preset();
      if (!this.open() || !preset) return;

      const start = new Date(preset.startAtUtc);
      this.studentResourceId.set(preset.studentCalendarResourceId);
      this.bookingType.set(preset.bookingType);
      this.durationMinutes.set(preset.durationMinutes);
      this.date.set(this.toDateInput(start));
      this.startTime.set(
        `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
      );
      this.instructorResourceId.set(preset.instructorCalendarResourceId ?? '');
      this.vehicleResourceId.set(preset.vehicleCalendarResourceId ?? '');
      this.roomResourceId.set(preset.roomCalendarResourceId ?? '');
      this.branchId.set(preset.branchId ?? '');
      if (preset.objective) this.objective.set(preset.objective);
      if (preset.trainingCategory) this.trainingCategory.set(preset.trainingCategory);
      this.step.set(1);
      this.errors.set([]);
      this.successKey.set(null);
      this.conflictCheck.set(null);
      this.suggestions.set([]);
    });
  }

  readonly bookingTitle = computed(() => {
    const explicit = this.title().trim();
    if (explicit) return explicit;
    const student = this.selectedStudent()?.displayName ?? '';
    return student
      ? `${this.bookingTypeLabelFallback()} · ${student}`
      : this.bookingTypeLabelFallback();
  });

  next(): void {
    if (!this.validateStep(this.step())) return;
    this.errors.set([]);
    this.step.update((value) => Math.min(this.steps.length, value + 1));
  }

  previous(): void {
    this.errors.set([]);
    this.step.update((value) => Math.max(1, value - 1));
  }

  goToStep(step: number): void {
    if (step <= this.step()) this.step.set(step);
  }

  close(): void {
    if (this.submitting()) return;
    this.closeRequested.emit();
  }

  searchSlots(): void {
    if (!this.canSearchSlots()) return;
    const student = this.selectedStudent();
    const start = this.startAtUtc();
    if (!student || !start) {
      this.errors.set(['scheduling.bookingCreate.validation.searchRequirements']);
      return;
    }

    const windowFrom = new Date(start);
    const windowTo = new Date(windowFrom.getTime() + 7 * 24 * 60 * 60 * 1000);
    const preferredInstructor = this.selectedInstructor();
    const preferredVehicle = this.selectedVehicle();

    this.searching.set(true);
    this.errors.set([]);
    this.suggestions.set([]);
    this.slotSearchWarnings.set([]);

    this.api
      .searchSlots({
        studentId: student.externalResourceId,
        bookingType: this.bookingType(),
        durationMinutes: this.durationMinutes(),
        fromUtc: windowFrom.toISOString(),
        toUtc: windowTo.toISOString(),
        branchId: this.branchId() || null,
        preferredInstructorId: preferredInstructor?.externalResourceId ?? null,
        preferredVehicleId: preferredVehicle?.externalResourceId ?? null,
        requireVehicle: this.requiresVehicle(),
        requireRoom: this.requiresRoom(),
        stepMinutes: 30,
        maxSuggestions: 8,
        trainingCategory: this.trainingCategory().trim() || null,
        preferContinuity: true,
      })
      .subscribe({
        next: (response) => {
          this.suggestions.set(response.suggestions);
          this.slotSearchWarnings.set(response.warnings);
          this.searching.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.apiErrors.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  selectSuggestion(suggestion: SlotSearchSuggestion): void {
    const start = new Date(suggestion.startAtUtc);
    this.date.set(this.toDateInput(start));
    this.startTime.set(
      `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`,
    );
    if (suggestion.instructorCalendarResourceId)
      this.instructorResourceId.set(suggestion.instructorCalendarResourceId);
    if (suggestion.vehicleCalendarResourceId)
      this.vehicleResourceId.set(suggestion.vehicleCalendarResourceId);
    if (suggestion.roomCalendarResourceId)
      this.roomResourceId.set(suggestion.roomCalendarResourceId);
    this.suggestions.set([]);
  }

  submit(mode: BookingCreateMode): void {
    if (!this.validateAll()) {
      this.errors.set(['scheduling.bookingCreate.validation.incomplete']);
      return;
    }
    if (mode !== 'draft' && !this.canReserve()) return;
    if (mode === 'confirm' && !this.canConfirm()) return;

    const request = this.buildCreateRequest();
    if (!request) return;

    this.submitting.set(true);
    this.errors.set([]);
    this.successKey.set(null);
    this.conflictCheck.set(null);

    const idempotencyKey = this.creationIdempotencyKey() ?? crypto.randomUUID();
    this.creationIdempotencyKey.set(idempotencyKey);

    this.api.createBooking(request, idempotencyKey).subscribe({
      next: ({ id }) => {
        this.creationIdempotencyKey.set(null);
        if (mode === 'draft') {
          this.finish(id, 'scheduling.bookingCreate.success.draft');
          return;
        }
        if (mode === 'hold') {
          this.hold(id);
          return;
        }
        this.reserve(id, mode === 'confirm');
      },
      error: (error: HttpErrorResponse) => {
        if (error.status !== 0) this.creationIdempotencyKey.set(null);
        this.fail(error);
      },
    });
  }

  conflictTypeKey(type: number): string {
    return `scheduling.bookingCreate.conflictTypes.${type}`;
  }

  slotSearchReasonKey(value: string): string {
    return `scheduling.slotSearch.reasons.${value.split('.').pop() ?? value}`;
  }

  slotSearchWarningKey(value: string): string {
    return `scheduling.slotSearch.warnings.${value.split('.').pop() ?? value}`;
  }

  slotSearchCompatibilityKey(value: string): string {
    return `scheduling.slotSearch.compatibility.${value}`;
  }

  resourceName(calendarResourceId: string): string {
    return this.findResource(calendarResourceId)?.displayName ?? calendarResourceId.slice(0, 8);
  }

  resourceTypeKey(resource: CalendarResource): string {
    return `scheduling.resources.type.${this.resourceTypeCode(resource.resourceType)}`;
  }

  bookingTypeKey(): string {
    return `scheduling.bookings.type.${this.bookingType()}`;
  }

  private hold(id: string): void {
    this.api.holdBookingSlot(id, 5).subscribe({
      next: (check) => {
        this.conflictCheck.set(check);
        if (!check.isConflictFree) {
          this.submitting.set(false);
          this.step.set(8);
          return;
        }
        this.finish(id, 'scheduling.bookingCreate.success.held');
      },
      error: (error: HttpErrorResponse) => this.fail(error),
    });
  }

  private reserve(id: string, confirmAfterReserve: boolean): void {
    this.api.reserveBooking(id).subscribe({
      next: (check) => {
        this.conflictCheck.set(check);
        if (!check.isConflictFree) {
          this.submitting.set(false);
          this.step.set(8);
          return;
        }
        if (!confirmAfterReserve) {
          this.finish(id, 'scheduling.bookingCreate.success.reserved');
          return;
        }
        this.api.confirmBooking(id).subscribe({
          next: (confirmCheck) => {
            this.conflictCheck.set(confirmCheck);
            if (!confirmCheck.isConflictFree) {
              this.submitting.set(false);
              this.step.set(8);
              return;
            }
            this.finish(
              id,
              this.notifyParticipants()
                ? 'scheduling.bookingCreate.success.confirmedNotify'
                : 'scheduling.bookingCreate.success.confirmed',
            );
          },
          error: (error: HttpErrorResponse) => this.fail(error),
        });
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as BookingConflictCheck | undefined;
        if (error.status === 409 && body?.conflicts) {
          this.conflictCheck.set(body);
          this.submitting.set(false);
          this.step.set(8);
          return;
        }
        this.fail(error);
      },
    });
  }

  private finish(id: string, successKey: string): void {
    this.submitting.set(false);
    this.successKey.set(successKey);
    this.bookingCreated.emit(id);
  }

  private fail(error: HttpErrorResponse): void {
    this.errors.set(this.apiErrors.getMessages(error));
    this.submitting.set(false);
  }

  private buildCreateRequest(): CreateBookingRequest | null {
    const start = this.startAtUtc();
    const end = this.endAtUtc();
    const student = this.selectedStudent();
    if (!start || !end || !student) return null;

    const resources = new Map<string, number>();
    resources.set(student.id, 1);
    const instructor = this.selectedInstructor();
    const vehicle = this.selectedVehicle();
    const room = this.selectedRoom();
    if (instructor) resources.set(instructor.id, 1);
    if (vehicle) resources.set(vehicle.id, 1);
    if (room) resources.set(room.id, 1);

    const participants = [
      { participantType: 1, externalParticipantId: student.externalResourceId },
    ];
    if (instructor)
      participants.push({
        participantType: 2,
        externalParticipantId: instructor.externalResourceId,
      });

    return {
      branchId: this.branchId() || student.branchId || null,
      bookingType: this.bookingType(),
      startAtUtc: start.toISOString(),
      endAtUtc: end.toISOString(),
      title: this.bookingTitle(),
      trainingPathId: null,
      trainingCategory: this.trainingCategory().trim() || null,
      objectives: this.objective().trim() || null,
      meetingPoint: this.meetingPoint().trim() || null,
      pricingReference: null,
      creditReservation: null,
      notes: null,
      notificationPolicy: this.notifyParticipants() ? 2 : 0,
      resources: [...resources.entries()].map(([calendarResourceId, quantity]) => ({
        calendarResourceId,
        quantity,
      })),
      participants,
    };
  }

  private validateStep(step: number): boolean {
    if (step === 1)
      return (
        !!this.studentResourceId() &&
        this.bookingType() > 0 &&
        (!this.requiresInstructor() || !!this.trainingCategory().trim())
      );
    if (step === 2) return this.objective().trim().length > 0;
    if (step === 3) return !!this.startAtUtc() && this.durationMinutes() >= 15;
    if (step === 4) return this.requiresInstructor() ? !!this.instructorResourceId() : true;
    if (step === 5) {
      if (this.requiresVehicle() && !this.vehicleResourceId()) return false;
      if (this.requiresRoom() && !this.roomResourceId()) return false;
      return true;
    }
    if (step === 6) return true;
    if (step === 7) return true;
    return true;
  }

  private validateAll(): boolean {
    return this.steps.every((step) => this.validateStep(step.id));
  }

  private requiresInstructor(): boolean {
    return [1, 2, 3, 4].includes(this.bookingType());
  }

  private requiresVehicle(): boolean {
    return [1, 2, 3].includes(this.bookingType());
  }

  private requiresRoom(): boolean {
    return this.bookingType() === 4;
  }

  private byType(type: string): readonly CalendarResource[] {
    return this.resources().filter(
      (resource) =>
        this.resourceTypeCode(resource.resourceType) === type && resource.status === 'Active',
    );
  }

  private findResource(id: string): CalendarResource | null {
    return this.resources().find((resource) => resource.id === id) ?? null;
  }

  private resourceTypeCode(type: string | number): string {
    const value = String(type);
    return (
      (
        {
          Student: '1',
          Instructor: '2',
          Vehicle: '3',
          Room: '4',
          Branch: '5',
          Simulator: '6',
          Equipment: '7',
          ExamVehicle: '8',
          PartnerResource: '9',
          Other: '99',
        } as Record<string, string>
      )[value] ?? value
    );
  }

  private combineDateTime(date: string, time: string): Date | null {
    if (!date || !time) return null;
    const parsed = new Date(`${date}T${time}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toDateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private bookingTypeLabelFallback(): string {
    return (
      (
        {
          1: 'Séance pratique',
          2: 'Évaluation',
          3: 'Examen',
          4: 'Cours théorique',
          5: 'Rendez-vous',
          6: 'Blocage ressource',
          7: 'Maintenance',
          99: 'Autre',
        } as Record<number, string>
      )[this.bookingType()] ?? 'Réservation'
    );
  }
}
