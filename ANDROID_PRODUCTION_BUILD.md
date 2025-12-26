# Android Production Build Guide

## Prerequisites

1. **EAS Account**: Make sure you're logged into EAS
   ```bash
   eas login
   ```

2. **App Configuration**: Already configured in `app.json`
   - Package: `com.attendiq.app`
   - Version Code: 4
   - Version: 1.0.3

## Build Types

### Option 1: App Bundle (AAB) - For Google Play Store
This is the default production build. Use this if you're submitting to Google Play Store.

```bash
npm run build:android
# or
eas build --platform android --profile production
```

### Option 2: APK - For Direct Distribution
If you need an APK file for direct installation (not through Play Store):

```bash
eas build --platform android --profile production --local
```

Or modify `eas.json` temporarily to use `"buildType": "apk"` instead of `"app-bundle"`.

## Build Process

1. **Start the build**:
   ```bash
   cd attendance-mobile
   eas build --platform android --profile production
   ```

2. **Follow the prompts**:
   - Confirm build configuration
   - Choose build type (cloud or local)
   - Wait for build to complete

3. **Download the build**:
   - Build will be available in EAS dashboard
   - Or download link will be provided in terminal

## Build Output

- **AAB file**: `app-release.aab` (for Play Store submission)
- **APK file**: `app-release.apk` (for direct installation)

## After Build

1. **Test the build**: Install on a device and test all features
2. **Submit to Play Store**: Use `eas submit --platform android`
3. **Update version**: Increment `versionCode` in `app.json` for next build

## Important Notes

- Production builds take 15-30 minutes
- You'll receive an email when build is complete
- Builds are stored in your EAS account
- Make sure your backend API is production-ready

## Troubleshooting

- **Build fails**: Check EAS dashboard for error logs
- **Missing assets**: Ensure all assets are in `./assets/` folder
- **Version conflicts**: Make sure versionCode is incremented for each new build

