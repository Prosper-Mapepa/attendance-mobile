# Development Build Setup

## Configuration Complete ✅

The development build configuration has been set up with:
- **Backend URL**: `https://attendance-iq-api-production.up.railway.app` (unchanged)
- **iOS Bundle ID**: `com.prospermap.attendiq`
- **Android Package**: `com.attendiq.app`

## Build Commands

### Build for Both Platforms
```bash
npm run build:dev:all
```

### Build for iOS Only
```bash
npm run build:dev:ios
```

### Build for Android Only
```bash
npm run build:dev:android
```

## Installation Steps

### For iOS (Simulator)
1. Run: `npm run build:dev:ios`
2. Wait for build to complete on EAS
3. Download the `.tar.gz` file from EAS dashboard
4. Extract and install on simulator:
   ```bash
   tar -xzf your-build.tar.gz
   xcrun simctl install booted Payload/YourApp.app
   ```

### For iOS (Physical Device)
1. Run: `npm run build:dev:ios` (without `simulator: true` in eas.json)
2. Download the `.ipa` file from EAS dashboard
3. Install via TestFlight or direct install

### For Android
1. Run: `npm run build:dev:android`
2. Wait for build to complete on EAS
3. Download the `.apk` file from EAS dashboard
4. Install on device:
   ```bash
   adb install your-build.apk
   ```
   Or transfer the APK to your device and install manually

## After Installation

Once the development build is installed:

1. Start the development server:
   ```bash
   npm start
   ```

2. Open the app on your device/simulator

3. The app will connect to the development server automatically

## Notes

- The development build includes `expo-dev-client` which allows hot reloading
- The backend URL is already configured to use the production backend
- You can make code changes and they will hot reload without rebuilding
- For native code changes, you'll need to rebuild the development build
