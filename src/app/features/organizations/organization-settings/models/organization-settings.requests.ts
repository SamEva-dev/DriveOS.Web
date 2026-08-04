import { MeasurementSystem } from './organization-settings.model';

export interface CreateOrganizationSettingsRequest {
  readonly tradeName: string | null;
  readonly registrationNumber: string | null;
  readonly taxNumber: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly region: string | null;
  readonly addressCountryCode: string;
  readonly defaultLanguage: string;
  readonly supportedLanguages: readonly string[];
  readonly timeZoneId: string;
  readonly currencyCode: string;
  readonly dateFormat: string;
  readonly timeFormat: string;
  readonly firstDayOfWeek: number;
  readonly measurementSystem: MeasurementSystem;
  readonly defaultSessionDurationMinutes: number;
  readonly defaultBookingLeadTimeMinutes: number;
  readonly defaultCancellationDelayHours: number;
  readonly allowStudentSelfBooking: boolean;
  readonly requireBranchForOperations: boolean;
  readonly defaultBranchId: string | null;
}

export interface UpdateOrganizationProfileRequest {
  readonly tradeName: string | null;
  readonly registrationNumber: string | null;
  readonly taxNumber: string | null;
  readonly expectedVersion: number;
}

export interface UpdateOrganizationContactRequest {
  readonly email: string | null;
  readonly phone: string | null;
  readonly website: string | null;
  readonly expectedVersion: number;
}

export interface UpdateOrganizationAddressRequest {
  readonly addressLine1: string | null;
  readonly addressLine2: string | null;
  readonly postalCode: string | null;
  readonly city: string | null;
  readonly region: string | null;
  readonly addressCountryCode: string;
  readonly expectedVersion: number;
}

export interface UpdateOrganizationRegionalSettingsRequest {
  readonly defaultLanguage: string;
  readonly supportedLanguages: readonly string[];
  readonly timeZoneId: string;
  readonly currencyCode: string;
  readonly dateFormat: string;
  readonly timeFormat: string;
  readonly firstDayOfWeek: number;
  readonly measurementSystem: MeasurementSystem;
  readonly expectedVersion: number;
}

export interface UpdateOrganizationOperationalSettingsRequest {
  readonly defaultSessionDurationMinutes: number;
  readonly defaultBookingLeadTimeMinutes: number;
  readonly defaultCancellationDelayHours: number;
  readonly allowStudentSelfBooking: boolean;
  readonly requireBranchForOperations: boolean;
  readonly defaultBranchId: string | null;
  readonly expectedVersion: number;
}
