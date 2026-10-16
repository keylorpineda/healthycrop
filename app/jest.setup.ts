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

// Mock react-native-fast-tflite
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn().mockResolvedValue({
    delegate: 'default',
    run: jest.fn().mockResolvedValue([new Float32Array([0.1, 0.85, 0.01, 0.02, 0.01, 0.01])]),
    runSync: jest.fn().mockReturnValue([new Float32Array([0.1, 0.85, 0.01, 0.02, 0.01, 0.01])]),
    inputs: [{ name: 'input', dataType: 'float32', shape: [1, 224, 224, 3] }],
    outputs: [{ name: 'output', dataType: 'float32', shape: [1, 6] }],
  }),
  useTensorflowModel: jest.fn().mockReturnValue({
    state: 'loaded',
    model: {
      delegate: 'default',
      run: jest.fn().mockResolvedValue([new Float32Array([0.1, 0.85, 0.01, 0.02, 0.01, 0.01])]),
      runSync: jest.fn().mockReturnValue([new Float32Array([0.1, 0.85, 0.01, 0.02, 0.01, 0.01])]),
      inputs: [{ name: 'input', dataType: 'float32', shape: [1, 224, 224, 3] }],
      outputs: [{ name: 'output', dataType: 'float32', shape: [1, 6] }],
    },
  }),
}));

