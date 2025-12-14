export default {
  expo: {
    name: "Movie App",
    slug: "movie-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "movieapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    description: "Discover and explore your favorite movies with detailed information, cast, and trailers",
    privacy: "public",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.movieapp.app",
      buildNumber: "1",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to save movie posters.",
      },
    },
    android: {
      package: "com.movieapp.app",
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      tmdbApiKey: process.env.EXPO_PUBLIC_TMDB_API_KEY,
      tmdbReadAccessToken: process.env.EXPO_PUBLIC_TMDB_READ_ACCESS_TOKEN,
    },
  },
};

