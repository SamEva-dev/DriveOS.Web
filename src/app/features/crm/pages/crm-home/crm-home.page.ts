import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsPageShellComponent } from '../../../../shared/ui/page-shell/driveos-page-shell.component';
import { CRM_PERMISSIONS } from '../../domain/crm-permissions';

@Component({
  selector: 'driveos-crm-home-page',
  standalone: true,
  imports: [DriveOsPageHeaderComponent, DriveOsPageShellComponent],
  templateUrl: './crm-home.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrmHomePage {
  private readonly authorization = inject(AuthorizationService);

  readonly canReadLeads = this.authorization.hasPermission(
    CRM_PERMISSIONS.leads.read,
  );
}
