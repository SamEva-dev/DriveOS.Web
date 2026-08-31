import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsDrawerComponent } from '../../../../shared/ui/drawer/driveos-drawer.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { ProfessionalMission } from '../../models/professional-mission.model';
import { ProfessionalStudentAssignment } from '../../models/professional-student-assignment.model';
import { ServiceEntry } from '../../models/service-entry.model';
import { ServiceEntryDrawerComponent } from '../service-entry-drawer/service-entry-drawer.component';
@Component({
  selector: 'driveos-my-professional-mission-drawer',
  standalone: true,
  imports: [FormsModule, TranslatePipe, DriveOsDrawerComponent, ServiceEntryDrawerComponent],
  templateUrl: './my-professional-mission-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfessionalMissionDrawerComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly errors = inject(ApiErrorService);
  private readonly translate = inject(TranslateService);
  readonly open = input(false);
  readonly missionId = input<string | null>(null);
  readonly closeRequested = output<void>();
  readonly changed = output<void>();
  readonly item = signal<ProfessionalMission | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly tab = signal<'details' | 'schedule' | 'students' | 'services' | 'history'>('details');
  readonly students = signal<readonly ProfessionalStudentAssignment[]>([]);
  readonly studentsLoading = signal(false);
  readonly services = signal<readonly ServiceEntry[]>([]);
  readonly servicesLoading = signal(false);
  readonly serviceDrawerOpen = signal(false);
  readonly selectedService = signal<ServiceEntry | null>(null);
  readonly formErrors = signal<readonly string[]>([]);
  readonly declineMode = signal(false);
  reason = '';
  private loaded: string | null = null;
  constructor() {
    effect(() => {
      const open = this.open(),
        id = this.missionId();
      if (open && id && id !== this.loaded) {
        this.loaded = id;
        this.load(id);
      }
      if (!open) {
        this.loaded = null;
        this.item.set(null);
        this.tab.set('details');
        this.declineMode.set(false);
      }
    });
  }
  close() {
    if (!this.busy()) this.closeRequested.emit();
  }
  selectTab(v: 'details' | 'schedule' | 'students' | 'services' | 'history') {
    this.tab.set(v);
    if (v === 'students' && this.missionId()) this.loadStudents(this.missionId()!);
    if (v === 'services' && this.missionId()) this.loadServices(this.missionId()!);
  }
  accept() {
    const id = this.missionId();
    if (!id) return;
    this.run(() => this.api.acceptMyProfessionalMission(id));
  }
  beginDecline() {
    this.reason = '';
    this.declineMode.set(true);
  }
  cancelDecline() {
    this.declineMode.set(false);
  }
  confirmDecline() {
    if (this.reason.trim().length < 2) {
      this.formErrors.set([
        this.translate.instant('professionalMarketplace.myMissions.errors.reason'),
      ]);
      return;
    }
    const id = this.missionId();
    if (id) this.run(() => this.api.declineMyProfessionalMission(id, this.reason.trim()));
  }
  openService(x: ServiceEntry) {
    this.selectedService.set(x);
    this.serviceDrawerOpen.set(true);
  }
  closeService() {
    this.serviceDrawerOpen.set(false);
    this.selectedService.set(null);
  }
  loadServices(id: string) {
    this.servicesLoading.set(true);
    this.api.listMyProfessionalMissionServiceEntries(id).subscribe({
      next: (x) => {
        this.services.set(x);
        this.servicesLoading.set(false);
      },
      error: () => {
        this.services.set([]);
        this.servicesLoading.set(false);
      },
    });
  }
  private loadStudents(id: string) {
    this.studentsLoading.set(true);
    this.api.listMyProfessionalMissionStudentAssignments(id).subscribe({
      next: (x) => {
        this.students.set(x);
        this.studentsLoading.set(false);
      },
      error: () => {
        this.students.set([]);
        this.studentsLoading.set(false);
      },
    });
  }
  private load(id: string) {
    this.loading.set(true);
    this.formErrors.set([]);
    this.api.getMyProfessionalMission(id).subscribe({
      next: (x) => {
        this.item.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }
  private run(factory: () => any) {
    this.busy.set(true);
    this.formErrors.set([]);
    factory().subscribe({
      next: () => {
        this.busy.set(false);
        this.declineMode.set(false);
        this.changed.emit();
        this.load(this.missionId()!);
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.formErrors.set(this.errors.getMessages(e));
      },
    });
  }
}
