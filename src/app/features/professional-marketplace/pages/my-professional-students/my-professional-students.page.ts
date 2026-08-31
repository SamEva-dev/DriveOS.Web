import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { ProfessionalStudentAssignment } from '../../models/professional-student-assignment.model';
@Component({
  selector: 'driveos-my-professional-students-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsPageShellComponent],
  templateUrl: './my-professional-students.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyProfessionalStudentsPage {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly items = signal<readonly ProfessionalStudentAssignment[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly query = signal('');
  readonly visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.items().filter((x) =>
          (x.studentDisplayName + ' ' + (x.studentEmail ?? '') + ' ' + x.scopeCode)
            .toLowerCase()
            .includes(q),
        )
      : this.items();
  });
  constructor() {
    this.load();
  }
  setQuery(v: string) {
    this.query.set(v);
  }
  load() {
    this.loading.set(true);
    this.loadError.set(false);
    this.api
      .listMyProfessionalStudentAssignments()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (x) => {
          this.items.set(x);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }
}
