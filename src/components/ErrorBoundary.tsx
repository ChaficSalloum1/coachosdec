import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * 
 * Prevents the entire app from crashing and provides a user-friendly error screen.
 * In production, errors are logged but not shown with full stack traces.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console in development
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });

    // In production, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error screen
      return (
        <View className="flex-1 bg-white px-6 py-12 justify-center">
          <View className="items-center mb-8">
            <View className="bg-red-50 rounded-full p-6 mb-4">
              <Ionicons name="warning-outline" size={48} color="#DC2626" />
            </View>
            <Text className="text-2xl font-bold text-center mb-2" style={{ color: '#0B1220' }}>
              Something Went Wrong
            </Text>
            <Text className="text-base text-center" style={{ color: '#42526E' }}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </Text>
          </View>

          {__DEV__ && this.state.error && (
            <ScrollView 
              className="bg-gray-50 rounded-xl p-4 mb-6 max-h-64"
              showsVerticalScrollIndicator={true}
            >
              <Text className="text-xs font-mono text-red-600 mb-2">
                {this.state.error.toString()}
              </Text>
              {this.state.errorInfo && (
                <Text className="text-xs font-mono text-gray-600">
                  {this.state.errorInfo.componentStack}
                </Text>
              )}
            </ScrollView>
          )}

          <Pressable
            onPress={this.resetError}
            className="bg-blue-500 rounded-xl py-4 px-6 active:bg-blue-600"
          >
            <Text className="text-white text-center font-semibold text-base">
              Try Again
            </Text>
          </Pressable>

          {__DEV__ && (
            <Text className="text-xs text-center mt-4" style={{ color: '#42526E' }}>
              This detailed error view is only shown in development mode
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}
