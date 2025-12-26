# iOS Production Build Guide

## Prerequisites

1. **Apple Developer Account** (required)
   - Active Apple Developer Program membership ($99/year)
   - Access to App Store Connect

2. **Apple Account Credentials**
   - Apple ID email
   - Password (or App-Specific Password if 2FA is enabled)
   - Team ID

## Build Options

### Option 1: Interactive Build (Recommended)
Run the build command and provide credentials when prompted:

```bash
cd attendance-mobile
eas build --platform ios --profile production
```

When prompted:
- Enter your Apple ID email
- Enter your Apple ID password (or App-Specific Password)
- EAS will automatically:
  - Generate certificates
  - Create provisioning profiles
  - Configure everything needed

### Option 2: Manual Credential Setup
If you prefer to set up credentials manually:

1. **Generate credentials**:
   ```bash
   eas credentials
   ```

2. **Select iOS** and follow the prompts to:
   - Upload your distribution certificate
   - Upload your provisioning profile
   - Or let EAS generate them

3. **Then build**:
   ```bash
   eas build --platform ios --profile production
   ```

## App-Specific Password (If 2FA Enabled)

If you have 2FA enabled on your Apple ID:

1. Go to: https://appleid.apple.com/
2. Sign in → Security → App-Specific Passwords
3. Generate a new password for "EAS Build"
4. Use this password instead of your regular password

## Build Configuration

Your current iOS config in `app.json`:
- Bundle Identifier: `com.attendiq.app`
- Build Number: `1` (increment for each build)
- Version: `1.0.4`

## After Build

1. **Download the build** from EAS dashboard
2. **Test on device** using TestFlight or direct install
3. **Submit to App Store**:
   ```bash
   eas submit --platform ios
   ```

## Important Notes

- iOS builds take 20-40 minutes
- You'll receive an email when build is complete
- First build may take longer (certificate generation)
- Make sure your Apple Developer account is active

## Troubleshooting

- **"Apple account required"**: You need to provide credentials interactively
- **Certificate errors**: Run `eas credentials` to regenerate
- **2FA issues**: Use App-Specific Password
- **Team ID not found**: Make sure you're enrolled in Apple Developer Program

