import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function IndexScreen(): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} testID="app-title">
          {t('common.appName')}
        </Text>
        <Text style={styles.tagline} testID="app-tagline">
          {t('common.tagline')}
        </Text>
        <View style={styles.disclaimerBox} testID="app-disclaimer">
          <Text style={styles.disclaimerText}>{t('common.disclaimer')}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B3B2B',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#4B6B58',
    marginBottom: 24,
    textAlign: 'center',
  },
  disclaimerBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8E4',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#55665C',
    textAlign: 'center',
  },
});
