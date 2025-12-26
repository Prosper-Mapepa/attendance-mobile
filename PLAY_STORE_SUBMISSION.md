# Play Store Submission Guide - AttendIQ

This is a step-by-step guide to submit AttendIQ to the Google Play Store.

## Prerequisites Checklist

- [ ] Google Play Console account ($25 one-time fee)
- [ ] EAS CLI installed and logged in
- [ ] Expo account set up
- [ ] App tested and working with production API

## Step 1: Google Play Console Setup

### 1.1 Create Your App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in the details:
   - **App name**: AttendIQ
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Check all that apply (Ads, Content rating, etc.)
4. Click **"Create app"**

### 1.2 Complete Store Listing (Required Before Upload)

Go to **Store presence → Main store listing** and fill in:

#### Required Information:
- **App name**: AttendIQ
- **Short description** (80 chars max): Smart attendance tracking with QR codes and location verification
- **Full description** (4000 chars max):
```
AttendIQ is a smart attendance tracking companion designed for students and educators. Mark your attendance easily using QR codes or OTP codes, all while ensuring you're physically present in the classroom through location verification.

Features:
• Quick QR Code Scanning - Scan QR codes displayed by your instructor to mark attendance instantly
• OTP Code Entry - Enter OTP codes manually when QR scanning isn't available
• Location Verification - Automatic location verification ensures you're physically present in the classroom
• Class Management - Enroll in classes, view your schedule, and manage your enrolled courses
• Attendance History - Track your attendance records and view detailed history
• User-Friendly Interface - Clean, modern design optimized for both phones and tablets

Perfect for:
- Students who want to track their attendance easily
- Educational institutions looking for reliable attendance solutions
- Teachers managing class attendance

AttendIQ makes attendance tracking simple, secure, and efficient.
```

- **App icon**: Upload 512x512px icon (use `./assets/icon.png`)
- **Feature graphic**: 1024x500px banner
- **Screenshots**: 
  - Phone: At least 2 screenshots (1080x1920 or similar)
  - 7-inch tablet: At least 1 screenshot
  - 10-inch tablet: At least 1 screenshot

#### Optional but Recommended:
- **App category**: Education
- **Tags**: attendance, education, qr code, student, tracking
- **Contact details**: Your support email
- **Privacy policy URL**: (Required if you collect user data)

### 1.3 Content Rating

1. Go to **Policy → App content**
2. Complete the **Content rating questionnaire**
3. Answer questions about your app's content
4. Submit for rating (usually takes a few hours)

### 1.4 Privacy Policy (Required)

You need a privacy policy URL. It should cover:
- Data collection (location, camera usage)
- How data is used
- Data storage and security
- User rights

If you don't have one, you can:
- Create a simple one using a privacy policy generator
- Host it on your website or GitHub Pages
- Add the URL in **Store presence → Main store listing → Privacy Policy**

### 1.5 Data Safety

1. Go to **Policy → Data safety**
2. Answer questions about:
   - Data collection (Location, Camera)
   - Data sharing
   - Security practices
3. Complete the form based on your app's functionality

## Step 2: Prepare for Build

### 2.1 Verify Configuration

Your `app.json` should have:
- ✅ Package name: `com.attendiq.app`
- ✅ Version: `1.0.0`
- ✅ Version code: `1`
- ✅ All required permissions
- ✅ Icon and splash screen

### 2.2 Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### 2.3 Login to Expo

```bash
eas login
```

### 2.4 Link Project (if not already linked)

```bash
cd attendance-mobile
eas build:configure
```

## Step 3: Build Production App Bundle

### 3.1 Build for Android

```bash
eas build --platform android --profile production
```

This will:
- Create an Android App Bundle (AAB) file
- Handle code signing automatically
- Upload to EAS servers
- Take about 10-20 minutes

### 3.2 Monitor Build Progress

You can check build status:
```bash
eas build:list
```

Or view in browser at: https://expo.dev/accounts/[your-account]/projects/attendiq/builds

## Step 4: Submit to Play Store

