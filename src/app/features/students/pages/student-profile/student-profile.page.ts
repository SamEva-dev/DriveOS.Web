import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsBadgeComponent } from '../../../../shared/ui/badge/driveos-badge.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStateBannerComponent } from '../../../../shared/ui/state-banner/driveos-state-banner.component';
import { StudentAdministrationPanelComponent } from '../../components/student-administration-panel/student-administration-panel.component';
import { StudentGuardiansPanelComponent } from '../../components/student-guardians-panel/student-guardians-panel.component';
import { StudentRelationshipsPanelComponent } from '../../components/student-relationships-panel/student-relationships-panel.component';
import { StudentsApiService } from '../../data-access/students-api.service';
import { STUDENT_PERMISSIONS } from '../../domain/student-permissions';
import {
  StudentAdministration,
  StudentGuardians,
  StudentIdentity,
  VerifyStudentIdentityRequest,
  StudentRelationships,
} from '../../models/student.models';

type ProfileSection = 'identity' | 'administration' | 'guardians' | 'relationships';
interface ProfileTab {
  id: ProfileSection;
  labelKey: string;
  icon: string;
  permission: string;
}

@Component({
  selector: 'driveos-student-profile-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsEmptyStateComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
    StudentAdministrationPanelComponent,
    StudentGuardiansPanelComponent,
    StudentRelationshipsPanelComponent,
  ],
  templateUrl: './student-profile.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentProfilePage {
  private readonly api = inject(StudentsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly ProfileTab[] = [
    {
      id: 'identity',
      labelKey: 'students.profile.tabs.identity',
      icon: 'ph-identification-card',
      permission: STUDENT_PERMISSIONS.identity,
    },
    {
      id: 'administration',
      labelKey: 'students.profile.tabs.administration',
      icon: 'ph-clipboard-text',
      permission: STUDENT_PERMISSIONS.administration,
    },
    {
      id: 'guardians',
      labelKey: 'students.profile.tabs.guardians',
      icon: 'ph-users-three',
      permission: STUDENT_PERMISSIONS.guardians,
    },
    {
      id: 'relationships',
      labelKey: 'students.profile.tabs.relationships',
      icon: 'ph-address-book',
      permission: STUDENT_PERMISSIONS.relationshipsRead,
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasPermission(tab.permission));
  });
  readonly selected = signal<ProfileSection>('identity');
  readonly identity = signal<StudentIdentity | null>(null);
  readonly administration = signal<StudentAdministration | null>(null);
  readonly guardians = signal<StudentGuardians | null>(null);
  readonly relationships = signal<StudentRelationships | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly studentId = this.route.parent?.snapshot.paramMap.get('studentId') ?? '';
  readonly canEditIdentity = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.identityUpdate),
  );
  readonly canVerifyIdentity = computed(() =>
    this.authorization.hasPermission(STUDENT_PERMISSIONS.identityVerify),
  );
  readonly verificationOpen = signal(false);
  readonly verificationStatus = signal<VerifyStudentIdentityRequest['status']>('DocumentVerified');
  readonly verificationJustification = signal('');
  readonly verificationSubmitting = signal(false);
  readonly verificationSuccess = signal(false);
  readonly verificationError = signal(false);

  constructor() {
    const first = this.visibleTabs()[0];
    if (first) this.selected.set(first.id);
    this.load();
  }
  select(section: ProfileSection): void {
    if (this.visibleTabs().some((tab) => tab.id === section)) this.selected.set(section);
  }
  openVerification(): void {
    this.verificationStatus.set('DocumentVerified');
    this.verificationJustification.set('');
    this.verificationSuccess.set(false);
    this.verificationError.set(false);
    this.verificationOpen.set(true);
  }

  cancelVerification(): void {
    if (!this.verificationSubmitting()) this.verificationOpen.set(false);
  }

  submitVerification(): void {
    const justification = this.verificationJustification().trim();
    if (!this.canVerifyIdentity() || justification.length < 10 || this.verificationSubmitting())
      return;

    this.verificationSubmitting.set(true);
    this.verificationSuccess.set(false);
    this.verificationError.set(false);
    this.api
      .verifyIdentity(this.studentId, {
        status: this.verificationStatus(),
        justification,
      })
      .subscribe({
        next: (identity) => {
          this.identity.set(identity);
          this.verificationSubmitting.set(false);
          this.verificationSuccess.set(true);
          this.verificationOpen.set(false);
        },
        error: () => {
          this.verificationSubmitting.set(false);
          this.verificationError.set(true);
        },
      });
  }

  load(): void {
    const id = this.studentId;
    this.loading.set(true);
    this.error.set(false);
    const identity$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.identity)
      ? this.api.getIdentity(id).pipe(catchError(() => of(null)))
      : of(null);
    const administration$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.administration)
      ? this.api.getAdministration(id).pipe(catchError(() => of(null)))
      : of(null);
    const guardians$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.guardians)
      ? this.api.getGuardians(id).pipe(catchError(() => of(null)))
      : of(null);
    const relationships$ = this.authorization.hasPermission(STUDENT_PERMISSIONS.relationshipsRead)
      ? this.api.getRelationships(id).pipe(catchError(() => of(null)))
      : of(null);
    forkJoin({
      identity: identity$,
      administration: administration$,
      guardians: guardians$,
      relationships: relationships$,
    }).subscribe({
      next: (data) => {
        this.identity.set(data.identity);
        this.administration.set(data.administration);
        this.guardians.set(data.guardians);
        this.relationships.set(data.relationships);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
