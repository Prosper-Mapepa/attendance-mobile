# How to Link Service Account in Play Console

This guide shows you exactly how to link your service account so EAS can automatically submit your app.

## 🎯 Your Service Account Details

- **Service Account Email:** `attendiq@attendiq-475019.iam.gserviceaccount.com`
- **Project ID:** `attendiq-475019`

## 📍 Step-by-Step Instructions

### Step 1: Open Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Make sure you're signed in with the **same Google account** you use for Google Cloud
3. Select your **AttendIQ** app

### Step 2: Navigate to API Access

**Method 1: Direct Navigation**
1. In the **left sidebar**, find **"Setup"** section
2. Click on **"Setup"** to expand it (if not already expanded)
3. Click **"API access"**

**Path:** `Left sidebar → Setup → API access`

**Method 2: Alternative Path**
- Look for **"Settings"** or **"Setup"** in the left sidebar
- Click it, then click **"API access"**

### Step 3: Link Service Account

1. On the **API access** page, scroll down to find the **"Service accounts"** section
2. You should see a button that says:
   - **"Link service account"** or
   - **"Link a service account"** or
   - **"Grant access"**
3. **Click that button**

### Step 4: Select Your Project

1. A dialog/popup will appear
2. You'll see a list of Google Cloud projects
3. Look for your project: **"attendiq-475019"** or **"AttendIQ Play Store"**
4. **Click on your project** to select it

### Step 5: Select Service Account

1. After selecting the project, you'll see a list of service accounts
2. Look for: **"attendiq@attendiq-475019.iam.gserviceaccount.com"**
3. **Click on the service account** to select it
4. Click **"Grant access"** or **"Link"** button

### Step 6: Grant Permissions

1. After linking, you'll see a permissions dialog
2. **Check the following permissions:**
   - ✅ **"View app information and download bulk reports"**
   - ✅ **"Manage production releases"** (REQUIRED)
   - ✅ **"Manage testing track releases"** (optional, but recommended)
   - ✅ **"Manage store listing"** (optional)

3. Click **"Invite user"** or **"Grant access"** or **"Save"**

### Step 7: Verify Link

1. After granting access, you should see your service account in the list
2. It should show:
   - **Email:** `attendiq@attendiq-475019.iam.gserviceaccount.com`
   - **Status:** Active or Linked
   - **Permissions:** The ones you granted

## ✅ Verification Checklist

After linking, verify:

- [ ] Service account appears in the "Service accounts" section
- [ ] Status shows "Active" or "Linked"
- [ ] "Manage production releases" permission is granted
- [ ] Service account email matches: `attendiq@attendiq-475019.iam.gserviceaccount.com`

## 🔍 What You Should See

### Before Linking:
```
Service accounts
[Link service account] button
(No service accounts listed)
```

### After Linking:
```
Service accounts
✅ attendiq@attendiq-475019.iam.gserviceaccount.com
   Status: Active
   Permissions: View app information, Manage production releases
```

## 🆘 Troubleshooting

### Can't Find "API Access"

**Solution:**
1. Make sure you're the **app owner** or have **admin access**
2. Try this direct URL: `https://play.google.com/console/developers/api-access`
3. Or: Left sidebar → **Setup** → **API access**

### "Link service account" Button Not Visible

**Possible reasons:**
1. **Already linked:** Check if the service account is already in the list
2. **Permissions:** You might not have admin access
3. **Wrong account:** Make sure you're using the correct Google account

**Solution:**
- Check the "Service accounts" section - it might already be linked
- Contact the app owner to grant you admin access

### Service Account Not Showing in List

**Possible reasons:**
1. **Wrong project:** Make sure you're selecting the correct Google Cloud project
2. **Service account not created:** Verify the service account exists in Google Cloud Console

**Solution:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select project: `attendiq-475019`
3. Go to: **IAM & Admin → Service Accounts**
4. Verify `attendiq@attendiq-475019.iam.gserviceaccount.com` exists

### "Permission Denied" Error

**Solution:**
1. Make sure you granted the correct permissions in Step 6
2. Try unlinking and re-linking the service account
3. Make sure "Manage production releases" is checked

### Service Account Shows But Can't Submit

**Solution:**
1. Verify permissions include "Manage production releases"
2. Check that the service account key file is correct
3. Try re-linking the service account

## 🎯 Quick Reference

**Direct URL to API Access:**
```
https://play.google.com/console/developers/api-access
```

**Navigation Path:**
```
Play Console → Select AttendIQ app → Setup → API access
```

**What to Look For:**
- Section: "Service accounts"
- Button: "Link service account"
- Your account: `attendiq@attendiq-475019.iam.gserviceaccount.com`

## ✅ After Linking

Once linked, you can:

1. **Build your app:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Submit automatically:**
   ```bash
   eas submit --platform android --profile production
   ```

EAS will automatically use your `service-account-key.json` file to authenticate and submit!

## 📸 Visual Guide

### Step 1: Find Setup Section
```
Left Sidebar:
├── Dashboard
├── Statistics
├── ...
├── Setup          ← Click here
│   ├── App access
│   └── API access ← Then click here
└── ...
```

### Step 2: Service Accounts Section
```
API access page:

[Google Play Android Developer API]
Status: Enabled

Service accounts
[Link service account]  ← Click this button
```

### Step 3: Select Project
```
Link service account dialog:

Select a Google Cloud project:
○ attendiq-475019  ← Select this
○ other-project-1
○ other-project-2

[Cancel] [Next]
```

### Step 4: Select Service Account
```
Select service account:

○ attendiq@attendiq-475019.iam.gserviceaccount.com  ← Select this

[Cancel] [Grant access]
```

### Step 5: Grant Permissions
```
Grant access:

Permissions:
☑ View app information and download bulk reports
☑ Manage production releases  ← MUST CHECK THIS
☐ Manage testing track releases
☐ Manage store listing

[Cancel] [Invite user]
```

---

**Once you see your service account in the list with "Active" status, you're all set! 🎉**

If you're still having trouble, let me know what you see on the API access page and I'll help you further!



