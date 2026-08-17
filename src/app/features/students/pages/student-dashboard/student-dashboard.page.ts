import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { StudentsApiService } from '../../data-access/students-api.service';
import { StudentDashboard } from '../../models/student.models';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';

@Component({
  selector: 'driveos-student-dashboard-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './student-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardPage {
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  readonly dashboard = signal<StudentDashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly canCreateEnrollment = () =>
    this.authorization.hasAll([STUDENT_PERMISSIONS.create, STUDENT_PERMISSIONS.enrollmentCreate]);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getDashboard().subscribe({
      next: (value) => {
        this.dashboard.set(value);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
