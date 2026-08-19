import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { FUNDING_BILLING_PERMISSIONS } from '../../../funding-billing/domain/funding-billing-permissions';
import { PEDAGOGY_PERMISSIONS } from '../../../pedagogy/domain/pedagogy-permissions';
import { StudentOverview } from '../../models/student.models';
import { DriveOsBadgeComponent } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';

interface StudentTab {
  route: string;
  labelKey: string;
  icon: string;
  permissions?: readonly string[];
}
@Component({
  selector: 'driveos-student-shell-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsSpinnerComponent,
  ],
  templateUrl: './student-shell.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentShellPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(StudentsApiService);
  private readonly authorization = inject(AuthorizationService);
  readonly studentId = this.route.snapshot.paramMap.get('studentId') ?? '';
  readonly overview = signal<StudentOverview | null>(null);
  readonly loading = signal(true);
  private readonly tabs: readonly StudentTab[] = [
    { route: 'overview', labelKey: 'students.tabs.overview', icon: 'ph-squares-four' },
    {
      route: 'profile',
      labelKey: 'students.tabs.profile',
      icon: 'ph-identification-card',
      permissions: [STUDENT_PERMISSIONS.identity, STUDENT_PERMISSIONS.administration],
    },
    {
      route: 'enrollment/administration',
      labelKey: 'students.tabs.enrollment',
      icon: 'ph-file-text',
      permissions: [STUDENT_PERMISSIONS.enrollment],
    },
    {
      route: 'contracts',
      labelKey: 'students.tabs.contracts',
      icon: 'ph-file-lock',
      permissions: [STUDENT_PERMISSIONS.contractsRead],
    },
    {
      route: 'finance',
      labelKey: 'students.tabs.finance',
      icon: 'ph-wallet',
      permissions: [FUNDING_BILLING_PERMISSIONS.summaryRead],
    },
    {
      route: 'pedagogy',
      labelKey: 'students.tabs.pedagogy',
      icon: 'ph-graduation-cap',
      permissions: [PEDAGOGY_PERMISSIONS.summaryRead],
    },
    {
      route: 'assignments/branches',
      labelKey: 'students.tabs.assignments',
      icon: 'ph-map-pin',
      permissions: STUDENT_PERMISSIONS.assignments,
    },
    {
      route: 'statuses',
      labelKey: 'students.tabs.statuses',
      icon: 'ph-shield-warning',
      permissions: [STUDENT_PERMISSIONS.statuses],
    },
    {
      route: 'mobility/internal-transfers',
      labelKey: 'students.tabs.mobility',
      icon: 'ph-arrows-left-right',
      permissions: STUDENT_PERMISSIONS.mobility,
    },
    {
      route: 'lifecycle/suspensions',
      labelKey: 'students.tabs.lifecycle',
      icon: 'ph-arrows-clockwise',
      permissions: STUDENT_PERMISSIONS.lifecycle,
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter(
      (tab) => !tab.permissions || this.authorization.hasAny(tab.permissions),
    );
  });
  constructor() {
    this.api.getOverview(this.studentId).subscribe({
      next: (v) => {
        this.overview.set(v);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
