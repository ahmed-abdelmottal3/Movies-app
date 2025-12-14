import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View, Pressable } from 'react-native';
import MovieCard from '../../components/MovieCard';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Movie } from '../../types/movie';
import { MovieListSkeleton } from '../../components/LoadingSkeleton';
import { useThemeColors } from '../../hooks/use-theme-colors';

export default function FavoritesScreen() {
  const colors = useThemeColors();
  const [favorites, setFavorites] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const getFavorites = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const favoritesData = await AsyncStorage.getItem('favorites');
          if (favoritesData) {
            const parsed = JSON.parse(favoritesData);
            setFavorites(Array.isArray(parsed) ? parsed : []);
          } else {
            setFavorites([]);
          }
        } catch (err) {
          console.error('Failed to load favorites:', err);
          setError('Failed to load favorites. Please try again.');
          setFavorites([]);
        } finally {
          setIsLoading(false);
        }
      };
      getFavorites();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Favorites</Text>
        <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
          {favorites.length} {favorites.length === 1 ? 'movie' : 'movies'} saved
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              const getFavorites = async () => {
                try {
                  setIsLoading(true);
                  const favoritesData = await AsyncStorage.getItem('favorites');
                  if (favoritesData) {
                    const parsed = JSON.parse(favoritesData);
                    setFavorites(Array.isArray(parsed) ? parsed : []);
                  } else {
                    setFavorites([]);
                  }
                } catch (err) {
                  console.error('Failed to load favorites:', err);
                  setError('Failed to load favorites. Please try again.');
                  setFavorites([]);
                } finally {
                  setIsLoading(false);
                }
              };
              getFavorites();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <MovieListSkeleton count={4} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <IconSymbol name="heart" size={80} color="#e0e0e0" />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>
            Start exploring movies and tap the heart icon to save your favorites
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => <MovieCard movie={item} isGridView={true} />}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  listContent: {
    padding: 10,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
