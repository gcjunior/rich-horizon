import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '../theme/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function ConfettiDot({ delay, left, color }: { delay: number; left: number; color: string }) {
  const y = useSharedValue(-20);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(220, { duration: 1600, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.2, { duration: 1400 }),
        ),
        -1,
        false,
      ),
    );
  }, [delay, opacity, y]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        { left, backgroundColor: color },
        style,
      ]}
    />
  );
}

export function MillionDollarFace({ visible, onClose }: Props) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (visible) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 320, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 180 }),
      );
    }
  }, [visible, scale]);

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dots = [
    { delay: 0, left: 40, color: colors.apple },
    { delay: 120, left: 90, color: colors.gold },
    { delay: 80, left: 150, color: colors.woodland },
    { delay: 200, left: 210, color: colors.apple },
    { delay: 60, left: 260, color: colors.gold },
    { delay: 160, left: 120, color: '#7ED957' },
    { delay: 240, left: 190, color: '#F5C542' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.confettiStage}>
            {dots.map((d, i) => (
              <ConfettiDot key={i} {...d} />
            ))}
          </View>

          <Animated.View style={[styles.faceWrap, faceStyle]}>
            <View style={styles.face}>
              <View style={styles.crown}>
                <View style={styles.crownPoint} />
                <View style={[styles.crownPoint, styles.crownMid]} />
                <View style={styles.crownPoint} />
              </View>
              <View style={styles.glasses}>
                <View style={styles.lens} />
                <View style={styles.bridge} />
                <View style={styles.lens} />
              </View>
              <View style={styles.smile} />
              <Text style={styles.moneyMotif}>$</Text>
            </View>
          </Animated.View>

          <Text style={styles.title}>Goal achieved!</Text>
          <Text style={styles.body}>
            Your next bill cliff is fully funded.{'\n'}
            Your Rich Horizon is getting closer.
          </Text>

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Keep going</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 46, 20, 0.72)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
  },
  confettiStage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
  },
  confetti: {
    position: 'absolute',
    top: 10,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  faceWrap: {
    marginTop: 12,
    marginBottom: spacing.md,
  },
  face: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.softGold,
    borderWidth: 4,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crown: {
    position: 'absolute',
    top: -18,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  crownPoint: {
    width: 14,
    height: 18,
    backgroundColor: colors.gold,
    marginHorizontal: 2,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  crownMid: {
    height: 24,
  },
  glasses: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lens: {
    width: 28,
    height: 18,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.woodland,
    backgroundColor: 'rgba(52,96,35,0.12)',
  },
  bridge: {
    width: 8,
    height: 3,
    backgroundColor: colors.woodland,
  },
  smile: {
    marginTop: 14,
    width: 36,
    height: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 3,
    borderTopWidth: 0,
    borderColor: colors.woodland,
  },
  moneyMotif: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    fontSize: 22,
    fontWeight: '900',
    color: colors.apple,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.woodland,
    marginBottom: 8,
  },
  body: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.apple,
    borderRadius: radii.full,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
