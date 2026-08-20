import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentsApiService } from '../../data-access/students-api.service';
import { StudentBranchesPanelComponent } from '../../components/student-branches-panel/student-branches-panel.component';
import { StudentInstructorsPanelComponent } from '../../components/student-instructors-panel/student-instructors-panel.component';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { StudentBranches, StudentInstructors } from '../../models/student.models';

type AssignmentSection = 'branches' | 'instructors' | 'history';
interface AssignmentTab {
  id: AssignmentSection;
  route: string;
  labelKey: string;
  icon: string;
  permission: string;
}

@Component({
  selector: 'driveos-student-assignments-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentBranchesPanelComponent,
    StudentInstructorsPanelComponent,
  ],
  templateUrl: './student-assignments.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentAssignmentsPage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly AssignmentTab[] = [
    {
      id: 'branches',
      route: 'branches',
      labelKey: 'students.assignments.tabs.branches',
      icon: 'ph-buildings',
      permission: STUDENT_PERMISSIONS.branchesRead,
    },
    {
      id: 'instructors',
      route: 'instructors',
      labelKey: 'students.assignments.tabs.instructors',
      icon: 'ph-chalkboard-teacher',
      permission: STUDENT_PERMISSIONS.instructorsRead,
    },
    {
      id: 'history',
      route: 'history',
      labelKey: 'students.assignments.tabs.history',
      icon: 'ph-clock-counter-clockwise',
      permission: STUDENT_PERMISSIONS.instructorsRead,
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly selected = signal<AssignmentSection>(
    (this.route.snapshot.data['section'] as AssignmentSection | undefined) ?? 'branches',
  );
  readonly branches = signal<StudentBranches | null>(null);
  readonly instructors = signal<StudentInstructors | null>(null);
  readonly loading = signal(true);
  readonly activeBranches = computed(
    () => this.branches()?.assignments.filter((item) => item.status === 'Active') ?? [],
  );
  readonly activeInstructors = computed(
    () => this.instructors()?.assignments.filter((item) => item.status === 'Active') ?? [],
  );
  constructor() {
    const requested = this.selected();
    const first = this.visibleTabs()[0];
    if (!this.visibleTabs().some((tab) => tab.id === requested) && first)
      this.selected.set(first.id);
    this.load();
  }
  load(): void {
    const id = this.studentId;
    this.loading.set(true);
    const branches$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.branchesRead)
      ? this.api.getBranches(id).pipe(catchError(() => of(null)))
      : of(null);
    const instructors$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.instructorsRead)
      ? this.api.getInstructors(id).pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({ branches: branches$, instructors: instructors$ }).subscribe((data) => {
      this.branches.set(data.branches);
      this.instructors.set(data.instructors);
      this.loading.set(false);
    });
  }
}
