import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { TRAINING_DELIVERY_PERMISSIONS } from '../../domain/training-delivery-permissions';

interface TrainingDeliveryTab {
  readonly route: string;
  readonly labelKey: string;
  readonly icon: string;
  readonly permissions: readonly string[];
}

@Component({
  selector: 'driveos-training-delivery-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './training-delivery-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingDeliveryShellComponent {
  private readonly authorization = inject(AuthorizationService);

  private readonly tabs: readonly TrainingDeliveryTab[] = [
    {
      route: 'dashboard',
      labelKey: 'training.tabs.dashboard',
      icon: 'ph ph-squares-four',
      permissions: [TRAINING_DELIVERY_PERMISSIONS.sessions.read],
    },
    {
      route: 'my-day',
      labelKey: 'training.tabs.myDay',
      icon: 'ph ph-calendar-dots',
      permissions: [TRAINING_DELIVERY_PERMISSIONS.sessions.read],
    },
    {
      route: 'sessions',
      labelKey: 'training.tabs.sessions',
      icon: 'ph ph-list-bullets',
      permissions: [TRAINING_DELIVERY_PERMISSIONS.sessions.read],
    },
    {
      route: 'sync',
      labelKey: 'training.tabs.sync',
      icon: 'ph ph-arrows-clockwise',
      permissions: [TRAINING_DELIVERY_PERMISSIONS.sessions.read],
    },
    {
      route: 'pending-reports',
      labelKey: 'training.tabs.pendingReports',
      icon: 'ph ph-clipboard-text',
      permissions: [TRAINING_DELIVERY_PERMISSIONS.reports.read],
    },
  ];

  readonly visibleTabs = computed(() => {
    this.authorization.permissions();
    return this.tabs.filter((tab) => this.authorization.hasAny(tab.permissions));
  });
}
