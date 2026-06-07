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

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success' | 'info'; title: string; message: string } | null>(null);
  const enterDemoMode = useCoachStore(s => s.enterDemoMode);

  const showFeedback = (
    type: 'error' | 'success' | 'info',
    title: string,
    message: string
  ) => {
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
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
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
              backgroundColor: '#EBF3FF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Ionicons name="clipboard-outline" size={36} color="#1E88E5" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#0B1220', marginBottom: 8 }}>
              CoachOS
            </Text>
            <Text style={{ fontSize: 15, color: '#42526E', textAlign: 'center' }}>
              {mode === 'login' ? 'Sign in to your account' : 'Create your coach account'}
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16, marginBottom: 8 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0B1220', marginBottom: 8 }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#0B1220',
                }}
                placeholder="your@email.com"
                placeholderTextColor="#9BA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#0B1220', marginBottom: 8 }}>
                Password
              </Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={{
                  backgroundColor: '#F8F9FA',
                  borderWidth: 1,
                  borderColor: '#E0E0E0',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#0B1220',
                }}
                placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
                placeholderTextColor="#9BA3AF"
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
              <Text style={{ fontSize: 14, color: '#1E88E5' }}>Forgot password?</Text>
            </Pressable>
          )}
          {mode === 'signup' && <View style={{ height: 24 }} />}

          {feedback && (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: feedback.type === 'error' ? '#F5B5B5' : feedback.type === 'success' ? '#A7D7B3' : '#B8D7F4',
                backgroundColor: feedback.type === 'error' ? '#FFF1F1' : feedback.type === 'success' ? '#F0FFF4' : '#F1F8FF',
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: feedback.type === 'error' ? '#B42318' : feedback.type === 'success' ? '#1F7A3A' : '#1E5B8E',
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                {feedback.title}
              </Text>
              <Text
                style={{
                  color: feedback.type === 'error' ? '#7A271A' : feedback.type === 'success' ? '#276749' : '#42526E',
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#90CAF9' : '#1E88E5',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleViewDemo}
            disabled={isLoading}
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#1E88E5',
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
            <Ionicons name="sparkles-outline" size={18} color="#1E88E5" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E88E5' }}>
              Explore a demo workspace
            </Text>
          </Pressable>

          <Text style={{ textAlign: 'center', fontSize: 13, color: '#42526E', lineHeight: 18, marginBottom: 20 }}>
            No account needed. Sample bookings, payments, and students are preloaded.
          </Text>

          {/* Toggle */}
          <Pressable onPress={switchMode}>
            <Text style={{ textAlign: 'center', fontSize: 15, color: '#42526E' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: '#1E88E5', fontWeight: '600' }}>
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
