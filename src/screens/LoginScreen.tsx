import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signIn, signUp, resetPassword } from '../services/authService';
import { useCoachStore } from '../state/coachStore';
import { DesignTokens } from '../utils/designTokens';

type Mode = 'login' | 'signup';
type Feedback = { type: 'error' | 'success' | 'info'; title: string; message: string };

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const enterDemoMode = useCoachStore(s => s.enterDemoMode);

  const triggerAuthFeedback = async (type: Feedback['type']) => {
    if (Platform.OS === 'web') return;

    try {
      const Haptics = await import('expo-haptics');

      if (type === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      if (type === 'error') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics should never block auth feedback.
    }
  };

  const showFeedback = (
    type: Feedback['type'],
    title: string,
    message: string
  ) => {
    void triggerAuthFeedback(type);
    setFeedback({ type, title, message });
    Alert.alert(title, message);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setFeedback(null);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    setFeedback(null);

    if (!trimmedEmail || !password) {
      showFeedback('error', 'Missing fields', 'Please enter your email and password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      showFeedback('error', 'Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    if (mode === 'signup') {
      void triggerAuthFeedback('info');
      setFeedback({
        type: 'info',
        title: 'Creating account',
        message: 'Securely creating your coach workspace...',
      });
    }

    try {
      const result = mode === 'login'
        ? await signIn({ email: trimmedEmail, password })
        : await signUp({ email: trimmedEmail, password });

      if (result.error) {
        showFeedback(
          'error',
          mode === 'login' ? 'Sign in failed' : 'Sign up failed',
          result.error.message
        );
      } else if (mode === 'signup' && !result.session) {
        showFeedback(
          'success',
          'Check your email',
          'We sent you a confirmation link. Please verify your email before signing in.'
        );
      } else if (mode === 'signup') {
        void triggerAuthFeedback('success');
        setFeedback({
          type: 'success',
          title: 'Account created',
          message: 'Opening your coach workspace...',
        });
      }
      // On success with session, RootNavigator's onAuthStateChange handles navigation
    } catch (error) {
      showFeedback(
        'error',
        mode === 'login' ? 'Sign in failed' : 'Sign up failed',
        error instanceof Error ? error.message : 'Authentication failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showFeedback('error', 'Enter your email', 'Please enter your email address above first.');
      return;
    }
    const { error } = await resetPassword(trimmedEmail);
    if (error) {
      showFeedback('error', 'Error', error.message);
    } else {
      showFeedback('success', 'Email sent', 'Check your inbox for a password reset link.');
    }
  };

  const handleViewDemo = () => {
    enterDemoMode();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: DesignTokens.colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: insets.bottom + 24,
        }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: DesignTokens.colors.brand.tint,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="clipboard-outline" size={36} color={DesignTokens.colors.brand.default} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: DesignTokens.colors.text.strong, marginBottom: 8 }}>
              CoachOS
            </Text>
            <Text style={{ fontSize: 15, color: DesignTokens.colors.text.muted, textAlign: 'center' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your coach account'}
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16, marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: DesignTokens.colors.text.strong, marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={{
                  backgroundColor: DesignTokens.colors.surface.raised,
                  borderWidth: 1,
                  borderColor: DesignTokens.colors.line.default,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: DesignTokens.colors.text.strong,
                }}
                placeholder="your@email.com"
                placeholderTextColor={DesignTokens.colors.text.faint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: DesignTokens.colors.text.strong, marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={{
                  backgroundColor: DesignTokens.colors.surface.raised,
                  borderWidth: 1,
                  borderColor: DesignTokens.colors.line.default,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: DesignTokens.colors.text.strong,
                }}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
                placeholderTextColor={DesignTokens.colors.text.faint}
                secureTextEntry
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>
          </View>

          {/* Forgot password */}
          {mode === 'login' && (
            <Pressable onPress={handleForgotPassword} style={{ alignSelf: 'flex-end', marginBottom: 24, paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, color: DesignTokens.colors.brand.default }}>Forgot password?</Text>
            </Pressable>
          )}
          {mode === 'signup' && <View style={{ height: 24 }} />}

          {feedback && (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: feedback.type === 'error' ? DesignTokens.colors.line.error : feedback.type === 'success' ? DesignTokens.colors.line.success : DesignTokens.colors.line.info,
                backgroundColor: feedback.type === 'error' ? DesignTokens.colors.red.tintFaint : feedback.type === 'success' ? DesignTokens.colors.surface.tintSuccess : DesignTokens.colors.surface.tintInfo,
                padding: 14,
                marginBottom: 16,
                flexDirection: 'row',
                gap: 10,
              }}
            >
              <Ionicons
                name={feedback.type === 'error' ? 'alert-circle' : feedback.type === 'success' ? 'checkmark-circle' : 'time-outline'}
                size={22}
                color={feedback.type === 'error' ? DesignTokens.colors.red.deep : feedback.type === 'success' ? DesignTokens.colors.green.text : DesignTokens.colors.brand.deep}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: feedback.type === 'error' ? DesignTokens.colors.red.deep : feedback.type === 'success' ? DesignTokens.colors.green.text : DesignTokens.colors.brand.deep,
                    fontSize: 14,
                    fontWeight: '700',
                    marginBottom: 4,
                  }}
                >
                  {feedback.title}
                </Text>
                <Text
                  style={{
                    color: feedback.type === 'error' ? DesignTokens.colors.text.errorDark : feedback.type === 'success' ? DesignTokens.colors.text.successDark : DesignTokens.colors.text.muted,
                    fontSize: 13,
                    lineHeight: 18,
                  }}
                >
                  {feedback.message}
                </Text>
              </View>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              backgroundColor: feedback?.type === 'success' ? DesignTokens.colors.green.text : isLoading ? DesignTokens.colors.brand.mid : DesignTokens.colors.brand.default,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 20,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={DesignTokens.colors.white} />
            ) : feedback?.type === 'success' ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color={DesignTokens.colors.white} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: DesignTokens.colors.white }}>
                  {mode === 'signup' ? 'Account Created' : 'Success'}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: DesignTokens.colors.white }}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleViewDemo}
            disabled={isLoading}
            style={{
              backgroundColor: DesignTokens.colors.white,
              borderColor: DesignTokens.colors.brand.default,
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="sparkles-outline" size={18} color={DesignTokens.colors.brand.default} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: DesignTokens.colors.brand.default }}>
              Explore a demo workspace
            </Text>
          </Pressable>

          <Text style={{ textAlign: 'center', fontSize: 13, color: DesignTokens.colors.text.muted, lineHeight: 18, marginBottom: 20 }}>
            No account needed. Sample bookings, payments, and students are preloaded.
          </Text>

          {/* Toggle */}
          <Pressable onPress={switchMode}>
            <Text style={{ textAlign: 'center', fontSize: 15, color: DesignTokens.colors.text.muted }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: DesignTokens.colors.brand.default, fontWeight: '600' }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
