import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { AuthUser, authUserDisplayName } from '../../../../../core/auth/models/auth-user.model';

import { DriveOsBadgeComponent, DriveOsCardComponent } from '../../../../../shared/ui';

@Component({
  selector: 'app-branch-assignment-user-card',

  standalone: true,

  imports: [TranslatePipe, DriveOsBadgeComponent, DriveOsCardComponent],

  templateUrl: './branch-assignment-user-card.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAssignmentUserCardComponent {
  @Input({
    required: true,
  })
  user!: AuthUser;

  displayName(): string {
    return authUserDisplayName(this.user);
  }
}
