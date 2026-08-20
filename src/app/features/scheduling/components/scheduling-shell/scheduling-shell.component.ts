import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SCHEDULING_PERMISSIONS } from '../../domain/scheduling-permissions';
import { AuthorizationService } from '../../../../core/auth/authorization.service';

interface SchedulingTab {
  readonly route: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly permissions: readonly string[];
}

@Component({
  selector: 'driveos-scheduling-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './scheduling-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulingShellComponent {
  private readonly authorization = inject(AuthorizationService);

  private readonly tabs: readonly SchedulingTab[] = [
    {
      route: 'dashboard',
      labelKey: 'scheduling.tabs.dashboard',
      icon: 'ph ph-squares-four',
      permissions: [SCHEDULING_PERMISSIONS.bookings.read],
    },
    {
      route: 'calendar',
      labelKey: 'scheduling.tabs.calendar',
      icon: 'ph ph-calendar-dots',
      permissions: [SCHEDULING_PERMISSIONS.bookings.read],
    },
    {
      route: 'slot-search',
      labelKey: 'scheduling.tabs.slotSearch',
      icon: 'ph ph-calendar-magnifying-glass',
      permissions: [SCHEDULING_PERMISSIONS.slotSearch],
    },
    {
      route: 'availability',
      labelKey: 'scheduling.tabs.availability',
      icon: 'ph ph-clock-countdown',
      permissions: [SCHEDULING_PERMISSIONS.availability.read],
    },
    {
      route: 'recurrences',
      labelKey: 'scheduling.tabs.recurrence',
      icon: 'ph ph-arrows-clockwise',
      permissions: [
        SCHEDULING_PERMISSIONS.recurrence.create,
        SCHEDULING_PERMISSIONS.recurrence.update,
        SCHEDULING_PERMISSIONS.recurrence.cancel,
        SCHEDULING_PERMISSIONS.bookings.read,
      ],
    },
    {
      route: 'conflicts',
      labelKey: 'scheduling.tabs.conflicts',
      icon: 'ph ph-warning-diamond',
      permissions: [SCHEDULING_PERMISSIONS.conflicts.read],
    },
    {
      route: 'replacements/instructor',
      labelKey: 'scheduling.tabs.replacements',
      icon: 'ph ph-user-switch',
      permissions: [
        SCHEDULING_PERMISSIONS.instructorReplacement.read,
        SCHEDULING_PERMISSIONS.vehicleReplacement.read,
      ],
    },
    {
      route: 'waiting-list',
      labelKey: 'scheduling.tabs.waitingList',
      icon: 'ph ph-list-checks',
      permissions: [SCHEDULING_PERMISSIONS.waitingList.read],
    },
    {
      route: 'travel',
      labelKey: 'scheduling.tabs.travel',
      icon: 'ph ph-route',
      permissions: [SCHEDULING_PERMISSIONS.travel.read],
    },
    {
      route: 'resources',
      labelKey: 'scheduling.tabs.resources',
      icon: 'ph ph-cube',
      permissions: [SCHEDULING_PERMISSIONS.resources.read],
    },
    {
      route: 'capacity',
      labelKey: 'scheduling.tabs.capacity',
      icon: 'ph ph-chart-line-up',
      permissions: [SCHEDULING_PERMISSIONS.capacity.read],
    },
  ];

  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasAny(tab.permissions));
  });
}
