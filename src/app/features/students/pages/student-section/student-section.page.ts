import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';

@Component({
  selector: 'driveos-student-section-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsEmptyStateComponent],
  templateUrl: './student-section.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentSectionPage {
  private readonly route = inject(ActivatedRoute);
  readonly section = computed(() => this.route.snapshot.paramMap.get('section') ?? 'overview');
}
