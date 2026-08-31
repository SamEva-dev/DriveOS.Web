import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { StudentsApiService } from '../../../students/data-access/students-api.service';
import { StudentListItem } from '../../../students/models/student.models';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { ProfessionalStudentAssignment } from '../../models/professional-student-assignment.model';

@Component({
  selector: 'driveos-professional-student-assignment-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './professional-student-assignment-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalStudentAssignmentDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly studentsApi = inject(StudentsApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly missionId = input<string | null>(null);
  readonly assignment = input<ProfessionalStudentAssignment | null>(null);
  readonly missionStartsOn = input<string>('');
  readonly missionEndsOn = input<string>('');
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  readonly isCreate = computed(() => !this.assignment());
  readonly canManage = computed(() =>
    this.authorization.hasPermission(
      PROFESSIONAL_MARKETPLACE_PERMISSIONS.studentAssignments.manage,
    ),
  );
  readonly canRevoke = computed(() =>
    this.authorization.hasPermission(
      PROFESSIONAL_MARKETPLACE_PERMISSIONS.studentAssignments.revoke,
    ),
  );
  readonly students = signal<readonly StudentListItem[]>([]);
  readonly loadingStudents = signal(false);
  readonly busy = signal(false);
  readonly messages = signal<readonly string[]>([]);
  readonly revokeMode = signal(false);
  search = '';
  selectedStudentId = '';
  startsOn = '';
  endsOn = '';
  scopeCode = 'PEDAGOGICAL';
  assignmentReason = '';
  revocationReason = '';
  constructor() {
    effect(() => {
      if (this.open() && this.isCreate()) {
        this.startsOn = this.missionStartsOn();
        this.endsOn = this.missionEndsOn();
        this.searchStudents();
      }
      if (!this.open()) {
        this.messages.set([]);
        this.revokeMode.set(false);
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  searchStudents() {
    this.loadingStudents.set(true);
    this.studentsApi
      .getStudents({
        pageNumber: 1,
        pageSize: 50,
        search: this.search,
        sortBy: 'Name',
        sortDirection: 'Ascending',
      })
      .subscribe({
        next: (p) => {
          this.students.set(p.items);
          this.loadingStudents.set(false);
        },
        error: (e) => {
          this.messages.set(this.errors.getMessages(e));
          this.loadingStudents.set(false);
        },
      });
  }
  create() {
    if (
      !this.selectedStudentId ||
      !this.startsOn ||
      !this.endsOn ||
      this.scopeCode.trim().length < 2 ||
      this.assignmentReason.trim().length < 2
    ) {
      this.messages.set([
        this.translate.instant('professionalMarketplace.studentAssignments.errors.required'),
      ]);
      return;
    }
    this.busy.set(true);
    this.api
      .assignProfessionalStudent(this.organizationId(), this.missionId()!, {
        studentId: this.selectedStudentId,
        startsOn: this.startsOn,
        endsOn: this.endsOn,
        scopeCode: this.scopeCode.trim(),
        assignmentReason: this.assignmentReason.trim(),
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.changed.emit();
          this.closeRequested.emit();
        },
        error: (e) => {
          this.busy.set(false);
          this.messages.set(this.errors.getMessages(e));
        },
      });
  }
  revoke() {
    if (this.revocationReason.trim().length < 2) {
      this.messages.set([
        this.translate.instant('professionalMarketplace.studentAssignments.errors.reason'),
      ]);
      return;
    }
    this.busy.set(true);
    this.api
      .revokeProfessionalStudentAssignment(
        this.organizationId(),
        this.assignment()!.id,
        this.revocationReason.trim(),
      )
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.changed.emit();
          this.closeRequested.emit();
        },
        error: (e) => {
          this.busy.set(false);
          this.messages.set(this.errors.getMessages(e));
        },
      });
  }
}
