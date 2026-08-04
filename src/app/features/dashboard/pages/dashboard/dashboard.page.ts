import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { DashboardDemoService } from '../../data-access/dashboard-demo.service';
import { DashboardIcon } from '../../models/dashboard.model';

@Component({
  selector: 'driveos-dashboard-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly dashboard = inject(DashboardDemoService);

  readonly metrics = this.dashboard.getMetrics();
  readonly quickActions = this.dashboard.getQuickActions();
  readonly agenda = this.dashboard.getAgenda();
  readonly alerts = this.dashboard.getAlerts();
  readonly activities = this.dashboard.getActivities();

  readonly selectedMonth = signal(new Date().getMonth());
  readonly selectedYear = signal(new Date().getFullYear());
  readonly refreshing = signal(false);

  readonly months = Array.from({ length: 12 }, (_, index) => index);
  readonly years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - 1 + index);

  readonly periodLabel = computed(
    () => `dashboard.months.${this.selectedMonth()}`,
  );

  setMonth(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isInteger(value) && value >= 0 && value <= 11) {
      this.selectedMonth.set(value);
    }
  }

  setYear(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isInteger(value)) {
      this.selectedYear.set(value);
    }
  }

  refresh(): void {
    if (this.refreshing()) {
      return;
    }

    this.refreshing.set(true);
    window.setTimeout(() => this.refreshing.set(false), 450);
  }

  iconPath(icon: DashboardIcon): string {
    const paths: Record<DashboardIcon, string> = {
      building: 'M4 21V7l8-4 8 4v14M9 21v-5h6v5M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01',
      student: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
      instructor: 'M15 19a6 6 0 0 0-12 0M9 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 5h6M19 2v6',
      vehicle: 'M5 17h14M6 17l-1-5 2-5h10l2 5-1 5M7 17v2M17 17v2M7 12h.01M17 12h.01',
      wallet: 'M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V6M16 13h.01',
      exam: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
      alert: 'M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01',
      document: 'M14 2H6a2 2 0 0 0-2 2v16h16V8ZM14 2v6h6M8 13h8M8 17h8',
      chart: 'M3 3v18h18M7 16l4-5 4 3 5-7',
      plus: 'M12 5v14M5 12h14',
      refresh: 'M20 11a8 8 0 1 0 2 5.3M20 4v7h-7',
    };

    return paths[icon];
  }
}
