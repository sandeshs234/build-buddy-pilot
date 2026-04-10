/**
 * IndexedDB-based offline storage for full offline operation.
 * Data is stored locally and can be synced to cloud when connectivity returns.
 */

const DB_NAME = 'buildforge_offline';
const DB_VERSION = 1;
const DATA_STORE = 'module_data';
const SYNC_QUEUE = 'sync_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE);
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE)) {
        db.createObjectStore(SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function offlineGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_STORE, 'readonly');
    const store = tx.objectStore(DATA_STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function offlineSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_STORE, 'readwrite');
    const store = tx.objectStore(DATA_STORE);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function offlineDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DATA_STORE, 'readwrite');
    const store = tx.objectStore(DATA_STORE);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function offlineClearAll(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DATA_STORE, SYNC_QUEUE], 'readwrite');
    tx.objectStore(DATA_STORE).clear();
    tx.objectStore(SYNC_QUEUE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export interface SyncQueueItem {
  id?: number;
  tableName: string;
  key: string;
  data: any[];
  userId: string;
  projectId: string | null;
  timestamp: number;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE);
    store.put({ ...item, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE, 'readonly');
    const store = tx.objectStore(SYNC_QUEUE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE, 'readwrite');
    tx.objectStore(SYNC_QUEUE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Check if the app is online */
export function isOnline(): boolean {
  return navigator.onLine;
}

/** Listen for online/offline status changes */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const onOnline = () => callback(true);
  const onOffline = () => callback(false);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
