import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { AuthUser } from '../../../../core/auth/models/auth-user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { DriveOsBadgeComponent, DriveOsButtonComponent, DriveOsEmptyStateComponent, DriveOsInputDirective,
  DriveOsPaginatorComponent, DriveOsSpinnerComponent, DriveOsStateBannerComponent, DriveOsTableDirective,
  DriveOsPageChange, DriveOsAuthUserPickerComponent, DriveOsToastService } from '../../../../shared/ui';
import { CrmLeadPickerComponent } from '../../components/lead-picker/crm-lead-picker.component';
import { CrmActivitiesApiService } from '../../data-access/crm-activities-api.service';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';
import { ActivityFilters, CrmActivity, CrmActivityPage, CrmActivityType } from '../../models/crm-activity.model';
import { LeadListItem } from '../../models/lead.model';

type ActivityState='nominal'|'empty'|'unattached'|'imported'|'syncError'|'readOnly'|'duplicate'|'loading'|'partialError';
interface StateTab{id:ActivityState;permission:string}
const EMPTY_PAGE:CrmActivityPage={items:[],pageNumber:1,pageSize:20,totalCount:0,totalPages:0};
@Component({selector:'driveos-activity-list-page',standalone:true,imports:[DatePipe,DecimalPipe,ReactiveFormsModule,TranslatePipe,
  DriveOsBadgeComponent,DriveOsButtonComponent,DriveOsEmptyStateComponent,DriveOsInputDirective,
  DriveOsPaginatorComponent,DriveOsSpinnerComponent,DriveOsStateBannerComponent,DriveOsTableDirective,
  DriveOsAuthUserPickerComponent,CrmLeadPickerComponent],
  templateUrl:'./activity-list.page.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ActivityListPage{
  private readonly api=inject(CrmActivitiesApiService);private readonly auth=inject(AuthorizationService);
  private readonly router=inject(Router);private readonly fb=inject(FormBuilder);private readonly destroyRef=inject(DestroyRef);
  private readonly authService=inject(AuthService);private readonly toast=inject(DriveOsToastService);private readonly tr=inject(TranslateService);
  private readonly tabs:readonly StateTab[]=[
    {id:'nominal',permission:CRM_PERMISSIONS.activities.tabs.nominal},{id:'empty',permission:CRM_PERMISSIONS.activities.tabs.empty},
    {id:'unattached',permission:CRM_PERMISSIONS.activities.tabs.unattached},{id:'imported',permission:CRM_PERMISSIONS.activities.tabs.imported},
    {id:'syncError',permission:CRM_PERMISSIONS.activities.tabs.syncError},{id:'readOnly',permission:CRM_PERMISSIONS.activities.tabs.readOnly},
    {id:'duplicate',permission:CRM_PERMISSIONS.activities.tabs.duplicate},{id:'loading',permission:CRM_PERMISSIONS.activities.tabs.loading},
    {id:'partialError',permission:CRM_PERMISSIONS.activities.tabs.partialError}];
  readonly visibleTabs=computed(()=>{this.auth.permissions();return this.tabs.filter(x=>this.auth.hasPermission(x.permission));});
  readonly selectedState=signal<ActivityState>('nominal');readonly tabsVisible=signal(sessionStorage.getItem('driveos.crm.activities.states.visible')!=='false');
  readonly page=signal<CrmActivityPage>(EMPTY_PAGE);readonly loading=signal(false);readonly error=signal(false);
  readonly drawerOpen=signal(false);readonly filtersOpen=signal(false);readonly saving=signal(false);
  readonly attachDrawerOpen=signal(false);readonly invalidateDrawerOpen=signal(false);readonly selectedActivity=signal<CrmActivity|null>(null);
  readonly actionMenuId=signal<string|null>(null);readonly actionError=signal(false);
  readonly attachmentFile=signal<File|null>(null);
  readonly organizationId=computed(()=>this.authService.user()?.organizationId??'');
  readonly canCreate=computed(()=>this.auth.hasPermission(CRM_PERMISSIONS.activities.create)&&this.selectedState()!=='readOnly');
  readonly canCreateUnattached=computed(()=>this.auth.hasPermission(CRM_PERMISSIONS.activities.createUnattached));
  readonly canSync=computed(()=>this.selectedState()!=='readOnly'&&this.auth.hasPermission(CRM_PERMISSIONS.activities.syncManage));
  readonly canInvalidate=computed(()=>this.selectedState()!=='readOnly'&&this.auth.hasPermission(CRM_PERMISSIONS.activities.invalidate));
  readonly canAttach=computed(()=>this.selectedState()!=='readOnly'&&this.auth.hasPermission(CRM_PERMISSIONS.activities.attach));
  readonly canCreateInternal=computed(()=>this.auth.hasPermission(CRM_PERMISSIONS.activities.internalNotesCreate));
  readonly canUploadAttachment=computed(()=>this.auth.hasPermission(CRM_PERMISSIONS.activities.attachmentsUpload));
  readonly canReadAttachment=computed(()=>this.auth.hasPermission(CRM_PERMISSIONS.activities.attachmentsRead));
  readonly canDeleteAttachment=computed(()=>this.selectedState()!=='readOnly'&&this.auth.hasPermission(CRM_PERMISSIONS.activities.attachmentsDelete));
  readonly search=new FormControl('',{nonNullable:true});
  readonly filters=this.fb.nonNullable.group({type:['' as CrmActivityType|''],advisorUserId:[''],leadId:[''],unattachedOnly:[false],
    importedOnly:[false],syncErrorsOnly:[false],duplicatesOnly:[false],regularizationOnly:[false],unfollowedOnly:[false],fromUtc:[''],toUtc:['']});
  readonly createForm=this.fb.group({leadId:[''],type:['Call' as CrmActivityType,Validators.required],direction:['Outbound'],
    subject:['',[Validators.required,Validators.maxLength(200)]],occurredAtUtc:[this.localNow(),Validators.required],result:[''],
    durationMinutes:[null as number|null,[Validators.min(0),Validators.max(1440)]],details:[''],advisorUserId:[''],isInternal:[false],isUnfollowed:[false],
    requiresRegularization:[false],attachmentName:[''],attachmentReference:[''],nextActionTitle:[''],nextActionDueAtUtc:[''],nextActionType:['FollowUp']},
    {validators:[ActivityListPage.activityDateValidator,ActivityListPage.nextActionValidator]});
  readonly attachForm=this.fb.nonNullable.group({leadId:['',Validators.required]});
  readonly invalidateForm=this.fb.nonNullable.group({reason:['',[Validators.required,Validators.maxLength(500)]]});
  readonly activityTypes:readonly CrmActivityType[]=['Call','Email','Sms','Meeting','Note','BranchVisit','StageChanged','OfferSent','DocumentReceived','SystemEvent'];
  readonly displayed=computed(()=>this.selectedState()==='empty'?[]:this.page().items);
  readonly viewLoading=computed(()=>this.loading()||this.selectedState()==='loading');
  readonly activeFilterCount=computed(()=>Object.values(this.filters.getRawValue()).filter(v=>v!==''&&v!==false).length);
  constructor(){if(!this.canCreateInternal())this.createForm.controls.isInternal.disable();
    this.search.valueChanges.pipe(debounceTime(350),distinctUntilChanged(),takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.load(1));
    this.filters.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.load(1));this.load();}
  load(pageNumber=this.page().pageNumber,pageSize=this.page().pageSize):void{this.loading.set(true);this.error.set(false);const raw=this.filters.getRawValue(),state=this.selectedState();
    const f:ActivityFilters={pageNumber,pageSize,search:this.search.value.trim(),...raw,unattachedOnly:raw.unattachedOnly||state==='unattached',
      importedOnly:raw.importedOnly||state==='imported',syncErrorsOnly:raw.syncErrorsOnly||state==='syncError',duplicatesOnly:raw.duplicatesOnly||state==='duplicate'};
    this.api.getPage(f).subscribe({next:p=>{this.page.set(p);this.loading.set(false);},error:()=>{this.loading.set(false);this.error.set(true);}});}
  selectState(s:ActivityState):void{if(!this.visibleTabs().some(x=>x.id===s))return;this.selectedState.set(s);this.load(1);}
  toggleTabs():void{this.tabsVisible.update(v=>!v);sessionStorage.setItem('driveos.crm.activities.states.visible',`${this.tabsVisible()}`);}
  resetFilters():void{this.filters.reset();this.search.setValue('');}onPageChange(e:DriveOsPageChange):void{this.load(e.pageNumber,e.pageSize);}
  openLead(a:CrmActivity):void{if(a.leadId)void this.router.navigate(['/crm/leads',a.leadId]);}toggleMenu(id:string):void{this.actionMenuId.update(x=>x===id?null:id);}
  submit():void{this.createForm.markAllAsTouched();if(this.createForm.invalid||this.saving())return;const v=this.createForm.getRawValue();if(!v.leadId&&!this.canCreateUnattached())return;this.saving.set(true);
    this.api.create(v.leadId||null,{type:v.type!,direction:v.direction as 'None'|'Inbound'|'Outbound',subject:v.subject!,details:v.details?.trim()||null,
      occurredAtUtc:new Date(v.occurredAtUtc!).toISOString(),advisorUserId:v.advisorUserId||null,result:v.result?.trim()||null,durationMinutes:v.durationMinutes,
      isInternal:this.canCreateInternal()&&!!v.isInternal,isUnfollowed:!!v.isUnfollowed,requiresRegularization:!!v.requiresRegularization,
      attachmentName:v.attachmentName?.trim()||null,attachmentReference:v.attachmentReference?.trim()||null,
      nextActionTitle:v.nextActionTitle?.trim()||null,nextActionDueAtUtc:v.nextActionDueAtUtc?new Date(v.nextActionDueAtUtc).toISOString():null,
      nextActionType:(v.nextActionType||'FollowUp') as 'Call'|'Email'|'Sms'|'Appointment'|'FollowUp'|'Other'}).subscribe({next:r=>{const file=this.attachmentFile();if(file){this.api.uploadAttachment(r.activityId,file).subscribe({next:()=>this.finishCreate(),error:()=>this.failAction()});}else this.finishCreate();},error:()=>this.failAction()});}
  retry(a:CrmActivity):void{if(this.canSync())this.api.retrySync(a.id).subscribe({next:()=>{this.actionMenuId.set(null);this.toast.success(this.tr.instant('crm.activities.feedback.updated'));this.load();},error:()=>this.failAction()});}
  abandon(a:CrmActivity):void{if(this.canSync())this.api.abandonSync(a.id).subscribe({next:()=>{this.actionMenuId.set(null);this.toast.success(this.tr.instant('crm.activities.feedback.updated'));this.load();},error:()=>this.failAction()});}
  openAttach(a:CrmActivity):void{if(!this.canAttach())return;this.selectedActivity.set(a);this.attachForm.reset();this.actionMenuId.set(null);this.attachDrawerOpen.set(true);}
  submitAttach():void{const a=this.selectedActivity();if(!a||this.attachForm.invalid||this.saving())return;this.saving.set(true);this.api.attach(a.id,this.attachForm.getRawValue().leadId).subscribe({next:()=>{this.saving.set(false);this.attachDrawerOpen.set(false);this.toast.success(this.tr.instant('crm.activities.feedback.attached'));this.load();},error:()=>this.failAction()});}
  openInvalidate(a:CrmActivity):void{if(!this.canInvalidate())return;this.selectedActivity.set(a);this.invalidateForm.reset();this.actionMenuId.set(null);this.invalidateDrawerOpen.set(true);}
  // Compatibility for templates from the first Activities archive. The C6
  // template calls openInvalidate directly, but this keeps incremental ZIP
  // application order from breaking compilation.
  invalidate(a:CrmActivity):void{this.openInvalidate(a);}
  submitInvalidate():void{const a=this.selectedActivity();if(!a||this.invalidateForm.invalid||this.saving())return;this.saving.set(true);this.api.invalidate(a.id,this.invalidateForm.getRawValue().reason).subscribe({next:()=>{this.saving.set(false);this.invalidateDrawerOpen.set(false);this.toast.success(this.tr.instant('crm.activities.feedback.invalidated'));this.load();},error:()=>this.failAction()});}
  selectCreateLead(lead:LeadListItem|null):void{this.createForm.controls.leadId.setValue(lead?.id??'');this.createForm.updateValueAndValidity();}
  selectFilterLead(lead:LeadListItem|null):void{this.filters.controls.leadId.setValue(lead?.id??'');}
  selectAttachLead(lead:LeadListItem|null):void{this.attachForm.controls.leadId.setValue(lead?.id??'');}
  selectCreateAdvisor(user:AuthUser|null):void{this.createForm.controls.advisorUserId.setValue(user?.id??'');}
  selectFilterAdvisor(user:AuthUser|null):void{this.filters.controls.advisorUserId.setValue(user?.id??'');}
  selectAttachment(event:Event):void{const input=event.target as HTMLInputElement;this.attachmentFile.set(input.files?.item(0)??null);}
  downloadAttachment(a:CrmActivity):void{if(!this.canReadAttachment())return;this.api.downloadAttachment(a.id).subscribe({next:(blob:Blob)=>{const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=a.attachmentName??'attachment';link.click();URL.revokeObjectURL(url);this.actionMenuId.set(null);},error:()=>this.failAction()});}
  deleteAttachment(a:CrmActivity):void{if(!this.canDeleteAttachment())return;this.api.deleteAttachment(a.id).subscribe({next:()=>{this.actionMenuId.set(null);this.toast.success(this.tr.instant('crm.activities.feedback.attachmentDeleted'));this.load();},error:()=>this.failAction()});}
  hasCreateError(name:'activityDate'|'nextAction'):boolean{return this.createForm.touched&&this.createForm.hasError(name);}
  typeKey(t:string):string{return`crm.activities.types.${t}`;}stateKey(s:ActivityState):string{return`crm.activities.states.${s}`;}
  icon(a:CrmActivity):string{return({Call:'ph-phone-outgoing',Email:'ph-envelope',Sms:'ph-chat',Meeting:'ph-calendar',Note:'ph-note',BranchVisit:'ph-buildings',StageChanged:'ph-arrows-left-right',OfferSent:'ph-file-text',DocumentReceived:'ph-paperclip',SystemEvent:'ph-gear'}as Record<string,string>)[a.type]||'ph-waveform';}
  private failAction():void{this.saving.set(false);this.actionError.set(true);this.actionMenuId.set(null);this.toast.error(this.tr.instant('crm.activities.feedback.error'));}
  private finishCreate():void{this.saving.set(false);this.drawerOpen.set(false);this.actionMenuId.set(null);this.attachmentFile.set(null);this.createForm.reset({type:'Call',direction:'Outbound',occurredAtUtc:this.localNow(),nextActionType:'FollowUp'});this.toast.success(this.tr.instant('crm.activities.feedback.created'));this.load(1);}
  private static activityDateValidator(control:AbstractControl):ValidationErrors|null{const raw=control.get('occurredAtUtc')?.value as string|undefined;return raw&&new Date(raw).getTime()>Date.now()?{activityDate:true}:null;}
  private static nextActionValidator(control:AbstractControl):ValidationErrors|null{const title=(control.get('nextActionTitle')?.value as string|undefined)?.trim();const due=control.get('nextActionDueAtUtc')?.value as string|undefined;const lead=control.get('leadId')?.value as string|undefined;return title||due?(!title||!due||!lead||new Date(due).getTime()<=Date.now()?{nextAction:true}:null):null;}
  private localNow():string{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16);}
}
