import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'movie_cache_';
const CACHE_EXPIRY_PREFIX = 'movie_cache_expiry_';
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  /**
   * Store data in cache with expiration
   */
  static async set<T>(key: string, data: T, duration: number = DEFAULT_CACHE_DURATION): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const expiryTime = Date.now() + duration;

      await AsyncStorage.multiSet([
        [cacheKey, JSON.stringify({ data, timestamp: Date.now() })],
        [expiryKey, expiryTime.toString()],
      ]);
    } catch (error) {
      console.error(`Failed to cache data for key ${key}:`, error);
    }
  }

  /**
   * Get data from cache if not expired
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

      const [cachedData, expiryTime] = await AsyncStorage.multiGet([cacheKey, expiryKey]);

      if (!cachedData[1] || !expiryTime[1]) {
        return null;
      }

      const expiry = parseInt(expiryTime[1], 10);
      if (Date.now() > expiry) {
        // Cache expired, remove it
        await AsyncStorage.multiRemove([cacheKey, expiryKey]);
        return null;
      }

      const parsed: CacheItem<T> = JSON.parse(cachedData[1]);
      return parsed.data;
    } catch (error) {
      console.error(`Failed to get cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove specific cache entry
   */
  static async remove(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
    } catch (error) {
      console.error(`Failed to remove cache for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX)
      );
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache entry exists and is valid
   */
  static async isValid(key: string): Promise<boolean> {
    try {
      const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
      const expiryTime = await AsyncStorage.getItem(expiryKey);
      
      if (!expiryTime) {
        return false;
      }

      const expiry = parseInt(expiryTime, 10);
      return Date.now() < expiry;
    } catch (error) {
      console.error(`Failed to check cache validity for key ${key}:`, error);
      return false;
    }
  }
}

