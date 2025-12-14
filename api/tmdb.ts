import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { CacheService } from '../services/cacheService';

// Get API credentials from environment variables
const getApiToken = (): string => {
  if (Constants.expoConfig?.extra?.tmdbReadAccessToken) {
    return Constants.expoConfig.extra.tmdbReadAccessToken as string;
  }
  // Try to get from process.env if available (for web builds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).process !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (globalThis as any).process.env;
    if (env?.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN) {
      return env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN;
    }
  }
  return 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZTBjZDJhMDUzM2ZkZjQ5MmFkNzM3NmVjZWY2MDg1NyIsIm5iZiI6MTc0NzY5MjY4MS45MDIwMDAyLCJzdWIiOiI2ODJiYWM4OTA3NjA1Y2IyYTYwYmRkNjQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.18pnw2ZewLwSqdtkNUDvCu2pFMlLbl35CsY10HSXOcE';
};

const API_READ_ACCESS_TOKEN = getApiToken();

const BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_READ_ACCESS_TOKEN}`,
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for retry logic
const MAX_RETRIES = 2;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

tmdb.interceptors.response.use(
  (response: AxiosResponse) => {
    // Clear retry count on successful response
    const config = response.config as RetryConfig;
    if (config) {
      config._retryCount = 0;
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    
    if (!config) {
      return Promise.reject(error);
    }
    
    // Initialize retry count if not exists
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }
    
    // Retry logic for network errors
    if (
      (!error.response || (error.response.status >= 500 && error.response.status < 600)) &&
      config._retryCount < MAX_RETRIES
    ) {
      config._retryCount++;
      
      // Wait before retrying (exponential backoff)
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000 * config._retryCount!);
      });
      
      return tmdb(config);
    }
    
    return Promise.reject(error);
  }
);

export const getPopularMovies = async (page: number = 1) => {
  const cacheKey = `popular_movies_page_${page}`;
  
  // Try to get from cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdb.get('/movie/popular', {
      params: {
        page,
      },
    });
    
    // Cache the response for 30 minutes
    await CacheService.set(cacheKey, response.data, 1000 * 60 * 30);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (id: number) => {
  const cacheKey = `movie_details_${id}`;
  
  // Try to get from cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdb.get(`/movie/${id}`);
    
    // Cache the response for 1 hour
    await CacheService.set(cacheKey, response.data, 1000 * 60 * 60);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id}:`, error);
    throw error;
  }
};

export const getGenres = async () => {
  const cacheKey = 'genres_list';
  
  // Try to get from cache first (genres don't change often)
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdb.get('/genre/movie/list');
    const genres = response.data.genres;
    
    // Cache genres for 24 hours (they rarely change)
    await CacheService.set(cacheKey, genres, 1000 * 60 * 60 * 24);
    
    return genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

export const searchMovies = async (query: string, page: number = 1) => {
  const cacheKey = `search_${query.toLowerCase().trim()}_page_${page}`;
  
  // Try to get from cache first (only for page 1, to avoid stale results)
  if (page === 1) {
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await tmdb.get('/search/movie', {
      params: {
        query,
        page,
      },
    });
    
    // Cache search results for 15 minutes (only page 1)
    if (page === 1) {
      await CacheService.set(cacheKey, response.data, 1000 * 60 * 15);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error searching movies for query "${query}":`, error);
    throw error;
  }
};

export const getMoviesByGenre = async (genreId: number, page: number = 1) => {
  const cacheKey = `genre_${genreId}_page_${page}`;
  
  // Try to get from cache first (only for page 1)
  if (page === 1) {
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await tmdb.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
      },
    });
    
    // Cache genre results for 30 minutes (only page 1)
    if (page === 1) {
      await CacheService.set(cacheKey, response.data, 1000 * 60 * 30);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    throw error;
  }
};

export const getMovieCredits = async (id: number) => {
  const cacheKey = `movie_credits_${id}`;
  
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdb.get(`/movie/${id}/credits`);
    
    // Cache credits for 1 hour
    await CacheService.set(cacheKey, response.data, 1000 * 60 * 60);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie credits for ID ${id}:`, error);
    throw error;
  }
};

export const getSimilarMovies = async (id: number, page: number = 1) => {
  const cacheKey = `similar_movies_${id}_page_${page}`;
  
  if (page === 1) {
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await tmdb.get(`/movie/${id}/similar`, {
      params: {
        page,
      },
    });
    
    // Cache similar movies for 30 minutes (only page 1)
    if (page === 1) {
      await CacheService.set(cacheKey, response.data, 1000 * 60 * 30);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching similar movies for ID ${id}:`, error);
    throw error;
  }
};

export const getMovieVideos = async (id: number) => {
  const cacheKey = `movie_videos_${id}`;
  
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await tmdb.get(`/movie/${id}/videos`);
    
    // Cache videos for 1 hour
    await CacheService.set(cacheKey, response.data, 1000 * 60 * 60);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching movie videos for ID ${id}:`, error);
    throw error;
  }
};
