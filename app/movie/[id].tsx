import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMovieDetails } from "../../api/tmdb";
import { IconSymbol } from "../../components/ui/icon-symbol";

const { width, height } = Dimensions.get("window");

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  release_date: string;
  vote_average?: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  [key: string]: any;
}

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();

  useEffect(() => {
    if (id) {
      getMovieDetails(Number(id)).then(setMovie);
      checkIfFavorite();
    }
  }, [id]);

  useEffect(() => {
    if (movie) {
      checkIfFavorite();
    }
  }, [movie]);

  const checkIfFavorite = async () => {
    if (!movie) return;
    const favorites = await AsyncStorage.getItem("favorites");
    if (favorites) {
      const favoriteMovies = JSON.parse(favorites);
      setIsFavorite(
        favoriteMovies.some((favMovie: Movie) => favMovie.id === movie.id)
      );
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

    const favorites = await AsyncStorage.getItem("favorites");
    let favoriteMovies = favorites ? JSON.parse(favorites) : [];
    if (isFavorite) {
      favoriteMovies = favoriteMovies.filter(
        (favMovie: Movie) => favMovie.id !== movie.id
      );
    } else {
      favoriteMovies.push(movie);
    }
    await AsyncStorage.setItem("favorites", JSON.stringify(favoriteMovies));
    setIsFavorite(!isFavorite);
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

  if (!movie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.posterContainer}>
          <Image
            source={{
              uri: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "https://via.placeholder.com/300x450/f8fafc/64748b?text=No+Image",
            }}
            style={styles.poster}
            resizeMode="cover"
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
          <Text style={styles.title}>{movie.title}</Text>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            {movie.release_date && (
              <View style={styles.metaItem}>
                <IconSymbol name="calendar" size={16} color="#64748b" />
                <Text style={styles.metaText}>
                  {formatDate(movie.release_date)}
                </Text>
              </View>
            )}

            {movie.runtime && (
              <View style={styles.metaItem}>
                <IconSymbol name="clock" size={16} color="#64748b" />
                <Text style={styles.metaText}>
                  {formatRuntime(movie.runtime)}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.watchButton}>
              <IconSymbol name="play.fill" size={20} color="#fff" />
              <Text style={styles.watchButtonText}>Watch Trailer</Text>
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
        <View style={styles.genresContainer}>
          {movie.genres.map((genre, index) => (
            <View
              key={genre.id}
              style={[styles.genreTag, index === 0 && styles.genreTagFirst]}
            >
              <Text style={styles.genreText}>{genre.name}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overview Section */}
      <View style={styles.overviewSection}>
        <Text style={styles.sectionTitle}>Storyline</Text>
        <Text style={styles.overview}>
          {movie.overview || "No overview available."}
        </Text>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#fef3c7" }]}>
            <IconSymbol name="star.fill" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.detailValue}>
            {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </Text>
          <Text style={styles.detailLabel}>Rating</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#d1fae5" }]}>
            <IconSymbol name="clock" size={20} color="#10b981" />
          </View>
          <Text style={styles.detailValue}>
            {movie.runtime ? formatRuntime(movie.runtime) : "N/A"}
          </Text>
          <Text style={styles.detailLabel}>Duration</Text>
        </View>

        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#fee2e2" }]}>
            <IconSymbol name="calendar" size={20} color="#ef4444" />
          </View>
          <Text style={styles.detailValue}>
            {movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "N/A"}
          </Text>
          <Text style={styles.detailLabel}>Year</Text>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Movie Details</Text>

        <View style={styles.infoList}>
          {movie.release_date && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="calendar" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Release Date</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatDate(movie.release_date)}
              </Text>
            </View>
          )}

          {movie.runtime && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="clock" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Runtime</Text>
              </View>
              <Text style={styles.infoValue}>
                {formatRuntime(movie.runtime)}
              </Text>
            </View>
          )}

          {movie.vote_average && (
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <IconSymbol name="star.fill" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Rating</Text>
              </View>
              <Text style={styles.infoValue}>
                {movie.vote_average.toFixed(1)} / 10
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
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
    color: "#1e293b",
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
    color: "#64748b",
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
    borderBottomColor: "#f1f5f9",
  },
  genreTag: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  genreTagFirst: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  genreText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  overviewSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    color: "#475569",
    lineHeight: 24,
    fontWeight: "400",
  },
  detailsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  detailCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    color: "#1e293b",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    textTransform: "uppercase",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoList: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  castSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  castPlaceholder: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
  },
});
