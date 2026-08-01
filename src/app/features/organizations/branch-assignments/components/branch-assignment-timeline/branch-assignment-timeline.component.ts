import { DatePipe } from '@angular/common';

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { DriveOsCardComponent } from '../../../../../shared/ui';

import { BranchAssignmentTimelineItem } from '../../models/branch-assignment-timeline-item';

@Component({
  selector: 'app-branch-assignment-timeline',

  standalone: true,

  imports: [DatePipe, TranslatePipe, DriveOsCardComponent],

  templateUrl: './branch-assignment-timeline.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchAssignmentTimelineComponent {
  @Input({
    required: true,
  })
  items: readonly BranchAssignmentTimelineItem[] = [];
}
