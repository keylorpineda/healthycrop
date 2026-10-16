import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { usePreferencesStore } from '@/stores/preferences';

export default function RootLayout(): React.JSX.Element {
  const theme = usePreferencesStore((state) => state.theme);

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'HealthyCrop' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
