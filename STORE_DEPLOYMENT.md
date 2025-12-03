# Store Deployment Guide - AttendIQ Mobile App

This guide will help you deploy AttendIQ to both the Apple App Store and Google Play Store.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **Apple Developer Account**: $99/year - [developer.apple.com](https://developer.apple.com)
3. **Google Play Console Account**: $25 one-time fee - [play.google.com/console](https://play.google.com/console)
4. **EAS CLI**: Install globally
   ```bash
   npm install -g eas-cli
   ```

## Initial Setup

### 1. Install EAS CLI and Login

```bash
npm install -g eas-cli
eas login
```

### 2. Configure EAS Project

```bash
cd attendance-mobile
eas build:configure
```

This will create/update `eas.json` and link your project to Expo.

### 3. Update app.json

Update the following in `app.json`:
- `ios.bundleIdentifier`: Your unique iOS bundle ID (e.g., `com.yourcompany.attendiq`)
- `android.package`: Your unique Android package name (e.g., `com.yourcompany.attendiq`)
- `extra.eas.projectId`: Will be generated when you run `eas build:configure`

## iOS App Store Deployment

### Step 1: Apple Developer Account Setup

1. **Create App ID**:
   - Go to [developer.apple.com/account](https://developer.apple.com/account)
   - Certificates, Identifiers & Profiles → Identifiers
   - Create new App ID matching your `bundleIdentifier`

2. **Create App in App Store Connect**:
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - My Apps → Create App
   - Fill in app information:
     - Name: AttendIQ
     - Primary Language: English
     - Bundle ID: (select the one you created)
     - SKU: attendiq-001

### Step 2: Build for iOS

```bash
eas build --platform ios --profile production
```

This will:
- Create a production build
- Handle code signing automatically
- Upload to EAS servers

### Step 3: Submit to App Store

```bash
eas submit --platform ios
```

You'll need:
- Apple ID credentials
- App Store Connect API key (recommended) or App-Specific Password

### Step 4: Complete App Store Listing

In App Store Connect, provide:
- App screenshots (required sizes: 6.5", 5.5", 12.9" iPad)
- App description
- Keywords
- Privacy policy URL
- Support URL
- Category: Education
- Age rating

## Android Play Store Deployment

### Step 1: Google Play Console Setup

1. **Create App**:
   - Go to [play.google.com/console](https://play.google.com/console)
   - Create app
   - Fill in:
     - App name: AttendIQ
     - Default language: English
     - App or game: App
     - Free or paid: Free

2. **Create Service Account** (for automated submission):
   - Google Cloud Console → IAM & Admin → Service Accounts
   - Create service account
   - Download JSON key file
   - Grant Play Console access in Play Console → Setup → API access

### Step 2: Build for Android

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) file required by Play Store.

### Step 3: Submit to Play Store

```bash
eas submit --platform android
```

You'll need:
- Service account key JSON file path
- Or manual upload through Play Console

### Step 4: Complete Play Store Listing

In Play Console, provide:
- App screenshots (phone, 7-inch tablet, 10-inch tablet)
- Feature graphic (1024x500)
- App description
- Short description
- Privacy policy URL
- Content rating questionnaire
- Category: Education

## Required Assets

### App Icons
- iOS: 1024x1024px PNG (no transparency)
- Android: 1024x1024px PNG (adaptive icon)

### Screenshots
- iOS: Various sizes for iPhone and iPad
- Android: Phone, 7" tablet, 10" tablet

### Privacy Policy
You must have a privacy policy URL that covers:
- Data collection (location, camera usage)
- How data is used
- Data storage and security
- User rights

## Build Profiles

The `eas.json` includes three profiles:

1. **development**: For testing with development client
2. **preview**: For internal testing (TestFlight/Internal Testing)
3. **production**: For store submission

## Version Management

### Update Version Numbers

Before each release, update:
- `app.json`: `version` (e.g., "1.0.1")
- `app.json`: `ios.buildNumber` (increment: 1, 2, 3...)
- `app.json`: `android.versionCode` (increment: 1, 2, 3...)

### Semantic Versioning
- Major.Minor.Patch (e.g., 1.0.0 → 1.0.1 for bug fixes)

## Testing Before Release

### Internal Testing

1. **iOS TestFlight**:
   ```bash
   eas build --platform ios --profile preview
   eas submit --platform ios
   ```
   Then add testers in App Store Connect → TestFlight

2. **Android Internal Testing**:
   ```bash
   eas build --platform android --profile preview
   eas submit --platform android --track internal
   ```

## Common Commands

```bash
# Build for both platforms
eas build --platform all --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Update app over-the-air (without store update)
eas update --branch production --message "Bug fixes"

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Troubleshooting

### iOS Issues
- **Code signing errors**: Ensure Apple Developer account is linked
- **Missing capabilities**: Check `app.json` iOS config
- **Build fails**: Check EAS build logs for specific errors

### Android Issues
- **Package name conflicts**: Ensure unique package name
- **Signing issues**: EAS handles this automatically
- **Permissions**: Verify all permissions in `app.json`

## Post-Deployment

### Monitor
- App Store Connect analytics
- Google Play Console analytics
- Crash reports
- User reviews

### Updates
- Use OTA updates for JS changes: `eas update`
- Use new builds for native changes: `eas build`

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

---

**Note**: Replace placeholder values in `app.json` and `eas.json` with your actual credentials and IDs before building.

