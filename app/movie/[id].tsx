import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { getMovieDetails, getMovieCredits, getSimilarMovies, getMovieVideos } from "../../api/tmdb";
import { IconSymbol } from "../../components/ui/icon-symbol";
import { Movie, MovieCredits, MovieVideo } from "../../types/movie";
import { handleApiError, getErrorMessage } from "../../utils/errorHandler";
import { useThemeColors } from "../../hooks/use-theme-colors";
import * as WebBrowser from "expo-web-browser";
import MovieCard from "../../components/MovieCard";
import { FlatList } from "react-native";

const { width, height } = Dimensions.get("window");

export default function MovieDetailsScreen() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<MovieCredits | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [trailerVideo, setTrailerVideo] = useState<MovieVideo | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const loadMovieDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const movieId = Number(id);
        
        // Load all data in parallel
        const [movieData, creditsData, similarData, videosData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieCredits(movieId).catch(() => null),
          getSimilarMovies(movieId, 1).catch(() => ({ results: [] })),
          getMovieVideos(movieId).catch(() => ({ results: [] })),
        ]);
        
        setMovie(movieData);
        setCredits(creditsData);
        setSimilarMovies(similarData.results || []);
        
        // Find trailer video
        const trailer = videosData.results?.find(
          (video: MovieVideo) => video.type === "Trailer" && video.site === "YouTube"
        );
        setTrailerVideo(trailer || null);
        
        await checkIfFavorite(movieData);
      } catch (err) {
        const appError = handleApiError(err);
        setError(getErrorMessage(appError));
        console.error("Failed to load movie details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieDetails();
  }, [id]);

  useEffect(() => {
    if (movie) {
      checkIfFavorite(movie);
    }
  }, [movie]);

  const checkIfFavorite = async (movieToCheck?: Movie) => {
    const movieToUse = movieToCheck || movie;
    if (!movieToUse) return;
    
    try {
      const favorites = await AsyncStorage.getItem("favorites");
      if (favorites) {
        const favoriteMovies: Movie[] = JSON.parse(favorites);
        setIsFavorite(
          favoriteMovies.some((favMovie) => favMovie.id === movieToUse.id)
        );
      }
    } catch (err) {
      console.error("Failed to check favorite status:", err);
    }
  };

  const toggleFavorite = async () => {
    if (!movie) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const favorites = await AsyncStorage.getItem("favorites");
      let favoriteMovies: Movie[] = favorites ? JSON.parse(favorites) : [];
      if (isFavorite) {
        favoriteMovies = favoriteMovies.filter(
          (favMovie) => favMovie.id !== movie.id
        );
      } else {
        favoriteMovies.push(movie);
      }
      await AsyncStorage.setItem("favorites", JSON.stringify(favoriteMovies));
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  useLayoutEffect(() => {
    if (movie && navigation) {
      navigation.setOptions({
        headerTransparent: false,
        headerTintColor: "#1a1a1a",
        headerTitle: "",
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerShadowVisible: true,
      });
    }
  }, [navigation, movie]);

  const getRatingColor = (rating?: number) => {
    if (!rating) return "#94a3b8";
    if (rating >= 7.5) return "#10b981";
    if (rating >= 6) return "#f59e0b";
    return "#ef4444";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.errorContainer}>
        <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Failed to load movie</Text>
        <Text style={styles.errorText}>{error || "Movie not found"}</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            const loadMovieDetails = async () => {
              if (!id) return;
              try {
                setIsLoading(true);
                const movieData = await getMovieDetails(Number(id));
                setMovie(movieData);
                await checkIfFavorite(movieData);
              } catch (err) {
                const appError = handleApiError(err);
                setError(getErrorMessage(appError));
              } finally {
                setIsLoading(false);
              }
            };
            loadMovieDetails();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : undefined,
            }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
            placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
          />

          {/* Rating Badge */}
          {movie.vote_average && (
            <View
              style={[
                styles.ratingBadge,
                { backgroundColor: getRatingColor(movie.vote_average) },
              ]}
            >
              <IconSymbol name="star.fill" size={14} color="#fff" />
              <Text style={styles.ratingText}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Title and Actions */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.text }]}>{movie.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {movie.release_date && (
              <View style={styles.metaItem}>
                <IconSymbol name="calendar" size={16} color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {formatDate(movie.release_date)}
                </Text>
              </View>
            )}

            {movie.runtime && (
              <View style={styles.metaItem}>
                <IconSymbol name="clock" size={16} color={colors.icon} />
                <Text style={[styles.metaText, { color: colors.icon }]}>
                  {formatRuntime(movie.runtime)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.watchButton}
              onPress={async () => {
                if (trailerVideo?.key) {
                  const url = `https://www.youtube.com/watch?v=${trailerVideo.key}`;
                  await WebBrowser.openBrowserAsync(url);
                }
              }}
              disabled={!trailerVideo}
            >
              <IconSymbol name="play.fill" size={20} color="#fff" />
              <Text style={styles.watchButtonText}>
                {trailerVideo ? "Watch Trailer" : "No Trailer"}
              </Text>
            </Pressable>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={toggleFavorite}
                style={[
                  styles.favoriteButton,
                  isFavorite && styles.favoriteButtonActive,
                ]}
              >
                <IconSymbol
                  name={isFavorite ? "heart.fill" : "heart"}
                  size={22}
                  color={isFavorite ? "#fff" : "#64748b"}
                />
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Genres */}
      {movie.genres && movie.genres.length > 0 && (
        <View style={[styles.genresContainer, { borderBottomColor: colors.border }]}>
          {movie.genres.map((genre, index) => (
            <View
              key={genre.id}
              style={[
                styles.genreTag,
                {
                  backgroundColor: index === 0 ? colors.tint + '20' : colors.inputBackground,
                  borderColor: index === 0 ? colors.tint : colors.border,
                },
              ]}
            >
              <Text style={[styles.genreText, { color: index === 0 ? colors.tint : colors.text }]}>{genre.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overview Section */}
      <View style={[styles.overviewSection, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Storyline</Text>
        <Text style={[styles.overview, { color: colors.icon }]}>
          {movie.overview || "No overview available."}
        </Text>
      </View>

      {/* Details Grid */}
      <View style={[styles.detailsGrid, { borderBottomColor: colors.border }]}>
        <View style={[styles.detailCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <View style={[styles.detailIcon, { backgroundColor: "#fef3c7" }]}>
            <IconSymbol name="star.fill" size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </Text>
          <Text style={[styles.detailLabel, { color: colors.icon }]}>Rating</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <View style={[styles.detailIcon, { backgroundColor: "#d1fae5" }]}>
            <IconSymbol name="clock" size={20} color="#10b981" />
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {movie.runtime ? formatRuntime(movie.runtime) : "N/A"}
          </Text>
          <Text style={[styles.detailLabel, { color: colors.icon }]}>Duration</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <View style={[styles.detailIcon, { backgroundColor: "#fee2e2" }]}>
            <IconSymbol name="calendar" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "N/A"}
          </Text>
          <Text style={[styles.detailLabel, { color: colors.icon }]}>Year</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={[styles.infoSection, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Movie Details</Text>

        <View style={[styles.infoList, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          {movie.release_date && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="calendar" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Release Date</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(movie.release_date)}
              </Text>
            </View>
          )}

          {movie.runtime && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="clock" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Runtime</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatRuntime(movie.runtime)}
              </Text>
            </View>
          )}

          {movie.vote_average && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="star.fill" size={16} color={colors.icon} />
                <Text style={[styles.infoLabel, { color: colors.icon }]}>Rating</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {movie.vote_average.toFixed(1)} / 10
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Cast Section */}
      {credits && credits.cast && credits.cast.length > 0 && (
        <View style={[styles.castSection, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 20 }]}>Cast</Text>
          <FlatList
            data={credits.cast.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castList}
            renderItem={({ item }) => (
              <View style={[styles.castItem, { backgroundColor: colors.inputBackground }]}>
                <Image
                  source={{
                    uri: item.profile_path
                      ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                      : undefined,
                  }}
                  style={styles.castImage}
                  contentFit="cover"
                  transition={200}
                  placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                  cachePolicy="memory-disk"
                />
                <Text style={[styles.castName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.castCharacter, { color: colors.icon }]} numberOfLines={1}>
                  {item.character}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      )}

      {/* Similar Movies Section */}
      {similarMovies.length > 0 && (
        <View style={styles.similarSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 20 }]}>
            Similar Movies
          </Text>
          <FlatList
            data={similarMovies.slice(0, 10)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarList}
            renderItem={({ item }) => <MovieCard movie={item} isGridView={false} />}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  posterContainer: {
    position: "relative",
    marginRight: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  ratingBadge: {
    position: "absolute",
    top: -6,
    left: -6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  titleSection: {
    flex: 1,
    paddingTop: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    lineHeight: 30,
  },
  metaContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  watchButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  favoriteButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  favoriteButtonActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  genresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 8,
    borderBottomWidth: 1,
  },
  genreTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  genreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  overviewSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  detailsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    borderBottomWidth: 1,
  },
  detailCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  infoList: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  castSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
  },
  castList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  castItem: {
    width: 120,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    marginRight: 8,
  },
  castImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  castName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  castCharacter: {
    fontSize: 11,
    textAlign: "center",
  },
  similarSection: {
    paddingVertical: 24,
  },
  similarList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
