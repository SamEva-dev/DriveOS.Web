import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TokenService } from '../../../core/services/token.service';
import {
  FieldSyncItem,
  FieldSyncItemType,
  FieldSyncState,
  FieldSyncSummary,
} from '../models/field-sync.models';

const DB_NAME = 'driveos-field-sync';
const DB_VERSION = 2;
const STORE = 'items';
const KEY_STORE = 'keys';
const DEFAULT_TTL_DAYS = 7;
const PURGE_SYNCED_AFTER_MS = 60_000;

interface EncryptedPayload {
  readonly iv: string;
  readonly ciphertext: string;
}

type PersistedFieldSyncItem = Omit<FieldSyncItem, 'url' | 'body'> & {
  readonly url?: string;
  readonly body?: unknown;
  readonly encryptedPayload?: EncryptedPayload;
};

@Injectable({ providedIn: 'root' })
export class FieldSyncQueueService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenService);
  private readonly itemsSignal = signal<readonly FieldSyncItem[]>([]);
  private readonly runningSignal = signal(false);
  private readonly onlineSignal = signal(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  private dbPromise: Promise<IDBDatabase> | null = null;

  readonly items = this.itemsSignal.asReadonly();
  readonly running = this.runningSignal.asReadonly();
  readonly online = this.onlineSignal.asReadonly();
  readonly summary = computed<FieldSyncSummary>(() => {
    const items = this.itemsSignal();
    const last =
      items
        .map((item) => item.lastSuccessAtUtc)
        .filter((value): value is string => !!value)
        .sort()
        .at(-1) ?? null;
    return {
      pending: items.filter(
        (item) =>
          item.state === 'LocalDraft' || item.state === 'PendingSync' || item.state === 'Syncing',
      ).length,
      failed: items.filter((item) => item.state === 'Failed').length,
      conflicts: items.filter((item) => item.state === 'Conflict').length,
      blocked: items.filter(
        (item) => item.state === 'BlockedByPermission' || item.state === 'BlockedByValidation',
      ).length,
      synced: items.filter((item) => item.state === 'Synced').length,
      lastSuccessfulSyncAtUtc: last,
    };
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      window.addEventListener(
        'driveos:session-revoked',
        this.handleSessionRevoked as EventListener,
      );
    }
    void this.refresh();
  }

  async enqueueRequest(request: {
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    body: unknown;
    permission?: string | null;
  }): Promise<FieldSyncItem | null> {
    const context = this.currentContext();
    if (!context) return null;
    const descriptor = this.describe(request.url, request.body);
    const normalizedBody = this.normalizeOfflineBody(request.body);
    const operationId = this.extractOperationId(normalizedBody);
    const existing = operationId
      ? this.itemsSignal().find(
          (item) =>
            item.ownerUserId === context.userId &&
            item.organizationId === context.organizationId &&
            item.operationId === operationId,
        )
      : undefined;
    if (existing) return existing;

    const now = new Date();
    const item: FieldSyncItem = {
      id: crypto.randomUUID(),
      ownerUserId: context.userId,
      organizationId: context.organizationId,
      sessionId: descriptor.sessionId,
      type: descriptor.type,
      method: request.method,
      url: request.url,
      body: normalizedBody,
      operationId,
      permission: request.permission ?? descriptor.permission,
      dependsOn: this.inferDependencies(descriptor.sessionId, descriptor.type),
      createdAtUtc: now.toISOString(),
      expiresAtUtc: new Date(now.getTime() + DEFAULT_TTL_DAYS * 86_400_000).toISOString(),
      updatedAtUtc: now.toISOString(),
      state: 'PendingSync',
      retryCount: 0,
      lastAttemptAtUtc: null,
      lastSuccessAtUtc: null,
      errorCode: null,
      errorMessageKey: null,
    };
    await this.put(item);
    await this.refresh();
    return item;
  }

  async refresh(): Promise<void> {
    const context = this.currentContext();
    if (!context) {
      this.itemsSignal.set([]);
      return;
    }
    await this.purgeExpired();
    const all = await this.getAll();
    this.itemsSignal.set(
      all
        .filter(
          (item) =>
            item.ownerUserId === context.userId && item.organizationId === context.organizationId,
        )
        .sort((a, b) => a.createdAtUtc.localeCompare(b.createdAtUtc)),
    );
  }

  async syncNow(): Promise<void> {
    if (this.runningSignal() || !this.onlineSignal()) return;
    this.runningSignal.set(true);
    try {
      await this.refresh();
      let progressed = true;
      while (progressed && this.onlineSignal()) {
        progressed = false;
        const candidates = this.itemsSignal().filter((item) =>
          ['PendingSync', 'Failed'].includes(item.state),
        );
        for (const item of candidates) {
          if (!this.dependenciesSatisfied(item)) continue;
          await this.syncItem(item.id);
          progressed = true;
          await this.refresh();
        }
      }
      await this.purgeSynced();
      await this.refresh();
    } finally {
      this.runningSignal.set(false);
    }
  }

  async retry(id: string): Promise<void> {
    const item = this.itemsSignal().find((candidate) => candidate.id === id);
    if (!item) return;
    await this.put({
      ...item,
      state: 'PendingSync',
      errorCode: null,
      errorMessageKey: null,
      updatedAtUtc: new Date().toISOString(),
    });
    await this.refresh();
    await this.syncNow();
  }

  async deleteLocalDraft(id: string): Promise<void> {
    const item = this.itemsSignal().find((candidate) => candidate.id === id);
    if (!item || item.state === 'Syncing') return;
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await this.refresh();
  }

  exportEvidence(id: string): void {
    const item = this.itemsSignal().find((candidate) => candidate.id === id);
    if (!item || typeof document === 'undefined') return;
    const safe = {
      exportedAtUtc: new Date().toISOString(),
      item: { ...item, body: item.body },
    };
    const blob = new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `driveos-local-evidence-${item.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async syncItem(id: string): Promise<void> {
    const item = this.itemsSignal().find((candidate) => candidate.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    await this.put({ ...item, state: 'Syncing', lastAttemptAtUtc: now, updatedAtUtc: now });
    try {
      await firstValueFrom(
        this.http.request(item.method, item.url, { body: item.body, observe: 'response' }),
      );
      await this.put({
        ...item,
        state: 'Synced',
        retryCount: item.retryCount + 1,
        lastAttemptAtUtc: now,
        lastSuccessAtUtc: new Date().toISOString(),
        errorCode: null,
        errorMessageKey: null,
        updatedAtUtc: new Date().toISOString(),
      });
    } catch (error) {
      const classified = this.classify(error);
      await this.put({
        ...item,
        state: classified.state,
        retryCount: item.retryCount + 1,
        lastAttemptAtUtc: now,
        errorCode: classified.code,
        errorMessageKey: classified.messageKey,
        updatedAtUtc: new Date().toISOString(),
      });
    }
  }

  private classify(error: unknown): {
    state: FieldSyncState;
    code: string | null;
    messageKey: string | null;
  } {
    const http = error as HttpErrorResponse;
    const payload = (http?.error ?? {}) as { code?: string; messageKey?: string };
    if (!http || http.status === 0)
      return { state: 'Failed', code: 'Network', messageKey: 'training.sync.errors.network' };
    if (http.status === 401 || http.status === 403)
      return {
        state: 'BlockedByPermission',
        code: payload.code ?? `HTTP_${http.status}`,
        messageKey: payload.messageKey ?? 'training.sync.errors.permission',
      };
    if (http.status === 409 || /Version\.Conflict|Conflict/i.test(payload.code ?? ''))
      return {
        state: 'Conflict',
        code: payload.code ?? 'Conflict',
        messageKey: payload.messageKey ?? 'training.sync.errors.conflict',
      };
    if (http.status === 400 || http.status === 422)
      return {
        state: 'BlockedByValidation',
        code: payload.code ?? `HTTP_${http.status}`,
        messageKey: payload.messageKey ?? 'training.sync.errors.validation',
      };
    return {
      state: 'Failed',
      code: payload.code ?? `HTTP_${http.status}`,
      messageKey: payload.messageKey ?? 'training.sync.errors.failed',
    };
  }

  private dependenciesSatisfied(item: FieldSyncItem): boolean {
    return item.dependsOn.every(
      (id) => this.itemsSignal().find((candidate) => candidate.id === id)?.state === 'Synced',
    );
  }

  private inferDependencies(sessionId: string | null, type: FieldSyncItemType): readonly string[] {
    if (!sessionId) return [];
    const sameSession = this.itemsSignal().filter(
      (item) => item.sessionId === sessionId && item.state !== 'Synced',
    );
    const order: readonly FieldSyncItemType[] = [
      'SessionStart',
      'Attendance',
      'SessionMarker',
      'Observation',
      'Intervention',
      'VehicleMileage',
      'VehicleCheck',
      'Incident',
      'SessionEnd',
      'SessionReport',
      'CompetencyAssessment',
      'Photo',
    ];
    const rank = order.indexOf(type);
    if (rank < 0) return [];
    const predecessor = [...sameSession].reverse().find((item) => {
      const predecessorRank = order.indexOf(item.type);
      return predecessorRank >= 0 && predecessorRank < rank;
    });
    return predecessor ? [predecessor.id] : [];
  }

  private describe(
    url: string,
    body: unknown,
  ): { type: FieldSyncItemType; sessionId: string | null; permission: string | null } {
    const base = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
    const path = new URL(url, base).pathname;
    const match = path.match(/\/training-delivery\/sessions\/([0-9a-f-]{36})/i);
    const sessionId = match?.[1] ?? null;
    const mappings: Array<[RegExp, FieldSyncItemType, string | null]> = [
      [/\/start$/, 'SessionStart', 'TrainingDelivery.Sessions.Start'],
      [/\/finish$/, 'SessionEnd', 'TrainingDelivery.Sessions.Complete'],
      [
        /\/attendance(?:\/correct|\/override)?$/,
        'Attendance',
        'TrainingDelivery.Attendance.Record',
      ],
      [/\/markers$/, 'SessionMarker', 'TrainingDelivery.Execution.Observations.Record'],
      [/\/observations$/, 'Observation', 'TrainingDelivery.Execution.Observations.Record'],
      [/\/interventions$/, 'Intervention', 'TrainingDelivery.Execution.Interventions.Record'],
      [/\/odometer$/, 'VehicleMileage', 'TrainingDelivery.Execution.Odometer.Record'],
      [/\/energy$/, 'VehicleCheck', 'TrainingDelivery.Execution.Odometer.Record'],
      [/\/incidents$/, 'Incident', 'TrainingDelivery.Incidents.Report'],
      [/\/assessments$/, 'CompetencyAssessment', 'TrainingDelivery.Assessments.Record'],
      [
        /\/report\/(draft|shared-comment|internal-note|ready|submit)$/,
        'SessionReport',
        'TrainingDelivery.Reports.Submit',
      ],
      [/\/interrupt$/, 'SessionInterrupt', 'TrainingDelivery.Execution.Interrupt'],
      [/\/resume$/, 'SessionResume', 'TrainingDelivery.Execution.Resume'],
    ];
    const found = mappings.find(([pattern]) => pattern.test(path));
    return { type: found?.[1] ?? 'Other', sessionId, permission: found?.[2] ?? null };
  }

  private normalizeOfflineBody(body: unknown): unknown {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
    const record = body as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(record, 'createdOffline')
      ? { ...record, createdOffline: true }
      : body;
  }

  private extractOperationId(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const value = (body as { operationId?: unknown }).operationId;
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private currentContext(): { userId: string; organizationId: string } | null {
    const stored = this.tokens.load();
    if (!stored) return null;
    const payload = this.tokens.decode(stored.accessToken);
    const organizationId = payload?.organization_id ?? payload?.tenant_id;
    if (!payload?.sub || !organizationId) return null;
    return { userId: payload.sub, organizationId };
  }

  private async purgeExpired(): Promise<void> {
    const now = Date.now();
    const all = await this.getAll();
    for (const item of all)
      if (new Date(item.expiresAtUtc).getTime() <= now) await this.deleteById(item.id);
  }

  private async purgeSynced(): Promise<void> {
    const threshold = Date.now() - PURGE_SYNCED_AFTER_MS;
    const all = await this.getAll();
    for (const item of all)
      if (
        item.state === 'Synced' &&
        item.lastSuccessAtUtc &&
        new Date(item.lastSuccessAtUtc).getTime() <= threshold
      )
        await this.deleteById(item.id);
  }

  private async purgeCurrentContext(): Promise<void> {
    const context = this.currentContext();
    const all = await this.getAll();
    for (const item of all) {
      if (
        !context ||
        (item.ownerUserId === context.userId && item.organizationId === context.organizationId)
      )
        await this.deleteById(item.id);
    }
    if (context) await this.deleteEncryptionKey(context.userId, context.organizationId);
    this.itemsSignal.set([]);
  }

  private readonly handleOnline = (): void => {
    this.onlineSignal.set(true);
    void this.syncNow();
  };
  private readonly handleOffline = (): void => this.onlineSignal.set(false);
  private readonly handleSessionRevoked = (): void => {
    void this.purgeCurrentContext();
  };

  private async db(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  private async getAll(): Promise<FieldSyncItem[]> {
    if (typeof indexedDB === 'undefined') return [];
    const db = await this.db();
    const persisted = await new Promise<PersistedFieldSyncItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as PersistedFieldSyncItem[]);
      request.onerror = () => reject(request.error);
    });
    const items: FieldSyncItem[] = [];
    for (const item of persisted) {
      const decoded = await this.decryptItem(item);
      if (!decoded) {
        await this.deleteById(item.id);
        continue;
      }
      items.push(decoded);
      if (!item.encryptedPayload) await this.put(decoded);
    }
    return items;
  }

  private async put(item: FieldSyncItem): Promise<void> {
    const db = await this.db();
    const persisted = await this.encryptItem(item);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(persisted);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async deleteById(id: string): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private async encryptItem(item: FieldSyncItem): Promise<PersistedFieldSyncItem> {
    if (!globalThis.crypto?.subtle) throw new Error('OFFLINE_ENCRYPTION_UNAVAILABLE');
    const key = await this.getOrCreateEncryptionKey(item.ownerUserId, item.organizationId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify({ url: item.url, body: item.body }));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    const { url: _url, body: _body, ...metadata } = item;
    return {
      ...metadata,
      encryptedPayload: {
        iv: this.toBase64(iv),
        ciphertext: this.toBase64(new Uint8Array(ciphertext)),
      },
    };
  }

  private async decryptItem(item: PersistedFieldSyncItem): Promise<FieldSyncItem | null> {
    if (!item.encryptedPayload) {
      if (!globalThis.crypto?.subtle) return null;
      if (typeof item.url !== 'string') return null;
      return item as FieldSyncItem;
    }
    try {
      const key = await this.getOrCreateEncryptionKey(item.ownerUserId, item.organizationId);
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: this.fromBase64(item.encryptedPayload.iv) },
        key,
        this.fromBase64(item.encryptedPayload.ciphertext),
      );
      const payload = JSON.parse(new TextDecoder().decode(plaintext)) as {
        url: string;
        body: unknown;
      };
      const { encryptedPayload: _encryptedPayload, ...metadata } = item;
      return { ...metadata, url: payload.url, body: payload.body } as FieldSyncItem;
    } catch {
      return null;
    }
  }

  private async getOrCreateEncryptionKey(userId: string, organizationId: string): Promise<CryptoKey> {
    const db = await this.db();
    const keyId = `${userId}:${organizationId}`;
    const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readonly');
      const request = tx.objectStore(KEY_STORE).get(keyId);
      request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
      request.onerror = () => reject(request.error);
    });
    if (existing) return existing;
    const generated = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readwrite');
      tx.objectStore(KEY_STORE).put(generated, keyId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return generated;
  }

  private async deleteEncryptionKey(userId: string, organizationId: string): Promise<void> {
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readwrite');
      tx.objectStore(KEY_STORE).delete(`${userId}:${organizationId}`);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  private toBase64(value: Uint8Array): string {
    let binary = '';
    for (const byte of value) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  private fromBase64(value: string): Uint8Array<ArrayBuffer> {
    const bytes = Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
    return new Uint8Array(bytes);
  }
}
