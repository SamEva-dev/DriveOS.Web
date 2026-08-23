import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatusBadgeComponent, DriveOsStatusTone } from '../../../../shared/ui/status-badge/driveos-status-badge.component';
import { WorkforceApiService } from '../../data-access/workforce-api.service';
import { EmployeeSummary } from '../../models/workforce.models';

@Component({
  selector: 'driveos-employee-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsFormAlertComponent,
    DriveOsPageHeaderComponent,
    DriveOsSpinnerComponent,
    DriveOsStatusBadgeComponent,
  ],
  templateUrl: './employee-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListPage {
  private readonly api = inject(WorkforceApiService);
  private readonly apiErrors = inject(ApiErrorService);

  readonly employees = signal<readonly EmployeeSummary[]>([]);
  readonly loading = signal(true);
  readonly errors = signal<readonly string[]>([]);
  readonly search = signal('');
  readonly status = signal('');

  readonly filteredEmployees = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    return this.employees().filter((employee) => {
      const matchesStatus = !status || employee.status === status;
      const matchesSearch = !term ||
        employee.employeeNumber.toLowerCase().includes(term) ||
        employee.personId.toLowerCase().includes(term) ||
        (employee.userId ?? '').toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  readonly statuses = ['Draft', 'Onboarding', 'Active', 'Suspended', 'OnLeave', 'Ending', 'Ended'] as const;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errors.set([]);
    this.api.getEmployees().subscribe({
      next: (employees) => {
        this.employees.set(employees);
        this.loading.set(false);
      },
      error: (error) => {
        this.errors.set(this.apiErrors.getMessages(error));
        this.loading.set(false);
      },
    });
  }

  statusTone(status: string): DriveOsStatusTone {
    switch (status) {
      case 'Active': return 'success';
      case 'Onboarding': return 'info';
      case 'Suspended':
      case 'Ending': return 'warning';
      case 'Ended': return 'neutral';
      default: return 'neutral';
    }
  }
}
