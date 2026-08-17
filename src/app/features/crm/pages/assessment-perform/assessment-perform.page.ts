import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import {
  DriveOsButtonComponent,
  DriveOsCardComponent,
  DriveOsSpinnerComponent,
  DriveOsStateBannerComponent,
  DriveOsToastService,
} from '../../../../shared/ui';
import { AssessmentSessionsApiService } from '../../data-access/assessment-sessions-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import {
  AssessmentAnswer,
  AssessmentAppointment,
  AssessmentQuestionnaireSnapshot,
  AssessmentSession,
} from '../../models/assessment-session.model';

const INITIAL_QUESTIONNAIRE: AssessmentQuestionnaireSnapshot = {
  title: 'Évaluation initiale permis B',
  questions: [
    {
      id: 'experience',
      section: 'Parcours',
      label: 'Expérience préalable de la conduite',
      required: true,
      options: scoreOptions(),
    },
    {
      id: 'rules',
      section: 'Connaissances',
      label: 'Connaissance des règles essentielles',
      required: true,
      options: scoreOptions(),
    },
    {
      id: 'installation',
      section: 'Pratique',
      label: 'Installation et prise en main',
      required: true,
      options: scoreOptions(),
    },
    {
      id: 'observation',
      section: 'Pratique',
      label: 'Observation et prise d’information',
      required: true,
      options: scoreOptions(),
    },
    {
      id: 'coordination',
      section: 'Pratique',
      label: 'Coordination et manipulation des commandes',
      required: true,
      options: scoreOptions(),
    },
    {
      id: 'risk',
      section: 'Comportement',
      label: 'Perception du risque et attitude',
      required: true,
      options: scoreOptions(),
    },
  ],
};

function scoreOptions() {
  return [
    { value: '0', label: 'Non observé' },
    { value: '1', label: 'À construire' },
    { value: '2', label: 'En cours d’acquisition' },
    { value: '3', label: 'Acquis' },
  ];
}

