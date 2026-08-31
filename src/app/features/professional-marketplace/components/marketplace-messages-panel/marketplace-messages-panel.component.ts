import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthorizationService } from '../../../../core/auth/authorization.service';
import { ApiErrorService } from '../../../../core/errors/api-error.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfessionalMarketplaceApiService } from '../../data-access/professional-marketplace-api.service';
import { PROFESSIONAL_MARKETPLACE_PERMISSIONS } from '../../domain/professional-marketplace-permissions';
import { MarketplaceConversationThread } from '../../models/marketplace-conversation.model';

@Component({
  selector: 'driveos-marketplace-messages-panel',
  standalone: true,
  imports: [DatePipe, FormsModule, TranslatePipe],
  templateUrl: './marketplace-messages-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceMessagesPanelComponent {
  private readonly api = inject(ProfessionalMarketplaceApiService);
  private readonly auth = inject(AuthService);
  private readonly authorization = inject(AuthorizationService);
  private readonly errors = inject(ApiErrorService);
  readonly engagementId = input.required<string>();
  readonly professionalProfileId = input.required<string>();
  readonly thread = signal<MarketplaceConversationThread | null>(null);
  readonly conversationId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly formErrors = signal<readonly string[]>([]);
  readonly canRead = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.messages.read),
  );
  readonly canSend = computed(() =>
    this.authorization.hasPermission(PROFESSIONAL_MARKETPLACE_PERMISSIONS.messages.send),
  );
  readonly currentUserId = computed(() => this.auth.user()?.id ?? '');
  readonly organizationId = computed(() => this.auth.user()?.organizationId ?? '');
  message = '';
  private loadedKey = '';
  constructor() {
    effect(() => {
      const key = `${this.organizationId()}|${this.engagementId()}|${this.professionalProfileId()}`;
      if (this.canRead() && key !== this.loadedKey) {
        this.loadedKey = key;
        this.ensureAndLoad();
      }
    });
  }
  refresh() {
    const id = this.conversationId();
    if (!id) return;
    this.loadThread(id);
  }
  send() {
    const org = this.organizationId(),
      id = this.conversationId(),
      body = this.message.trim();
    if (!org || !id || !body || !this.canSend() || this.sending()) return;
    this.sending.set(true);
    this.formErrors.set([]);
    this.api.sendMarketplaceConversationMessage(org, id, body).subscribe({
      next: () => {
        this.message = '';
        this.sending.set(false);
        this.loadThread(id);
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.sending.set(false);
      },
    });
  }
  isMine(senderUserId: string) {
    return senderUserId === this.currentUserId();
  }
  private ensureAndLoad() {
    const org = this.organizationId();
    if (!org || !this.engagementId() || !this.professionalProfileId()) return;
    this.loading.set(true);
    this.formErrors.set([]);
    this.api
      .ensureMarketplaceEngagementConversation(
        org,
        this.engagementId(),
        this.professionalProfileId(),
      )
      .subscribe({
        next: (r) => {
          this.conversationId.set(r.conversationId);
          this.loadThread(r.conversationId);
        },
        error: (e) => {
          this.formErrors.set(this.errors.getMessages(e));
          this.loading.set(false);
        },
      });
  }
  private loadThread(id: string) {
    const org = this.organizationId();
    if (!org) return;
    this.loading.set(true);
    this.api.getMarketplaceConversationThread(org, id, 200).subscribe({
      next: (t) => {
        this.thread.set(t);
        this.loading.set(false);
        if (t.unreadCount > 0)
          this.api
            .markMarketplaceConversationRead(org, id)
            .subscribe({
              next: () => this.thread.update((x) => (x ? { ...x, unreadCount: 0 } : x)),
            });
      },
      error: (e) => {
        this.formErrors.set(this.errors.getMessages(e));
        this.loading.set(false);
      },
    });
  }
}
