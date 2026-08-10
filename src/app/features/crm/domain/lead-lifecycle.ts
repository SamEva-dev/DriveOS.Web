import { LeadStatus } from '../models/lead.model';

export type LeadLifecycleAction =
  | 'contact' | 'qualify' | 'schedule-assessment' | 'send-offer'
  | 'start-negotiation' | 'win' | 'lose' | 'put-on-hold' | 'reactivate';

export interface LeadLifecycleActionDefinition {
  readonly code: LeadLifecycleAction;
  readonly targetStatus: LeadStatus;
  readonly requiresReason: boolean;
  readonly destructive: boolean;
}

const action = (
  code: LeadLifecycleAction,
  targetStatus: LeadStatus,
  requiresReason = false,
  destructive = false,
): LeadLifecycleActionDefinition => ({ code, targetStatus, requiresReason, destructive });

const actionsByStatus: Record<LeadStatus, readonly LeadLifecycleActionDefinition[]> = {
  New: [action('contact', 'Contacted'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  Contacted: [action('qualify', 'Qualified'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  Qualified: [action('schedule-assessment', 'AssessmentScheduled'), action('send-offer', 'OfferSent'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  AssessmentScheduled: [action('qualify', 'Qualified'), action('send-offer', 'OfferSent'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  OfferSent: [action('start-negotiation', 'Negotiation'), action('win', 'Won'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  Negotiation: [action('win', 'Won'), action('lose', 'Lost', true, true), action('put-on-hold', 'Dormant')],
  Won: [],
  Lost: [action('reactivate', 'New')],
  Dormant: [action('reactivate', 'New')],
};

export function getLeadLifecycleActions(status: LeadStatus): readonly LeadLifecycleActionDefinition[] {
  return actionsByStatus[status];
}
