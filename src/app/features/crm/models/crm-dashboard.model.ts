export interface CrmDashboardKpis {
  newLeads: number;
  toContact: number;
  overdueFollowUps: number;
  upcomingAppointments: number | null;
  pendingOffers: number;
  conversionRate: number;
  firstContactDelayHours: number | null;
  pipelineValue: number | null;
  pipelineCurrency: string | null;
  unassignedLeads: number;
  expiringOpportunities: number | null;
}

export interface CrmDashboardPriority { leadId: string; firstName: string; lastName: string; kind: string; label: string; dueAtUtc: string | null; }
export interface CrmDashboardPipelineStage { status: string; count: number; }
export interface CrmDashboardActivity { id: string; leadId: string; firstName: string; lastName: string; type: string; direction: string; subject: string; occurredAtUtc: string; }
export interface CrmDashboardTask { id: string; leadId: string; firstName: string; lastName: string; type: string; title: string; dueAtUtc: string; isOverdue: boolean; }
export interface CrmDashboardAppointment { id: string; leadId: string; firstName: string; lastName: string; type: string; deliveryMode: string; status: string; startsAtUtc: string; endsAtUtc: string; locationDetails: string | null; }
export interface CrmDashboardSource { source: string; count: number; }
export interface CrmDashboardBranchConversion { branchId: string | null; converted: number; total: number; }
export interface CrmDashboardBranchScope { id: string; name: string; code: string; isPrimary: boolean; }
export interface CrmDashboardOrganizationScope { id: string; name: string; isNetwork: boolean; }
export interface CrmDashboardInactiveLead { leadId: string; firstName: string; lastName: string; status: string; lastInteractionAtUtc: string; inactiveDays: number; }

export interface CrmDashboard {
  generatedAtUtc: string;
  scope: 'Branch' | 'Organization' | 'Network';
  branchId: string | null;
  kpis: CrmDashboardKpis;
  priorities: CrmDashboardPriority[];
  pipeline: CrmDashboardPipelineStage[];
  recentActivities: CrmDashboardActivity[];
  upcomingTasks: CrmDashboardTask[];
  upcomingAppointments: CrmDashboardAppointment[];
  sources: CrmDashboardSource[];
  conversionsByBranch: CrmDashboardBranchConversion[];
  availableBranches: CrmDashboardBranchScope[];
  includedOrganizations: CrmDashboardOrganizationScope[];
  inactiveLeads: CrmDashboardInactiveLead[];
  unavailableWidgets: string[];
}

export interface CrmDashboardFilters {
  fromUtc?: string;
  toUtc?: string;
  assignedAdvisorId?: string;
  source?: string;
  status?: string;
}
