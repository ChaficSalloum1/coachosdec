# Maestro Test Suite for CoachOS

This directory contains end-to-end tests for CoachOS using [Maestro](https://maestro.mobile.dev/).

## Setup

### 1. Install Maestro

**Mac/Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Or via Homebrew:**
```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

**Windows:**
Download from: https://maestro.mobile.dev/getting-started/installing-maestro

### 2. Update App ID

Before running tests, update the `appId` in each test file with your actual app bundle ID:

- **iOS**: Usually `com.yourcompany.vibecode` (check in Xcode or app.json)
- **Android**: Usually `com.yourcompany.vibecode` (check in android/app/build.gradle)

To find your app ID:
- **iOS**: Run `npx expo run:ios` and check the console output
- **Android**: Check `android/app/build.gradle` for `applicationId`

### 3. Build Your App

Maestro tests run against a built app, not the Expo dev server:

**iOS:**
```bash
npx expo run:ios
# Or build a release version
npx expo run:ios --configuration Release
```

**Android:**
```bash
npx expo run:android
# Or build a release version
npx expo run:android --variant release
```

## Running Tests

### Run All Tests
```bash
maestro test maestro/
```

### Run Specific Test
```bash
maestro test maestro/rls-security-test.yaml
```

### Run on Specific Platform
```bash
# iOS
maestro test maestro/ --ios

# Android
maestro test maestro/ --android
```

### Run with Device/Simulator
```bash
# List available devices
maestro devices

# Run on specific device
maestro test maestro/ --device "iPhone 15 Pro"
```

## Test Files

### Critical Tests (Run These First)

1. **`rls-security-test.yaml`** - Verifies Row Level Security policies work correctly
   - Tests that Coach A cannot see Coach B's data
   - **CRITICAL** - Run this after implementing RLS policies

2. **`create-student-test.yaml`** - Tests creating a new student
   - Verifies the core student creation flow

3. **`create-lesson-test.yaml`** - Tests creating a lesson
   - Verifies lesson creation and scheduling

4. **`approve-booking-test.yaml`** - Tests approving a booking request
   - Verifies the booking approval workflow

### Additional Tests

5. **`navigation-test.yaml`** - Tests basic navigation between tabs
   - Verifies all main screens are accessible

6. **`onboarding-test.yaml`** - Tests the initial onboarding flow
   - Verifies new user setup works correctly

## Test Data Setup

Some tests require test data. Before running tests:

1. **Create Test Coaches:**
   - Coach A: `coach-a@test.com` / `password123`
   - Coach B: `coach-b@test.com` / `password123`

2. **Or Update Test Files:**
   - Edit test files to use your existing test accounts
   - Update email/password fields in test files

## Troubleshooting

### Tests Can't Find Elements

Maestro uses text matching by default. If tests fail to find elements:

1. **Check if text exists:** Make sure the text you're looking for is visible on screen
2. **Use testIDs:** We've added `testID` props to key components - update tests to use them
3. **Use accessibility labels:** Some elements use `accessibilityLabel` - Maestro can find these

### App Not Found

If Maestro can't find your app:

1. **Check app ID:** Make sure `appId` in test files matches your actual bundle ID
2. **Build app first:** Maestro needs a built app, not the Expo dev server
3. **Install app:** Make sure the app is installed on the device/simulator

### Authentication Issues

If login tests fail:

1. **Check credentials:** Verify test account credentials are correct
2. **Check Supabase:** Make sure Supabase is configured and accessible
3. **Check RLS policies:** If RLS is enabled, make sure test accounts can authenticate

## Best Practices

1. **Run RLS security test first** - This is the most critical test after security fixes
2. **Run tests in order** - Some tests depend on data from previous tests
3. **Clean up test data** - Delete test data between test runs to avoid conflicts
4. **Update app ID** - Remember to update `appId` in all test files before running

## CI/CD Integration

Maestro tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Maestro Tests
  run: |
    maestro test maestro/ --format junit > test-results.xml
```

## More Information

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Maestro Examples](https://maestro.mobile.dev/examples)
- [Maestro Best Practices](https://maestro.mobile.dev/best-practices)

