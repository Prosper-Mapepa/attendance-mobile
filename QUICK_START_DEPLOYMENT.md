# Quick Start: Deploy to App Store & Play Store

## Prerequisites Checklist

- [ ] Expo account created at [expo.dev](https://expo.dev)
- [ ] Apple Developer account ($99/year)
- [ ] Google Play Console account ($25 one-time)
- [ ] EAS CLI installed: `npm install -g eas-cli`

## Step-by-Step Deployment

### 1. Initial Setup (5 minutes)

```bash
# Login to Expo
eas login

# Configure EAS for your project
cd attendance-mobile
eas build:configure
```

This will:
- Create `eas.json` (if not exists)
- Link your project to Expo
- Generate a project ID

### 2. Update Configuration

Edit `app.json` and update:
- `ios.bundleIdentifier`: Change to your unique ID (e.g., `com.yourcompany.attendiq`)
- `android.package`: Change to match (e.g., `com.yourcompany.attendiq`)

**Important**: These must be unique and match your developer accounts!

### 3. Build for iOS App Store

```bash
# Build production iOS app
eas build --platform ios --profile production

# Follow prompts to:
# - Select distribution method: App Store
# - Configure credentials (EAS can handle this automatically)
```

Wait for build to complete (15-30 minutes).

### 4. Submit iOS to App Store

```bash
# Submit to App Store
eas submit --platform ios

# You'll need:
# - Apple ID and password, OR
# - App Store Connect API key (recommended)
```

### 5. Build for Android Play Store

```bash
# Build production Android app (AAB format)
eas build --platform android --profile production

# Follow prompts for credentials
```

Wait for build to complete (15-30 minutes).

### 6. Submit Android to Play Store

```bash
# Submit to Play Store
eas submit --platform android

# You'll need:
# - Service account JSON key file, OR
# - Manual upload through Play Console
```

## Store Listings Setup

### App Store Connect (iOS)

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Create new app:
   - Name: AttendIQ
   - Bundle ID: (select from dropdown)
   - SKU: attendiq-001
3. Complete required information:
   - Screenshots (required sizes)
   - Description
   - Privacy Policy URL
   - Support URL
   - Category: Education

### Google Play Console (Android)

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app:
   - App name: AttendIQ
   - Default language: English
   - App or game: App
   - Free or paid: Free
3. Complete required information:
   - Screenshots
   - Feature graphic
   - Description
   - Privacy Policy URL
   - Content rating

## Version Updates

When releasing updates:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",  // User-facing version
   "ios": {
     "buildNumber": "2"  // Increment for each build
   },
   "android": {
     "versionCode": 2  // Increment for each build
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform all --profile production
   eas submit --platform all
   ```

## Quick Commands Reference

```bash
# Build for both stores
eas build --platform all --profile production

# Submit to both stores
eas submit --platform all

# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Update app without new build (JS changes only)
eas update --branch production --message "Bug fixes"
```

## Important Notes

1. **Bundle/Package IDs**: Must be unique and cannot be changed after first submission
2. **Privacy Policy**: Required by both stores - must be publicly accessible URL
3. **Screenshots**: Required in specific sizes for both stores
4. **Review Process**: 
   - iOS: Usually 1-3 days
   - Android: Usually 1-7 days
5. **Testing**: Use TestFlight (iOS) and Internal Testing (Android) before production release

## Need Help?

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Expo Discord](https://chat.expo.dev/)

---

**Estimated Time**: 
- Initial setup: 30-60 minutes
- First build: 30-60 minutes per platform
- Store listing: 1-2 hours
- Review wait: 1-7 days

