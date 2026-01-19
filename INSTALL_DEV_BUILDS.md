# Installing Development Builds on Physical Devices

## Prerequisites

### For iOS:
- Apple Developer account (free or paid)
- Xcode installed (for device registration)
- Device registered in Apple Developer portal

### For Android:
- USB debugging enabled on your Android device
- ADB installed (comes with Android Studio) OR
- Just transfer the APK file directly to your device

## Step 1: Build the Development Builds

### Build for Android Device:
```bash
npm run build:dev:android
```

### Build for iOS Device:
```bash
npm run build:dev:ios
```

### Build for Both:
```bash
npm run build:dev:all
```

Wait for the builds to complete on EAS. You'll get download links in the terminal or check your EAS dashboard.

## Step 2: Install on Android Device

### Method 1: Direct APK Installation (Easiest)

1. Download the `.apk` file from EAS dashboard
2. Transfer the APK to your Android device (via email, cloud storage, or USB)
3. On your Android device:
   - Open the file manager
   - Navigate to where you saved the APK
   - Tap the APK file
   - If prompted, allow "Install from Unknown Sources"
   - Tap "Install"
   - Wait for installation to complete
   - Tap "Open" or find "AttendIQ" in your app drawer

### Method 2: Using ADB (Advanced)

1. Download the `.apk` file from EAS dashboard
2. Connect your Android device via USB
3. Enable USB debugging on your device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times to enable Developer Options
   - Go to Settings > Developer Options
   - Enable "USB Debugging"
4. Install via ADB:
   ```bash
   adb install path/to/your-app.apk
   ```

## Step 3: Install on iOS Device

### Method 1: Direct Install via EAS (Recommended)

1. After the build completes, EAS will provide a link
2. Open the link on your iOS device (Safari browser)
3. Tap "Install" when prompted
4. Go to Settings > General > VPN & Device Management
5. Trust the developer certificate
6. The app will appear on your home screen

### Method 2: Using TestFlight (For Team Distribution)

1. After build completes, submit to TestFlight:
   ```bash
   eas submit --platform ios --profile development
   ```
2. Add testers in App Store Connect
3. Testers receive an email invitation
4. Install TestFlight app from App Store
5. Accept invitation and install the app

### Method 3: Using Xcode (For Local Development)

1. Download the `.ipa` file from EAS
2. Open Xcode
3. Go to Window > Devices and Simulators
4. Select your connected device
5. Drag and drop the `.ipa` file to install

## Step 4: Connect to Development Server

After installing the development build:

1. Start the development server:
   ```bash
   npm start
   ```

2. Open the app on your device

3. The app will automatically connect to the development server (if on same network)

4. If it doesn't connect automatically:
   - Shake your device (or press Cmd+D on iOS simulator)
   - Select "Enter URL manually"
   - Enter your computer's IP address (shown in the terminal)
   - Format: `exp://192.168.x.x:8081`

## Troubleshooting

### Android: "Install blocked" or "Unknown sources"
- Go to Settings > Security > Enable "Install from Unknown Sources"
- Or Settings > Apps > Special Access > Install Unknown Apps

### iOS: "Untrusted Developer"
- Go to Settings > General > VPN & Device Management
- Tap on the developer certificate
- Tap "Trust [Developer Name]"

### App won't connect to dev server
- Ensure device and computer are on the same WiFi network
- Check firewall settings on your computer
- Try manually entering the IP address in the app

### Build fails with certificate errors
- For iOS: Ensure your Apple Developer account is properly configured in EAS
- Run: `eas credentials` to check/configure credentials

## Quick Reference

```bash
# Build for Android device
npm run build:dev:android

# Build for iOS device  
npm run build:dev:ios

# Build for iOS simulator (faster, no certificate needed)
npm run build:dev:ios:simulator

# Start development server
npm start
```

## Notes

- Development builds include `expo-dev-client` for hot reloading
- Code changes will hot reload without rebuilding
- Native code changes require rebuilding the development build
- Backend URL is already configured: `https://attendance-iq-api-production.up.railway.app`
