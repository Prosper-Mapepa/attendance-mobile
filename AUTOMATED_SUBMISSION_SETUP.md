# Automated Play Store Submission Setup Guide

This guide will walk you through setting up automated submission to Google Play Store using EAS Submit.

## Prerequisites

- ✅ Google Play Console account created
- ✅ App created in Play Console
- ✅ EAS CLI installed (`npm install -g eas-cli`)
- ✅ Logged into EAS (`eas login`)

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with the **same Google account** you use for Play Console

### 1.2 Create or Select Project

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Enter project name: `AttendIQ Play Store` (or any name)
4. Click **"Create"**
5. Wait for project creation (takes a few seconds)
6. Select the newly created project from the dropdown

**OR** if you already have a project, just select it from the dropdown.

## Step 2: Enable Google Play Android Developer API

### 2.1 Navigate to APIs & Services

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - Or go directly: https://console.cloud.google.com/apis/library

### 2.2 Enable the API

1. In the search bar, type: **"Google Play Android Developer API"**
2. Click on **"Google Play Android Developer API"** from results
3. Click the **"Enable"** button
4. Wait for it to enable (takes a few seconds)
5. You should see a green checkmark or "API enabled" message

## Step 3: Create Service Account

### 3.1 Navigate to Service Accounts

1. In the left sidebar, click **"IAM & Admin"** → **"Service Accounts"**
   - Or go directly: https://console.cloud.google.com/iam-admin/serviceaccounts

### 3.2 Create New Service Account

1. Click the **"+ CREATE SERVICE ACCOUNT"** button at the top
2. **Step 1 - Service account details:**
   - **Service account name**: `play-store-submitter` (or any name)
   - **Service account ID**: Will auto-fill (e.g., `play-store-submitter@your-project.iam.gserviceaccount.com`)
   - **Description** (optional): `Service account for automated Play Store submissions`
   - Click **"CREATE AND CONTINUE"**

3. **Step 2 - Grant this service account access to project:**
   - **Role**: Select **"Editor"** (or **"Owner"** for full access)
   - Click **"CONTINUE"**

4. **Step 3 - Grant users access to this service account:**
   - You can skip this step (leave empty)
   - Click **"DONE"**

5. You should now see your service account in the list

## Step 4: Create and Download Service Account Key

### 4.1 Create Key

1. Click on the service account you just created (the email address)
2. Go to the **"KEYS"** tab at the top
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **"JSON"** as the key type
5. Click **"CREATE"**

### 4.2 Download the Key

1. The JSON file will automatically download to your computer
2. **Important**: Save this file securely - you won't be able to download it again!
3. The file will be named something like: `your-project-xxxxx-xxxxx.json`

### 4.3 Move Key to Project

1. Rename the downloaded file to: `service-account-key.json`
2. Move it to your project root: `/attendance-mobile/service-account-key.json`
3. **Verify it's in .gitignore** (we already added it, but double-check it's not committed to git)

## Step 5: Grant Play Console Access

### 5.1 Open Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your **AttendIQ** app

### 5.2 Navigate to API Access

1. In the left sidebar, click **"Setup"** → **"API access"**
   - Or go directly: https://play.google.com/console/developers/api-access

### 5.3 Link Service Account

1. Scroll down to the **"Service accounts"** section
2. Click **"Link service account"** button
3. A dialog will open showing your Google Cloud projects
4. Select the project you created in Step 1
5. You should see your service account listed (e.g., `play-store-submitter@your-project.iam.gserviceaccount.com`)
6. Click on the service account to select it
7. Click **"Grant access"** or **"Link"**

### 5.4 Grant Permissions

1. After linking, you'll see your service account in the list
2. Click on the service account name
3. You'll see a permissions dialog
4. **Grant the following permissions:**
   - ✅ **View app information and download bulk reports**
   - ✅ **Manage production releases**
   - ✅ **Manage testing track releases** (optional, for internal testing)
   - ✅ **Manage store listing** (optional, if you want to update store listing via API)

5. Click **"Invite user"** or **"Grant access"**
6. The service account should now show as "Active" with the granted permissions

