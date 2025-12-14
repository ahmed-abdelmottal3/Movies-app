import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import {
  getGenres,
  getMoviesByGenre,
  getPopularMovies,
  searchMovies,
} from "../../api/tmdb";
import MovieCard from "../../components/MovieCard";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { Movie, Genre, MovieResponse } from "../../types/movie";
import { handleApiError, getErrorMessage } from "../../utils/errorHandler";
import { MovieListSkeleton } from "../../components/LoadingSkeleton";
import { useDebounce } from "../../hooks/useDebounce";
import { useThemeColors } from "../../hooks/use-theme-colors";
import { SearchHistoryService } from "../../services/searchHistoryService";
import { useFocusEffect } from "@react-navigation/native";

export default function MoviesScreen() {
  const colors = useThemeColors();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(
    undefined
  );
  const debouncedQuery = useDebounce(query, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await getGenres();
        setGenres(data);
      } catch (err) {
        const appError = handleApiError(err);
        setError(getErrorMessage(appError));
        console.error("Failed to load genres:", err);
      }
    };
    loadGenres();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadSearchHistory = async () => {
        const recent = await SearchHistoryService.getRecentSearches(5);
        setSearchHistory(recent);
      };
      loadSearchHistory();
    }, [])
  );

  // Load movies when search/genre changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasMore(true);

    const loadMovies = async () => {
      try {
        let data: MovieResponse;
        
        if (debouncedQuery.length > 2) {
          data = await searchMovies(debouncedQuery, 1);
        } else if (selectedGenre) {
          data = await getMoviesByGenre(selectedGenre, 1);
        } else {
          data = await getPopularMovies(1);
        }
        
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        setHasMore((data.total_pages || 1) > 1);
        
        // Add to search history if it's a search query
        if (debouncedQuery.length > 2) {
          await SearchHistoryService.addToHistory(debouncedQuery);
          const recent = await SearchHistoryService.getRecentSearches(5);
          setSearchHistory(recent);
        }
        setShowHistory(false);
      } catch (err) {
        const appError = handleApiError(err);
        const errorMessage = getErrorMessage(appError);
        setError(errorMessage);
        setMovies([]);
        console.error("Failed to load movies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovies();
  }, [debouncedQuery, selectedGenre]);

  const loadMoreMovies = async () => {
    if (isLoadingMore || !hasMore || currentPage >= totalPages) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      let data: MovieResponse;
      
      if (debouncedQuery.length > 2) {
        data = await searchMovies(debouncedQuery, nextPage);
      } else if (selectedGenre) {
        data = await getMoviesByGenre(selectedGenre, nextPage);
      } else {
        data = await getPopularMovies(nextPage);
      }

      setMovies((prev) => [...prev, ...(data.results || [])]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < (data.total_pages || 1));
    } catch (err) {
      console.error("Failed to load more movies:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleEndReached = () => {
    if (!isLoadingMore && hasMore) {
      loadMoreMovies();
    }
  };

  // Memoize the renderItem function
  const renderItem = useCallback(
    ({ item }: { item: Movie }) => <MovieCard movie={item} isGridView={true} />,
    []
  );

  // Memoize the keyExtractor function
  const keyExtractor = useCallback((item: Movie, index: number) => {
    return item?.id ? `movie-${item.id}` : `movie-${index}`;
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Discover Movies</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>Find your next favorite film</Text>
      </View>

      {/* Search Section */}
      <View style={[styles.searchSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <IconSymbol
            name="magnifyingglass"
            size={22}
            color={colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search movies..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelectedGenre(undefined);
              setShowHistory(text.length === 0 && searchHistory.length > 0);
            }}
            onFocus={() => {
              if (query.length === 0 && searchHistory.length > 0) {
                setShowHistory(true);
              }
            }}
            onBlur={() => {
              // Delay to allow press events on history items
              setTimeout(() => setShowHistory(false), 200);
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => {
              setQuery("");
              setShowHistory(searchHistory.length > 0);
            }} style={styles.clearButton}>
              <IconSymbol name="xmark" size={16} color={colors.icon} />
            </Pressable>
          )}
        </View>
        
        {/* Search History */}
        {showHistory && searchHistory.length > 0 && (
          <View style={[styles.historyContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Searches</Text>
              <Pressable
                onPress={async () => {
                  await SearchHistoryService.clearHistory();
                  setSearchHistory([]);
                  setShowHistory(false);
                }}
              >
                <Text style={[styles.clearHistoryText, { color: colors.tint }]}>Clear</Text>
              </Pressable>
            </View>
            {searchHistory.map((item, index) => (
              <Pressable
                key={index}
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
                onPress={async () => {
                  setQuery(item);
                  setShowHistory(false);
                  await SearchHistoryService.addToHistory(item);
                }}
              >
                <IconSymbol name="clock" size={16} color={colors.icon} />
                <Text style={[styles.historyText, { color: colors.text }]}>{item}</Text>
                <Pressable
                  onPress={async (e) => {
                    e.stopPropagation();
                    await SearchHistoryService.removeFromHistory(item);
                    const recent = await SearchHistoryService.getRecentSearches(5);
                    setSearchHistory(recent);
                    if (recent.length === 0) {
                      setShowHistory(false);
                    }
                  }}
                  style={styles.removeHistoryButton}
                >
                  <IconSymbol name="xmark" size={12} color={colors.icon} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Category Section */}
      <View style={[styles.categorySection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.categoryTitle, { color: colors.text }]}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          <Pressable
            style={[
              styles.categoryChip,
              { backgroundColor: !selectedGenre ? colors.tint : colors.inputBackground, borderColor: colors.border },
              !selectedGenre && styles.categoryChipActive,
            ]}
            onPress={() => {
              setSelectedGenre(undefined);
              setQuery("");
            }}
          >
            <Text
              style={[
                styles.categoryText,
                { color: !selectedGenre ? '#fff' : colors.icon },
                !selectedGenre && styles.categoryTextActive,
              ]}
            >
              All
            </Text>
          </Pressable>
          {genres.map((genre) => (
            <Pressable
              key={genre.id}
              style={[
                styles.categoryChip,
                { backgroundColor: selectedGenre === genre.id ? colors.tint : colors.inputBackground, borderColor: colors.border },
                selectedGenre === genre.id && styles.categoryChipActive,
              ]}
              onPress={() => {
                setSelectedGenre(genre.id);
                setQuery("");
              }}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedGenre === genre.id ? '#fff' : colors.icon },
                  selectedGenre === genre.id && styles.categoryTextActive,
                ]}
              >
                {genre.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Movies List */}
      {error ? (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              // Trigger reload by updating a dependency
              setQuery((prev) => prev + " ");
              setTimeout(() => setQuery((prev) => prev.trim()), 100);
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <MovieListSkeleton count={6} />
      ) : movies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="film.fill" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No movies found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search or category
          </Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categorySection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipActive: {
    // Active state handled dynamically
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#fff",
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
  },
  historyContainer: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 200,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
  },
  removeHistoryButton: {
    padding: 4,
  },
});
