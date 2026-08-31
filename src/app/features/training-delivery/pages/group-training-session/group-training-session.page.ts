import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { StudentsApiService } from '../../../students/data-access/students-api.service';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import {
  GroupTrainingSession,
  GroupTrainingSessionParticipant,
} from '../../models/group-training-session.models';

@Component({
  selector: 'driveos-group-training-session',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DriveOsDrawerComponent],
  templateUrl: './group-training-session.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupTrainingSessionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TrainingDeliveryApiService);
  private readonly students = inject(StudentsApiService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly session = signal<GroupTrainingSession | null>(null);
  readonly names = signal<Record<string, string>>({});
  readonly tab = signal<'attendance' | 'report' | 'assessments' | 'certificates'>('attendance');
  readonly drawer = signal<'participant' | 'assessment' | 'report' | null>(null);
  readonly selected = signal<GroupTrainingSessionParticipant | null>(null);
  newStudentId = '';
  report = '';
  objectives = '';
  assessmentLevel: number | null = null;
  quizScore: number | null = null;
  observation = '';
  readonly seatsRemaining = computed(() =>
    Math.max(0, (this.session()?.capacity ?? 0) - (this.session()?.registeredCount ?? 0)),
  );
  constructor() {
    this.load();
  }
  load() {
    const id = this.route.snapshot.paramMap.get('sessionId')!;
    this.loading.set(true);
    this.api
      .getGroupSession(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((s) => {
        this.session.set(s);
        this.report = s.collectiveReport ?? '';
        this.objectives = s.sharedObjectives ?? '';
        this.loadNames();
      });
  }
  loadNames() {
    this.students
      .getStudents({
        pageNumber: 1,
        pageSize: 100,
        search: '',
        sortBy: 'Name',
        sortDirection: 'Ascending',
      })
      .pipe(catchError(() => of({ items: [] } as any)))
      .subscribe((p) =>
        this.names.set(
          Object.fromEntries(
            (p.items ?? []).map((x: any) => [x.studentId, `${x.firstName} ${x.lastName}`]),
          ),
        ),
      );
  }
  name(id: string) {
    return this.names()[id] ?? id.slice(0, 8);
  }
  attendance(p: GroupTrainingSessionParticipant, status: number) {
    this.mutate(this.api.recordGroupAttendance(this.session()!.id, p.studentId, status, 1));
  }
  openAssessment(p: GroupTrainingSessionParticipant) {
    this.selected.set(p);
    this.assessmentLevel = p.assessmentLevel;
    this.quizScore = p.quizScore;
    this.observation = p.individualObservation ?? '';
    this.drawer.set('assessment');
  }
  saveAssessment() {
    const p = this.selected();
    if (!p) return;
    this.mutate(
      this.api.recordGroupAssessment(this.session()!.id, {
        studentId: p.studentId,
        competencyId: p.competencyId,
        level: this.assessmentLevel,
        quizScore: this.quizScore,
        observation: this.observation || null,
      }),
    );
    this.drawer.set(null);
  }
  addParticipant() {
    if (!this.newStudentId.trim()) return;
    this.mutate(this.api.addGroupParticipant(this.session()!.id, this.newStudentId.trim()));
    this.newStudentId = '';
    this.drawer.set(null);
  }
  saveReport() {
    if (!this.report.trim()) return;
    this.mutate(this.api.saveGroupReport(this.session()!.id, this.report, this.objectives || null));
    this.drawer.set(null);
  }
  certificate(p: GroupTrainingSessionParticipant) {
    this.mutate(this.api.prepareGroupCertificate(this.session()!.id, p.studentId));
  }
  private mutate(obs: any) {
    this.saving.set(true);
    obs
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe((s: GroupTrainingSession) => this.session.set(s));
  }
}