## Step 6: Verify Configuration

### 6.1 Check File Location

Make sure `service-account-key.json` is in the correct location:

```bash
cd attendance-mobile
ls -la service-account-key.json
```

You should see the file listed.

### 6.2 Verify .gitignore

Check that the key file is in .gitignore:

```bash
cat .gitignore | grep service-account-key
```

You should see: `service-account-key.json`

### 6.3 Verify eas.json

Check that `eas.json` has the correct path:

```bash
cat eas.json | grep serviceAccountKeyPath
```

You should see: `"serviceAccountKeyPath": "./service-account-key.json"`

## Step 7: Build Your App (If Not Already Done)

Before submitting, make sure you have a production build:

```bash
eas build --platform android --profile production
```

Wait for the build to complete (10-20 minutes). You'll get a build ID when it's done.

## Step 8: Submit to Play Store

### 8.1 Submit Command

Once your build is complete, run:

```bash
eas submit --platform android --profile production
```

### 8.2 What Happens

EAS will:
1. Detect your `service-account-key.json` file
2. Authenticate with Google Play using the service account
3. Find your latest production build
4. Upload the AAB to Play Console
5. Create a new release in the Production track
6. Show you the submission status

### 8.3 Expected Output

You should see something like:

```
✔ Using service account from ./service-account-key.json
✔ Found 1 build for platform android
✔ Submitting app to Google Play Store
✔ Successfully submitted the app to Google Play Store
```

## Step 9: Complete Release in Play Console

### 9.1 Add Release Notes

1. Go to [Play Console](https://play.google.com/console)
2. Select your app
3. Go to **"Production"** (or the track you submitted to)
4. You should see a new release with status "Draft"
5. Click on the release
6. Add **Release notes**:
   ```
   Initial release of AttendIQ
   - Smart attendance tracking with QR codes
   - Location verification
   - Class management
   - Attendance history
   ```
7. Click **"Review release"**

### 9.2 Review and Publish

1. Review all sections:
   - ✅ Release notes
   - ✅ Content rating
   - ✅ Store listing
   - ✅ Data safety
2. Click **"Start rollout to Production"**
3. Your app will be submitted for review!

## Troubleshooting

### Error: "Service account key not found"

**Solution:**
- Make sure `service-account-key.json` is in the project root
- Check the file name matches exactly (case-sensitive)
- Verify the path in `eas.json` is correct

### Error: "Permission denied" or "Access denied"

**Solution:**
- Go back to Step 5 and verify service account has correct permissions
- Make sure you granted "Manage production releases" permission
- Try unlinking and re-linking the service account

### Error: "API not enabled"

**Solution:**
- Go back to Step 2 and verify Google Play Android Developer API is enabled
- Make sure you're in the correct Google Cloud project

### Error: "App not found in Play Console"

**Solution:**
- Make sure you created the app in Play Console first
- Verify the package name in `app.json` matches the one in Play Console
- Check that you're using the same Google account

### Build Not Found

**Solution:**
- Make sure you built with `--profile production`
- Check build status: `eas build:list`
- Wait for build to complete before submitting

## Security Best Practices

1. **Never commit the service account key to git**
   - Already added to `.gitignore`
   - If accidentally committed, rotate the key immediately

2. **Limit permissions**
   - Only grant necessary permissions
   - Use "Release manager" role if available instead of "Owner"

3. **Store key securely**
   - Keep the JSON file in a secure location
   - Don't share it publicly
   - Consider using environment variables for CI/CD

4. **Rotate keys periodically**
   - Create new keys every 6-12 months
   - Delete old unused keys

## Quick Reference Commands

```bash
# Build production app
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Check submission status
# (Check in Play Console → Production → Releases)
```

## Next Steps After Submission

1. ✅ Monitor review status in Play Console
2. ✅ Respond to any review feedback
3. ✅ Prepare for app updates (increment version numbers)
4. ✅ Set up analytics and crash reporting

---

**You're all set! Your automated submission is configured. 🚀**

If you encounter any issues, refer to the troubleshooting section or check the EAS documentation.



