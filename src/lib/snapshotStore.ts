const DB_NAME = 'ruff-config';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'current';

const toError = (value: unknown, fallback: string): Error =>
    value instanceof Error ? value : new Error(fallback);

const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onerror = () => {
            reject(toError(request.error, 'IndexedDB open failed'));
        };
    });

const withStore = async <T,>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> => {
    const db = await openDb();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = run(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => {
            db.close();
            resolve(request.result);
        };
        tx.onabort = () => {
            db.close();
            reject(toError(tx.error, 'IndexedDB transaction aborted'));
        };
    });
};

export const readStoredSnapshot = (): Promise<unknown> =>
    withStore<unknown>('readonly', (store) => store.get(SNAPSHOT_KEY));

export const writeStoredSnapshot = async (snapshot: unknown): Promise<void> => {
    await withStore('readwrite', (store) => store.put(snapshot, SNAPSHOT_KEY));
};
