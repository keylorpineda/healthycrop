import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AnalyzingOverlay } from '@/components/camera';
import { runInference } from '@/ml';
import { type InferencePrediction } from '@/ml/types';
import { CameraScreen, ResultScreen } from '@/screens';
import { type SupportedCrop } from '@/version';

export default function ScanScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ crop?: SupportedCrop }>();
  const crop: SupportedCrop = params.crop || 'coffee';

  const [status, setStatus] = useState<'camera' | 'analyzing' | 'result'>('camera');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<InferencePrediction | null>(null);

  const handlePhotoCaptured = async (uri: string) => {
    setImageUri(uri);
    setStatus('analyzing');

    try {
      const result = await runInference(uri, crop);
      setPrediction(result);
      setStatus('result');
    } catch {
      // In case of unexpected inference failure, reset to camera
      setStatus('camera');
    }
  };

  const handleRetake = () => {
    setImageUri(null);
    setPrediction(null);
    setStatus('camera');
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {status === 'camera' && (
        <CameraScreen
          crop={crop}
          onPhotoCaptured={handlePhotoCaptured}
          onClose={() => router.back()}
          testID="scan-camera-screen"
        />
      )}

      {status === 'analyzing' && (
        <AnalyzingOverlay imageUri={imageUri ?? undefined} testID="scan-analyzing-overlay" />
      )}

      {status === 'result' && prediction && imageUri && (
        <ResultScreen
          imageUri={imageUri}
          prediction={prediction}
          onRetake={handleRetake}
          onDone={handleDone}
          testID="scan-result-screen"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
