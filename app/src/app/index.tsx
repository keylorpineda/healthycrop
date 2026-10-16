import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export default function IndexScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, { paddingHorizontal: theme.spacing.xxl }]}>
        <Text
          style={[
            theme.typography.display,
            { color: theme.colors.primary, marginBottom: theme.spacing.sm },
          ]}
          testID="app-title"
        >
          {t('common.appName')}
        </Text>
        <Text
          style={[
            theme.typography.headline,
            {
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xxl,
              textAlign: 'center',
            },
          ]}
          testID="app-tagline"
        >
          {t('common.tagline')}
        </Text>
        <View
          style={[
            styles.disclaimerBox,
            {
              backgroundColor: theme.colors.surface,
              padding: theme.spacing.lg,
              borderRadius: theme.radii.md,
              borderColor: theme.colors.border,
            },
            theme.elevation.sm,
          ]}
          testID="app-disclaimer"
        >
          <Text
            style={[
              theme.typography.subhead,
              { color: theme.colors.textSecondary, textAlign: 'center' },
            ]}
          >
            {t('common.disclaimer')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerBox: {
    borderWidth: 1,
  },
});
