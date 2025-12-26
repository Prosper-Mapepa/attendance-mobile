# When to Update Version Numbers

## 🎯 Quick Answer

**NO** - You only need to change version numbers when submitting to Play Store (production releases).

## 📋 Detailed Breakdown

### ✅ When You DON'T Need to Change Versions

#### 1. Development Builds
```bash
eas build --platform android --profile development
```
- **Version numbers:** Keep the same
- **Purpose:** Testing on your device
- **Not uploaded to Play Store**

#### 2. Preview/Internal Testing Builds
```bash
eas build --platform android --profile preview
```
- **Version numbers:** Can keep the same (or increment if you want)
- **Purpose:** Internal testing, sharing with testers
- **Version code:** Can reuse, but if uploading to Play Console testing tracks, must increment

#### 3. Multiple Builds for Same Release
- If a build fails and you rebuild
- If you're testing different configurations
- **Version numbers:** Keep the same

### ⚠️ When You MUST Change Versions

#### Production Builds (Play Store Submission)
```bash
eas build --platform android --profile production
```
- **Version code:** MUST increment (1 → 2 → 3...)
- **Version name:** Should update based on changes
- **Purpose:** Releasing to users on Play Store

## 🔄 Typical Workflow

### Scenario 1: Testing Before Release
```bash
# Build 1: Test build (no version change needed)
eas build --platform android --profile preview

# Build 2: Another test (no version change needed)
eas build --platform android --profile preview

# Build 3: Production release (MUST increment version)
# Update app.json: versionCode 1 → 2
eas build --platform android --profile production
```

### Scenario 2: Multiple Production Releases
```bash
# Release 1.0.0
# app.json: version "1.0.0", versionCode 1
eas build --platform android --profile production

# Release 1.0.1 (bug fix)
# app.json: version "1.0.1", versionCode 2  ← MUST increment
eas build --platform android --profile production

# Release 1.1.0 (new feature)
# app.json: version "1.1.0", versionCode 3  ← MUST increment
eas build --platform android --profile production
```

## 📝 Quick Decision Guide

| Build Type | Change Version? | Change Version Code? |
|------------|----------------|---------------------|
| Development build | ❌ No | ❌ No |
| Preview/Internal test | ⚠️ Optional | ⚠️ Only if uploading to Play Console |
| Production build | ✅ Yes | ✅ **MUST** increment |
| Rebuild (same release) | ❌ No | ❌ No |

## 🎯 Best Practice

### For Testing:
```bash
# Use preview profile - no version changes needed
eas build --platform android --profile preview
```

### For Production:
```bash
# 1. Update version numbers in app.json FIRST
# 2. Then build
eas build --platform android --profile production
```

## ⚠️ Important Rules

### Version Code Rules:
1. **Must increase for each Play Store release**
2. **Can stay same for test builds** (unless uploading to Play Console)
3. **Never decrease** - always go up (1, 2, 3, 4...)

### Version Name Rules:
1. **Update for production releases** (follow semantic versioning)
2. **Can stay same for test builds**
3. **User-visible** - this is what users see

## 🔍 How to Check

### Before Production Build:
1. Check Play Console for latest version code
2. Make sure your new version code is HIGHER
3. Update both version and versionCode in app.json

### For Test Builds:
- Just run the build - no version changes needed!

## 📋 Summary

**Simple rule:**
- **Test builds (development/preview):** No version changes needed
- **Production builds:** Always increment versionCode, update version name

**Exception:**
- If uploading preview builds to Play Console testing tracks, you may need to increment versionCode

---

**Bottom line: Only change versions when submitting to Play Store production!** 🚀



