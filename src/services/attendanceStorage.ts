import { AttendanceSession, StudentAttendance } from '../types/attendance';

const DB_NAME = 'RollCallDB';
const DB_VERSION = 1;
const STORE_NAME = 'attendance_sessions';
const LOCAL_STORAGE_PREFIX = 'rollcall_session_';
const LOCAL_STORAGE_INDEX = 'rollcall_all_sessions';

/**
 * Storage Abstraction Interface
 * This allows replacing the underlying persistence mechanism with Supabase or Firebase in the future.
 */
export interface AttendanceStorage {
  saveAttendance(session: AttendanceSession): Promise<void>;
  getAttendanceByDate(date: string): Promise<AttendanceSession | null>;
  getAllAttendance(): Promise<AttendanceSession[]>;
  deleteAttendance(date: string): Promise<void>;
  clearAttendance(date: string): Promise<void>;
  updateAttendance(date: string, students: StudentAttendance[]): Promise<AttendanceSession | null>;
  getMostRecentSession(): Promise<AttendanceSession | null>;
}

class IndexedDBAttendanceStorage implements AttendanceStorage {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean;

  constructor() {
    this.isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB not supported');
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'date' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async saveAttendance(session: AttendanceSession): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put({
          ...session,
          updatedAt: new Date().toISOString(),
        });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB save failed, falling back to localStorage:', err);
      this.saveToLocalStorage(session);
    }
  }

  async getAttendanceByDate(date: string): Promise<AttendanceSession | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(date);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB read failed, falling back to localStorage:', err);
      return this.getFromLocalStorage(date);
    }
  }

  async getAllAttendance(): Promise<AttendanceSession[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          const sessions: AttendanceSession[] = req.result || [];
          // Sort by date descending (latest first)
          sessions.sort((a, b) => b.date.localeCompare(a.date));
          resolve(sessions);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB getAll failed, falling back to localStorage:', err);
      return this.getAllFromLocalStorage();
    }
  }

  async deleteAttendance(date: string): Promise<void> {
    // Delete from localStorage fallback
    this.deleteFromLocalStorage(date);

    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(date);

        tx.oncomplete = () => {
          resolve();
        };

        tx.onerror = () => {
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('IndexedDB delete fallback:', err);
    }
  }

  async clearAttendance(date: string): Promise<void> {
    const existing = await this.getAttendanceByDate(date);
    if (!existing) return;

    // Reset all student statuses to 'unmarked'
    const clearedStudents = existing.students.map((s) => ({
      ...s,
      status: 'unmarked' as const,
      updatedAt: Date.now(),
    }));

    const updatedSession: AttendanceSession = {
      ...existing,
      students: clearedStudents,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAttendance(updatedSession);
  }

  async updateAttendance(
    date: string,
    students: StudentAttendance[]
  ): Promise<AttendanceSession | null> {
    const existing = await this.getAttendanceByDate(date);
    if (!existing) return null;

    const updatedSession: AttendanceSession = {
      ...existing,
      students,
      updatedAt: new Date().toISOString(),
    };

    await this.saveAttendance(updatedSession);
    return updatedSession;
  }

  async getMostRecentSession(): Promise<AttendanceSession | null> {
    const all = await this.getAllAttendance();
    return all.length > 0 ? all[0] : null;
  }

  // --- LocalStorage Fallback Helpers ---

  private saveToLocalStorage(session: AttendanceSession): void {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${session.date}`, JSON.stringify(session));
      const dates = this.getLocalStorageDates();
      if (!dates.includes(session.date)) {
        dates.push(session.date);
        localStorage.setItem(LOCAL_STORAGE_INDEX, JSON.stringify(dates));
      }
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }

  private getFromLocalStorage(date: string): AttendanceSession | null {
    try {
      const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${date}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getAllFromLocalStorage(): AttendanceSession[] {
    try {
      const dates = this.getLocalStorageDates();
      const sessions: AttendanceSession[] = [];
      for (const d of dates) {
        const item = this.getFromLocalStorage(d);
        if (item) sessions.push(item);
      }
      sessions.sort((a, b) => b.date.localeCompare(a.date));
      return sessions;
    } catch {
      return [];
    }
  }

  private deleteFromLocalStorage(date: string): void {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${date}`);
      const dates = this.getLocalStorageDates().filter((d) => d !== date);
      localStorage.setItem(LOCAL_STORAGE_INDEX, JSON.stringify(dates));
    } catch (e) {
      console.error('LocalStorage delete failed:', e);
    }
  }

  private getLocalStorageDates(): string[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_INDEX);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance of storage provider
export const attendanceStorage: AttendanceStorage = new IndexedDBAttendanceStorage();
