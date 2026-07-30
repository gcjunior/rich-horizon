import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme/colors';
import { MillionDollarFace } from '../src/components/MillionDollarFace';
import { useAppStore } from '../src/store/appStore';

export default function RootLayout() {
  const celebrationVisible = useAppStore((s) => s.celebrationVisible);
  const dismissCelebration = useAppStore((s) => s.dismissCelebration);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.woodland },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <MillionDollarFace visible={celebrationVisible} onClose={dismissCelebration} />
    </>
  );
}