### Option A: Automated Submission (Recommended)

#### 4.1 Create Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Play Android Developer API**
4. Go to **IAM & Admin → Service Accounts**
5. Click **Create Service Account**
6. Name it (e.g., "play-store-submitter")
7. Grant role: **Editor** (or minimal required permissions)
8. Click **Create and Continue**
9. Skip optional steps, click **Done**

#### 4.2 Grant Play Console Access

1. Go to [Play Console](https://play.google.com/console)
2. Go to **Setup → API access**
3. Under **Service accounts**, click **Link service account**
4. Select the service account you created
5. Grant access with role: **Admin** (or **Release manager**)
6. Click **Grant access**

#### 4.3 Download Service Account Key

1. Go back to [Google Cloud Console](https://console.cloud.google.com)
2. **IAM & Admin → Service Accounts**
3. Click on your service account
4. Go to **Keys** tab
5. Click **Add Key → Create new key**
6. Choose **JSON** format
7. Download the file
8. Save it as `service-account-key.json` in the `attendance-mobile` folder
9. **Important**: Add `service-account-key.json` to `.gitignore` (don't commit it!)

#### 4.4 Submit Using EAS

```bash
eas submit --platform android --profile production
```

This will automatically:
- Upload the AAB to Play Console
- Submit to the production track (or internal testing if configured)

### Option B: Manual Submission

1. Download the AAB file from EAS build page
2. Go to [Play Console](https://play.google.com/console)
3. Select your app
4. Go to **Production** (or **Testing → Internal testing**)
5. Click **Create new release**
6. Upload the AAB file
7. Add release notes
8. Click **Review release**
9. Review and click **Start rollout to Production**

## Step 5: Complete Store Listing

Before your app can be published, ensure:

- [ ] Store listing is complete (Step 1.2)
- [ ] Content rating is complete (Step 1.3)
- [ ] Privacy policy URL is added (Step 1.4)
- [ ] Data safety form is complete (Step 1.5)
- [ ] App bundle is uploaded (Step 4)
- [ ] Release notes are added

## Step 6: Review and Publish

1. Go to **Production** in Play Console
2. Review your release
3. Click **Review release**
4. Review all sections:
   - Content rating
   - Store listing
   - Data safety
   - App access
5. Click **Start rollout to Production**

### Review Process

- Google typically reviews apps within 1-7 days
- You'll receive email notifications about the review status
- If rejected, address the issues and resubmit

## Step 7: Post-Publication

### Monitor Your App

- **Analytics**: Track downloads, ratings, crashes
- **Reviews**: Respond to user reviews
- **Crashes**: Monitor crash reports in Play Console

### Update Your App

For future updates:

1. Update version numbers in `app.json`:
   ```json
   {
     "version": "1.0.1",
     "android": {
       "versionCode": 2
     }
   }
   ```

2. Build new version:
   ```bash
   eas build --platform android --profile production
   ```

3. Submit update:
   ```bash
   eas submit --platform android --profile production
   ```

## Quick Command Reference

```bash
# Build production AAB
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Update app over-the-air (JS changes only)
eas update --branch production --message "Bug fixes"
```

## Troubleshooting

### Build Fails
- Check build logs: `eas build:view [build-id]`
- Verify `app.json` configuration
- Ensure all assets exist

### Submission Fails
- Verify service account has correct permissions
- Check service account key path in `eas.json`
- Ensure app is created in Play Console first

### App Rejected
- Read rejection reason carefully
- Address all issues mentioned
- Update app and resubmit

## Important Notes

1. **First Submission**: Can take 1-7 days for review
2. **Updates**: Usually reviewed faster (hours to 1-2 days)
3. **Version Codes**: Must always increment (1, 2, 3, ...)
4. **Privacy Policy**: Required if app collects any user data
5. **Testing**: Consider using Internal Testing track first

## Next Steps After Submission

1. Set up app analytics
2. Prepare marketing materials
3. Plan app updates
4. Monitor user feedback
5. Set up crash reporting

---

**Good luck with your Play Store submission! 🚀**



