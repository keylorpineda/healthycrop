/* eslint-disable @typescript-eslint/no-require-imports */
// Include testing-library jest matchers
import '@testing-library/react-native';

// Mock Reanimated
try {
  const reanimated = require('react-native-reanimated');
  if (reanimated.setUpTests) {
    reanimated.setUpTests();
  }
} catch {
  // Ignore if reanimated is not loaded in node context
}

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-localization
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'es', regionCode: 'CR' }],
  locale: 'es-CR',
}));
