import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  CalendarResource,
  RecurrenceOccurrence,
  RecurrencePreview,
  RecurrenceSeries,
} from '../../models/scheduling.models';

type DrawerMode = 'create' | 'occurrence' | 'future' | 'cancel-series' | null;

@Component({
  selector: 'driveos-scheduling-recurrence-page',
  standalone: true,
  imports: [
    TranslatePipe,
    DatePipe,
    SlicePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-recurrence.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingRecurrencePage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly series = signal<readonly RecurrenceSeries[]>([]);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly selectedSeriesId = signal<string | null>(null);
  readonly preview = signal<RecurrencePreview | null>(null);
  readonly drawerMode = signal<DrawerMode>(null);
  readonly selectedOccurrence = signal<RecurrenceOccurrence | null>(null);

  readonly title = signal('');
  readonly targetType = signal(1);
  readonly frequency = signal(2);
  readonly interval = signal(1);
  readonly startDate = signal(this.todayKey());
  readonly endDate = signal('');
  readonly occurrenceCount = signal<number | null>(12);
  readonly localTime = signal('09:00');
  readonly durationMinutes = signal(60);
  readonly timeZoneId = signal(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris');
  readonly branchId = signal('');
  readonly resourceSelectionPolicy = signal(1);
  readonly daysOfWeek = signal<readonly number[]>([1]);
  readonly selectedResourceIds = signal<readonly string[]>([]);

  readonly occurrenceStart = signal('');
  readonly occurrenceEnd = signal('');
  readonly occurrenceReason = signal('');
  readonly occurrenceAction = signal<'reschedule' | 'cancel'>('reschedule');

  readonly futureApplyFrom = signal(this.todayKey());
  readonly futureFrequency = signal(2);
  readonly futureInterval = signal(1);
  readonly futureEndDate = signal('');
  readonly futureOccurrenceCount = signal<number | null>(12);
  readonly futureLocalTime = signal('09:00');
  readonly futureDuration = signal(60);
  readonly futureDays = signal<readonly number[]>([1]);
  readonly cancellationReason = signal('');

  readonly canCreate = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.recurrence.create),
  );
  readonly canUpdate = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.recurrence.update),
  );
  readonly canCancel = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.recurrence.cancel),
  );
  readonly selectedSeries = computed(
    () => this.series().find((x) => x.id === this.selectedSeriesId()) ?? null,
  );
  readonly activeOccurrences = computed(
    () =>
      this.selectedSeries()?.occurrences.filter(
        (x) => x.status === 'Planned' || x.status === 'Rescheduled',
      ) ?? [],
  );
  readonly exceptionOccurrences = computed(
    () => this.selectedSeries()?.occurrences.filter((x) => x.status !== 'Planned') ?? [],
  );
  readonly fixedResources = computed(
    () =>
      this.selectedSeries()?.resources.map((x) => ({
        ...x,
        label: this.resourceLabel(x.calendarResourceId),
      })) ?? [],
  );

  readonly weekdays = [
    { value: 1, key: 'scheduling.recurrence.weekdays.monday' },
    { value: 2, key: 'scheduling.recurrence.weekdays.tuesday' },
    { value: 3, key: 'scheduling.recurrence.weekdays.wednesday' },
    { value: 4, key: 'scheduling.recurrence.weekdays.thursday' },
    { value: 5, key: 'scheduling.recurrence.weekdays.friday' },
    { value: 6, key: 'scheduling.recurrence.weekdays.saturday' },
    { value: 0, key: 'scheduling.recurrence.weekdays.sunday' },
  ] as const;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    this.api.getResources().subscribe({
      next: (resources) => {
        this.resources.set(resources);
        this.loadSeries();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  private loadSeries(preferredId?: string): void {
    this.api.getRecurrences().subscribe({
      next: (series) => {
        this.series.set(series);
        const nextId = preferredId ?? this.selectedSeriesId() ?? series[0]?.id ?? null;
        this.selectedSeriesId.set(nextId);
        this.loading.set(false);
        if (nextId) this.loadPreview(nextId);
        else this.preview.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  selectSeries(id: string): void {
    this.selectedSeriesId.set(id);
    this.loadPreview(id);
  }
  loadPreview(id = this.selectedSeriesId()): void {
    if (!id) return;
    this.preview.set(null);
    this.api.previewRecurrence(id).subscribe({
      next: (preview) => this.preview.set(preview),
      error: (error: HttpErrorResponse) => this.errors.set(this.errorsApi.getMessages(error)),
    });
  }

  openCreate(): void {
    this.resetCreate();
    this.drawerMode.set('create');
  }
  openOccurrence(item: RecurrenceOccurrence): void {
    this.selectedOccurrence.set(item);
    this.occurrenceAction.set('reschedule');
    this.occurrenceReason.set('');
    this.occurrenceStart.set(this.toLocalInput(item.startAtUtc));
    this.occurrenceEnd.set(this.toLocalInput(item.endAtUtc));
    this.drawerMode.set('occurrence');
  }
  openFuture(): void {
    const s = this.selectedSeries();
    if (!s) return;
    this.futureApplyFrom.set(s.startDate);
    this.futureFrequency.set(this.frequencyCode(s.frequency));
    this.futureInterval.set(s.interval);
    this.futureEndDate.set(s.endDate ?? '');
    this.futureOccurrenceCount.set(s.occurrenceCount);
    this.futureLocalTime.set(s.localTime.slice(0, 5));
    this.futureDuration.set(s.durationMinutes);
    this.futureDays.set(s.daysOfWeek);
    this.drawerMode.set('future');
  }
  openCancelSeries(): void {
    this.cancellationReason.set('');
    this.drawerMode.set('cancel-series');
  }
  closeDrawer(): void {
    if (!this.saving()) this.drawerMode.set(null);
  }

  createSeries(): void {
    if (!this.title().trim()) return;
    const resources =
      this.resourceSelectionPolicy() === 1
        ? this.selectedResourceIds().map((id) => ({ calendarResourceId: id, quantity: 1 }))
        : [];
    this.runSave(
      this.api.createRecurrence({
        branchId: this.branchId() || null,
        targetType: this.targetType(),
        frequency: this.frequency(),
        interval: this.interval(),
        startDate: this.startDate(),
        endDate: this.endDate() || null,
        occurrenceCount: this.endDate() ? null : this.occurrenceCount(),
        daysOfWeek: this.frequency() === 2 ? this.daysOfWeek() : [],
        localTime: this.localTime(),
        durationMinutes: this.durationMinutes(),
        timeZoneId: this.timeZoneId(),
        title: this.title().trim(),
        resourceSelectionPolicy: this.resourceSelectionPolicy(),
        resources,
      }),
      'scheduling.recurrence.messages.created',
      (result) => result.id,
    );
  }

  generate(): void {
    const id = this.selectedSeriesId();
    if (!id) return;
    this.runSave(
      this.api.generateRecurrence(id),
      'scheduling.recurrence.messages.generated',
      () => id,
      false,
    );
  }

  saveOccurrence(): void {
    const seriesId = this.selectedSeriesId(),
      occurrence = this.selectedOccurrence();
    if (!seriesId || !occurrence) return;
    if (this.occurrenceAction() === 'cancel') {
      this.runSave(
        this.api.cancelRecurrenceOccurrence(seriesId, occurrence.id, this.occurrenceReason()),
        'scheduling.recurrence.messages.occurrenceCancelled',
        () => seriesId,
      );
      return;
    }
    this.runSave(
      this.api.rescheduleRecurrenceOccurrence(
        seriesId,
        occurrence.id,
        new Date(this.occurrenceStart()).toISOString(),
        new Date(this.occurrenceEnd()).toISOString(),
        this.occurrenceReason(),
      ),
      'scheduling.recurrence.messages.occurrenceRescheduled',
      () => seriesId,
    );
  }

  saveFuture(): void {
    const id = this.selectedSeriesId();
    if (!id) return;
    this.runSave(
      this.api.changeFutureRecurrenceRule(id, {
        applyFrom: this.futureApplyFrom(),
        frequency: this.futureFrequency(),
        interval: this.futureInterval(),
        endDate: this.futureEndDate() || null,
        occurrenceCount: this.futureEndDate() ? null : this.futureOccurrenceCount(),
        daysOfWeek: this.futureFrequency() === 2 ? this.futureDays() : [],
        localTime: this.futureLocalTime(),
        durationMinutes: this.futureDuration(),
      }),
      'scheduling.recurrence.messages.futureUpdated',
      () => id,
    );
  }

  cancelSeries(): void {
    const id = this.selectedSeriesId();
    if (!id) return;
    this.runSave(
      this.api.cancelRecurrenceSeries(id, this.cancellationReason()),
      'scheduling.recurrence.messages.seriesCancelled',
      () => id,
    );
  }

  toggleDay(day: number, future = false): void {
    const source = future ? this.futureDays() : this.daysOfWeek();
    const next = source.includes(day) ? source.filter((x) => x !== day) : [...source, day].sort();
    future ? this.futureDays.set(next) : this.daysOfWeek.set(next);
  }

  toggleResource(id: string): void {
    const current = this.selectedResourceIds();
    this.selectedResourceIds.set(
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  resourceLabel(id: string): string {
    return this.resources().find((x) => x.id === id)?.displayName ?? id;
  }
  previewFor(id: string) {
    return this.preview()?.occurrences.find((x) => x.occurrenceId === id) ?? null;
  }
  frequencyCode(value: string): number {
    return value === 'Daily' ? 1 : value === 'Monthly' ? 3 : 2;
  }
  statusTone(status: string): string {
    return status === 'Cancelled'
      ? 'bg-red-50 text-red-700'
      : status === 'Superseded'
        ? 'bg-slate-100 text-slate-600'
        : status === 'Rescheduled'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-emerald-50 text-emerald-700';
  }

  private runSave<T>(
    request: import('rxjs').Observable<T>,
    successKey: string,
    id: (value: T) => string,
    close = true,
  ): void {
    this.saving.set(true);
    this.errors.set([]);
    this.successKey.set(null);
    request.subscribe({
      next: (value) => {
        const selected = id(value);
        this.successKey.set(successKey);
        if (close) this.drawerMode.set(null);
        this.saving.set(false);
        this.loadSeries(selected);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  private resetCreate(): void {
    this.title.set('');
    this.targetType.set(1);
    this.frequency.set(2);
    this.interval.set(1);
    this.startDate.set(this.todayKey());
    this.endDate.set('');
    this.occurrenceCount.set(12);
    this.localTime.set('09:00');
    this.durationMinutes.set(60);
    this.branchId.set('');
    this.resourceSelectionPolicy.set(1);
    this.daysOfWeek.set([1]);
    this.selectedResourceIds.set([]);
    this.errors.set([]);
    this.successKey.set(null);
  }
  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
  private toLocalInput(value: string): string {
    const d = new Date(value);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
}
