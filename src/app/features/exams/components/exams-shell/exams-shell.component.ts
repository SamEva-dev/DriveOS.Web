import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { EXAMS_PERMISSIONS } from '../../domain/exams-permissions';
interface ExamTab {
  route: string;
  labelKey: string;
  icon: string;
  permissions: readonly string[];
}
@Component({
  selector: 'driveos-exams-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './exams-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExamsShellComponent {
  private readonly authorization = inject(AuthorizationService);
  private readonly tabs: readonly ExamTab[] = [
    {
      route: 'dashboard',
      labelKey: 'exams.tabs.dashboard',
      icon: 'ph ph-squares-four',
      permissions: [EXAMS_PERMISSIONS.analytics.read],
    },
    {
      route: 'readiness',
      labelKey: 'exams.tabs.readiness',
      icon: 'ph ph-seal-check',
      permissions: [EXAMS_PERMISSIONS.readiness.read],
    },
    {
      route: 'places',
      labelKey: 'exams.tabs.places',
      icon: 'ph ph-map-pin',
      permissions: [EXAMS_PERMISSIONS.places.read],
    },
    {
      route: 'registrations',
      labelKey: 'exams.tabs.registrations',
      icon: 'ph ph-file-text',
      permissions: [EXAMS_PERMISSIONS.registrations.read],
    },
    {
      route: 'operations',
      labelKey: 'exams.tabs.operations',
      icon: 'ph ph-flag-checkered',
      permissions: [
        EXAMS_PERMISSIONS.preparation.read,
        EXAMS_PERMISSIONS.attempts.read,
        EXAMS_PERMISSIONS.registrations.read,
      ],
    },
    {
      route: 'results',
      labelKey: 'exams.tabs.results',
      icon: 'ph ph-medal',
      permissions: [EXAMS_PERMISSIONS.results.read],
    },
  ];
  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((t) => this.authorization.hasAny(t.permissions));
  });
}
