import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width || '100%',
          height: height || 20,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const MovieCardSkeleton = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={[styles.cardSkeleton, { backgroundColor: colors.cardBackground }]}>
      <Skeleton width="100%" height={200} borderRadius={16} />
      <View style={styles.cardContent}>
        <Skeleton width="80%" height={16} style={styles.titleSkeleton} />
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  );
};

export const MovieListSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <MovieCardSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    flex: 1,
    margin: 6,
    maxWidth: '47%',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 12,
  },
  cardContent: {
    marginTop: 12,
    gap: 8,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  listContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
});

