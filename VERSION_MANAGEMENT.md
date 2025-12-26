# Version Management Guide

## 📋 Quick Answer

**YES** - You need to update version numbers for each new release to Play Store.

## 🎯 Two Version Numbers to Update

### 1. Version Name (User-Facing)
- **Location:** `app.json` → `version`
- **Format:** `"1.0.0"` (Major.Minor.Patch)
- **Example:** `"1.0.0"` → `"1.0.1"` → `"1.1.0"` → `"2.0.0"`

### 2. Version Code (Internal)
- **Location:** `app.json` → `android.versionCode`
- **Format:** Integer (1, 2, 3, 4...)
- **Must always increase:** Each build must have a higher number than the previous one

## 📝 Current Version

Looking at your `app.json`:
- **Version:** `1.0.0`
- **Version Code:** `1`

## 🔄 When to Update

### For Production Releases (Play Store)

**Every time you submit a new build to Play Store, update BOTH:**

1. **Version Name** - Increment based on changes:
   - **Patch (1.0.0 → 1.0.1):** Bug fixes, small improvements
   - **Minor (1.0.0 → 1.1.0):** New features, enhancements
   - **Major (1.0.0 → 2.0.0):** Major changes, breaking changes

2. **Version Code** - Always increment by 1:
   - `1` → `2` → `3` → `4` → etc.
   - **Must be higher than previous release**

### For Test Builds (Internal/Closed Testing)

- You can keep the same version for testing
- But version code must still increase if uploading to Play Console

## 📋 Update Process

### Before Each Production Build:

1. **Open `app.json`**

2. **Update version name:**
   ```json
   {
     "version": "1.0.1",  // Increment this
   }
   ```

3. **Update version code:**
   ```json
   {
     "android": {
       "versionCode": 2,  // Increment this (must be higher)
     }
   }
   ```

4. **Save the file**

5. **Build and submit:**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android --profile production
   ```

## 🎯 Version Numbering Examples

### Example 1: Bug Fix Release
```json
// Before
"version": "1.0.0",
"android": { "versionCode": 1 }

// After
"version": "1.0.1",  // Patch increment
"android": { "versionCode": 2 }  // Always increment
```

### Example 2: New Feature Release
```json
// Before
"version": "1.0.1",
"android": { "versionCode": 2 }

// After
"version": "1.1.0",  // Minor increment
"android": { "versionCode": 3 }  // Always increment
```

### Example 3: Major Update
```json
// Before
"version": "1.5.0",
"android": { "versionCode": 10 }

// After
"version": "2.0.0",  // Major increment
"android": { "versionCode": 11 }  // Always increment
```

## ⚠️ Important Rules

### Version Code Rules:
1. **Must always increase** - Never use a lower number
2. **Must be unique** - Each release needs a unique version code
3. **Integer only** - No decimals (1, 2, 3, not 1.0, 1.1)
4. **No gaps required** - Can go 1, 2, 3 or 1, 5, 10 (but sequential is recommended)

### Version Name Rules:
1. **Semantic versioning** - Use Major.Minor.Patch format
2. **User-visible** - This is what users see in Play Store
3. **Can be same** - Multiple builds can have same version name (but different codes)

## 🔍 How to Check Current Version in Play Console

1. Go to Play Console
2. Select your app
3. Go to **"Production"** or **"Releases"**
4. Check the latest release version

**Make sure your new version code is HIGHER than the latest one!**

## 📋 Quick Checklist Before Each Build

- [ ] Check current version in `app.json`
- [ ] Check latest version code in Play Console
- [ ] Update `version` in `app.json` (if needed)
- [ ] Update `versionCode` in `app.json` (must be higher)
- [ ] Save `app.json`
- [ ] Build: `eas build --platform android --profile production`
- [ ] Submit: `eas submit --platform android --profile production`

## 🚀 Automated Versioning (Optional)

You can create a script to auto-increment, but manual is fine for now.

## 📝 Example Workflow

### First Release:
```json
"version": "1.0.0",
"android": { "versionCode": 1 }
```

### Second Release (Bug Fix):
```json
"version": "1.0.1",
"android": { "versionCode": 2 }
```

### Third Release (New Feature):
```json
"version": "1.1.0",
"android": { "versionCode": 3 }
```

### Fourth Release (Another Bug Fix):
```json
"version": "1.1.1",
"android": { "versionCode": 4 }
```

## 🆘 Common Mistakes

### ❌ Don't Do This:
- Use same version code twice
- Use lower version code than previous
- Forget to update version code
- Use decimals in version code

### ✅ Do This:
- Always increment version code
- Update version name appropriately
- Check Play Console for latest version code
- Keep version code sequential (1, 2, 3...)

---

**Remember: Version code MUST increase for each Play Store release, even if version name stays the same!**



