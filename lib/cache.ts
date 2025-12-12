import { AIEnhancedAnalysisResult, CachedAnalysis } from '@/types';

const CACHE_PREFIX = 'gitscore_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DB_NAME = 'GitScoreDB';
const STORE_NAME = 'analyses';

/**
 * Generate cache key for a repository
 */
export function getCacheKey(owner: string, repo: string): string {
  return `${owner}/${repo}`.toLowerCase();
}

/**
 * In-memory cache for fastest access
 */
const memoryCache = new Map<string, CachedAnalysis>();

/**
 * Check if cached data is still valid
 */
function isValidCache(cached: CachedAnalysis): boolean {
  return Date.now() < cached.expiresAt;
}

/**
 * Get analysis from cache (checks memory, then localStorage, then IndexedDB)
 */
export async function getCachedAnalysis(
  owner: string,
  repo: string
): Promise<AIEnhancedAnalysisResult | null> {
  const key = getCacheKey(owner, repo);

  // Check memory cache first (fastest)
  const memCached = memoryCache.get(key);
  if (memCached && isValidCache(memCached)) {
    return memCached.result;
  }

  // Check localStorage
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);
    if (stored) {
      const cached: CachedAnalysis = JSON.parse(stored);
      if (isValidCache(cached)) {
        // Restore to memory cache
        memoryCache.set(key, cached);
        return cached.result;
      } else {
        // Remove expired cache
        localStorage.removeItem(CACHE_PREFIX + key);
      }
    }
  } catch (e) {
    console.warn('LocalStorage cache read failed:', e);
  }

  // Check IndexedDB for larger data
  try {
    const cached = await getFromIndexedDB(key);
    if (cached && isValidCache(cached)) {
      memoryCache.set(key, cached);
      return cached.result;
    }
  } catch (e) {
    console.warn('IndexedDB cache read failed:', e);
  }

  return null;
}

/**
 * Store analysis in cache (all three layers)
 */
export async function setCachedAnalysis(
  owner: string,
  repo: string,
  result: AIEnhancedAnalysisResult
): Promise<void> {
  const key = getCacheKey(owner, repo);
  const cached: CachedAnalysis = {
    result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_TTL,
    repoKey: key,
  };

  // Store in memory cache
  memoryCache.set(key, cached);

  // Try localStorage
  try {
    const serialized = JSON.stringify(cached);
    // Only use localStorage for smaller results (< 2MB)
    if (serialized.length < 2 * 1024 * 1024) {
      localStorage.setItem(CACHE_PREFIX + key, serialized);
    } else {
      // Use IndexedDB for larger results
      await saveToIndexedDB(key, cached);
    }
  } catch (e) {
    // localStorage might be full or unavailable, fall back to IndexedDB
    console.warn('LocalStorage cache write failed, using IndexedDB:', e);
    try {
      await saveToIndexedDB(key, cached);
    } catch (dbError) {
      console.warn('IndexedDB cache write failed:', dbError);
    }
  }
}

/**
 * Clear cache for a specific repository
 */
export async function clearCachedAnalysis(owner: string, repo: string): Promise<void> {
  const key = getCacheKey(owner, repo);

  memoryCache.delete(key);

  try {
    localStorage.removeItem(CACHE_PREFIX + key);
  } catch (e) {
    console.warn('LocalStorage cache clear failed:', e);
  }

  try {
    await deleteFromIndexedDB(key);
  } catch (e) {
    console.warn('IndexedDB cache clear failed:', e);
  }
}

/**
 * Clear all cached analyses
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();

  // Clear localStorage cache
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    keys.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('LocalStorage clear failed:', e);
  }

  // Clear IndexedDB
  try {
    await clearIndexedDB();
  } catch (e) {
    console.warn('IndexedDB clear failed:', e);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  memoryEntries: number;
  localStorageEntries: number;
} {
  let localStorageEntries = 0;
  try {
    localStorageEntries = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX)
    ).length;
  } catch {
    // Ignore
  }

  return {
    memoryEntries: memoryCache.size,
    localStorageEntries,
  };
}

// IndexedDB helpers
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'repoKey' });
      }
    };
  });
}

async function getFromIndexedDB(key: string): Promise<CachedAnalysis | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

async function saveToIndexedDB(key: string, data: CachedAnalysis): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ ...data, repoKey: key });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteFromIndexedDB(key: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(key);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function clearIndexedDB(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
