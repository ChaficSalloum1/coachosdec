# Maestro Quick Start Guide

## 🚀 Get Testing in 5 Minutes

### Step 1: Install Maestro (2 minutes)

**Mac/Linux:**
```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Windows:**
Download installer from: https://maestro.mobile.dev/getting-started/installing-maestro

Verify installation:
```bash
maestro --version
```

### Step 2: Build Your App (2 minutes)

Maestro tests run against a **built app**, not the Expo dev server.

**iOS:**
```bash
npx expo run:ios
```

**Android:**
```bash
npx expo run:android
```

### Step 3: Update Test Files (1 minute)

1. **Find your app bundle ID:**
   - Check `app.json` or run `npx expo config` and look for `ios.bundleIdentifier` or `android.package`

2. **Update all test files:**
   - Open each `.yaml` file in the `maestro/` folder
   - Replace `com.yourcompany.vibecode` with your actual bundle ID
   - Update test email/password if needed

### Step 4: Run Your First Test

```bash
# Run all tests
npm run test:maestro

# Or run specific test
maestro test maestro/navigation-test.yaml

# Run on specific platform
npm run test:maestro:ios
npm run test:maestro:android
```

## 🎯 Start with These Tests

1. **Navigation Test** (easiest) - `maestro/navigation-test.yaml`
   - Tests basic app navigation
   - Good for verifying Maestro is working

2. **RLS Security Test** (most important) - `maestro/rls-security-test.yaml`
   - **CRITICAL** - Verifies coaches can't see each other's data
   - Run this after implementing RLS policies

3. **Create Student Test** - `maestro/create-student-test.yaml`
   - Tests core student creation flow

## ⚠️ Common Issues

### "App not found"
- Make sure you've built the app (`npx expo run:ios` or `npx expo run:android`)
- Check that `appId` in test files matches your actual bundle ID
- Verify app is installed on device/simulator

### "Element not found"
- Maestro uses text matching - make sure the text exists on screen
- Try using different text (e.g., "Sign In" vs "Login")
- Check if element is visible (not hidden or off-screen)

### "Authentication fails"
- Verify test account credentials are correct
- Make sure Supabase is configured and accessible
- Check if RLS policies allow the test account to authenticate

## 📝 Test Customization

### Using Environment Variables

Update `.maestro.yaml` with your credentials:
```yaml
env:
  COACH_A_EMAIL: "your-test-email@example.com"
  COACH_A_PASSWORD: "your-password"
```

Then use in tests:
```yaml
- inputText: "${COACH_A_EMAIL}"
```

### Adding More Tests

Copy an existing test file and modify:
```bash
cp maestro/create-student-test.yaml maestro/my-new-test.yaml
```

Edit the new file with your test steps.

## 🎓 Learn More

- [Maestro Docs](https://maestro.mobile.dev/)
- [Maestro Examples](https://maestro.mobile.dev/examples)
- Check `maestro/README.md` for detailed documentation

## ✅ Success Checklist

- [ ] Maestro installed (`maestro --version` works)
- [ ] App built and installed on device/simulator
- [ ] App ID updated in all test files
- [ ] Test credentials updated (if needed)
- [ ] Navigation test passes
- [ ] RLS security test passes (after RLS implementation)

