# App Update Guide - EAS Update

This guide explains how to use EAS Update to push over-the-air (OTA) updates to your app without going through app stores.

## 🎯 What is EAS Update?

EAS Update allows you to:
- **Update JavaScript and assets** without rebuilding the app
- **Push updates instantly** to users
- **No app store review** required for JS/asset changes
- **Prompt users** or **auto-update** when new versions are available

## ⚠️ Important Limitations

EAS Update can **ONLY** update:
- ✅ JavaScript code
- ✅ Assets (images, fonts, etc.)
- ✅ App configuration (app.json changes that don't require native changes)

EAS Update **CANNOT** update:
- ❌ Native code changes (requires new build)
- ❌ New native dependencies (requires new build)
- ❌ Changes to `app.json` that affect native code

## 📋 How It Works

### Current Implementation

The app is configured to:
1. **Check for updates** automatically when the app opens (`ON_LOAD`)
2. **Show a prompt** to users when an update is available
3. **Download and apply** updates when user confirms

### Update Modes

You can configure the update behavior in `App.tsx`:

```typescript
// Prompt user (current setting)
<UpdatePrompt autoCheck={true} autoUpdate={false} />

// Auto-update without prompt
<UpdatePrompt autoCheck={true} autoUpdate={true} />
```

## 🚀 Publishing Updates

### Step 1: Make Your Changes

Make JavaScript or asset changes to your app. For example:
- Fix bugs in your React components
- Update UI styling
- Add new features (JavaScript only)
- Update images or fonts

### Step 2: Publish Update

```bash
cd attendance-mobile

# Publish to production channel
eas update --branch production --message "Bug fixes and improvements"

# Or publish to a specific channel
eas update --branch preview --message "Preview update"
```

### Step 3: Users Get Update

- Users will see the update prompt when they open the app
- They can choose to update now or later
- App will restart after update is downloaded

## 📱 Update Channels

### Production Channel (Default)
```bash
eas update --branch production --message "Your update message"
```
- Used for production app builds
- All production users will receive this update

### Preview Channel
```bash
eas update --branch preview --message "Preview update"
```
- Used for testing before production
- Can be used with preview builds

## 🔧 Configuration

### app.json

The app is configured with:
```json
{
  "updates": {
    "url": "https://u.expo.dev/5e792208-6678-4813-ae6d-e0347287e75d",
    "fallbackToCacheTimeout": 0,
    "checkAutomatically": "ON_LOAD"
  },
  "runtimeVersion": {
    "policy": "appVersion"
  }
}
```

**Settings:**
- `checkAutomatically: "ON_LOAD"` - Checks for updates when app opens
- `fallbackToCacheTimeout: 0` - Uses cached version if update check fails
- `runtimeVersion: "appVersion"` - Uses app version for compatibility

### Update Check Options

You can change `checkAutomatically` to:
- `"ON_LOAD"` - Check when app opens (current)
- `"ON_ERROR_RECOVERY"` - Only check after errors
- `"NEVER"` - Manual check only

## 🎨 Customizing Update Prompt

The update prompt component is in:
`src/components/UpdatePrompt.tsx`

You can customize:
- Message text
- Button styles
- Auto-update behavior
- Update timing

## 📊 Monitoring Updates

View update status:
```bash
# List all updates
eas update:list

# View specific update
eas update:view [update-id]
```

## 🔄 Workflow Examples

### Example 1: Bug Fix Update
```bash
# 1. Fix bug in your code
# 2. Test locally
# 3. Publish update
eas update --branch production --message "Fixed login issue"

# Users will see prompt on next app open
```

### Example 2: UI Update
```bash
# 1. Update UI components
# 2. Test changes
# 3. Publish update
eas update --branch production --message "Improved dashboard UI"

# Users get update instantly
```

### Example 3: New Feature (JS only)
```bash
# 1. Add new feature (JavaScript only)
# 2. Test thoroughly
# 3. Publish update
eas update --branch production --message "Added new attendance filters"

# Users can use new feature immediately
```

## ⚠️ When to Build New Version

You **MUST** create a new build (not just update) when:
- Adding new native dependencies
- Changing native code
- Modifying `app.json` in ways that affect native code
- Changing app version numbers
- Submitting to app stores

## 🐛 Troubleshooting

### Updates Not Showing

1. **Check if updates are enabled:**
   ```bash
   eas update:list
   ```

2. **Verify runtime version matches:**
   - Updates only work for same runtime version
   - Check `app.json` → `runtimeVersion`

3. **Check update channel:**
   - Production builds use `production` channel
   - Preview builds use `preview` channel

### Update Fails to Download

- Check internet connection
- Verify EAS Update service is running
- Check EAS dashboard for errors

## 📚 Resources

- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Update Channels](https://docs.expo.dev/eas-update/update-channels/)

## 🎯 Quick Commands

```bash
# Publish update
eas update --branch production --message "Your message"

# List updates
eas update:list

# View update details
eas update:view [update-id]

# Rollback update (if needed)
eas update:rollback [update-id]
```

---

**Note:** EAS Update is included in EAS Free plan. For production apps, consider upgrading for better reliability and support.

