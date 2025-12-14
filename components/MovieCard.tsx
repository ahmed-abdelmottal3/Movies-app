import { Link } from "expo-router";
import React, { memo, useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { IconSymbol } from "./ui/icon-symbol";
import { Movie, Genre } from "../types/movie";
import { getGenres } from "../api/tmdb";

interface MovieCardProps {
  movie: Movie;
  isGridView?: boolean;
}

function MovieCard({ movie, isGridView = true }: MovieCardProps) {
  const [movieGenres, setMovieGenres] = useState<Genre[]>([]);

  useEffect(() => {
    const loadGenres = async () => {
      if (movie.genres && movie.genres.length > 0) {
        setMovieGenres(movie.genres);
      } else if (movie.genre_ids && movie.genre_ids.length > 0) {
        try {
          const allGenres = await getGenres();
          const genreIds = movie.genre_ids;
          const matchedGenres = allGenres.filter((genre: Genre) =>
            genreIds.includes(genre.id)
          );
          setMovieGenres(matchedGenres.slice(0, 2)); // Show max 2 genres
        } catch (err) {
          console.error("Failed to load genres:", err);
        }
      }
    };
    loadGenres();
  }, [movie.genres, movie.genre_ids]);


  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.getFullYear();
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "#999";
    if (rating >= 7.5) return "#00D4AA";
    if (rating >= 6) return "#FFB800";
    return "#FF4757";
  };

  if (isGridView) {
    return (
      <View style={styles.card}>
        <View style={styles.cardPressable}>
          {/* Poster Container */}
          <View style={styles.posterContainer}>
            {movie.id && (
              <Link href={`/movie/${movie.id}`} asChild>
                <Pressable style={styles.posterLink}>
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

                  {/* Gradient Overlay */}
                  <View style={styles.gradientOverlay} />

                  {/* Rating Badge */}
                  {movie.vote_average !== undefined &&
                    movie.vote_average !== null && (
                      <View
                        style={[
                          styles.ratingBadge,
                          {
                            backgroundColor: getRatingColor(movie.vote_average),
                          },
                        ]}
                      >
                        <IconSymbol name="star.fill" size={12} color="#fff" />
                        <Text style={styles.ratingText}>
                          {movie.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    )}

                  {/* Year Badge */}
                  {movie.release_date && (
                    <View style={styles.yearBadge}>
                      <Text style={styles.yearBadgeText}>
                        {formatDate(movie.release_date)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Link>
            )}

          </View>

          {/* Movie Info */}
          {movie.id ? (
            <Link href={`/movie/${movie.id}`} asChild>
              <Pressable style={styles.cardInfo}>
                <Text style={styles.title} numberOfLines={2}>
                  {movie.title || "Untitled"}
                </Text>
                {movieGenres.length > 0 && (
                  <View style={styles.genreTags}>
                    {movieGenres.slice(0, 2).map((genre: Genre) => (
                      <View key={genre.id} style={styles.genreTag}>
                        <Text style={styles.genreTagText}>{genre.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            </Link>
          ) : (
            <View style={styles.cardInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {movie.title || "Untitled"}
              </Text>
              {movieGenres.length > 0 && (
                <View style={styles.genreTags}>
                  {movieGenres.slice(0, 2).map((genre: Genre) => (
                    <View key={genre.id} style={styles.genreTag}>
                      <Text style={styles.genreTagText}>{genre.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  // List View (Simplified since we're using grid view)
  return (
    <View style={styles.cardList}>
      {movie.id ? (
        <Link href={`/movie/${movie.id}`} asChild>
          <Pressable style={styles.listPressable}>
            <View style={styles.listPosterContainer}>
              <Image
                source={{
                  uri: movie.poster_path
                    ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                    : undefined,
                }}
                style={styles.posterList}
                contentFit="cover"
                transition={200}
                placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
                placeholderContentFit="cover"
                cachePolicy="memory-disk"
              />

              {/* Rating Badge */}
              {movie.vote_average !== undefined &&
                movie.vote_average !== null && (
                  <View
                    style={[
                      styles.ratingBadgeList,
                      { backgroundColor: getRatingColor(movie.vote_average) },
                    ]}
                  >
                    <IconSymbol name="star.fill" size={10} color="#fff" />
                    <Text style={styles.ratingTextList}>
                      {movie.vote_average.toFixed(1)}
                    </Text>
                  </View>
                )}
            </View>

            <View style={styles.listInfo}>
              <Text style={styles.listTitle} numberOfLines={2}>
                {movie.title || "Untitled"}
              </Text>
              <Text style={styles.listYear}>
                {formatDate(movie.release_date)}
              </Text>

              {movieGenres.length > 0 && (
                <View style={styles.genreTagsList}>
                  {movieGenres.slice(0, 2).map((genre: Genre) => (
                    <View key={genre.id} style={styles.genreTagList}>
                      <Text style={styles.genreTagTextList}>{genre.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>
        </Link>
      ) : (
        <Pressable style={styles.listPressable}>
          <View style={styles.listPosterContainer}>
            <Image
              source={{
                uri: movie.poster_path
                  ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                  : undefined,
              }}
              style={styles.posterList}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
              placeholderContentFit="cover"
              cachePolicy="memory-disk"
            />
            {movie.vote_average !== undefined &&
              movie.vote_average !== null && (
                <View
                  style={[
                    styles.ratingBadgeList,
                    { backgroundColor: getRatingColor(movie.vote_average) },
                  ]}
                >
                  <IconSymbol name="star.fill" size={10} color="#fff" />
                  <Text style={styles.ratingTextList}>
                    {movie.vote_average.toFixed(1)}
                  </Text>
                </View>
              )}
          </View>

          <View style={styles.listInfo}>
            <Text style={styles.listTitle} numberOfLines={2}>
              {movie.title || "Untitled"}
            </Text>
            <Text style={styles.listYear}>
              {formatDate(movie.release_date)}
            </Text>

            {movieGenres.length > 0 && (
              <View style={styles.genreTagsList}>
                {movieGenres.slice(0, 2).map((genre: Genre) => (
                  <View key={genre.id} style={styles.genreTagList}>
                    <Text style={styles.genreTagTextList}>{genre.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    maxWidth: "47%",
  },
  cardPressable: {
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
  },
  posterContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  posterLink: {
    width: "100%",
    height: "100%",
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "transparent",
  },
  ratingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#00D4AA",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  yearBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  yearBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardInfo: {
    padding: 12,
    paddingTop: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    lineHeight: 20,
  },
  genreTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  genreTag: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genreTagText: {
    fontSize: 10,
    color: "#666",
    fontWeight: "500",
  },
  // List View Styles
  cardList: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    alignItems: "center",
  },
  listPressable: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
  },
  listPosterContainer: {
    position: "relative",
    width: 80,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 16,
  },
  posterList: {
    width: "100%",
    height: "100%",
  },
  ratingBadgeList: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  ratingTextList: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  listInfo: {
    flex: 1,
    justifyContent: "center",
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 22,
  },
  listYear: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  genreTagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  genreTagList: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genreTagTextList: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },
});

export default memo(MovieCard, (prevProps: MovieCardProps, nextProps: MovieCardProps) => {
  return (
    prevProps.movie.id === nextProps.movie.id &&
    prevProps.isGridView === nextProps.isGridView &&
    prevProps.movie.title === nextProps.movie.title &&
    prevProps.movie.poster_path === nextProps.movie.poster_path &&
    prevProps.movie.vote_average === nextProps.movie.vote_average &&
    prevProps.movie.release_date === nextProps.movie.release_date
  );
});
