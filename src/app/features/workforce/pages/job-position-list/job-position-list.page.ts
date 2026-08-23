import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsButtonComponent } from '../../../../shared/ui/button/driveos-button.component';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatusBadgeComponent, DriveOsStatusTone } from '../../../../shared/ui/status-badge/driveos-status-badge.component';
import { WorkforceApiService } from '../../data-access/workforce-api.service';
import { WORKFORCE_PERMISSIONS } from '../../domain/workforce-permissions';
import { JobPosition } from '../../models/workforce.models';

type DrawerKind = 'create' | 'edit' | 'deactivate' | 'reactivate' | null;

@Component({
  selector: 'driveos-job-position-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, DriveOsButtonComponent, DriveOsDrawerComponent, DriveOsEmptyStateComponent, DriveOsFormAlertComponent, DriveOsPageHeaderComponent, DriveOsSpinnerComponent, DriveOsStatusBadgeComponent],
  templateUrl: './job-position-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobPositionListPage {
  private readonly api = inject(WorkforceApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);
  private readonly fb = inject(FormBuilder);

  readonly positions = signal<readonly JobPosition[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly actionErrors = signal<readonly string[]>([]);
  readonly search = signal('');
  readonly status = signal('');
  readonly drawer = signal<DrawerKind>(null);
  readonly selected = signal<JobPosition | null>(null);
  readonly canManage = computed(() => this.authorization.hasPermission(WORKFORCE_PERMISSIONS.jobPositions.manage));
  readonly functions = ['Instructor','PedagogicalManagement','BranchManagement','Administration','Finance','Executive','FleetManagement','ExamCoordination','Sales','HumanResources','Support','Other'] as const;

  readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(160)]],
    description: [''],
    professionalFunction: ['Instructor', Validators.required],
  });

  readonly filtered = computed(() => {
    const q=this.search().trim().toLowerCase(); const st=this.status();
    return this.positions().filter(x => (!st || x.status===st) && (!q || x.code.toLowerCase().includes(q) || x.name.toLowerCase().includes(q) || x.professionalFunction.toLowerCase().includes(q)));
  });

  constructor(){ this.load(); }
  load(): void { this.loading.set(true); this.errors.set([]); this.api.getJobPositions().subscribe({next:x=>{this.positions.set(x);this.loading.set(false);},error:e=>{this.errors.set(this.apiErrors.getMessages(e));this.loading.set(false);}}); }
  openCreate(): void { this.selected.set(null); this.form.reset({code:'',name:'',description:'',professionalFunction:'Instructor'}); this.open('create'); }
  openEdit(item: JobPosition): void { this.selected.set(item); this.form.reset({code:item.code,name:item.name,description:item.description??'',professionalFunction:item.professionalFunction}); this.open('edit'); }
  openState(item: JobPosition): void { this.selected.set(item); this.open(item.status==='Active'?'deactivate':'reactivate'); }
  close(): void { if(this.saving()) return; this.drawer.set(null); this.selected.set(null); this.actionErrors.set([]); }
  save(): void { if(this.form.invalid||this.saving()){this.form.markAllAsTouched();return;} const v=this.form.getRawValue(); const req={code:v.code.trim(),name:v.name.trim(),description:v.description.trim()||null,professionalFunction:v.professionalFunction}; this.run(this.drawer()==='create'?this.api.createJobPosition(req):this.api.updateJobPosition(this.selected()!.id,req)); }
  confirmState(): void { const item=this.selected(); if(!item||this.saving()) return; this.run(this.drawer()==='deactivate'?this.api.deactivateJobPosition(item.id):this.api.reactivateJobPosition(item.id)); }
  tone(status:string):DriveOsStatusTone{return status==='Active'?'success':'neutral';}
  drawerTitleKey():string{return `workforce.jobPositions.drawers.${this.drawer()??'create'}.title`;}
  private open(kind:Exclude<DrawerKind,null>):void{this.actionErrors.set([]);this.drawer.set(kind);}
  private run(request:import('rxjs').Observable<unknown>):void{this.saving.set(true);this.actionErrors.set([]);request.subscribe({next:()=>{this.saving.set(false);this.close();this.load();},error:e=>{this.actionErrors.set(this.apiErrors.getMessages(e));this.saving.set(false);}});}
}
