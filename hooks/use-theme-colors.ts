import { useColorScheme } from './use-color-scheme';
import { Colors } from '@/constants/theme';

export function useThemeColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme ?? 'light'];
}

