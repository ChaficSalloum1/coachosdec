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

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = mode === 'login'
        ? await signIn({ email: trimmedEmail, password })
        : await signUp({ email: trimmedEmail, password });

      if (result.error) {
        Alert.alert(
          mode === 'login' ? 'Sign in failed' : 'Sign up failed',
          result.error.message
        );
      } else if (mode === 'signup' && !result.session) {
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Please verify your email before signing in.'
        );
      }
      // On success with session, RootNavigator's onAuthStateChange handles navigation
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Enter your email', 'Please enter your email address above first.');
      return;
    }
    const { error } = await resetPassword(trimmedEmail);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Email sent', 'Check your inbox for a password reset link.');
    }
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

          {/* Toggle */}
          <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
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
