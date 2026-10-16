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

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  const CameraView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      takePictureAsync: jest.fn().mockResolvedValue({
        uri: 'file:///mock/captured_photo.jpg',
        width: 1080,
        height: 1920,
      }),
    }));
    return React.createElement(View, { ...props, testID: props.testID || 'camera-view' });
  });

  return {
    CameraView,
    useCameraPermissions: () => [{ granted: true }, jest.fn().mockResolvedValue({ granted: true })],
  };
});

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///mock/gallery_photo.jpg', width: 800, height: 600 }],
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => {
  const jpeg = require('jpeg-js');
  const mockRaw = new Uint8Array(224 * 224 * 4);
  const encoded = jpeg.encode({ width: 224, height: 224, data: mockRaw }, 50);
  const base64Jpeg = Buffer.from(encoded.data).toString('base64');

  return {
    manipulateAsync: jest.fn().mockResolvedValue({
      uri: 'file:///mock/manipulated.jpg',
      base64: base64Jpeg,
      width: 224,
      height: 224,
    }),
    SaveFormat: {
      JPEG: 'jpeg',
      PNG: 'png',
    },
  };
});

