import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Card, Chip, EmptyState, Toast } from '@/components/ui';
import { useTheme } from '@/theme';
import { type SupportedCrop } from '@/version';

export interface HomeScreenProps {
  onOpenSettings?: () => void;
  onScan?: (crop: SupportedCrop) => void;
  testID?: string;
}

export function HomeScreen({
  onOpenSettings,
  onScan,
  testID = 'home-screen',
}: HomeScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedCrop, setSelectedCrop] = useState<SupportedCrop>('coffee');
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleScanPress = () => {
    if (onScan) {
      onScan(selectedCrop);
    } else {
      setToastMessage(`${t('common.analyzing')} (${t(`crops.${selectedCrop}`)})`);
      setToastVisible(true);
    }
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      testID={testID}
    >
      {/* Toast Overlay */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant="info"
        durationMs={3000}
        onDismiss={() => setToastVisible(false)}
        testID="home-toast"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.brandingCol}>
            <Text
              style={[theme.typography.title1, { color: theme.colors.primary }]}
              testID="home-title"
            >
              {t('common.appName')}
            </Text>
            <Text
              style={[theme.typography.subhead, { color: theme.colors.textSecondary }]}
              testID="home-tagline"
            >
              {t('common.tagline')}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Badge
              label={t('home.offlinePill')}
              variant="healthy"
              size="sm"
              testID="home-offline-badge"
            />
            <Pressable
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              style={styles.settingsButton}
              testID="home-settings-btn"
            >
              <Text style={[theme.typography.title3, { color: theme.colors.textPrimary }]}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        {/* Crop Selection Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.headline,
              { color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
            ]}
            testID="home-crop-selector-title"
          >
            {t('home.selectCrop')}
          </Text>
          <View style={styles.cropChipsRow} testID="crop-chips-row">
            <Chip
              label={t('crops.coffee')}
              crop="coffee"
              selected={selectedCrop === 'coffee'}
              onPress={() => setSelectedCrop('coffee')}
              testID="crop-chip-coffee"
            />
            <View style={{ width: theme.spacing.sm }} />
            <Chip
              label={t('crops.cacao')}
              crop="cacao"
              selected={selectedCrop === 'cacao'}
              onPress={() => setSelectedCrop('cacao')}
              testID="crop-chip-cacao"
            />
            <View style={{ width: theme.spacing.sm }} />
            <Chip
              label={t('crops.banana')}
              crop="banana"
              selected={selectedCrop === 'banana'}
              onPress={() => setSelectedCrop('banana')}
              testID="crop-chip-banana"
            />
          </View>
        </View>

        {/* Primary Scan CTA Card */}
        <Card
          variant="elevated"
          style={[styles.scanCard, { borderColor: theme.colors.borderSubtle }]}
          testID="home-scan-card"
        >
          <View style={styles.scanCardHeader}>
            <Text
              style={[
                theme.typography.title2,
                { color: theme.colors.textPrimary, marginBottom: 4 },
              ]}
            >
              {`${t('home.scanAction')} — ${t(`crops.${selectedCrop}`)}`}
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
              ]}
            >
              {t('home.scanHint')}
            </Text>
          </View>

          <Button
            title={t('home.scanAction')}
            onPress={handleScanPress}
            variant="primary"
            size="lg"
            fullWidth
            testID="home-scan-cta-btn"
          />
        </Card>

        {/* Recent Scans Section with EmptyState */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text
              style={[theme.typography.headline, { color: theme.colors.textPrimary }]}
              testID="home-recent-scans-title"
            >
              {t('home.recentScans')}
            </Text>
            <Badge label="0" variant="neutral" size="sm" />
          </View>

          <Card variant="outlined" style={styles.emptyStateCard}>
            <EmptyState
              title={t('home.noScansTitle')}
              description={t('home.noScansDescription')}
              actionLabel={t('home.scanAction')}
              onAction={handleScanPress}
              testID="home-empty-state"
            />
          </Card>
        </View>

        {/* Non-Replacement Agronomic Disclaimer */}
        <View
          style={[
            styles.disclaimerContainer,
            {
              backgroundColor: theme.colors.surfaceSubtle,
              borderColor: theme.colors.borderSubtle,
            },
          ]}
          testID="home-disclaimer-box"
        >
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, textAlign: 'center', lineHeight: 18 },
            ]}
          >
            {t('common.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandingCol: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanCard: {
    padding: 20,
    marginBottom: 24,
  },
  scanCardHeader: {
    alignItems: 'flex-start',
  },
  emptyStateCard: {
    padding: 12,
    alignItems: 'center',
  },
  disclaimerContainer: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
