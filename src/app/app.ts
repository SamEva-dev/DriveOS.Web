import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  RouterOutlet,
} from '@angular/router';

import {
  DriveOsToastContainerComponent,
} from './shared/ui';

@Component({
  selector: 'driveos-root',
  standalone: true,
  imports: [
    RouterOutlet,
    DriveOsToastContainerComponent,
  ],
  templateUrl: './app.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class App {
}
