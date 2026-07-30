import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useFinanceStore } from '../src/store/financeStore';
import { colors, spacing } from '../src/theme/colors';

export default function WelcomeScreen() {
  const startManualSetup = useFinanceStore((s) => s.startManualSetup);
  const loadSampleData = useFinanceStore((s) => s.loadSampleData);
  const onboardingComplete = useFinanceStore((s) => s.onboardingComplete);

  const onManual = () => {
    startManualSetup();
    router.push('/setup/income');
  };

  const onSample = () => {
    loadSampleData();
    router.replace('/(tabs)/today');
  };

  const onContinue = () => {
    router.replace('/(tabs)/today');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Rich Horizon</Text>
        <Text style={styles.tagline}>
          Every dollar gets a purpose{'\n'}before it is spent.
        </Text>
      </View>

      <View style={styles.panel}>
        <PrimaryButton label="Enter finances manually" onPress={onManual} />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton
          label="Use sample data"
          onPress={onSample}
          variant="secondary"
        />
        {onboardingComplete ? (
          <>
            <View style={{ height: spacing.sm }} />
            <PrimaryButton
              label="Continue to Today"
              onPress={onContinue}
              variant="secondary"
            />
          </>
        ) : null}

        <Text style={styles.privacy}>
          Your financial information stays on this device.{'\n'}No login is required.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.woodland,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  brand: {
    color: colors.white,
    fontSize: 44,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  tagline: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
  },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  privacy: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
