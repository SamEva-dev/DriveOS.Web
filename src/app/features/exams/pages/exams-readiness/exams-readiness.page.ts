import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { ExamsApiService } from '../../data-access/exams-api.service';
import { EXAMS_PERMISSIONS } from '../../domain/exams-permissions';
import { ExamReadinessDecision, ExamReadinessOpinion, ExamReadinessOpinionContext, ExamReadinessSnapshot } from '../../models/exams.models';

type ReadinessTab = 'decision'|'opinion'|'history';
type DrawerMode = 'decision'|'opinion'|null;

@Component({selector:'driveos-exams-readiness-page',standalone:true,imports:[FormsModule,DatePipe,JsonPipe,TranslatePipe,DriveOsButtonComponent,DriveOsDrawerComponent,DriveOsEmptyStateComponent],templateUrl:'./exams-readiness.page.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ExamsReadinessPage {
  private readonly api=inject(ExamsApiService); private readonly auth=inject(AuthorizationService); private readonly errors=inject(ApiErrorService);
  studentId=''; trainingPathId='';
  readonly decision=signal<ExamReadinessDecision|null>(null); readonly snapshot=signal<ExamReadinessSnapshot|null>(null); readonly opinionContext=signal<ExamReadinessOpinionContext|null>(null); readonly opinions=signal<readonly ExamReadinessOpinion[]>([]);
  readonly messages=signal<readonly string[]>([]); readonly loading=signal(false); readonly saving=signal(false); readonly activeTab=signal<ReadinessTab>('decision'); readonly drawerMode=signal<DrawerMode>(null);
  outcome='Ready'; rationale=''; conditions=''; opinion='Favorable'; observedAutonomy='Autonomous'; reservations=''; opinionConditions=''; comment=''; reservationCodes='';
  readonly canDecide=computed(()=>this.auth.hasPermission(EXAMS_PERMISSIONS.readiness.decide));
  readonly canEvaluate=computed(()=>this.auth.hasPermission(EXAMS_PERMISSIONS.readiness.evaluate));
  readonly canReadOpinions=computed(()=>this.auth.hasPermission(EXAMS_PERMISSIONS.readiness.readOpinions));
  readonly canSubmitOpinion=computed(()=>this.auth.hasPermission(EXAMS_PERMISSIONS.readiness.submitOpinion));

  load():void {
    if(!this.studentId.trim()||!this.trainingPathId.trim()) return;
    this.loading.set(true); this.messages.set([]);
    const studentId=this.studentId.trim(), trainingPathId=this.trainingPathId.trim();
    this.api.getReadinessSnapshot(studentId,trainingPathId).subscribe({next:s=>{this.snapshot.set(s);this.loadDecision(studentId,trainingPathId);},error:e=>this.fail(e)});
    if(this.canEvaluate()) this.api.getReadinessOpinionContext(studentId,trainingPathId).subscribe({next:v=>this.opinionContext.set(v),error:()=>this.opinionContext.set(null)});
    if(this.canReadOpinions()) this.api.getReadinessOpinions(studentId,trainingPathId).subscribe({next:v=>this.opinions.set(v),error:()=>this.opinions.set([])});
  }
  private loadDecision(studentId:string,trainingPathId:string):void { this.api.getReadiness(studentId,trainingPathId).subscribe({next:d=>{this.decision.set(d);this.loading.set(false);},error:()=>{this.decision.set(null);this.loading.set(false);}}); }
  open(mode:Exclude<DrawerMode,null>):void { this.drawerMode.set(mode); }
  close():void { this.drawerMode.set(null); }
  saveDecision():void { if(!this.canDecide())return; this.saving.set(true); this.api.recordReadinessDecision(this.studentId.trim(),{trainingPathId:this.trainingPathId.trim(),outcome:this.outcome,rationale:this.rationale.trim(),conditions:this.conditions.trim()||null}).subscribe({next:()=>{this.saving.set(false);this.close();this.load();},error:e=>this.fail(e,true)}); }
  saveOpinion():void { if(!this.canSubmitOpinion())return; this.saving.set(true); const codes=this.reservationCodes.split(',').map(x=>x.trim()).filter(Boolean); this.api.submitReadinessOpinion(this.studentId.trim(),{trainingPathId:this.trainingPathId.trim(),opinion:this.opinion,observedAutonomy:this.observedAutonomy,reservationCodes:codes,reservations:this.reservations.trim()||null,conditions:this.opinionConditions.trim()||null,comment:this.comment.trim()||null,operationId:crypto.randomUUID()}).subscribe({next:()=>{this.saving.set(false);this.close();this.load();this.activeTab.set('history');},error:e=>this.fail(e,true)}); }
  private fail(error:HttpErrorResponse,saving=false):void { this.messages.set(this.errors.getMessages(error)); this.loading.set(false); if(saving)this.saving.set(false); }
}
