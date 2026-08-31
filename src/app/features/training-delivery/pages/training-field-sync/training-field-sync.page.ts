import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldSyncQueueService } from '../../data-access/field-sync-queue.service';
import { FieldSyncItem, FieldSyncState } from '../../models/field-sync.models';
import { DriveOsDrawerComponent } from '../../../../shared/ui';

@Component({
  selector: 'driveos-training-field-sync-page',
  standalone: true,
  imports: [TranslatePipe, DatePipe, DriveOsDrawerComponent],
  templateUrl: './training-field-sync.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingFieldSyncPage {
  readonly queue = inject(FieldSyncQueueService);
  private readonly router = inject(Router);
  readonly filter = signal<FieldSyncState | 'All'>('All');
  readonly selected = signal<FieldSyncItem | null>(null);
  readonly visibleItems = computed(() => {
    const filter = this.filter();
    return filter === 'All'
      ? this.queue.items()
      : this.queue.items().filter((item) => item.state === filter);
  });
  readonly filters: readonly (FieldSyncState | 'All')[] = [
    'All',
    'PendingSync',
    'Failed',
    'Conflict',
    'BlockedByPermission',
    'BlockedByValidation',
    'Synced',
  ];

  constructor() {
    void this.queue.refresh();
  }

  setFilter(value: FieldSyncState | 'All'): void {
    this.filter.set(value);
  }
  open(item: FieldSyncItem): void {
    this.selected.set(item);
  }
  close(): void {
    this.selected.set(null);
  }
  syncNow(): void {
    void this.queue.syncNow();
  }
  retry(item: FieldSyncItem): void {
    void this.queue.retry(item.id);
  }
  deleteDraft(item: FieldSyncItem): void {
    void this.queue.deleteLocalDraft(item.id);
    this.close();
  }
  exportEvidence(item: FieldSyncItem): void {
    this.queue.exportEvidence(item.id);
  }

  resolve(item: FieldSyncItem): void {
    if (!item.sessionId) return;
    if (item.type === 'SessionReport')
      void this.router.navigate(['/training/sessions', item.sessionId, 'report']);
    else void this.router.navigate(['/training/sessions', item.sessionId]);
    this.close();
  }

  stateKey(state: FieldSyncState): string {
    return `training.sync.states.${state}`;
  }
  typeKey(type: string): string {
    return `training.sync.types.${type}`;
  }
}
