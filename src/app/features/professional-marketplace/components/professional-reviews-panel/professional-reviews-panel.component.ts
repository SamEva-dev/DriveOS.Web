import { Observable } from 'rxjs';
import {ChangeDetectionStrategy,Component,computed,effect,inject,input,signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe,TranslateService} from '@ngx-translate/core';
import {AuthorizationService} from '../../../../core/auth/authorization.service';
import {ApiErrorService} from '../../../../core/errors/api-error.service';
import {AuthService} from '../../../../core/services/auth.service';
import {DriveOsDrawerComponent} from '../../../../shared/ui/drawer/driveos-drawer.component';
import {ProfessionalMarketplaceApiService} from '../../data-access/professional-marketplace-api.service';
import {PROFESSIONAL_MARKETPLACE_PERMISSIONS} from '../../domain/professional-marketplace-permissions';
import {ProfessionalEngagement} from '../../models/professional-engagement.model';
import {ModeratedProfessionalReview,ProfessionalReview,ProfessionalReviewModeration,ProfessionalReputation} from '../../models/professional-review.model';

@Component({selector:'driveos-professional-reviews-panel',standalone:true,imports:[FormsModule,TranslatePipe,DatePipe,DriveOsDrawerComponent],templateUrl:'./professional-reviews-panel.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ProfessionalReviewsPanelComponent{
 private readonly api=inject(ProfessionalMarketplaceApiService);private readonly auth=inject(AuthService);private readonly authorization=inject(AuthorizationService);private readonly errors=inject(ApiErrorService);private readonly translate=inject(TranslateService);
 readonly profileId=input.required<string>();readonly organizationId=computed(()=>this.auth.user()?.organizationId??'');
 readonly reputation=signal<ProfessionalReputation|null>(null);readonly moderation=signal<ProfessionalReviewModeration|null>(null);readonly engagements=signal<readonly ProfessionalEngagement[]>([]);readonly myProfileId=signal<string|null>(null);readonly loading=signal(false);readonly messages=signal<readonly string[]>([]);readonly activeTab=signal<'reputation'|'moderation'>('reputation');
 readonly canCreate=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.reviews.create));readonly canRespond=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.reviews.respond)&&this.myProfileId()===this.profileId());readonly canReport=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.reviews.report));readonly canModerate=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.moderation.read));readonly canHide=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.moderation.hideContent));readonly canManageModeration=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.moderation.manage));readonly canResolveReport=computed(()=>this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.moderation.resolveReport));
 readonly completedEngagements=computed(()=>this.engagements().filter(x=>x.activatedAtUtc&&(['Ended','Terminated'] as const).includes(x.status as 'Ended'|'Terminated')));
 readonly drawerOpen=signal(false);readonly drawerMode=signal<'create'|'respond'|'report'|'moderate'>('create');readonly selectedReview=signal<ProfessionalReview|ModeratedProfessionalReview|null>(null);readonly busy=signal(false);
 engagementId='';overall=5;reliability=5;pedagogy=5;communication=5;punctuality=5;comment='';response='';reasonCode='INAPPROPRIATE_CONTENT';details='';moderationReason='';resolution='';
 constructor(){effect(()=>{const id=this.profileId();if(id)this.load();});}
 load(){this.loading.set(true);this.messages.set([]);this.api.getProfessionalReputation(this.profileId()).subscribe({next:x=>{this.reputation.set(x);this.loading.set(false);},error:e=>{this.loading.set(false);this.messages.set(this.errors.getMessages(e));}});if(this.canCreate()&&this.organizationId())this.api.listProfessionalEngagements(this.organizationId(),this.profileId()).subscribe({next:x=>this.engagements.set(x)});if(this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.reviews.respond))this.api.getMyProfessionalProfile().subscribe({next:x=>this.myProfileId.set(x.id),error:()=>this.myProfileId.set(null)});if(this.canModerate())this.loadModeration();}
 loadModeration(){this.api.getProfessionalReviewModeration(this.profileId()).subscribe({next:x=>this.moderation.set(x),error:e=>this.messages.set(this.errors.getMessages(e))});}
 openCreate(){this.drawerMode.set('create');this.selectedReview.set(null);this.engagementId=this.completedEngagements()[0]?.id??'';this.overall=this.reliability=this.pedagogy=this.communication=this.punctuality=5;this.comment='';this.drawerOpen.set(true);}
 openRespond(r:ProfessionalReview){this.drawerMode.set('respond');this.selectedReview.set(r);this.response=r.professionalResponse??'';this.drawerOpen.set(true);}
 openReport(r:ProfessionalReview){this.drawerMode.set('report');this.selectedReview.set(r);this.reasonCode='INAPPROPRIATE_CONTENT';this.details='';this.drawerOpen.set(true);}
 openModerate(r:ModeratedProfessionalReview){this.drawerMode.set('moderate');this.selectedReview.set(r);this.moderationReason='';this.resolution='';this.drawerOpen.set(true);}
 close(){if(!this.busy())this.drawerOpen.set(false);}
 submit(){const review=this.selectedReview();this.busy.set(true);this.messages.set([]);let req: Observable<unknown>;if(this.drawerMode()==='create')req=this.api.createProfessionalReview(this.organizationId(),this.engagementId,{overall:this.overall,reliability:this.reliability,pedagogy:this.pedagogy,communication:this.communication,punctuality:this.punctuality,comment:this.comment.trim()||null});else if(this.drawerMode()==='respond'&&review)req=this.api.respondProfessionalReview(this.profileId(),review.id,this.response.trim());else if(this.drawerMode()==='report'&&review)req=this.api.reportProfessionalReview(this.organizationId(),review.id,this.reasonCode,this.details.trim()||null);else{this.busy.set(false);return;}req.subscribe({next:()=>{this.busy.set(false);this.drawerOpen.set(false);this.load();},error:(e:unknown)=>{this.busy.set(false);this.messages.set(this.errors.getMessages(e));}});}
 hide(){const r=this.selectedReview();if(!r||this.moderationReason.trim().length<2)return;this.busy.set(true);this.api.hideProfessionalReview(r.id,this.moderationReason.trim()).subscribe({next:()=>{this.busy.set(false);this.drawerOpen.set(false);this.load();},error:(e:unknown)=>{this.busy.set(false);this.messages.set(this.errors.getMessages(e));}});}
 restore(){const r=this.selectedReview();if(!r)return;this.busy.set(true);this.api.restoreProfessionalReview(r.id).subscribe({next:()=>{this.busy.set(false);this.drawerOpen.set(false);this.load();},error:(e:unknown)=>{this.busy.set(false);this.messages.set(this.errors.getMessages(e));}});}
 resolveReport(reportId:string){if(this.resolution.trim().length<2)return;this.busy.set(true);this.api.resolveProfessionalReviewReport(reportId,this.resolution.trim()).subscribe({next:()=>{this.busy.set(false);this.resolution='';this.loadModeration();},error:(e:unknown)=>{this.busy.set(false);this.messages.set(this.errors.getMessages(e));}});}
 stars(value:number){return Array.from({length:5},(_,i)=>i<Math.round(value));}
}
