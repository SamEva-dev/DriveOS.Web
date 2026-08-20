import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { BookingCreateDrawerComponent } from '../../components/booking-create-drawer/booking-create-drawer.component';
import { SchedulingApiService } from '../../data-access/scheduling-api.service';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import {
  BookingCreatePreset,
  CalendarResource,
  CreateWaitingListEntryRequest,
  SlotSearchSuggestion,
  WaitingListEntry,
  WaitingListProposal,
} from '../../models/scheduling.models';

type WaitingTab = 'waiting' | 'proposals' | 'holds' | 'history';
type DrawerMode = 'create' | 'detail' | 'preferences' | 'slotSearch' | 'cancel' | null;

@Component({
  selector: 'driveos-scheduling-waiting-list-page',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    BookingCreateDrawerComponent,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './scheduling-waiting-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingWaitingListPage {
  private readonly api = inject(SchedulingApiService);
  private readonly errorsApi = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly successKey = signal<string | null>(null);
  readonly entries = signal<readonly WaitingListEntry[]>([]);
  readonly resources = signal<readonly CalendarResource[]>([]);
  readonly selectedEntryId = signal<string | null>(null);
  readonly drawerMode = signal<DrawerMode>(null);
  readonly tab = signal<WaitingTab>('waiting');
  readonly search = signal('');

  readonly studentId = signal('');
  readonly bookingType = signal(1);
  readonly searchTrainingCategory = signal('');
  readonly preferredFrom = signal(this.toLocalDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  readonly preferredTo = signal(
    this.toLocalDateTime(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)),
  );
  readonly durationMinutes = signal(60);
  readonly preferredBranchId = signal('');
  readonly preferredInstructorId = signal('');
  readonly reason = signal('');
  readonly expiresAt = signal(
    this.toLocalDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  );
  readonly examAt = signal('');
  readonly noFutureSession = signal(false);
  readonly interruptionDays = signal(0);
  readonly pedagogicalUrgency = signal(0);
  readonly schoolCancellation = signal(false);
  readonly limitedAvailability = signal(false);
  readonly regulatoryPriority = signal(false);
  readonly commercialPriority = signal(false);
  readonly manualAdjustment = signal(0);
  readonly manualAdjustmentReason = signal('');

  readonly editPreferredFrom = signal('');
  readonly editPreferredTo = signal('');
  readonly editBranchId = signal('');
  readonly editInstructorId = signal('');
  readonly editExpiresAt = signal('');
  readonly cancelReason = signal('');

  readonly slotSuggestions = signal<readonly SlotSearchSuggestion[]>([]);
  readonly slotWarnings = signal<readonly string[]>([]);
  readonly proposalExpiryMinutes = signal(30);
  readonly bookingDrawerOpen = signal(false);
  readonly bookingPreset = signal<BookingCreatePreset | null>(null);
  readonly pendingProposalId = signal<string | null>(null);

  readonly canManage = computed(() =>
    this.authorization.hasPermission(SCHEDULING_PERMISSIONS.waitingList.manage),
  );
  readonly selectedEntry = computed(
    () => this.entries().find((x) => x.id === this.selectedEntryId()) ?? null,
  );
  readonly students = computed(() => this.resourcesByType('1'));
  readonly instructors = computed(() => this.resourcesByType('2'));
  readonly branches = computed(() => this.resourcesByType('5'));

  readonly waitingCount = computed(
    () =>
      this.entries().filter(
        (x) => this.effectiveEntryStatus(x) === 1 || this.effectiveEntryStatus(x) === 5,
      ).length,
  );
  readonly proposalCount = computed(
    () =>
      this.entries().filter((x) => x.proposals.some((p) => this.effectiveProposalStatus(p) === 1))
        .length,
  );
  readonly holdCount = computed(
    () =>
      this.entries().filter((x) => x.proposals.some((p) => this.effectiveProposalStatus(p) === 2))
        .length,
  );
  readonly urgentCount = computed(
    () =>
      this.entries().filter(
        (x) =>
          this.effectiveEntryStatus(x) !== 8 &&
          this.effectiveEntryStatus(x) !== 7 &&
          x.effectivePriorityScore >= 70,
      ).length,
  );

  readonly filtered = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    return this.entries().filter((entry) => {
      const status = this.effectiveEntryStatus(entry);
      if (this.tab() === 'waiting' && !(status === 1 || status === 5)) return false;
      if (
        this.tab() === 'proposals' &&
        !entry.proposals.some(
          (p) => this.effectiveProposalStatus(p) === 1 || this.effectiveProposalStatus(p) === 3,
        )
      )
        return false;
      if (
        this.tab() === 'holds' &&
        !entry.proposals.some((p) => this.effectiveProposalStatus(p) === 2)
      )
        return false;
      if (
        this.tab() === 'history' &&
        !(
          status === 6 ||
          status === 7 ||
          status === 8 ||
          entry.proposals.some((p) => [4, 5, 6].includes(this.effectiveProposalStatus(p)))
        )
      )
        return false;
      if (!query) return true;
      return [
        this.studentLabel(entry.studentId),
        entry.reason,
        this.branchLabel(entry.preferredBranchId),
        this.instructorLabel(entry.preferredInstructorId),
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    forkJoin({ entries: this.api.getWaitingList(), resources: this.api.getResources() }).subscribe({
      next: ({ entries, resources }) => {
        this.entries.set(entries);
        this.resources.set(resources);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  setTab(tab: WaitingTab): void {
    this.tab.set(tab);
  }

  openCreate(): void {
    if (!this.canManage()) return;
    this.resetCreate();
    this.drawerMode.set('create');
  }

  openDetail(entry: WaitingListEntry): void {
    this.selectedEntryId.set(entry.id);
    this.drawerMode.set('detail');
  }

  openPreferences(entry = this.selectedEntry()): void {
    if (!entry || !this.canManage()) return;
    this.selectedEntryId.set(entry.id);
    this.editPreferredFrom.set(this.toLocalDateTime(new Date(entry.preferredFromUtc)));
    this.editPreferredTo.set(this.toLocalDateTime(new Date(entry.preferredToUtc)));
    this.editBranchId.set(entry.preferredBranchId ?? '');
    this.editInstructorId.set(entry.preferredInstructorId ?? '');
    this.editExpiresAt.set(this.toLocalDateTime(new Date(entry.expiresAtUtc)));
    this.drawerMode.set('preferences');
  }

  openCancel(entry = this.selectedEntry()): void {
    if (!entry || !this.canManage()) return;
    this.selectedEntryId.set(entry.id);
    this.cancelReason.set('');
    this.drawerMode.set('cancel');
  }

  closeDrawer(): void {
    if (!this.saving() && !this.searching()) this.drawerMode.set(null);
  }

  create(): void {
    const student = this.students().find((x) => x.externalResourceId === this.studentId());
    const from = this.asIso(this.preferredFrom());
    const to = this.asIso(this.preferredTo());
    const expiry = this.asIso(this.expiresAt());
    if (!student || !from || !to || !expiry || !this.reason().trim() || to <= from) {
      this.errors.set(['scheduling.waitingList.validation.required']);
      return;
    }

    const request: CreateWaitingListEntryRequest = {
      studentId: student.externalResourceId,
      requestedSessionType: this.bookingType(),
      preferredFromUtc: from,
      preferredToUtc: to,
      durationMinutes: this.durationMinutes(),
      preferredBranchId: this.preferredBranchId() || null,
      preferredInstructorId: this.preferredInstructorId() || null,
      priority: {
        examAtUtc: this.asIso(this.examAt()),
        hasNoFutureSession: this.noFutureSession(),
        interruptionDays: this.interruptionDays(),
        pedagogicalUrgencyLevel: this.pedagogicalUrgency(),
        schoolCancellation: this.schoolCancellation(),
        limitedAvailability: this.limitedAvailability(),
        regulatoryPriority: this.regulatoryPriority(),
        commercialPriority: this.commercialPriority(),
        manualAdjustment: this.manualAdjustment(),
        manualAdjustmentReason:
          this.manualAdjustment() === 0 ? null : this.manualAdjustmentReason().trim() || null,
      },
      reason: this.reason().trim(),
      expiresAtUtc: expiry,
    };

    this.saving.set(true);
    this.errors.set([]);
    this.api.createWaitingListEntry(request).subscribe({
      next: ({ id }) => {
        this.selectedEntryId.set(id);
        this.saving.set(false);
        this.drawerMode.set(null);
        this.successKey.set('scheduling.waitingList.messages.created');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  savePreferences(): void {
    const entry = this.selectedEntry();
    const from = this.asIso(this.editPreferredFrom());
    const to = this.asIso(this.editPreferredTo());
    const expiry = this.asIso(this.editExpiresAt());
    if (!entry || !from || !to || !expiry || to <= from) return;
    this.saving.set(true);
    this.errors.set([]);
    this.api
      .updateWaitingListPreferences(entry.id, {
        preferredFromUtc: from,
        preferredToUtc: to,
        preferredBranchId: this.editBranchId() || null,
        preferredInstructorId: this.editInstructorId() || null,
        expiresAtUtc: expiry,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.drawerMode.set(null);
          this.successKey.set('scheduling.waitingList.messages.preferencesUpdated');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  searchSlot(entry = this.selectedEntry()): void {
    if (!entry || !this.canManage()) return;
    this.selectedEntryId.set(entry.id);
    this.searching.set(true);
    this.slotSuggestions.set([]);
    this.slotWarnings.set([]);
    this.errors.set([]);
    this.drawerMode.set('slotSearch');

    this.api
      .searchSlots({
        studentId: entry.studentId,
        bookingType: entry.requestedSessionType,
        durationMinutes: entry.durationMinutes,
        fromUtc: entry.preferredFromUtc,
        toUtc: entry.preferredToUtc,
        branchId: entry.preferredBranchId,
        preferredInstructorId: entry.preferredInstructorId,
        preferredVehicleId: null,
        requireVehicle: [1, 2, 3].includes(entry.requestedSessionType),
        requireRoom: entry.requestedSessionType === 4,
        stepMinutes: 30,
        maxSuggestions: 12,
        trainingCategory: this.searchTrainingCategory().trim() || null,
        preferContinuity: true,
      })
      .subscribe({
        next: (response) => {
          this.slotSuggestions.set(response.suggestions);
          this.slotWarnings.set(response.warnings);
          this.searching.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.searching.set(false);
        },
      });
  }

  propose(suggestion: SlotSearchSuggestion): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    const expiry = new Date(
      Math.min(
        new Date(entry.expiresAtUtc).getTime(),
        Date.now() + this.proposalExpiryMinutes() * 60_000,
      ),
    );
    this.saving.set(true);
    this.api
      .proposeWaitingListSlot(entry.id, {
        startAtUtc: suggestion.startAtUtc,
        endAtUtc: suggestion.endAtUtc,
        branchId: suggestion.branchId,
        instructorId: suggestion.instructorId,
        expiresAtUtc: expiry.toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.drawerMode.set(null);
          this.successKey.set('scheduling.waitingList.messages.proposed');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  hold(proposal: WaitingListProposal): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    const heldUntil = new Date(
      Math.min(new Date(proposal.expiresAtUtc).getTime(), Date.now() + 5 * 60_000),
    );
    this.saving.set(true);
    this.api
      .holdWaitingListProposal(entry.id, proposal.id, { heldUntilUtc: heldUntil.toISOString() })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.successKey.set('scheduling.waitingList.messages.held');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  accept(proposal: WaitingListProposal): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    this.saving.set(true);
    this.api.acceptWaitingListProposal(entry.id, proposal.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.successKey.set('scheduling.waitingList.messages.accepted');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  decline(proposal: WaitingListProposal): void {
    const entry = this.selectedEntry();
    if (!entry) return;
    this.saving.set(true);
    this.api
      .declineWaitingListProposal(entry.id, proposal.id, 'declined-from-planning-workspace')
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.successKey.set('scheduling.waitingList.messages.declined');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  cancel(): void {
    const entry = this.selectedEntry();
    if (!entry || !this.cancelReason().trim()) return;
    this.saving.set(true);
    this.api.cancelWaitingListEntry(entry.id, this.cancelReason().trim()).subscribe({
      next: () => {
        this.saving.set(false);
        this.drawerMode.set(null);
        this.successKey.set('scheduling.waitingList.messages.cancelled');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.errors.set(this.errorsApi.getMessages(error));
        this.saving.set(false);
      },
    });
  }

  prepareBooking(proposal: WaitingListProposal): void {
    const entry = this.selectedEntry();
    const studentResource = entry
      ? this.students().find((x) => x.externalResourceId === entry.studentId)
      : null;
    if (!entry || !studentResource) return;

    this.saving.set(true);
    this.errors.set([]);
    this.api
      .searchSlots({
        studentId: entry.studentId,
        bookingType: entry.requestedSessionType,
        durationMinutes: entry.durationMinutes,
        fromUtc: proposal.startAtUtc,
        toUtc: proposal.endAtUtc,
        branchId: proposal.branchId,
        preferredInstructorId: proposal.instructorId,
        preferredVehicleId: null,
        requireVehicle: [1, 2, 3].includes(entry.requestedSessionType),
        requireRoom: entry.requestedSessionType === 4,
        stepMinutes: Math.max(15, entry.durationMinutes),
        maxSuggestions: 5,
        trainingCategory: this.searchTrainingCategory().trim() || null,
        preferContinuity: true,
      })
      .subscribe({
        next: (response) => {
          const exact =
            response.suggestions.find(
              (x) => x.startAtUtc === proposal.startAtUtc && x.endAtUtc === proposal.endAtUtc,
            ) ?? response.suggestions[0];
          this.saving.set(false);
          if (!exact) {
            this.errors.set(['scheduling.waitingList.validation.slotNoLongerAvailable']);
            return;
          }
          this.pendingProposalId.set(proposal.id);
          this.bookingPreset.set({
            studentCalendarResourceId: studentResource.id,
            bookingType: entry.requestedSessionType,
            durationMinutes: entry.durationMinutes,
            startAtUtc: exact.startAtUtc,
            instructorCalendarResourceId: exact.instructorCalendarResourceId,
            vehicleCalendarResourceId: exact.vehicleCalendarResourceId,
            roomCalendarResourceId: exact.roomCalendarResourceId,
            branchId: exact.branchId,
            trainingCategory: this.searchTrainingCategory().trim() || null,
          });
          this.bookingDrawerOpen.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.errors.set(this.errorsApi.getMessages(error));
          this.saving.set(false);
        },
      });
  }

  onBookingCreated(bookingId: string): void {
    const entry = this.selectedEntry();
    const proposalId = this.pendingProposalId();
    if (!entry || !proposalId) return;

    this.api.getBooking(bookingId).subscribe({
      next: (booking) => {
        if (![2, 3].includes(booking.status)) {
          this.successKey.set('scheduling.waitingList.messages.bookingCreatedNotFulfilled');
          return;
        }
        this.saving.set(true);
        this.api.fulfillWaitingListEntry(entry.id, proposalId, bookingId).subscribe({
          next: () => {
            this.saving.set(false);
            this.bookingDrawerOpen.set(false);
            this.pendingProposalId.set(null);
            this.successKey.set('scheduling.waitingList.messages.fulfilled');
            this.load();
          },
          error: (error: HttpErrorResponse) => {
            this.errors.set(this.errorsApi.getMessages(error));
            this.saving.set(false);
          },
        });
      },
      error: (error: HttpErrorResponse) => this.errors.set(this.errorsApi.getMessages(error)),
    });
  }

  closeBookingDrawer(): void {
    this.bookingDrawerOpen.set(false);
  }

  openHeldBooking(proposal: WaitingListProposal): void {
    const bookingId = proposal.fulfilledBookingId;
    if (bookingId) this.router.navigate(['/planning/calendar'], { queryParams: { bookingId } });
  }

  entryStatusName(entry: WaitingListEntry): string {
    return (
      (
        {
          1: 'waiting',
          2: 'proposed',
          3: 'temporarilyHeld',
          4: 'accepted',
          5: 'declined',
          6: 'expired',
          7: 'cancelled',
          8: 'fulfilled',
        } as Record<number, string>
      )[this.effectiveEntryStatus(entry)] ?? 'waiting'
    );
  }

  proposalStatusName(proposal: WaitingListProposal): string {
    return (
      (
        {
          1: 'proposed',
          2: 'temporarilyHeld',
          3: 'accepted',
          4: 'declined',
          5: 'expired',
          6: 'released',
        } as Record<number, string>
      )[this.effectiveProposalStatus(proposal)] ?? 'proposed'
    );
  }

  priorityLevel(score: number): string {
    return score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'normal' : 'low';
  }
  priorityFactors(entry: WaitingListEntry): readonly string[] {
    return entry.priorityExplanation
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  priorityFactorKey(factor: string): string {
    return `scheduling.waitingList.priorityFactors.${factor.split(':')[0]}`;
  }
  priorityFactorPoints(factor: string): string {
    const match = factor.match(/([+-]\d+)/);
    return match?.[1] ?? '';
  }
  bookingTypeKey(type: number): string {
    return `scheduling.bookings.type.${type}`;
  }
  studentLabel(id: string): string {
    return (
      this.resources().find(
        (x) => this.resourceTypeCode(x.resourceType) === '1' && x.externalResourceId === id,
      )?.displayName ?? id.slice(0, 8)
    );
  }
  instructorLabel(id: string | null): string {
    return id
      ? (this.resources().find(
          (x) => this.resourceTypeCode(x.resourceType) === '2' && x.externalResourceId === id,
        )?.displayName ?? id.slice(0, 8))
      : '—';
  }
  branchLabel(id: string | null): string {
    return id
      ? (this.resources().find(
          (x) =>
            this.resourceTypeCode(x.resourceType) === '5' &&
            (x.externalResourceId === id || x.id === id),
        )?.displayName ?? id.slice(0, 8))
      : '—';
  }
  warningKey(value: string): string {
    return `scheduling.slotSearch.warnings.${value.split('.').pop() ?? value}`;
  }
  reasonKey(value: string): string {
    return `scheduling.slotSearch.reasons.${value.split('.').pop() ?? value}`;
  }

  effectiveEntryStatus(entry: WaitingListEntry): number {
    if (![7, 8].includes(entry.status) && new Date(entry.expiresAtUtc).getTime() <= Date.now())
      return 6;
    if (entry.status === 3 && !entry.proposals.some((p) => this.effectiveProposalStatus(p) === 2))
      return 1;
    return entry.status;
  }

  effectiveProposalStatus(proposal: WaitingListProposal): number {
    if (
      [1, 2].includes(proposal.status) &&
      (new Date(proposal.expiresAtUtc).getTime() <= Date.now() ||
        (proposal.heldUntilUtc && new Date(proposal.heldUntilUtc).getTime() <= Date.now()))
    )
      return 5;
    return proposal.status;
  }

  private resourcesByType(type: string): readonly CalendarResource[] {
    return this.resources().filter(
      (x) => this.resourceTypeCode(x.resourceType) === type && x.status === 'Active',
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

  private resetCreate(): void {
    this.studentId.set(this.students()[0]?.externalResourceId ?? '');
    this.bookingType.set(1);
    this.searchTrainingCategory.set('');
    this.preferredFrom.set(this.toLocalDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    this.preferredTo.set(this.toLocalDateTime(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)));
    this.durationMinutes.set(60);
    this.preferredBranchId.set('');
    this.preferredInstructorId.set('');
    this.reason.set('');
    this.expiresAt.set(this.toLocalDateTime(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
    this.examAt.set('');
    this.noFutureSession.set(false);
    this.interruptionDays.set(0);
    this.pedagogicalUrgency.set(0);
    this.schoolCancellation.set(false);
    this.limitedAvailability.set(false);
    this.regulatoryPriority.set(false);
    this.commercialPriority.set(false);
    this.manualAdjustment.set(0);
    this.manualAdjustmentReason.set('');
  }

  private asIso(value: string): string | null {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  private toLocalDateTime(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  }
}
