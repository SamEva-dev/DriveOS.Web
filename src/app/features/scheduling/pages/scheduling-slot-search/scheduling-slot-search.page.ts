import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { BookingCreateDrawerComponent } from '../../components/booking-create-drawer/booking-create-drawer.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import {
  BookingCreatePreset,
  CalendarResource,
  SlotSearchResponse,
  SlotSearchSuggestion,
} from '../../models/scheduling.models';

@Component({
  selector: 'driveos-scheduling-slot-search-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TranslatePipe,
    BookingCreateDrawerComponent,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-slot-search.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingSlotSearchPage {
  private readonly api = inject(SchedulingApiService);
  private readonly apiErrors = inject(ApiErrorService);

  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly response = signal<SlotSearchResponse | null>(null);
  readonly loadingResources = signal(true);
  readonly searching = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly criteriaOpen = signal(false);
  readonly bookingDrawerOpen = signal(false);
  readonly bookingPreset = signal<BookingCreatePreset | null>(null);

  readonly studentResourceId = signal('');
  readonly bookingType = signal(1);
  readonly durationMinutes = signal(60);
  readonly fromDate = signal(this.dateInput(new Date()));
  readonly toDate = signal(this.dateInput(this.addDays(new Date(), 14)));
  readonly branchId = signal('');
  readonly trainingCategory = signal('');
  readonly preferredInstructorResourceId = signal('');
  readonly preferredVehicleResourceId = signal('');
  readonly preferContinuity = signal(true);
  readonly requireVehicle = signal(true);
  readonly requireRoom = signal(false);
  readonly stepMinutes = signal(30);
  readonly maxSuggestions = signal(12);

  readonly students = computed(() => this.byType('1'));
  readonly instructors = computed(() => this.byType('2'));
  readonly vehicles = computed(() =>
    this.resources().filter(
      (x) => ['3', '8'].includes(this.resourceTypeCode(x.resourceType)) && x.status === 'Active',
    ),
  );
  readonly branches = computed(() => this.byType('5'));
  readonly selectedStudent = computed(
    () => this.resources().find((x) => x.id === this.studentResourceId()) ?? null,
  );
  readonly hasCriteria = computed(
    () =>
      !!this.studentResourceId() &&
      !!this.fromDate() &&
      !!this.toDate() &&
      this.durationMinutes() >= 15,
  );
  readonly suggestions = computed(() => this.response()?.suggestions ?? []);

  constructor() {
    this.api.getResources().subscribe({
      next: (resources) => {
        this.resources.set(resources);
        this.studentResourceId.set(this.students()[0]?.id ?? '');
        this.loadingResources.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loadingResources.set(false);
      },
    });
  }

  search(): void {
    const student = this.selectedStudent();
    const from = this.startOfDayUtc(this.fromDate());
    const to = this.endOfDayUtc(this.toDate());
    if (!student || !from || !to || from >= to) {
      this.errors.set(['scheduling.slotSearch.validation.criteria']);
      return;
    }

    const instructor = this.resources().find((x) => x.id === this.preferredInstructorResourceId());
    const vehicle = this.resources().find((x) => x.id === this.preferredVehicleResourceId());

    this.searching.set(true);
    this.errors.set([]);
    this.api
      .searchSlots({
        studentId: student.externalResourceId,
        bookingType: this.bookingType(),
        durationMinutes: this.durationMinutes(),
        fromUtc: from.toISOString(),
        toUtc: to.toISOString(),
        branchId: this.branchId() || null,
        preferredInstructorId: instructor?.externalResourceId ?? null,
        preferredVehicleId: vehicle?.externalResourceId ?? null,
        requireVehicle: this.requireVehicle(),
        requireRoom: this.requireRoom(),
        stepMinutes: this.stepMinutes(),
        maxSuggestions: this.maxSuggestions(),
        trainingCategory: this.trainingCategory().trim() || null,
        preferContinuity: this.preferContinuity(),
      })
      .subscribe({
        next: (response) => {
          this.response.set(response);
          this.searching.set(false);
          this.criteriaOpen.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.apiErrors.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  choose(suggestion: SlotSearchSuggestion): void {
    const student = this.selectedStudent();
    if (!student) return;
    this.bookingPreset.set({
      studentCalendarResourceId: student.id,
      bookingType: this.bookingType(),
      durationMinutes: this.durationMinutes(),
      startAtUtc: suggestion.startAtUtc,
      instructorCalendarResourceId: suggestion.instructorCalendarResourceId,
      vehicleCalendarResourceId: suggestion.vehicleCalendarResourceId,
      roomCalendarResourceId: suggestion.roomCalendarResourceId,
      branchId: suggestion.branchId ?? (this.branchId() || null),
      trainingCategory: this.trainingCategory().trim() || null,
    });
    this.bookingDrawerOpen.set(true);
  }

  closeBookingDrawer(): void {
    this.bookingDrawerOpen.set(false);
  }
  closeCriteria(): void {
    this.criteriaOpen.set(false);
  }
  openCriteria(): void {
    this.criteriaOpen.set(true);
  }

  warningKey(value: string): string {
    return `scheduling.slotSearch.warnings.${this.keyTail(value)}`;
  }
  reasonKey(value: string): string {
    return `scheduling.slotSearch.reasons.${this.keyTail(value)}`;
  }
  externalKey(value: string): string {
    return `scheduling.slotSearch.external.${this.keyTail(value)}`;
  }
  compatibilityKey(value: string): string {
    return `scheduling.slotSearch.compatibility.${value}`;
  }
  bookingTypeKey(): string {
    return `scheduling.bookings.type.${this.bookingType()}`;
  }
  loadHours(minutes: number): string {
    return (minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  private byType(type: string): readonly CalendarResource[] {
    return this.resources().filter(
      (resource) =>
        this.resourceTypeCode(resource.resourceType) === type && resource.status === 'Active',
    );
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
  private keyTail(value: string): string {
    return value.split('.').pop() ?? value;
  }
  private dateInput(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }
  private startOfDayUtc(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  private endOfDayUtc(value: string): Date | null {
    const date = new Date(`${value}T23:59:59`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
