const STORAGE_KEY = 'birstore_offline_queue';
const FLUSH_INTERVAL_MS = 30000;

interface QueueEntry {
  id: string;
  type: string;
  payload: unknown;
  queuedAt: string;
}

type QueueHandler = (payload: unknown) => Promise<void>;

const handlers = new Map<string, QueueHandler>();
const listeners = new Set<() => void>();

function readQueue(): QueueEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueueEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  for (const listener of listeners) listener();
}

function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true;
  if (e instanceof Error && /network|fetch failed|failed to fetch/i.test(e.message)) return true;
  return false;
}

/** Belirli bir yazma işlemi türü için kuyruktan tekrar denendiğinde çağrılacak fonksiyon. */
export function registerOfflineHandler(type: string, handler: QueueHandler): void {
  handlers.set(type, handler);
}

/**
 * `fn`'i çalıştırır; ağ hatası nedeniyle başarısız olursa `payload`'ı kuyruğa alır ve
 * sessizce döner (hata fırlatmaz). Ağ dışı bir hata olursa (örn. geçersiz veri) olduğu gibi fırlatılır.
 */
export async function runOrQueue<T>(type: string, payload: unknown, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (!isNetworkError(e)) throw e;
    const entries = readQueue();
    entries.push({ id: crypto.randomUUID(), type, payload, queuedAt: new Date().toISOString() });
    writeQueue(entries);
    return null;
  }
}

export async function flushQueue(): Promise<void> {
  const entries = readQueue();
  if (entries.length === 0) return;

  const remaining: QueueEntry[] = [];
  for (const entry of entries) {
    const handler = handlers.get(entry.type);
    if (!handler) {
      remaining.push(entry);
      continue;
    }
    try {
      await handler(entry.payload);
    } catch (e) {
      if (isNetworkError(e)) remaining.push(entry);
      // ağ dışı bir hata ise kayıt sonsuza dek tekrar denenmesin diye kuyruktan düşürülür
    }
  }
  writeQueue(remaining);
}

export function getQueueLength(): number {
  return readQueue().length;
}

export function subscribeQueueLength(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let started = false;
export function startOfflineQueue(): void {
  if (started) return;
  started = true;
  window.addEventListener('online', () => void flushQueue());
  setInterval(() => void flushQueue(), FLUSH_INTERVAL_MS);
}
