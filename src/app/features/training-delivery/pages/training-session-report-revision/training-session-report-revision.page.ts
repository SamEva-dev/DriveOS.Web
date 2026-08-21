import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { TrainingDeliveryApiService } from '../../data-access/training-delivery-api.service';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../domain/training-delivery-permissions';
import { TrainingSessionDetail, TrainingSessionReportRevision } from '../../models/training-session-detail.models';

@Component({ selector: 'app-training-session-report-revision', standalone: true, imports: [CommonModule, FormsModule, TranslatePipe, DriveOsDrawerComponent], templateUrl: './training-session-report-revision.page.html', changeDetection: ChangeDetectionStrategy.OnPush })
export class TrainingSessionReportRevisionPage {
  private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly api = inject(TrainingDeliveryApiService); private readonly authorization = inject(AuthorizationService);
  readonly sessionId = this.route.snapshot.paramMap.get('sessionId') ?? '';
  readonly session = signal<TrainingSessionDetail | null>(null); readonly revisions = signal<readonly TrainingSessionReportRevision[]>([]); readonly loading = signal(true); readonly drawerOpen = signal(false); readonly decisionRevision = signal<TrainingSessionReportRevision | null>(null); readonly saving = signal(false);
  readonly canRequest = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.requestCorrection) || this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.dispute));
  readonly canApprove = computed(() => this.authorization.hasPermission(TRAINING_DELIVERY_PERMISSIONS.reports.approveCorrection));
  scenario = 1; fieldCode = 'deliveredDurationMinutes'; proposedValue = ''; reason = ''; hasFinancialImpact = true; approvalRequired = true; decisionReason = '';
  readonly currentValue = computed(() => { const s=this.session(); if(!s) return ''; if(this.fieldCode==='deliveredDurationMinutes') return String(s.deliveredDurationMinutes ?? ''); if(this.fieldCode==='summary') return s.report?.summary ?? ''; if(this.fieldCode==='nextObjective') return s.report?.nextObjective ?? ''; if(this.fieldCode==='sharedComment') return s.report?.sharedComment ?? ''; return ''; });
  constructor(){ this.load(); }
  load(){ this.loading.set(true); this.api.getSession(this.sessionId).subscribe(s=>{this.session.set(s);this.api.getReportRevisions(this.sessionId).subscribe(r=>{this.revisions.set(r);this.loading.set(false);});}); }
  back(){ void this.router.navigate(['/training/sessions',this.sessionId],{queryParams:{tab:'report'}}); }
  openRequest(){ this.decisionRevision.set(null); this.drawerOpen.set(true); }
  openDecision(r:TrainingSessionReportRevision){ this.decisionRevision.set(r); this.decisionReason=''; this.drawerOpen.set(true); }
  submit(){ if(!this.reason.trim()||!this.proposedValue.trim()||this.saving())return; this.saving.set(true); this.api.requestReportRevision(this.sessionId,{operationId:crypto.randomUUID(),expectedVersion:this.session()?.report?.version ?? 0,scenario:this.scenario,fieldCode:this.fieldCode,currentValue:this.currentValue(),proposedValue:this.proposedValue.trim(),reason:this.reason.trim(),hasFinancialImpact:this.hasFinancialImpact,approvalRequired:this.approvalRequired}).subscribe({next:()=>{this.drawerOpen.set(false);this.saving.set(false);this.load();},error:()=>this.saving.set(false)}); }
  decide(approve:boolean){ const r=this.decisionRevision(); if(!r||this.saving())return; this.saving.set(true); this.api.decideReportRevision(this.sessionId,r.id,approve,this.decisionReason.trim()||null).subscribe({next:()=>{this.drawerOpen.set(false);this.saving.set(false);this.load();},error:()=>this.saving.set(false)}); }
}
