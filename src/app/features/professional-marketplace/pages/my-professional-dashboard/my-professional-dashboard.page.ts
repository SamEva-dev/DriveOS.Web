import {ChangeDetectionStrategy,Component,DestroyRef,computed,inject,signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Router} from '@angular/router';
import {TranslatePipe,TranslateService} from '@ngx-translate/core';
import {forkJoin} from 'rxjs';
import {ApiErrorService} from '../../../../core/errors/api-error.service';
import {DriveOsPageShellComponent} from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import {DriveOsStatCardComponent} from '../../../../shared/ui/stat-card/driveos-stat-card.component';
import {MyProfessionalMissionDrawerComponent} from '../../components/my-professional-mission-drawer/my-professional-mission-drawer.component';
import {ProfessionalMarketplaceApiService} from '../../data-access/professional-marketplace-api.service';
import {MarketplaceDashboard,MarketplaceDashboardAlert} from '../../models/marketplace-dashboard.model';
import {ProfessionalMission} from '../../models/professional-mission.model';
import {ProfessionalProfile} from '../../models/professional-profile.model';
import {ProfessionalStudentAssignment} from '../../models/professional-student-assignment.model';

type DashboardTab='actions'|'activity'|'finance'|'profile';

@Component({selector:'driveos-my-professional-dashboard-page',standalone:true,imports:[TranslatePipe,DriveOsPageShellComponent,DriveOsStatCardComponent,MyProfessionalMissionDrawerComponent],templateUrl:'./my-professional-dashboard.page.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class MyProfessionalDashboardPage{
 private readonly api=inject(ProfessionalMarketplaceApiService);private readonly destroyRef=inject(DestroyRef);private readonly router=inject(Router);private readonly errorsApi=inject(ApiErrorService);private readonly translate=inject(TranslateService);
 readonly profile=signal<ProfessionalProfile|null>(null);readonly dashboard=signal<MarketplaceDashboard|null>(null);readonly missions=signal<readonly ProfessionalMission[]>([]);readonly assignments=signal<readonly ProfessionalStudentAssignment[]>([]);readonly loading=signal(false);readonly errors=signal<readonly string[]>([]);readonly activeTab=signal<DashboardTab>('actions');readonly missionDrawerOpen=signal(false);readonly selectedMission=signal<ProfessionalMission|null>(null);
 readonly pendingMissions=computed(()=>this.missions().filter(x=>x.status==='Proposed'));readonly activeAccessibleStudents=computed(()=>this.assignments().filter(x=>x.status==='Active').length);readonly profileLabel=computed(()=>this.profile()?.tradeName||this.profile()?.legalName||this.profile()?.headline||this.translate.instant('professionalMarketplace.myDashboard.defaultProfessional'));readonly complianceTone=computed(()=>this.profile()?.complianceStatus==='Compliant'?'success':this.profile()?.complianceStatus==='PendingReview'?'warning':'danger');
 constructor(){this.load();}
 setTab(tab:DashboardTab){this.activeTab.set(tab);}
 load(){this.loading.set(true);this.errors.set([]);forkJoin({profile:this.api.getMyProfessionalProfile(),dashboard:this.api.getMyProfessionalDashboard(),missions:this.api.listMyProfessionalMissions(),assignments:this.api.listMyProfessionalStudentAssignments()}).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next:r=>{this.profile.set(r.profile);this.dashboard.set(r.dashboard);this.missions.set(r.missions);this.assignments.set(r.assignments);this.loading.set(false);},error:e=>{this.errors.set(this.errorsApi.getMessages(e));this.loading.set(false);}});}
 openMission(m:ProfessionalMission){this.selectedMission.set(m);this.missionDrawerOpen.set(true);}
 closeMission(){this.missionDrawerOpen.set(false);this.selectedMission.set(null);}
 go(path:string){void this.router.navigateByUrl(path);}
 alertMessage(alert:MarketplaceDashboardAlert){const translated=this.translate.instant(alert.messageKey);return translated===alert.messageKey?this.translate.instant('professionalMarketplace.dashboard.alerts.fallback',{code:alert.code}):translated;}
 formatPercent(v:number|null){return v===null?'—':`${v.toFixed(1)} %`;}
 formatHours(v:number|null){return v===null?'—':`${v.toFixed(1)} h`;}
 formatMoney(v:number|null,c:string|null){if(v===null)return '—';try{return new Intl.NumberFormat(this.translate.currentLang()||'fr',{style:'currency',currency:c||'EUR'}).format(v);}catch{return `${v.toFixed(2)} ${c??''}`.trim();}}
}
