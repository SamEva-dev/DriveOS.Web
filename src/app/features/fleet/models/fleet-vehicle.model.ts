export interface FleetVehicle {
  readonly id: string;
  readonly organizationId: string;
  readonly ownerOrganizationId: string;
  readonly providerOrganizationId: string | null;
  readonly branchId: string | null;
  readonly registrationNumber: string;
  readonly vin: string | null;
  readonly make: string;
  readonly model: string;
  readonly transmissionType: string;
  readonly energyType: string;
  readonly dualControl: boolean;
  readonly licenseCategories: readonly string[];
  readonly adaptations: readonly string[];
  readonly operationalStatus: FleetVehicleStatus;
  readonly technicalComplianceVerified: boolean;
  readonly documentsCompliant: boolean;
  readonly insuranceValidUntilUtc: string | null;
  readonly maintenanceBlocking: boolean;
  readonly nextMaintenanceDueAtUtc: string | null;
  readonly lastComplianceVerifiedAtUtc: string | null;
  readonly complianceNotes: string | null;
  readonly currentOdometerKilometers: number;
  readonly lastOdometerRecordedAtUtc: string | null;
}

export type FleetVehicleStatus =
  | 'Expected'
  | 'Available'
  | 'Assigned'
  | 'MaintenanceDue'
  | 'UnderMaintenance'
  | 'Restricted'
  | 'Immobilized'
  | 'OutOfService'
  | 'Returning'
  | 'Returned';

export interface CreateFleetVehicleRequest {
  readonly branchId: string | null;
  readonly registrationNumber: string;
  readonly vin: string | null;
  readonly make: string;
  readonly model: string;
  readonly transmissionType: string;
  readonly energyType: string;
  readonly dualControl: boolean;
  readonly licenseCategories: readonly string[];
  readonly adaptations: readonly string[];
}

export interface UpdateFleetVehicleComplianceRequest {
  readonly technicalComplianceVerified: boolean;
  readonly documentsCompliant: boolean;
  readonly insuranceValidUntilUtc: string | null;
  readonly maintenanceBlocking: boolean;
  readonly nextMaintenanceDueAtUtc: string | null;
  readonly operationalStatus: FleetVehicleStatus;
  readonly branchId: string | null;
  readonly providerOrganizationId: string | null;
  readonly notes: string | null;
}
