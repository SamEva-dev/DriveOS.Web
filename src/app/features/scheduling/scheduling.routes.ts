import { Routes } from '@angular/router';

export const SCHEDULING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/scheduling-shell/scheduling-shell.component').then(
        (m) => m.SchedulingShellComponent,
      ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/scheduling-dashboard/scheduling-dashboard.page').then(
            (m) => m.SchedulingDashboardPage,
          ),
        data: { titleKey: 'scheduling.dashboard.title' },
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./pages/scheduling-calendar/scheduling-calendar.page').then(
            (m) => m.SchedulingCalendarPage,
          ),
        data: { titleKey: 'scheduling.calendar.title' },
      },
      {
        path: 'slot-search',
        loadComponent: () =>
          import('./pages/scheduling-slot-search/scheduling-slot-search.page').then(
            (m) => m.SchedulingSlotSearchPage,
          ),
        data: { titleKey: 'scheduling.slotSearch.title' },
      },
      { path: 'find-slot', redirectTo: 'slot-search', pathMatch: 'full' },
      {
        path: 'bookings/new',
        loadComponent: () =>
          import('./pages/scheduling-calendar/scheduling-calendar.page').then(
            (m) => m.SchedulingCalendarPage,
          ),
        data: { titleKey: 'scheduling.bookingCreate.title' },
      },
      {
        path: 'bookings/:bookingId/reschedule',
        loadComponent: () =>
          import('./pages/scheduling-reschedule/scheduling-reschedule.page').then(
            (m) => m.SchedulingReschedulePage,
          ),
        data: { titleKey: 'scheduling.reschedule.title' },
      },
      {
        path: 'bookings/:bookingId/cancel',
        loadComponent: () =>
          import('./pages/scheduling-cancel/scheduling-cancel.page').then(
            (m) => m.SchedulingCancelPage,
          ),
        data: { titleKey: 'scheduling.cancel.title' },
      },
      {
        path: 'bookings/:bookingId/attendance',
        loadComponent: () =>
          import('./pages/scheduling-attendance/scheduling-attendance.page').then(
            (m) => m.SchedulingAttendancePage,
          ),
        data: { titleKey: 'scheduling.attendance.title' },
      },
      {
        path: 'bookings/:bookingId/absence',
        redirectTo: 'bookings/:bookingId/attendance',
        pathMatch: 'full',
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./pages/scheduling-availability/scheduling-availability.page').then(
            (m) => m.SchedulingAvailabilityPage,
          ),
        data: { titleKey: 'scheduling.availability.title' },
      },
      {
        path: 'recurrences',
        loadComponent: () =>
          import('./pages/scheduling-recurrence/scheduling-recurrence.page').then(
            (m) => m.SchedulingRecurrencePage,
          ),
        data: { titleKey: 'scheduling.recurrence.title' },
      },
      { path: 'recurrence', redirectTo: 'recurrences', pathMatch: 'full' },
      {
        path: 'conflicts',
        loadComponent: () =>
          import('./pages/scheduling-conflicts/scheduling-conflicts.page').then(
            (m) => m.SchedulingConflictsPage,
          ),
        data: { titleKey: 'scheduling.conflictInbox.title' },
      },
      {
        path: 'replacements/instructor',
        loadComponent: () =>
          import('./pages/scheduling-instructor-replacement/scheduling-instructor-replacement.page').then(
            (m) => m.SchedulingInstructorReplacementPage,
          ),
        data: { titleKey: 'scheduling.instructorReplacement.title' },
      },
      {
        path: 'replacements/vehicle',
        loadComponent: () =>
          import('./pages/scheduling-vehicle-replacement/scheduling-vehicle-replacement.page').then(
            (m) => m.SchedulingVehicleReplacementPage,
          ),
        data: { titleKey: 'scheduling.vehicleReplacement.title' },
      },
      {
        path: 'travel',
        loadComponent: () =>
          import('./pages/scheduling-travel/scheduling-travel.page').then(
            (m) => m.SchedulingTravelPage,
          ),
        data: { titleKey: 'scheduling.travel.title' },
      },
      {
        path: 'waiting-list',
        loadComponent: () =>
          import('./pages/scheduling-waiting-list/scheduling-waiting-list.page').then(
            (m) => m.SchedulingWaitingListPage,
          ),
        data: { titleKey: 'scheduling.waitingList.title' },
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/scheduling-availability/scheduling-availability.page').then(
            (m) => m.SchedulingAvailabilityPage,
          ),
        data: { titleKey: 'scheduling.tabs.resources', availabilityContext: 'resources' },
      },
      {
        path: 'capacity',
        loadComponent: () =>
          import('./pages/scheduling-capacity/scheduling-capacity.page').then(
            (m) => m.SchedulingCapacityPage,
          ),
        data: { titleKey: 'scheduling.capacity.title' },
      },
    ],
  },
];
