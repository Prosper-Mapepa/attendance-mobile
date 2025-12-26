# iOS Build Fix - Provisioning Profile Error

## The Problem
You're getting "unknown error" in the fastlane step, which is typically a code signing/provisioning profile issue.

## Complete Fix Steps

### Step 1: Delete Existing Credentials (if any)
```bash
cd attendance-mobile
eas credentials
```
1. Select **iOS**
2. Select your project
3. Choose **"Remove all credentials"** or **"Delete credentials"**
4. Confirm deletion

### Step 2: Verify Your Apple Developer Account
1. Go to https://developer.apple.com/account
2. Make sure your account is active
3. Note your **Team ID** (found in Membership section)

### Step 3: Register Bundle Identifier (if not already done)
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click the **+** button
3. Select **App IDs** → Continue
4. Select **App** → Continue
5. Enter:
   - **Description**: AttendIQ
   - **Bundle ID**: `com.attendiq.app` (Explicit)
6. Enable capabilities you need (Push Notifications, etc.)
7. Click **Continue** → **Register**

### Step 4: Build with Auto Credentials
Run the build and let EAS generate everything automatically:

```bash
cd attendance-mobile
eas build --platform ios --profile production --clear-cache
```

**When prompted:**
- Enter your **Apple ID email**
- Enter your **Apple ID password** (or App-Specific Password if 2FA enabled)
- EAS will automatically:
  - Generate distribution certificate
  - Create provisioning profile
  - Configure everything

### Step 5: If You Have 2FA Enabled
1. Go to https://appleid.apple.com/
2. Sign in → **Security** → **App-Specific Passwords**
3. Click **Generate Password**
4. Label it: "EAS Build"
5. Copy the password
6. Use this password (not your regular password) when EAS prompts

### Step 6: Alternative - Manual Credential Setup
If auto doesn't work, set up manually:

```bash
eas credentials
```

Then:
1. Select **iOS**
2. Select **production** credentials
3. Choose **"Set up new credentials"**
4. Select **"Generate new credentials"**
5. Follow prompts to:
   - Generate certificate
   - Create provisioning profile

## What Changed in Configuration

I've updated `eas.json` to:
- Add `"credentialsSource": "auto"` - Forces EAS to auto-generate credentials
- Add `"autoIncrement": true` - Automatically increments build number
- Keep `"developmentClient": false` - Excludes dev client from production

## If Still Failing

1. **Check Xcode Logs**: In the EAS dashboard, expand "Xcode Logs" to see the exact error
2. **Verify Bundle ID**: Make sure `com.attendiq.app` is registered in Apple Developer
3. **Check Team ID**: Ensure your Apple Developer Team ID is correct
4. **Try Preview Build First**: 
   ```bash
   eas build --platform ios --profile preview
   ```
   This uses ad-hoc provisioning which is easier

## Common Issues

- **"No valid 'aps-environment' entitlement"**: You need to enable Push Notifications in App ID
- **"Bundle identifier is already in use"**: The bundle ID is registered to another account
- **"Provisioning profile expired"**: Credentials need to be regenerated (Step 1)

## Success Indicators

When it works, you'll see:
- ✅ "Run fastlane" step succeeds
- ✅ Build completes with "Build finished"
- ✅ You can download the `.ipa` file

