import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { DriveOsEmptyStateComponent } from '../../../../shared/ui/empty-state/driveos-empty-state.component';
import { DriveOsFormAlertComponent } from '../../../../shared/ui/form-alert/driveos-form-alert.component';
import { DriveOsPageHeaderComponent } from '../../../../shared/ui/page-header/driveos-page-header.component';
import { DriveOsSpinnerComponent } from '../../../../shared/ui/spinner/driveos-spinner.component';
import { DriveOsStatusBadgeComponent, DriveOsStatusTone } from '../../../../shared/ui/status-badge/driveos-status-badge.component';
import { FleetApiService } from '../../data-access/fleet-api.service';
import { FLEET_PERMISSIONS } from '../../domain/fleet-permissions';
import { FleetVehicle, FleetVehicleStatus } from '../../models/fleet-vehicle.model';

type FleetDrawer = 'create' | 'compliance' | 'odometer' | null;

@Component({
  selector: 'driveos-fleet-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, DriveOsEmptyStateComponent, DriveOsFormAlertComponent,
    DriveOsPageHeaderComponent, DriveOsSpinnerComponent, DriveOsStatusBadgeComponent],
  templateUrl: './fleet-dashboard.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FleetDashboardPage {
  private readonly api = inject(FleetApiService);
  private readonly apiErrors = inject(ApiErrorService);
  private readonly authorization = inject(AuthorizationService);

  readonly vehicles = signal<readonly FleetVehicle[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errors = signal<readonly string[]>([]);
  readonly actionErrors = signal<readonly string[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly drawer = signal<FleetDrawer>(null);
  readonly selected = signal<FleetVehicle | null>(null);

  readonly canRead = this.authorization.hasPermission(FLEET_PERMISSIONS.vehicles.read);
  readonly canManage = this.authorization.hasPermission(FLEET_PERMISSIONS.vehicles.manage);
  readonly canManageCompliance = this.authorization.hasPermission(FLEET_PERMISSIONS.vehicles.manageCompliance);

  readonly statuses: readonly FleetVehicleStatus[] = ['Expected', 'Available', 'Assigned', 'MaintenanceDue',
    'UnderMaintenance', 'Restricted', 'Immobilized', 'OutOfService', 'Returning', 'Returned'];

  readonly filteredVehicles = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.vehicles().filter((vehicle) =>
      (!status || vehicle.operationalStatus === status) &&
      (!term || `${vehicle.registrationNumber} ${vehicle.make} ${vehicle.model} ${vehicle.vin ?? ''}`.toLowerCase().includes(term)));
  });

  readonly availableCount = computed(() => this.vehicles().filter((x) => x.operationalStatus === 'Available').length);
  readonly immobilizedCount = computed(() => this.vehicles().filter((x) => ['Immobilized', 'OutOfService', 'UnderMaintenance'].includes(x.operationalStatus)).length);
  readonly complianceAlertCount = computed(() => this.vehicles().filter((x) => this.hasComplianceAlert(x)).length);
  readonly maintenanceAlertCount = computed(() => this.vehicles().filter((x) => this.isDue(x.nextMaintenanceDueAtUtc) || x.maintenanceBlocking).length);

  registrationNumber = '';
  vin = '';
  make = '';
  model = '';
  transmissionType = 'Manual';
  energyType = 'Petrol';
  dualControl = true;
  licenseCategories = 'B';
  adaptations = '';
  branchId = '';

  technicalComplianceVerified = false;
  documentsCompliant = false;
  insuranceValidUntilUtc = '';
  maintenanceBlocking = false;
  nextMaintenanceDueAtUtc = '';
  operationalStatus: FleetVehicleStatus = 'Expected';
  providerOrganizationId = '';
  notes = '';
  odometerKilometers = 0;
  odometerRecordedAt = '';

  constructor() { if (this.canRead) this.load(); else this.loading.set(false); }

  load(): void {
    this.loading.set(true); this.errors.set([]);
    this.api.getVehicles().subscribe({
      next: (vehicles) => { this.vehicles.set(vehicles); this.loading.set(false); },
      error: (error) => { this.errors.set(this.apiErrors.getMessages(error)); this.loading.set(false); },
    });
  }

  openCreate(): void { this.resetCreate(); this.actionErrors.set([]); this.drawer.set('create'); }
  openCompliance(vehicle: FleetVehicle): void {
    this.selected.set(vehicle); this.technicalComplianceVerified = vehicle.technicalComplianceVerified;
    this.documentsCompliant = vehicle.documentsCompliant; this.insuranceValidUntilUtc = this.toLocalInput(vehicle.insuranceValidUntilUtc);
    this.maintenanceBlocking = vehicle.maintenanceBlocking; this.nextMaintenanceDueAtUtc = this.toLocalInput(vehicle.nextMaintenanceDueAtUtc);
    this.operationalStatus = vehicle.operationalStatus; this.branchId = vehicle.branchId ?? '';
    this.providerOrganizationId = vehicle.providerOrganizationId ?? ''; this.notes = vehicle.complianceNotes ?? '';
    this.actionErrors.set([]); this.drawer.set('compliance');
  }
  openOdometer(vehicle: FleetVehicle): void {
    this.selected.set(vehicle); this.odometerKilometers = vehicle.currentOdometerKilometers;
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000); this.odometerRecordedAt = now.toISOString().slice(0, 16);
    this.actionErrors.set([]); this.drawer.set('odometer');
  }
  closeDrawer(): void { if (!this.saving()) { this.drawer.set(null); this.selected.set(null); } }

  create(): void {
    if (!this.registrationNumber.trim() || !this.transmissionType.trim() || !this.energyType.trim() || !this.tokens(this.licenseCategories).length) return;
    this.saving.set(true); this.actionErrors.set([]);
    this.api.createVehicle({ branchId: this.optional(this.branchId), registrationNumber: this.registrationNumber.trim(),
      vin: this.optional(this.vin), make: this.make.trim(), model: this.model.trim(), transmissionType: this.transmissionType.trim(),
      energyType: this.energyType.trim(), dualControl: this.dualControl, licenseCategories: this.tokens(this.licenseCategories), adaptations: this.tokens(this.adaptations) })
      .subscribe({ next: () => this.afterSave(), error: (error) => this.saveFailed(error) });
  }

  saveCompliance(): void {
    const vehicle = this.selected(); if (!vehicle) return;
    this.saving.set(true); this.actionErrors.set([]);
    this.api.updateCompliance(vehicle.id, { technicalComplianceVerified: this.technicalComplianceVerified,
      documentsCompliant: this.documentsCompliant, insuranceValidUntilUtc: this.toUtc(this.insuranceValidUntilUtc),
      maintenanceBlocking: this.maintenanceBlocking, nextMaintenanceDueAtUtc: this.toUtc(this.nextMaintenanceDueAtUtc),
      operationalStatus: this.operationalStatus, branchId: this.optional(this.branchId),
      providerOrganizationId: this.optional(this.providerOrganizationId), notes: this.optional(this.notes) })
      .subscribe({ next: () => this.afterSave(), error: (error) => this.saveFailed(error) });
  }

  saveOdometer(): void {
    const vehicle = this.selected(); if (!vehicle || !Number.isInteger(this.odometerKilometers) || !this.odometerRecordedAt) return;
    this.saving.set(true); this.actionErrors.set([]);
    this.api.recordOdometer(vehicle.id, this.odometerKilometers, new Date(this.odometerRecordedAt).toISOString())
      .subscribe({ next: () => this.afterSave(), error: (error) => this.saveFailed(error) });
  }

  hasComplianceAlert(vehicle: FleetVehicle): boolean {
    return !vehicle.technicalComplianceVerified || !vehicle.documentsCompliant || this.isDue(vehicle.insuranceValidUntilUtc);
  }
  isDue(value: string | null): boolean { return !!value && new Date(value).getTime() <= Date.now(); }
  statusTone(status: FleetVehicleStatus): DriveOsStatusTone {
    if (status === 'Available') return 'success'; if (status === 'Assigned') return 'info';
    if (['MaintenanceDue', 'Restricted', 'Returning'].includes(status)) return 'warning';
    if (['UnderMaintenance', 'Immobilized', 'OutOfService'].includes(status)) return 'danger'; return 'neutral';
  }

  private afterSave(): void { this.saving.set(false); this.drawer.set(null); this.selected.set(null); this.load(); }
  private saveFailed(error: unknown): void { this.actionErrors.set(this.apiErrors.getMessages(error)); this.saving.set(false); }
  private tokens(value: string): string[] { return [...new Set(value.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean))]; }
  private optional(value: string): string | null { const result = value.trim(); return result || null; }
  private toUtc(value: string): string | null { return value ? new Date(value).toISOString() : null; }
  private toLocalInput(value: string | null): string { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }
  private resetCreate(): void { this.registrationNumber = ''; this.vin = ''; this.make = ''; this.model = ''; this.transmissionType = 'Manual';
    this.energyType = 'Petrol'; this.dualControl = true; this.licenseCategories = 'B'; this.adaptations = ''; this.branchId = ''; }
}
