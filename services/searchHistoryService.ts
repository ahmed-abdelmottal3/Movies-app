import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
}

export class SearchHistoryService {
  /**
   * Get search history
   */
  static async getHistory(): Promise<SearchHistoryItem[]> {
    try {
      const historyData = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (historyData) {
        const history: SearchHistoryItem[] = JSON.parse(historyData);
        // Sort by timestamp (newest first) and return
        return history.sort((a, b) => b.timestamp - a.timestamp);
      }
      return [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  /**
   * Add a search query to history
   */
  static async addToHistory(query: string): Promise<void> {
    try {
      if (!query || query.trim().length === 0) {
        return;
      }

      const trimmedQuery = query.trim();
      const queryLower = trimmedQuery.toLowerCase();
      const history = await this.getHistory();

      // Remove duplicate entries (case-insensitive comparison)
      const filteredHistory = history.filter(
        (item) => item.query.toLowerCase() !== queryLower
      );

      // Add new entry at the beginning (preserve original casing)
      const newHistory: SearchHistoryItem[] = [
        { query: trimmedQuery, timestamp: Date.now() },
        ...filteredHistory,
      ].slice(0, MAX_HISTORY_ITEMS); // Keep only the latest MAX_HISTORY_ITEMS

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to add to search history:', error);
    }
  }

  /**
   * Clear search history
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }

  /**
   * Remove a specific item from history
   */
  static async removeFromHistory(query: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const filteredHistory = history.filter(
        (item) => item.query.toLowerCase() !== query.toLowerCase()
      );
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Failed to remove from search history:', error);
    }
  }

  /**
   * Get recent searches (last 5)
   */
  static async getRecentSearches(limit: number = 5): Promise<string[]> {
    try {
      const history = await this.getHistory();
      return history.slice(0, limit).map((item) => item.query);
    } catch (error) {
      console.error('Failed to get recent searches:', error);
      return [];
    }
  }
}

