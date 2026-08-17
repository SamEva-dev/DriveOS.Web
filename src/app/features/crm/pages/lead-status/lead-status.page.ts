import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { LeadsApiService } from '../../data-access/leads-api.service';
import { LeadClosureReason, LeadStatus } from '../../models/lead.model';

@Component({
  selector: 'app-lead-status',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lead-status.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadStatusPage {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(LeadsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly leadId = this.route.snapshot.paramMap.get('leadId')!;
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly decisions: LeadStatus[] = [
    'Lost',
    'NotEligible',
    'OutOfScope',
    'Duplicate',
    'NoResponse',
    'CancelledByLead',
    'ConvertedElsewhere',
  ];
  readonly reasons: LeadClosureReason[] = [
    'PriceTooHigh',
    'FinancingRejected',
    'DelayTooLong',
    'TrainingUnavailable',
    'AreaNotCovered',
    'CompetitorChosen',
    'Unavailable',
    'ProjectPostponed',
    'NoResponse',
    'EligibilityConditionNotMet',
    'Duplicate',
    'CancelledByLead',
    'ConvertedElsewhere',
    'Other',
  ];
  readonly form = this.fb.nonNullable.group({
    mode: ['lost' as 'lost' | 'dormant' | 'partner' | 'reopen'],
    decision: ['Lost' as LeadStatus],
    reason: ['Other' as LeadClosureReason],
    comment: [''],
    resumeAtUtc: [''],
    responsibleUserId: [''],
    campaignCode: [''],
    partnerName: [''],
    sharedDataDescription: [''],
    consent: [false],
    consentCollectedAtUtc: [''],
  });

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    let request: Observable<void>;
    if (v.mode === 'dormant') {
      if (!v.resumeAtUtc || !v.responsibleUserId) {
        this.error.set('Date de reprise et responsable requis.');
        return;
      }
      request = this.api.setDormant(this.leadId, {
        reason: v.reason,
        resumeAtUtc: new Date(v.resumeAtUtc).toISOString(),
        responsibleUserId: v.responsibleUserId,
        campaignCode: v.campaignCode.trim() || null,
        comment: v.comment.trim() || null,
      });
    } else if (v.mode === 'partner') {
      if (
        !v.partnerName.trim() ||
        !v.sharedDataDescription.trim() ||
        !v.consent ||
        !v.consentCollectedAtUtc
      ) {
        this.error.set('Partenaire, données partagées et consentement sont requis.');
        return;
      }
      request = this.api.referToPartner(this.leadId, {
        partnerName: v.partnerName.trim(),
        sharedDataDescription: v.sharedDataDescription.trim(),
        consentCollectedAtUtc: new Date(v.consentCollectedAtUtc).toISOString(),
        comment: v.comment.trim() || null,
      });
    } else if (v.mode === 'reopen')
      request = this.api.reopen(this.leadId, v.comment.trim() || null);
    else
      request = this.api.close(this.leadId, {
        decision: v.decision,
        reason: v.reason,
        comment: v.comment.trim() || null,
      });
    this.saving.set(true);
    this.error.set(null);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => void this.router.navigate(['/app/crm/leads', this.leadId]),
      error: () => this.error.set('Le changement de statut a échoué.'),
    });
  }
}
