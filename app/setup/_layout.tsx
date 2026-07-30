import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../../src/theme/colors';

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.woodland },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="income" options={{ title: 'Income sources' }} />
      <Stack.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Stack.Screen name="goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="method" options={{ title: 'Allocation method' }} />
      <Stack.Screen name="review" options={{ title: 'Initial plan' }} />
    </Stack>
  );
}
