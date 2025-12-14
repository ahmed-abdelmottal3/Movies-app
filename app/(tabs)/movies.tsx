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

// A simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>(
    undefined
  );
  const debouncedQuery = useDebounce(query, 500);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load movies when search/genre changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);

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
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Movies</Text>
        <Text style={styles.headerSubtitle}>Find your next favorite film</Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={22}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setSelectedGenre(undefined);
            }}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} style={styles.clearButton}>
              <IconSymbol name="xmark" size={16} color="#666" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Section */}
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContainer}
        >
          <Pressable
            style={[
              styles.categoryChip,
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
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading movies...</Text>
        </View>
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#1a1a1a",
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  categorySection: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
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
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#1a1a1a",
    borderColor: "#1a1a1a",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
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
    color: "#666",
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
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
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
    color: "#ef4444",
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
});
