import {
  DatePipe,
} from '@angular/common';

import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import {
  TranslatePipe,
} from '@ngx-translate/core';

import {
  DriveOsBadgeComponent,
  DriveOsBadgeVariant,
  DriveOsCardComponent,
} from '../../../../shared/ui';

import {
  OrganizationStatus,
} from '../../models/organization-status';

import {
  Organization,
} from '../../models/organization.model';

@Component({
  selector:
    'driveos-organization-summary',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    DriveOsBadgeComponent,
    DriveOsCardComponent,
  ],
  templateUrl:
    './organization-summary.component.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OrganizationSummaryComponent {
  readonly organization =
    input.required<Organization>();

  statusKey(
    status: OrganizationStatus,
  ): string {
    return `organizations.statuses.${status
      .charAt(0)
      .toLowerCase()}${status.slice(1)}`;
  }

  statusVariant(
    status: OrganizationStatus,
  ): DriveOsBadgeVariant {
    switch (status) {
      case 'Active':
        return 'success';

      case 'Draft':
      case 'PendingActivation':
        return 'info';

      case 'Restricted':
        return 'warning';

      case 'Suspended':
      case 'Closed':
        return 'danger';

      case 'Archived':
      default:
        return 'neutral';
    }
  }

  organizationTypeKey(
    type: string,
  ): string {
    const values:
      Record<string, string> = {
      DrivingSchool:
        'organizations.types.drivingSchool',

      DrivingSchoolNetwork:
        'organizations.types.drivingSchoolNetwork',

      TrainingCenter:
        'organizations.types.trainingCenter',

      IndependentInstructorBusiness:
        'organizations.types.independentInstructorBusiness',

      VehicleProvider:
        'organizations.types.vehicleProvider',

      FundingOrganization:
        'organizations.types.fundingOrganization',

      PartnerOrganization:
        'organizations.types.partnerOrganization',

      PlatformOperator:
        'organizations.types.platformOperator',
    };

    return (
      values[type] ??
      'organizations.types.unknown'
    );
  }
}
