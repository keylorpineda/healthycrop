import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/i18n';
import { ThemeProvider, useTheme } from '@/theme';

function NavigationStack(): React.JSX.Element {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'HealthyCrop' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      </Stack>
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
