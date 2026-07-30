import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MillionDollarFace } from '../src/components/MillionDollarFace';
import { useFinanceStore } from '../src/store/financeStore';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const celebrationVisible = useFinanceStore((s) => s.celebrationVisible);
  const dismissCelebration = useFinanceStore((s) => s.dismissCelebration);

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
        <Stack.Screen name="setup" options={{ headerShown: false }} />
        <Stack.Screen name="income/source" options={{ title: 'Income source' }} />
        <Stack.Screen name="income/received" options={{ title: 'Income received' }} />
        <Stack.Screen name="expense/form" options={{ title: 'Expense' }} />
        <Stack.Screen name="goal/form" options={{ title: 'Goal' }} />
        <Stack.Screen name="transaction/form" options={{ title: 'Transaction' }} />
        <Stack.Screen name="allocation/[incomeEntryId]" options={{ title: 'Allocate income' }} />
      </Stack>
      <MillionDollarFace visible={celebrationVisible} onClose={dismissCelebration} />
    </>
  );
}
