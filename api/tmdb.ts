import axios from 'axios';
import Constants from 'expo-constants';

// Get API credentials from environment variables
const API_READ_ACCESS_TOKEN = 
  Constants.expoConfig?.extra?.tmdbReadAccessToken || 
  process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN ||
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZTBjZDJhMDUzM2ZkZjQ5MmFkNzM3NmVjZWY2MDg1NyIsIm5iZiI6MTc0NzY5MjY4MS45MDIwMDAyLCJzdWIiOiI2ODJiYWM4OTA3NjA1Y2IyYTYwYmRkNjQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.18pnw2ZewLwSqdtkNUDvCu2pFMlLbl35CsY10HSXOcE';

const BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_READ_ACCESS_TOKEN}`,
  },
  timeout: 10000, // 10 seconds timeout
});

export const getPopularMovies = async (page: number = 1) => {
  try {
    const response = await tmdb.get('/movie/popular', {
      params: {
        page,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (id: number) => {
  try {
    const response = await tmdb.get(`/movie/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id}:`, error);
    throw error;
  }
};

export const getGenres = async () => {
  try {
    const response = await tmdb.get('/genre/movie/list');
    return response.data.genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

export const searchMovies = async (query: string, page: number = 1) => {
  try {
    const response = await tmdb.get('/search/movie', {
      params: {
        query,
        page,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching movies for query "${query}":`, error);
    throw error;
  }
};

export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  try {
    const response = await tmdb.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    throw error;
  }
};