@Component({
  selector: 'driveos-assessment-perform-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    TranslatePipe,
    DriveOsButtonComponent,
    DriveOsCardComponent,
    DriveOsSpinnerComponent,
    DriveOsStateBannerComponent,
  ],
  templateUrl: './assessment-perform.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssessmentPerformPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(AssessmentSessionsApiService);
  private readonly auth = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(DriveOsToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  readonly appointment = signal<AssessmentAppointment | null>(null);
  readonly session = signal<AssessmentSession | null>(null);
  readonly questionnaire = signal<AssessmentQuestionnaireSnapshot>(INITIAL_QUESTIONNAIRE);
  readonly step = signal(0);
  readonly loading = signal(true);
  readonly starting = signal(false);
  readonly saving = signal(false);
  readonly submitting = signal(false);
  readonly loadFailed = signal(false);
  readonly savedAt = signal<string | null>(null);
  readonly canStart = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.start));
  readonly canComplete = computed(
    () =>
      this.auth.hasPermission(CRM_PERMISSIONS.assessments.complete) &&
      this.auth.hasPermission(CRM_PERMISSIONS.assessments.notesCreate),
  );
  readonly canSubmit = computed(() => this.auth.hasPermission(CRM_PERMISSIONS.assessments.submit));
  readonly isSubmitted = computed(() => this.session()?.status === 'Submitted');
  readonly questions = computed(() => this.questionnaire().questions);
  readonly answeredCount = computed(
    () => this.answers().filter((answer) => answer.value !== '').length,
  );
  readonly completion = computed(() =>
    this.questions().length
      ? Math.round((this.answeredCount() * 100) / this.questions().length)
      : 0,
  );
  readonly answers = signal<AssessmentAnswer[]>([]);

  readonly notesForm = this.fb.nonNullable.group({
    factualObservations: [''],
    pedagogicalInterpretation: [''],
    recommendation: [''],
    internalNotes: [''],
    prospectComment: [''],
  });

  private readonly appointmentId = this.route.snapshot.paramMap.get('appointmentId');

  constructor() {
    if (!this.appointmentId) {
      void this.router.navigate(['/crm']);
      return;
    }
    this.load();
    this.notesForm.valueChanges
      .pipe(
        debounceTime(1200),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        filter(() => !!this.session() && !this.isSubmitted() && this.canComplete()),
        switchMap(() => this.save(false, true)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  answer(questionId: string, value: string): void {
    this.answers.update((items) => [
      ...items.filter((item) => item.questionId !== questionId),
      { questionId, value },
    ]);
    if (this.session() && this.canComplete())
      this.save(false, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  answerValue(questionId: string): string {
    return this.answers().find((item) => item.questionId === questionId)?.value ?? '';
  }
  back(): void {
    void this.router.navigate(['/crm/leads', this.appointment()?.leadId]);
  }
  previous(): void {
    this.step.update((value) => Math.max(0, value - 1));
  }
  next(): void {
    this.step.update((value) => Math.min(2, value + 1));
  }

  start(): void {
    if (!this.appointmentId || !this.canStart()) return;
    this.starting.set(true);
    this.api
      .start(this.appointmentId, 'FR-PERMIS-B-INITIAL', 1, INITIAL_QUESTIONNAIRE)
      .pipe(
        switchMap(() => this.api.getSession(this.appointmentId!)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (session) => {
          this.starting.set(false);
          this.applySession(session);
        },
        error: (error) => {
          this.starting.set(false);
          this.showError(error);
        },
      });
  }

  saveManually(): void {
    this.save(false, false).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  submit(): void {
    if (!this.appointmentId || !this.canSubmit() || this.completion() < 100) return;
    this.submitting.set(true);
    this.save(true, false)
      .pipe(
        switchMap(() => this.api.submit(this.appointmentId!)),
        switchMap(() => this.api.getSession(this.appointmentId!)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (session) => {
          this.submitting.set(false);
          this.applySession(session);
          this.toast.success(this.translate.instant('crm.assessments.perform.submitted'));
        },
        error: (error) => {
          this.submitting.set(false);
          this.showError(error);
        },
      });
  }

  private load(): void {
    if (!this.appointmentId) return;
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .getAppointment(this.appointmentId)
      .pipe(
        tap((appointment) => this.appointment.set(appointment)),
        switchMap(() => this.api.getSession(this.appointmentId!)),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) return of(null);
          this.loadFailed.set(true);
          this.showError(error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((session) => {
        if (session) this.applySession(session);
        this.loading.set(false);
      });
  }

  private save(draftCompleted: boolean, silent: boolean) {
    if (!this.appointmentId) return of(undefined);
    const notes = this.notesForm.getRawValue();
    this.saving.set(true);
    return this.api
      .saveDraft(this.appointmentId, {
        answers: this.answers(),
        factualObservations: notes.factualObservations.trim() || null,
        pedagogicalInterpretation: notes.pedagogicalInterpretation.trim() || null,
        recommendation: notes.recommendation.trim() || null,
        internalNotes: notes.internalNotes.trim() || null,
        prospectComment: notes.prospectComment.trim() || null,
        draftCompleted,
      })
      .pipe(
        tap(() => {
          this.saving.set(false);
          this.savedAt.set(new Date().toISOString());
          if (!silent) this.toast.success(this.translate.instant('crm.assessments.perform.saved'));
        }),
        catchError((error) => {
          this.saving.set(false);
          this.showError(error);
          return throwError(() => error);
        }),
      );
  }

  private applySession(session: AssessmentSession): void {
    this.session.set(session);
    try {
      this.questionnaire.set(JSON.parse(session.questionnaireSnapshotJson));
    } catch {
      this.questionnaire.set(INITIAL_QUESTIONNAIRE);
    }
    try {
      this.answers.set(JSON.parse(session.answersJson));
    } catch {
      this.answers.set([]);
    }
    this.notesForm.patchValue(
      {
        factualObservations: session.factualObservations ?? '',
        pedagogicalInterpretation: session.pedagogicalInterpretation ?? '',
        recommendation: session.recommendation ?? '',
        internalNotes: session.internalNotes ?? '',
        prospectComment: session.prospectComment ?? '',
      },
      { emitEvent: false },
    );
    this.savedAt.set(session.lastSavedAtUtc);
    if (session.status === 'Submitted') this.notesForm.disable({ emitEvent: false });
  }

  private showError(error: HttpErrorResponse): void {
    for (const message of this.errors.getMessages(error))
      this.toast.error(this.translate.instant('errors.title'), message);
  }
}
