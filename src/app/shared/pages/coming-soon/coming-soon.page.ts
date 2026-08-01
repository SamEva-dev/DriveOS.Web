import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { TranslatePipe } from '@ngx-translate/core';
import { DriveOsCardComponent } from '../../ui';

@Component({
  selector: 'driveos-coming-soon-page',
  standalone: true,
  imports: [TranslatePipe, DriveOsCardComponent],
  templateUrl: './coming-soon.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoonPage {
  private readonly route = inject(ActivatedRoute);

  readonly titleKey = this.route.snapshot.data['titleKey'] as string;
}
