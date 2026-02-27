# 🎯 CoachOS - Complete Replication Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Project Structure](#project-structure)
5. [Configuration Files](#configuration-files)
6. [Dependencies](#dependencies)
7. [Source Code Architecture](#source-code-architecture)
8. [Key Features](#key-features)
9. [Build & Deploy](#build--deploy)
10. [Troubleshooting](#troubleshooting)

---

## 📱 Project Overview

**CoachOS** is a comprehensive coaching management app built with:
- **React Native 0.79.2** (New Architecture enabled)
- **Expo SDK 53**
- **TypeScript 5.8.3** (strict mode)
- **NativeWind 4.1** (TailwindCSS for React Native)
- **Zustand 5.0** (State management with persistence)
- **React Navigation 7** (Native Stack + Bottom Tabs)

### Core Functionality
- 📅 Booking request management
- 🎓 Student management with timeline notes
- 📍 Location management (Areas, Facilities, Courts)
- ⏰ Availability scheduling
- 💰 Payment tracking
- 📊 Analytics and insights
- 📆 Device calendar sync

---

## 🔧 Prerequisites

### Required Software
```bash
# Node.js 18.x or higher
node --version  # Should be >= 18.0.0

# Bun (package manager - preferred over npm)
curl -fsSL https://bun.sh/install | bash
bun --version  # Should be >= 1.0.0

# Expo CLI
npm install -g expo-cli
expo --version

# iOS Development (macOS only)
xcode-select --install
# Install Xcode from Mac App Store

# Android Development
# Install Android Studio and configure ANDROID_HOME
```

### Development Environment
- **macOS**: For iOS development (required for iOS builds)
- **Windows/Linux**: For Android only
- **Text Editor**: VSCode recommended with extensions:
  - ESLint
  - TypeScript
  - Tailwind CSS IntelliSense
  - React Native Tools

---

## 🚀 Initial Setup

### Step 1: Create New Expo Project

```bash
# Create new project with Expo SDK 53
npx create-expo-app@latest CoachOS-replica --template blank-typescript

cd CoachOS-replica

# Enable new React Native architecture
npx expo config --type app.json
```

### Step 2: Install Core Dependencies

```bash
# Install all dependencies with bun
bun install expo@53.0.9
bun install react@19.0.0 react-dom@19.0.0
bun install react-native@0.79.2

# Navigation
bun install @react-navigation/native@^7.1.6
bun install @react-navigation/native-stack@^7.3.2
bun install @react-navigation/bottom-tabs@^7.3.10
bun install @react-navigation/drawer@^7.3.2
bun install @react-navigation/stack@^7.1.1
bun install @react-navigation/material-top-tabs@^7.2.3
bun install @react-navigation/elements@^2.3.8

# React Native dependencies
bun install react-native-screens@~4.10.0
bun install react-native-safe-area-context@5.4.0
bun install react-native-gesture-handler@~2.24.0
bun install react-native-reanimated@~3.17.4
bun install react-native-svg@15.11.2
bun install react-native-web@~0.20.0
bun install react-native-webview@13.13.5

# State Management
bun install zustand@^5.0.4
bun install @react-native-async-storage/async-storage@2.1.2

# UI & Styling
bun install nativewind@^4.1.23
bun install tailwindcss@^3.4.17
bun install tailwind-merge@^3.2.0
bun install clsx@^2.1.1

# Expo Modules (install all at once)
bun install expo-av@~15.1.4
bun install expo-calendar@~14.1.4
bun install expo-camera@~16.1.6
bun install expo-haptics@~14.1.4
bun install expo-image@~2.1.6
bun install expo-linear-gradient@~14.1.4
bun install expo-font@~13.3.0
bun install expo-status-bar@~2.2.3
bun install expo-constants@~17.1.5
bun install expo-device@~7.1.4
bun install expo-file-system@~18.1.8
bun install expo-secure-store@^14.0.1
bun install expo-sharing@~13.1.5
bun install expo-clipboard@~7.1.4

# Utilities
bun install date-fns@^4.1.0
bun install uuid@^11.1.0
bun install @expo/vector-icons@^14.1.0
bun install @expo/react-native-action-sheet@^4.1.1

# AI SDKs (optional - for AI features)
bun install openai@^4.89.0
bun install @anthropic-ai/sdk@^0.39.0

# Additional React Native libraries
bun install react-native-qrcode-svg@^6.3.0
bun install react-native-view-shot@~4.0.3
bun install react-native-pager-view@6.7.1
bun install react-native-mmkv@^3.2.0
bun install react-native-keyboard-controller@^1.17.0
```

### Step 3: Install Dev Dependencies

```bash
bun install -D typescript@~5.8.3
bun install -D @types/react@~19.0.10
bun install -D @typescript-eslint/eslint-plugin@^8.29.1
bun install -D @typescript-eslint/parser@^8.29.1
bun install -D eslint@^9.25.0
bun install -D eslint-config-expo@~9.2.0
bun install -D eslint-plugin-react@^7.37.5
bun install -D eslint-plugin-react-hooks@^5.2.0
bun install -D @babel/core@^7.25.2
bun install -D babel-plugin-module-resolver@^5.0.2
bun install -D patch-package@^8.0.0
```

---

## 📁 Project Structure

Create the following directory structure:

```
CoachOS-replica/
├── src/
│   ├── api/                    # API integration services
│   │   ├── anthropic.ts
│   │   ├── openai.ts
│   │   ├── grok.ts
│   │   ├── chat-service.ts
│   │   ├── transcribe-audio.ts
│   │   └── image-generation.ts
│   │
│   ├── components/            # Reusable components
│   │   ├── AvailabilityModals.tsx
│   │   ├── LessonAvatar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── StudentNotesScreen.tsx
│   │   └── PublicBookingPreview.tsx
│   │
│   ├── hooks/                 # Custom React hooks
│   │   └── useMockData.ts
│   │
│   ├── navigation/            # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   └── TabNavigator.tsx
│   │
│   ├── screens/               # App screens
│   │   ├── TodayScreen.tsx
│   │   ├── AvailabilityScreen.tsx
│   │   ├── StudentsScreen.tsx
│   │   ├── RequestsScreen.tsx
│   │   ├── LocationsScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── PublicBookingScreen.tsx
│   │   └── PublicBookingWrapper.tsx
│   │
│   ├── services/              # Business logic services
│   │   └── timeConflictValidator.ts
│   │
│   ├── state/                 # State management
│   │   └── coachStore.ts
│   │
│   ├── types/                 # TypeScript types
│   │   ├── coach.ts
│   │   └── ai.ts
│   │
│   └── utils/                 # Utility functions
│       ├── calendarService.ts
│       ├── cn.ts
│       ├── dataExport.ts
│       ├── dayNav.ts
│       ├── designTokens.ts
│       ├── timeFormat.ts      # New utility
│       └── dateFormat.ts      # New utility
│
├── assets/                     # Images, fonts, etc
├── patches/                    # Package patches
├── App.tsx                     # App entry point
├── index.ts                    # Expo entry
├── app.json                    # Expo config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── tailwind.config.js         # TailwindCSS config
├── babel.config.js            # Babel config
├── metro.config.js            # Metro bundler config
├── global.css                 # Global styles
└── nativewind-env.d.ts        # NativeWind types
```

---

## ⚙️ Configuration Files

### 1. **app.json**
```json
{
  "expo": {
    "name": "CoachOS",
    "slug": "coachos",
    "scheme": "coachos",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.coachos",
      "infoPlist": {
        "NSCalendarsUsageDescription": "CoachOS needs access to your calendar to sync approved lessons.",
        "NSRemindersUsageDescription": "CoachOS needs access to your reminders to help you stay on top of your coaching schedule."
      }
    },
    "android": {
      "edgeToEdgeEnabled": true,
      "package": "com.yourcompany.coachos",
      "permissions": [
        "android.permission.READ_CALENDAR",
        "android.permission.WRITE_CALENDAR"
      ]
    }
  }
}
```

### 2. **tsconfig.json**
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

### 3. **tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./App.tsx", "./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  corePlugins: {
    space: false,
  },
  theme: {
    extend: {
      colors: {
        primary: '#1E88E5',
        success: '#2E7D32',
        warning: '#F9A825',
        danger: '#C62828',
        'accent-blue': '#007AFF',
        'graphite': '#1C1C1E',
        'secondary-grey': '#8E8E93',
        'true-white': '#FFFFFF',
        ink: {
          900: '#0B1220',
          600: '#42526E'
        }
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px'
      },
      borderRadius: {
        'default': '8px',
        'card': '12px',
        'sheet': '20px'
      },
      fontSize: {
        'title': ['22px', '28px'],
        'section': ['18px', '24px'],
        'body': ['16px', '22px'],
        'small': ['14px', '18px']
      }
    }
  },
  darkMode: "class",
  plugins: [
    plugin(({ matchUtilities, theme }) => {
      const spacing = theme("spacing");
      matchUtilities(
        { space: (value) => ({ gap: value }) },
        { values: spacing }
      );
      matchUtilities(
        { "space-x": (value) => ({ columnGap: value }) },
        { values: spacing }
      );
      matchUtilities(
        { "space-y": (value) => ({ rowGap: value }) },
        { values: spacing }
      );
    }),
  ],
};
```

### 4. **babel.config.js**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./src",
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@utils": "./src/utils",
            "@state": "./src/state",
            "@types": "./src/types",
            "@api": "./src/api",
          },
        },
      ],
    ],
  };
};
```

### 5. **metro.config.js**
```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push("css");

module.exports = withNativeWind(config, { input: './global.css' });
```

### 6. **global.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 7. **nativewind-env.d.ts**
```typescript
/// <reference types="nativewind/types" />
```

### 8. **index.ts** (Expo entry point)
```typescript
import './global.css';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

---

## 📦 Complete Dependencies List

See the package.json file for the complete list. Key dependencies:

### Core
- expo@53.0.9
- react@19.0.0
- react-native@0.79.2
- typescript@5.8.3

### State & Storage
- zustand@5.0.4
- @react-native-async-storage/async-storage@2.1.2

### Navigation
- @react-navigation/native@7.1.6
- @react-navigation/native-stack@7.3.2
- @react-navigation/bottom-tabs@7.3.10

### UI & Styling
- nativewind@4.1.23
- tailwindcss@3.4.17
- react-native-reanimated@3.17.4
- react-native-gesture-handler@2.24.0

### Utilities
- date-fns@4.1.0
- uuid@11.1.0
- @expo/vector-icons@14.1.0

---

## 🏗️ Source Code Architecture

### Data Model (src/types/coach.ts)

```typescript
export interface Coach {
  id: string;
  name: string;
  photo?: string;
  sports: string[];
  pricePerHour: number;
  paymentSettings: PaymentSettings;
  availability: WeeklyAvailability;
  blackoutDates: string[];
  bookingLink: string;
  calendarSyncEnabled?: boolean;
}

export interface Student {
  id: string;
  coachId: string;
  name: string;
  contact: string;
  totalLessons: number;
  totalSpent: number;
  balance: number;
  notes?: string; // Deprecated
  createdAt: string;
  lastLessonDate?: string;
}

export interface StudentNote {
  id: string;
  studentId: string;
  coachId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  lessonId?: string;
  tags?: string[];
}

export interface Lesson {
  id: string;
  coachId: string;
  studentId: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  isPaid: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
  calendarEventId?: string;
}

export interface BookingRequest {
  id: string;
  coachId: string;
  studentName: string;
  studentContact: string;
  requestedDate: string;
  requestedTime: string;
  duration: number;
  note?: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
  areaId?: string;
  facilityId?: string;
  courtId?: string;
}

export interface AvailabilityRange {
  id: string;
  coachId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  areaId: string;
  facilityId?: string;
  courtId?: string;
}

export interface Area {
  id: string;
  coachId: string;
  name: string;
}

export interface Facility {
  id: string;
  coachId: string;
  areaId: string;
  name: string;
  address?: string;
  notes?: string;
}

export interface Court {
  id: string;
  coachId: string;
  facilityId: string;
  label: string;
  sport?: string;
}
```

---

## 🔑 Key Features Implemented

### 1. ✅ Bug Fixes (50+ issues resolved)
- Race condition handling
- Date validation
- Memory leak fixes
- API error handling
- Type safety improvements
- Input validation
- Calendar sync error handling

### 2. 📝 Student Notes Timeline
- Timestamped notes
- Search functionality
- Timeline UI with date grouping
- Edit/delete with confirmation
- Tag support (ready for categorization)
- Link notes to specific lessons

### 3. ⏰ Availability Management
- Weekly schedules with time ranges
- Location-based availability (Area → Facility → Court)
- Blackout dates
- Conflict detection
- Visual preview

### 4. 📅 Booking System
- Public booking page
- Request approval/decline
- Automatic calendar sync
- Conflict prevention
- Race condition handling

### 5. 💰 Payment Tracking
- Lesson payment status
- Student balance tracking
- Financial summaries
- Payment history

### 6. 📊 Analytics
- Student progress tracking
- Lesson statistics
- Revenue analytics
- Attendance patterns

---

## 🚀 Build & Deploy

### Development Build
```bash
# Start development server
bun start

# Run on iOS simulator
bun ios

# Run on Android emulator
bun android

# Run on physical device
# Scan QR code with Expo Go app
```

### Production Build

#### iOS
```bash
# Prerequisites: Apple Developer Account

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure for iOS
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

#### Android
```bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

### Environment Variables
Create `.env` file:
```bash
EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY=your_openai_key
EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY=your_anthropic_key
EXPO_PUBLIC_VIBECODE_GROK_API_KEY=your_grok_key
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
```bash
bun start --clear
```

2. **iOS build failures**
```bash
cd ios && pod install && cd ..
```

3. **Android build failures**
```bash
cd android && ./gradlew clean && cd ..
```

4. **TypeScript errors**
```bash
bun tsc --noEmit
```

5. **NativeWind not working**
```bash
# Ensure global.css is imported in index.ts
# Restart Metro bundler
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [React Navigation](https://reactnavigation.org/)

---

## ✅ Verification Checklist

Before considering replication complete:

- [ ] All dependencies installed
- [ ] Project builds without errors
- [ ] TypeScript has no errors
- [ ] All screens render correctly
- [ ] Navigation works properly
- [ ] State persists correctly
- [ ] Calendar sync working (iOS/Android)
- [ ] Student notes feature working
- [ ] Booking system functional
- [ ] Payment tracking accurate

---

## 📝 Next Steps After Setup

1. Replace placeholder API keys with your own
2. Customize app name and branding in app.json
3. Update bundle identifiers for iOS/Android
4. Configure app icons and splash screens
5. Test on physical devices
6. Submit to app stores

---

**Created by:** CoachOS Development Team
**Last Updated:** 2025-10-30
**Version:** 1.0.0
