export type CrmActivityType = 'Call' | 'Email' | 'Sms' | 'Meeting' | 'Note';
export type CrmActivityDirection = 'None' | 'Inbound' | 'Outbound';

export interface CrmActivity {
  id: string;
  leadId: string;
  type: CrmActivityType;
  direction: CrmActivityDirection;
  subject: string;
  details: string | null;
  occurredAtUtc: string;
  createdAtUtc: string;
  createdByUserId: string | null;
}

export interface CreateCrmActivityRequest {
  type: CrmActivityType;
  direction: CrmActivityDirection;
  subject: string;
  details: string | null;
  occurredAtUtc: string;
}
