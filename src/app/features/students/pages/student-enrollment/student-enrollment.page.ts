import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsBadgeComponent } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { StudentEnrollmentChecklistPanelComponent } from '../../components/student-enrollment-checklist-panel/student-enrollment-checklist-panel.component';
import { StudentDocumentsPanelComponent } from '../../components/student-documents-panel/student-documents-panel.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import {
  EnrollmentChecklist,
  StudentDocuments,
  StudentOverview,
} from '../../models/student.models';

type EnrollmentSection = 'summary' | 'checklist' | 'documents';
interface EnrollmentTab {
  id: EnrollmentSection;
  route: string;
  labelKey: string;
  icon: string;
  permission: string;
}

@Component({
  selector: 'driveos-student-enrollment-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentEnrollmentChecklistPanelComponent,
    StudentDocumentsPanelComponent,
  ],
  templateUrl: './student-enrollment.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentEnrollmentPage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly EnrollmentTab[] = [
    {
      id: 'summary',
      route: 'administration',
      labelKey: 'students.enrollment.tabs.summary',
      icon: 'ph-file-text',
      permission: STUDENT_PERMISSIONS.enrollment,
    },
    {
      id: 'checklist',
      route: 'checklist',
      labelKey: 'students.enrollment.tabs.checklist',
      icon: 'ph-check-square',
      permission: STUDENT_PERMISSIONS.checklist,
    },
    {
      id: 'documents',
      route: 'documents',
      labelKey: 'students.enrollment.tabs.documents',
      icon: 'ph-files',
      permission: STUDENT_PERMISSIONS.documents,
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly selected = signal<EnrollmentSection>(
    (this.route.snapshot.data['section'] as EnrollmentSection | undefined) ?? 'summary',
  );
  readonly overview = signal<StudentOverview | null>(null);
  readonly checklist = signal<EnrollmentChecklist | null>(null);
  readonly documents = signal<StudentDocuments | null>(null);
  readonly loading = signal(true);

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
    const overview$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.enrollment)
      ? this.api.getOverview(id).pipe(catchError(() => of(null)))
      : of(null);
    const checklist$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.checklist)
      ? this.api.getEnrollmentChecklist(id).pipe(catchError(() => of(null)))
      : of(null);
    const documents$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.documents)
      ? this.api.getDocuments(id).pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({ overview: overview$, checklist: checklist$, documents: documents$ }).subscribe(
      (data) => {
        this.overview.set(data.overview);
        this.checklist.set(data.checklist);
        this.documents.set(data.documents);
        this.loading.set(false);
      },
    );
  }
}
