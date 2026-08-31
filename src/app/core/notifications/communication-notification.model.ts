export interface CommunicationNotification {
  readonly id: string;
  readonly category: string;
  readonly templateKey: string;
  readonly parameters: Readonly<Record<string, string | null>>;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: string | null;
  readonly status: 'Unread' | 'Read' | 'Dismissed' | string;
  readonly emailStatus: string;
  readonly createdAtUtc: string;
  readonly readAtUtc: string | null;
}

export interface NotificationPreference {
  readonly category: string;
  readonly inAppEnabled: boolean;
  readonly emailEnabled: boolean;
}
