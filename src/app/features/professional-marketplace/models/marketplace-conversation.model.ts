export interface MarketplaceConversationThread {
  readonly conversationId: string;
  readonly relatedEntityType: string;
  readonly relatedEntityId: string;
  readonly status: string;
  readonly unreadCount: number;
  readonly messages: readonly MarketplaceConversationMessage[];
}

export interface MarketplaceConversationMessage {
  readonly messageId: string;
  readonly senderUserId: string;
  readonly body: string;
  readonly attachmentDocumentIds: readonly string[];
  readonly sentAtUtc: string;
}
