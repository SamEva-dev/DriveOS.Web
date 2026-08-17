import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentClosurePanelComponent } from '../../components/student-closure-panel/student-closure-panel.component';
import { StudentReactivationPanelComponent } from '../../components/student-reactivation-panel/student-reactivation-panel.component';
import { StudentSuspensionPanelComponent } from '../../components/student-suspension-panel/student-suspension-panel.component';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import { EnrollmentClosure, EnrollmentReactivation, EnrollmentSuspension } from '../../models/student.models';

type LifecycleSection = 'suspensions' | 'reactivations' | 'closures';
interface LifecycleTab {
  id: LifecycleSection;
  route: string;
  labelKey: string;
  icon: string;
  permissions: readonly string[];
}

@Component({
  selector: 'driveos-student-lifecycle-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentSuspensionPanelComponent,
    StudentReactivationPanelComponent,
    StudentClosurePanelComponent,
  ],
  templateUrl: './student-lifecycle.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentLifecyclePage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly LifecycleTab[] = [
    {
      id: 'suspensions',
      route: 'suspensions',
      labelKey: 'students.lifecycle.tabs.suspensions',
      icon: 'ph-pause-circle',
      permissions: [STUDENT_PERMISSIONS.suspend],
    },
    {
      id: 'reactivations',
      route: 'reactivations',
      labelKey: 'students.lifecycle.tabs.reactivations',
      icon: 'ph-play-circle',
      permissions: [STUDENT_PERMISSIONS.reactivate, STUDENT_PERMISSIONS.complianceRead],
    },
    {
      id: 'closures',
      route: 'closure',
      labelKey: 'students.lifecycle.tabs.closures',
      icon: 'ph-archive',
      permissions: [STUDENT_PERMISSIONS.read],
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasAll(tab.permissions));
  });
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly selected = signal<LifecycleSection>(
    (this.route.snapshot.data['section'] as LifecycleSection | undefined) ?? 'suspensions',
  );
  readonly suspensions = signal<readonly EnrollmentSuspension[] | null>(null);
  readonly reactivations = signal<readonly EnrollmentReactivation[] | null>(null);
  readonly closures = signal<readonly EnrollmentClosure[] | null>(null);
  readonly loading = signal(true);
  constructor() {
    const requested = this.selected();
    const first = this.visibleTabs()[0];
    if (!this.visibleTabs().some((tab) => tab.id === requested) && first) this.selected.set(first.id);
    this.load();
  }
  load(): void {
    const id = this.studentId;
    this.loading.set(true);
    const suspensions$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.suspend)
      ? this.api.getSuspensions(id).pipe(catchError(() => of(null)))
      : of(null);
    const reactivations$ = this.authorization.hasAll([
      STUDENT_PERMISSIONS.reactivate,
      STUDENT_PERMISSIONS.complianceRead,
    ])
      ? this.api.getReactivations(id).pipe(catchError(() => of(null)))
      : of(null);
    const closures$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.read)
      ? this.api.getClosures(id).pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({
      suspensions: suspensions$,
      reactivations: reactivations$,
      closures: closures$,
    }).subscribe((data) => {
      this.suspensions.set(data.suspensions);
      this.reactivations.set(data.reactivations);
      this.closures.set(data.closures);
      this.loading.set(false);
    });
  }
}
