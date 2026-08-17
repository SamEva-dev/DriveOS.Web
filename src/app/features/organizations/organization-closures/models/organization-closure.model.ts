export type ClosureSeverity = 'Information' | 'Warning' | 'Blocking';
export interface ClosureRequirement {
  code: string;
  isSatisfied: boolean;
  severity: ClosureSeverity;
  messageKey: string;
  parameters: Record<string, unknown>;
}
export interface ClosureReadiness {
  organizationId: string;
  canClose: boolean;
  requirements: readonly ClosureRequirement[];
  blockingRequirements: readonly ClosureRequirement[];
}
export interface OrganizationClosure {
  id: string;
  organizationId: string;
  reasonCode: string;
  reasonDetails?: string;
  requestedEffectiveAtUtc: string;
  dataDisposition: string;
  retentionUntilUtc?: string;
  status: string;
  revision: number;
}
