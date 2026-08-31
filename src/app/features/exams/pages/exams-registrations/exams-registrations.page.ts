import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { ExamsApiService } from '../../data-access/exams-api.service';
import { EXAMS_PERMISSIONS } from '../../domain/exams-permissions';
import {
  ExamPlaceHold,
  ExamRegistration,
  ExamRegistrationFile,
  ExamRegistrationSubmission,
} from '../../models/exams.models';

type RegistrationTab = 'overview' | 'file' | 'submissions';
type RegistrationDrawer = 'create' | 'officialData' | 'officialResponse' | null;
@Component({
  selector: 'driveos-exams-registrations-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsDrawerComponent,
    DriveOsEmptyStateComponent,
  ],
  templateUrl: './exams-registrations.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsRegistrationsPage {
  private readonly api = inject(ExamsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  studentId = '';
  readonly items = signal<readonly ExamRegistration[]>([]);
  readonly selected = signal<ExamRegistration | null>(null);
  readonly file = signal<ExamRegistrationFile | null>(null);
  readonly submissions = signal<readonly ExamRegistrationSubmission[]>([]);
  readonly hold = signal<ExamPlaceHold | null>(null);
  readonly messages = signal<readonly string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly activeTab = signal<RegistrationTab>('overview');
  readonly drawerMode = signal<RegistrationDrawer>(null);
  readonly selectedSubmission = signal<ExamRegistrationSubmission | null>(null);
  createForm = { studentId: '', trainingPathId: '', examPlaceId: '', holdMinutes: 5 };
  candidateReference = '';
  responseForm = {
    outcome: 'Accepted',
    externalSubmissionId: '',
    externalRegistrationId: '',
    candidateReference: '',
    providerResponseCode: '',
    providerResponseJson: '',
    providerErrorCode: '',
  };
  readonly canCreate = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.registrations.create),
  );
  readonly canUpdate = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.registrations.update),
  );
  readonly canSubmit = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.registrations.submit),
  );
  readonly canResolve = computed(() =>
    this.auth.hasPermission(EXAMS_PERMISSIONS.registrations.resolveErrors),
  );
  load(): void {
    if (!this.studentId.trim()) return;
    this.loading.set(true);
    this.messages.set([]);
    this.api.getStudentRegistrations(this.studentId.trim()).subscribe({
      next: (v) => {
        this.items.set(v);
        this.loading.set(false);
        if (this.selected()) {
          const refreshed = v.find((x) => x.id === this.selected()!.id) || null;
          this.selected.set(refreshed);
        }
      },
      error: (e) => this.fail(e),
    });
  }
  select(item: ExamRegistration): void {
    this.selected.set(item);
    this.activeTab.set('overview');
    this.loadContext(item.id);
  }
  private loadContext(id: string): void {
    this.api.getRegistrationFile(id).subscribe({
      next: (v) => {
        this.file.set(v);
        this.candidateReference = v.candidateReference || '';
      },
      error: () => this.file.set(null),
    });
    this.api
      .getRegistrationSubmissions(id)
      .subscribe({ next: (v) => this.submissions.set(v), error: () => this.submissions.set([]) });
  }
  open(mode: Exclude<RegistrationDrawer, null>, submission?: ExamRegistrationSubmission): void {
    this.drawerMode.set(mode);
    if (submission) this.selectedSubmission.set(submission);
  }
  close(): void {
    this.drawerMode.set(null);
    this.selectedSubmission.set(null);
  }
  startHold(): void {
    if (!this.createForm.examPlaceId.trim()) return;
    this.saving.set(true);
    this.api
      .holdPlace(this.createForm.examPlaceId.trim(), Number(this.createForm.holdMinutes))
      .subscribe({
        next: (v) => {
          this.hold.set(v);
          this.saving.set(false);
        },
        error: (e) => this.fail(e, true),
      });
  }
  releaseHold(): void {
    const h = this.hold();
    if (!h) return;
    this.api
      .releasePlace(h.examPlaceId, h.holdToken)
      .subscribe({ next: () => this.hold.set(null), error: (e) => this.fail(e) });
  }
  createRegistration(): void {
    const h = this.hold();
    if (!h) return;
    this.saving.set(true);
    const f = this.createForm;
    this.api
      .createRegistration({
        studentId: f.studentId.trim(),
        trainingPathId: f.trainingPathId.trim(),
        examPlaceId: f.examPlaceId.trim(),
        holdToken: h.holdToken,
        operationId: crypto.randomUUID(),
      })
      .subscribe({
        next: (v) => {
          this.saving.set(false);
          this.hold.set(null);
          this.close();
          this.studentId = v.studentId || f.studentId;
          this.load();
          this.selected.set(v);
          this.loadContext(v.id);
        },
        error: (e) => this.fail(e, true),
      });
  }
  refreshFile(): void {
    const r = this.selected();
    if (!r || !this.canUpdate()) return;
    this.saving.set(true);
    this.api.refreshRegistrationFile(r.id).subscribe({
      next: (v) => {
        this.file.set(v);
        this.saving.set(false);
      },
      error: (e) => this.fail(e, true),
    });
  }
  saveOfficialData(): void {
    const r = this.selected();
    if (!r) return;
    this.saving.set(true);
    this.api.updateRegistrationOfficialData(r.id, this.candidateReference.trim()).subscribe({
      next: (v) => {
        this.file.set(v);
        this.saving.set(false);
        this.close();
      },
      error: (e) => this.fail(e, true),
    });
  }
  submit(): void {
    const r = this.selected();
    if (!r) return;
    this.saving.set(true);
    this.api.submitRegistration(r.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadContext(r.id);
        this.activeTab.set('submissions');
      },
      error: (e) => this.fail(e, true),
    });
  }
  retry(s: ExamRegistrationSubmission): void {
    const r = this.selected();
    if (!r) return;
    this.saving.set(true);
    this.api.retryRegistrationSubmission(r.id, s.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadContext(r.id);
      },
      error: (e) => this.fail(e, true),
    });
  }
  saveOfficialResponse(): void {
    const r = this.selected(),
      s = this.selectedSubmission();
    if (!r || !s) return;
    this.saving.set(true);
    const f = this.responseForm;
    this.api
      .recordRegistrationOfficialResponse(r.id, s.id, {
        outcome: f.outcome,
        externalSubmissionId: f.externalSubmissionId.trim() || null,
        externalRegistrationId: f.externalRegistrationId.trim() || null,
        candidateReference: f.candidateReference.trim() || null,
        providerResponseCode: f.providerResponseCode.trim() || null,
        providerResponseJson: f.providerResponseJson.trim() || null,
        providerErrorCode: f.providerErrorCode.trim() || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.close();
          this.loadContext(r.id);
          this.load();
        },
        error: (e) => this.fail(e, true),
      });
  }
  private fail(e: HttpErrorResponse, saving = false): void {
    this.messages.set(this.errors.getMessages(e));
    this.loading.set(false);
    if (saving) this.saving.set(false);
  }
}
