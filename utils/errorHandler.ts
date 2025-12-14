import { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeoutError?: boolean;
}

export const handleApiError = (error: unknown): AppError => {
  if (error instanceof AxiosError) {
    // Network error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'Request timeout. Please check your connection and try again.',
        code: error.code,
        isTimeoutError: true,
      };
    }

    // Network connectivity issue
    if (!error.response) {
      return {
        message: 'Network error. Please check your internet connection.',
        code: error.code,
        isNetworkError: true,
      };
    }

    // API error response
    const statusCode = error.response.status;
    let message = 'An error occurred while fetching data.';

    switch (statusCode) {
      case 400:
        message = 'Invalid request. Please try again.';
        break;
      case 401:
        message = 'Authentication failed. Please check your API credentials.';
        break;
      case 403:
        message = 'Access forbidden. You do not have permission to access this resource.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 429:
        message = 'Too many requests. Please try again later.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      case 503:
        message = 'Service unavailable. Please try again later.';
        break;
      default:
        message = error.response.data?.status_message || message;
    }

    return {
      message,
      code: error.code,
      statusCode,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
    };
  }

  // Unknown error
  return {
    message: 'An unknown error occurred. Please try again.',
  };
};

export const getErrorMessage = (error: AppError): string => {
  return error.message || 'An error occurred. Please try again.';
};

